import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

/**
 * Encryption utility for securing sensitive data like product keys
 * Uses AES-256-GCM for encryption with authentication
 *
 * SECURITY WARNING: The encryption key MUST be stored securely in environment variables.
 * NEVER commit the encryption key to version control.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

export class EncryptionUtil {
  private encryptionKey: Buffer;

  constructor(configService?: ConfigService) {
    // Get encryption key from environment or use default for development
    const keyString =
      configService?.get<string>('ENCRYPTION_KEY') ||
      process.env.ENCRYPTION_KEY;

    if (!keyString) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required. ' +
          "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
      );
    }

    // Derive a proper 256-bit key from the hex string
    this.encryptionKey = Buffer.from(keyString, 'hex');

    if (this.encryptionKey.length !== KEY_LENGTH) {
      throw new Error(
        `ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes). ` +
          "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
      );
    }
  }

  /**
   * Encrypt a plaintext string
   * Returns base64-encoded encrypted data with IV and auth tag
   */
  encrypt(plaintext: string): string {
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine IV + encrypted data + auth tag
    const combined = Buffer.concat([
      iv,
      Buffer.from(encrypted, 'hex'),
      authTag,
    ]);

    // Return as base64
    return combined.toString('base64');
  }

  /**
   * Decrypt an encrypted string
   * Expects base64-encoded data with IV and auth tag
   */
  decrypt(encryptedData: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract components
      const iv = combined.subarray(0, IV_LENGTH);
      const authTag = combined.subarray(combined.length - TAG_LENGTH);
      const encrypted = combined.subarray(
        IV_LENGTH,
        combined.length - TAG_LENGTH
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(
        ALGORITHM,
        this.encryptionKey,
        iv
      );
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error(
        'Decryption failed: data may be corrupted or key is incorrect'
      );
    }
  }

  /**
   * Create a SHA-256 hash of a string (for deduplication without revealing content)
   */
  static hash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Verify if two hashes match (constant-time comparison to prevent timing attacks)
   */
  static verifyHash(input: string, hash: string): boolean {
    const inputHash = this.hash(input);
    return crypto.timingSafeEqual(
      Buffer.from(inputHash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  }

  /**
   * Generate a random encryption key (for setup/documentation)
   */
  static generateKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  }
}

/**
 * Singleton instance factory
 * Use this in NestJS services that need encryption
 */
let encryptionUtilInstance: EncryptionUtil | null = null;

export function getEncryptionUtil(
  configService?: ConfigService
): EncryptionUtil {
  if (!encryptionUtilInstance) {
    encryptionUtilInstance = new EncryptionUtil(configService);
  }
  return encryptionUtilInstance;
}
