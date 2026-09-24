/**
 * Shared LLM extraction utility — NVIDIA NIM API (OpenAI-compatible).
 *
 * Provides a single `extractStructuredData<T>()` function that any feature
 * (field-mapping suggestions, resume extraction, description parsing) can call
 * to get structured JSON from an LLM, validated against a Zod schema.
 *
 * Resilience:
 *  - 10-second request timeout
 *  - 1 automatic retry on transient failures
 *  - Graceful degradation via LLMUnavailableError (callers catch & fallback)
 *
 * Usage logging:
 *  - Every call logs feature-tag, token counts, and timestamp via the app logger
 */

import OpenAI from 'openai';
import { z } from 'zod';
import { env } from '../config/env';
import { AppError } from '../middleware/error-handler';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';

// ─── Error Classes ───────────────────────────────────────────────────────────

/**
 * Thrown when the NIM API is unreachable, rate-limited, times out, or the
 * API key is missing. Callers should catch this specifically and fall back
 * to a "manual" code-path instead of crashing the request.
 */
export class LLMUnavailableError extends AppError {
  constructor(message: string, cause?: Error) {
    super(
      message,
      StatusCodes.SERVICE_UNAVAILABLE,
      'LLM_UNAVAILABLE',
    );
    this.name = 'LLMUnavailableError';
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Thrown when the LLM returns output that cannot be parsed as JSON or
 * fails Zod schema validation. Indicates a model-quality issue, not a
 * network issue — retrying with the same prompt is unlikely to help.
 */
export class LLMValidationError extends AppError {
  constructor(message: string, cause?: Error) {
    super(
      message,
      StatusCodes.UNPROCESSABLE_ENTITY,
      'LLM_VALIDATION_ERROR',
    );
    this.name = 'LLMValidationError';
    if (cause) {
      this.cause = cause;
    }
  }
}

// ─── OpenAI Client (lazy singleton) ──────────────────────────────────────────

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!env.NVIDIA_NIM_API_KEY) {
    throw new LLMUnavailableError(
      'NVIDIA NIM API key is not configured. LLM extraction is unavailable.',
    );
  }

  if (!_client) {
    _client = new OpenAI({
      baseURL: env.NVIDIA_NIM_BASE_URL,
      apiKey: env.NVIDIA_NIM_API_KEY,
      timeout: 10_000,          // 10-second request timeout
      maxRetries: 0,            // we handle retries ourselves for better logging
    });
  }

  return _client;
}

// ─── JSON Cleaning ───────────────────────────────────────────────────────────

/**
 * Strip markdown JSON fences and leading/trailing whitespace that some models
 * add despite explicit instructions not to.
 *
 * Handles patterns like:
 *  ```json\n{...}\n```
 *  ```\n{...}\n```
 */
function stripJsonFences(raw: string): string {
  let cleaned = raw.trim();

  // Remove opening fence:  ```json  or  ```
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');

  // Remove closing fence:  ```
  cleaned = cleaned.replace(/\n?\s*```\s*$/i, '');

  return cleaned.trim();
}

// ─── Core Extraction Function ────────────────────────────────────────────────

export interface ExtractStructuredDataOptions<T> {
  /** The system-level instructions telling the model what to extract. */
  systemPrompt: string;

  /** The user-provided content (resume text, description, etc.). */
  userContent: string;

  /**
   * Plain-English description of the expected JSON output schema,
   * appended to the system prompt so the model knows the target shape.
   */
  schemaDescription: string;

  /**
   * Zod schema to validate the parsed JSON against. If the model's output
   * does not match, an LLMValidationError is thrown.
   */
  schema: z.ZodSchema<T>;

  /**
   * Short tag identifying which feature triggered this call
   * (e.g. 'field-mapping-suggest', 'resume-extract', 'description-parse').
   * Used in usage logs.
   */
  featureTag?: string;
}

/**
 * Call NVIDIA NIM to extract structured data from unstructured text.
 *
 * @returns Parsed and Zod-validated data of type T.
 * @throws LLMUnavailableError  — NIM unreachable / rate-limited / key missing
 * @throws LLMValidationError   — model output is not valid JSON or fails schema
 */
export async function extractStructuredData<T>(
  options: ExtractStructuredDataOptions<T>,
): Promise<T> {
  const {
    systemPrompt,
    userContent,
    schemaDescription,
    schema,
    featureTag = 'unknown',
  } = options;

  const client = getClient(); // throws LLMUnavailableError if no key

  const systemMessage =
    `${systemPrompt}\n\n` +
    `## Expected output schema\n${schemaDescription}\n\n` +
    `CRITICAL: Respond ONLY with valid JSON. ` +
    `Do NOT wrap the response in markdown fences (\`\`\`). ` +
    `Do NOT include any explanation, commentary, or text outside the JSON object.`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userContent },
  ];

  // ── Attempt with 1 retry ───────────────────────────────────────────────
  const MAX_ATTEMPTS = 2;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const startMs = Date.now();

      const completion = await client.chat.completions.create({
        model: env.NVIDIA_NIM_MODEL,
        messages,
        temperature: 0.1,       // low temperature for structured extraction
        max_tokens: 2048,
      });

      const elapsedMs = Date.now() - startMs;
      const rawContent = completion.choices?.[0]?.message?.content ?? '';
      const usage = completion.usage;

      // ── Usage logging ────────────────────────────────────────────────
      logger.info(
        {
          featureTag,
          model: env.NVIDIA_NIM_MODEL,
          attempt,
          elapsedMs,
          promptTokens: usage?.prompt_tokens ?? null,
          completionTokens: usage?.completion_tokens ?? null,
          totalTokens: usage?.total_tokens ?? null,
        },
        `LLM extraction call [${featureTag}]`,
      );

      // ── Parse JSON ───────────────────────────────────────────────────
      const cleanedJson = stripJsonFences(rawContent);

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleanedJson);
      } catch (parseErr) {
        throw new LLMValidationError(
          `LLM returned non-JSON output for [${featureTag}]. ` +
          `Raw (first 500 chars): ${rawContent.slice(0, 500)}`,
          parseErr instanceof Error ? parseErr : undefined,
        );
      }

      // ── Zod validation ───────────────────────────────────────────────
      const result = schema.safeParse(parsed);
      if (!result.success) {
        const issues = result.error.issues
          .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
          .join('\n');

        throw new LLMValidationError(
          `LLM output for [${featureTag}] failed schema validation:\n${issues}`,
        );
      }

      return result.data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry validation errors — they won't self-heal
      if (err instanceof LLMValidationError) {
        throw err;
      }

      // Log transient failure, retry if we have attempts left
      if (attempt < MAX_ATTEMPTS) {
        logger.warn(
          { featureTag, attempt, error: lastError.message },
          `LLM extraction attempt ${attempt} failed, retrying...`,
        );
        continue;
      }
    }
  }

  // All attempts exhausted — wrap as LLMUnavailableError
  throw new LLMUnavailableError(
    `LLM extraction failed for [${featureTag}] after ${MAX_ATTEMPTS} attempts: ${lastError?.message}`,
    lastError,
  );
}

// ─── Re-export for convenience ───────────────────────────────────────────────

export { getClient as _getClientForTesting };
