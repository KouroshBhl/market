import { randomBytes } from 'crypto';

/**
 * Generate a unique, non-guessable order display code
 * Format: ORD_XXXXXXXXXX (10 random alphanumeric chars, base32-like)
 * 
 * Base32 alphabet (excluding ambiguous chars like 0/O, 1/I/l):
 * 23456789ABCDEFGHJKLMNPQRSTUVWXYZ
 */
const BASE32_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateOrderDisplayCode(): string {
  // Generate 10 random characters from base32 alphabet
  const bytes = randomBytes(10);
  let code = '';
  
  for (let i = 0; i < 10; i++) {
    code += BASE32_ALPHABET[bytes[i] % BASE32_ALPHABET.length];
  }
  
  return `ORD_${code}`;
}

/**
 * Validate display code format
 */
export function isValidDisplayCode(code: string): boolean {
  return /^ORD_[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{10}$/.test(code);
}
