import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * CryptoService - Handles encryption/decryption of sensitive data (like keys)
 * Uses AES-256-GCM for authenticated encryption
 */
@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 12; // 96 bits (recommended for GCM)
  private readonly authTagLength = 16; // 128 bits
  private encryptionKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const secret = this.configService.get<string>('KEY_ENCRYPTION_SECRET');
    
    if (!secret) {
      // In development, use a deterministic key derived from a default secret
      // In production, this MUST be set via environment variable
      const defaultSecret = 'development-key-encryption-secret-32b';
      console.warn('⚠️ KEY_ENCRYPTION_SECRET not set, using development default. DO NOT use in production!');
      this.encryptionKey = this.deriveKey(defaultSecret);
    } else {
      this.encryptionKey = this.deriveKey(secret);
    }
  }

  /**
   * Derive a 256-bit key from the secret using PBKDF2
   */
  private deriveKey(secret: string): Buffer {
    // Use a fixed salt for deterministic key derivation
    // In a more secure setup, you'd use a random salt stored with the ciphertext
    const salt = Buffer.from('market-key-pool-salt', 'utf8');
    return crypto.pbkdf2Sync(secret, salt, 100000, this.keyLength, 'sha256');
  }

  /**
   * Encrypt a plaintext string
   * Returns base64-encoded string: iv:authTag:ciphertext
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + AuthTag + Ciphertext
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  /**
   * Decrypt a ciphertext string
   * Expects base64-encoded string: iv:authTag:ciphertext
   */
  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Create a SHA-256 hash of a string (for deduplication)
   * Returns hex-encoded hash
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
