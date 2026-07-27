import crypto from 'node:crypto';

/** Generates a cryptographically secure random token (URL-safe base64). */
export const generateRandomToken = (bytes = 48): string => {
  return crypto.randomBytes(bytes).toString('base64url');
};

/** Returns SHA-256 hash of a string (hex). Used to hash tokens at rest. */
export const sha256 = (input: string): string => {
  return crypto.createHash('sha256').update(input).digest('hex');
};