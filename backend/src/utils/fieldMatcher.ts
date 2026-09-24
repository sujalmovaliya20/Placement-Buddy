/**
 * Field Matcher — lightweight string-similarity-based auto-suggest for
 * mapping Google Form question labels to student profile field keys.
 *
 * Algorithm: Levenshtein-based similarity (0..1) between the normalised form
 * label and a hand-curated variant table of 20 profile fields × 3-5 label
 * variants each. Returns the best match above a confidence threshold.
 * No LLM, no external dependency — pure TypeScript.
 *
 * UPDATE: Added optional LLM fallback. Fields that fail local string similarity
 * are batched and sent to an LLM for classification, logging results to assist
 * in expanding the hardcoded variants over time.
 */

import { z } from 'zod';
import { logger } from './logger';
import { extractStructuredData, LLMUnavailableError } from '../services/llmExtraction.service';

// ─── Variant Lookup Table ────────────────────────────────────────────────────
// For each profile field key, list 3-5 realistic label variants that appear on
// real college placement Google Forms (Casepoint, TechCorp, etc.).

export const PROFILE_FIELD_VARIANTS: Record<string, string[]> = {
  first_name: [
    'first name',
    'given name',
    'first',
    'fname',
    'student first name',
  ],
  last_name: [
    'last name',
    'surname',
    'family name',
    'last',
    'lname',
  ],
  date_of_birth: [
    'date of birth',
    'dob',
    'birth date',
    'birthdate',
    'd.o.b',
  ],
  email: [
    'email',
    'email address',
    'email id',
    'e-mail',
    'college email',
    'student email',
    'your email',
    'mail',
  ],
  contact_number: [
    'contact number',
    'phone number',
    'phone',
    'mobile',
    'mobile number',
    'contact no',
    'contact',
    'cell number',
    'whatsapp number',
    'phone no',
    'mobile no',
  ],
  present_address: [
    'present address',
    'address',
    'current address',
    'residential address',
    'home address',
  ],
  course: [
    'course',
    'branch',
    'program',
    'degree',
    'department',
    'stream',
    'specialization',
    'field of study',
  ],
  enrollment_number: [
    'enrollment number',
    'enrollment no',
    'enrolment number',
    'roll number',
    'roll no',
    'student id',
    'registration number',
    'reg no',
    'student roll number',
    'prn',
    'usn',
  ],
  tenth_result: [
    '10th result',
    '10th percentage',
    '10th marks',
    'ssc percentage',
    'class 10 percentage',
    '10th %',
    'tenth percentage',
    'ssc result',
    'x percentage',
    '10th percent',
  ],
  twelfth_result: [
    '12th result',
    '12th percentage',
    '12th marks',
    'hsc percentage',
    'class 12 percentage',
    '12th %',
    'twelfth percentage',
    'hsc result',
    'xii percentage',
    '12th percent',
    'inter percentage',
    'diploma percentage',
  ],
  cgpa_previous_semester: [
    'cgpa',
    'cgpa previous semester',
    'overall cgpa',
    'aggregate cgpa',
    'current cgpa',
    'cumulative gpa',
    'latest cgpa',
    'gpa',
    'aggregate',
  ],
  sem1_sgpa: [
    'sem 1 sgpa',
    'semester 1 sgpa',
    'sem1 sgpa',
    '1st semester sgpa',
    'first semester sgpa',
  ],
  sem2_sgpa: [
    'sem 2 sgpa',
    'semester 2 sgpa',
    'sem2 sgpa',
    '2nd semester sgpa',
    'second semester sgpa',
  ],
  sem3_sgpa: [
    'sem 3 sgpa',
    'semester 3 sgpa',
    'sem3 sgpa',
    '3rd semester sgpa',
    'third semester sgpa',
  ],
  sem4_sgpa: [
    'sem 4 sgpa',
    'semester 4 sgpa',
    'sem4 sgpa',
    '4th semester sgpa',
    'fourth semester sgpa',
  ],
  sem5_sgpa: [
    'sem 5 sgpa',
    'semester 5 sgpa',
    'sem5 sgpa',
    '5th semester sgpa',
    'fifth semester sgpa',
  ],
  sem6_sgpa: [
    'sem 6 sgpa',
    'semester 6 sgpa',
    'sem6 sgpa',
    '6th semester sgpa',
    'sixth semester sgpa',
  ],
  sem7_sgpa: [
    'sem 7 sgpa',
    'semester 7 sgpa',
    'sem7 sgpa',
    '7th semester sgpa',
    'seventh semester sgpa',
  ],
  sem8_sgpa: [
    'sem 8 sgpa',
    'semester 8 sgpa',
    'sem8 sgpa',
    '8th semester sgpa',
    'eighth semester sgpa',
  ],
  experience_months: [
    'experience',
    'experience months',
    'work experience',
    'experience in months',
    'total experience',
    'internship experience',
  ],
  resume_url: [
    'resume',
    'resume link',
    'resume url',
    'cv link',
    'upload resume',
    'resume drive link',
    'resume google drive link',
  ],
};

// ─── Normalisation ───────────────────────────────────────────────────────────

/**
 * Normalise a label for comparison: lowercase, strip punctuation & extra spaces.
 */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')  // replace punctuation with space
    .replace(/\s+/g, ' ')           // collapse multiple spaces
    .trim();
}

// ─── Levenshtein Distance ────────────────────────────────────────────────────

/**
 * Classic Levenshtein edit distance — O(m × n) DP.
 * Uses a single-row optimisation to keep memory at O(min(m, n)).
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure `b` is the shorter string for space optimisation
  if (a.length < b.length) {
    [a, b] = [b, a];
  }

  const bLen = b.length;
  const prev = new Array<number>(bLen + 1);

  for (let j = 0; j <= bLen; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prev[0]!;
    prev[0] = i;

    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const temp = prev[j]!;
      prev[j] = Math.min(
        prev[j]! + 1,       // deletion
        prev[j - 1]! + 1,   // insertion
        prevDiag + cost,     // substitution
      );
      prevDiag = temp;
    }
  }

  return prev[bLen]!;
}

/**
 * Similarity score between two strings, 0 (no match) to 1 (identical).
 */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Additional containment-aware boost: if the normalised label exactly contains
 * a variant (or vice versa), it's very likely a match even if Levenshtein distance
 * is high due to surrounding text (e.g. "Enter your Email Address" vs "email").
 */
function containmentSimilarity(label: string, variant: string): number {
  if (label.includes(variant) || variant.includes(label)) {
    // Scale by the ratio of lengths — closer lengths = higher confidence
    const ratio = Math.min(label.length, variant.length) / Math.max(label.length, variant.length);
    // Containment scores range from 0.65 to 0.95 depending on length ratio
    return 0.65 + ratio * 0.30;
  }
  return 0;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Confidence threshold — only suggest if best score is >= this value. */
const DEFAULT_THRESHOLD = 0.6;

export interface FieldSuggestion {
  /** The profile field key (e.g. "email", "contact_number"). null if below threshold. */
  suggested_field: string | null;
  /** Confidence score, 0..1. */
  confidence: number;
}

/**
 * Given a Google Form question label, find the best-matching profile field.
 *
 * @param formLabel  — The question label text from the form
 * @param threshold  — Minimum confidence to suggest (default 0.6)
 * @returns { suggested_field, confidence }
 */
export function suggestProfileField(
  formLabel: string,
  threshold: number = DEFAULT_THRESHOLD,
): FieldSuggestion {
  const normLabel = normalise(formLabel);

  let bestField: string | null = null;
  let bestScore = 0;

  for (const [fieldKey, variants] of Object.entries(PROFILE_FIELD_VARIANTS)) {
    for (const variant of variants) {
      const normVariant = normalise(variant);

      // Pure Levenshtein similarity
      const levScore = similarity(normLabel, normVariant);

      // Containment boost (handles "Your Email Address" matching "email")
      const contScore = containmentSimilarity(normLabel, normVariant);

      const score = Math.max(levScore, contScore);

      if (score > bestScore) {
        bestScore = score;
        bestField = fieldKey;
      }
    }
  }

  if (bestScore >= threshold) {
    return { suggested_field: bestField, confidence: Math.round(bestScore * 100) / 100 };
  }

  return { suggested_field: null, confidence: Math.round(bestScore * 100) / 100 };
}

/**
 * Batch version: suggest profile fields for an array of form fields.
 * Now Async due to optional LLM fallback for unrecognized fields.
 *
 * @param fields — Array of objects with at least a `label` property
 * @returns Same array with `suggested_field` and `confidence` added to each item
 */
export async function suggestFieldMappings<T extends { label: string; entryId: string }>(
  fields: T[],
  threshold: number = DEFAULT_THRESHOLD,
): Promise<Array<T & FieldSuggestion>> {
  // 1. Run local fuzzy-matching first (Phase 1A)
  const results = fields.map((field) => ({
    ...field,
    ...suggestProfileField(field.label, threshold),
  }));

  // 2. Identify fields that failed local matching
  const unmatched = results.filter((r) => r.suggested_field === null);
  
  if (unmatched.length === 0) {
    return results;
  }

  // 3. Prepare LLM Fallback
  const validProfileFields = Object.keys(PROFILE_FIELD_VARIANTS);
  const unmatchedLabels = unmatched.map(u => ({ id: u.entryId, label: u.label }));

  const schema = z.object({
    matches: z.array(z.object({
      id: z.string(),
      suggestedProfileField: z.string().nullable(),
    }))
  });

  const systemPrompt = `You are a data-mapping assistant for a college placement portal.
Your job is to map custom Google Form question labels to standardized student profile fields.
Be conservative: if a label is ambiguous or completely unrelated to these profile fields (like a quiz question or a company-specific question), map it to null.

Here is the exact list of the 20 valid profile fields you may choose from (do not invent new ones):
${validProfileFields.map(f => `- ${f}`).join('\n')}
`;

  try {
    const llmResult = await extractStructuredData({
      systemPrompt,
      userContent: `Map these unmatched form labels:\n${JSON.stringify(unmatchedLabels, null, 2)}`,
      schemaDescription: `{ matches: [{ id: "the entryId", suggestedProfileField: "valid_field_name_or_null" }] }`,
      schema,
      featureTag: 'field-mapping-fallback',
    });

    // 4. Merge LLM results back and log discoveries
    for (const match of llmResult.matches) {
      if (match.suggestedProfileField && validProfileFields.includes(match.suggestedProfileField)) {
        // Find the original item in results array
        const resultItem = results.find(r => r.entryId === match.id);
        if (resultItem) {
          resultItem.suggested_field = match.suggestedProfileField;
          resultItem.confidence = 0.85; // Hardcoded confidence for LLM

          // Log the discovery to help grow the static variant list
          logger.info(
            { 
              discoveredVariant: { 
                profileField: match.suggestedProfileField, 
                label: resultItem.label 
              } 
            },
            'LLM field-matching fallback discovered a new variant'
          );
        }
      }
    }
  } catch (error) {
    // LLMUnavailableError or LLMValidationError should not crash the form parsing process.
    // We just gracefully degrade and keep the unmatched fields as null.
    if (error instanceof LLMUnavailableError) {
      logger.warn({ err: error.message }, 'LLM fallback unavailable for field mapping. Continuing with local matches only.');
    } else {
      logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Error during LLM field mapping fallback');
    }
  }

  return results;
}
