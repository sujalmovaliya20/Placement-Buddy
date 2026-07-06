import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Generate a 32-byte (256-bit) encryption key from the environment variable.
 * Hashes the key using SHA-256 to guarantee it is always exactly 32 bytes.
 */
const getEncryptionKey = (): Buffer => {
  const rawKey = env.GOOGLE_TOKEN_ENCRYPTION_KEY || 'default-token-encryption-key-for-dev';
  return crypto.createHash('sha256').update(rawKey).digest();
};

/**
 * Encrypts a text string using AES-256-GCM.
 * Returns the encrypted string in the format iv:encryptedData:authTag.
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${encrypted}:${tag}`;
}

/**
 * Decrypts an iv:encryptedData:authTag string using AES-256-GCM.
 * Returns the original decrypted string.
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const [ivHex, encryptedHex, tagHex] = parts;
  const iv = Buffer.from(ivHex!, 'hex');
  const encrypted = Buffer.from(encryptedHex!, 'hex');
  const tag = Buffer.from(tagHex!, 'hex');

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
