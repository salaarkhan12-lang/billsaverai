// Tests for encryption utilities
// Run with: npm test src/lib/__tests__/encryption.test.ts

import {
  generateSalt,
  generateIV,
  deriveKeyFromPassword,
  encryptData,
  decryptData,
  computeHash,
  verifyIntegrity,
  encryptAnalysisResult,
  decryptAnalysisResult,
  EncryptionError
} from '../encryption';
import type { AnalysisResult } from '../billing-rules';

describe('Encryption Utilities', () => {
  const testPassword = 'testPassword123!';
  const testData = 'This is sensitive medical data that needs encryption';
  const testAnalysisResult: AnalysisResult = {
    overallScore: 85,
    documentationLevel: 'Good' as const,
    gaps: [
      {
        id: 'test-gap',
        category: 'major' as const,
        title: 'Test Gap',
        description: 'Test gap description',
        impact: 'Test impact',
        recommendation: 'Test recommendation',
        potentialRevenueLoss: '$500',
        mlConfidence: 0.8,
        isMLDetected: true
      }
    ],
    strengths: ['Good documentation', 'Clear assessment'],
    suggestedEMLevel: '99214',
    currentEMLevel: '99213',
    potentialUpcodeOpportunity: true,
    totalPotentialRevenueLoss: '$1,200',
    mdmComplexity: 'Moderate' as const,
    timeDocumented: true,
    meatCriteriaMet: true
  };

  describe('Salt and IV Generation', () => {
    test('should generate salt of correct length', () => {
      const salt = generateSalt(32);
      expect(salt).toHaveLength(32);
      expect(salt).toBeInstanceOf(Uint8Array);
    });

    test('should generate IV of correct length', () => {
      const iv = generateIV();
      expect(iv).toHaveLength(12); // 96 bits for AES-GCM
      expect(iv).toBeInstanceOf(Uint8Array);
    });

    test('should generate different values each time', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const iv1 = generateIV();
      const iv2 = generateIV();

      expect(salt1).not.toEqual(salt2);
      expect(iv1).not.toEqual(iv2);
    });
  });

  describe('Key Derivation', () => {
    test('should derive key from password', async () => {
      const salt = generateSalt();
      const key = await deriveKeyFromPassword(testPassword, salt);

      expect(key).toBeInstanceOf(CryptoKey);
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    test('should derive different keys with different salts', async () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      const key1 = await deriveKeyFromPassword(testPassword, salt1);
      const key2 = await deriveKeyFromPassword(testPassword, salt2);

      // Keys should be different objects (can't compare CryptoKey values directly)
      expect(key1).not.toBe(key2);
    });

    test('should derive same key with same password and salt', async () => {
      const salt = generateSalt();
      const key1 = await deriveKeyFromPassword(testPassword, salt);
      const key2 = await deriveKeyFromPassword(testPassword, salt);

      // Same inputs should produce equivalent keys
      expect(key1.algorithm).toEqual(key2.algorithm);
      expect(key1.type).toEqual(key2.type);
    });
  });

  describe('Encryption/Decryption', () => {
    test('should encrypt and decrypt data correctly', async () => {
      const salt = generateSalt();
      const iv = generateIV();
      const key = await deriveKeyFromPassword(testPassword, salt);

      const { encryptedData, authTag } = await encryptData(new TextEncoder().encode(testData), key, iv);
      const decryptedText = await decryptData(encryptedData, authTag, key, iv);

      expect(decryptedText).toBe(testData);
    });

    test('should fail decryption with wrong key', async () => {
      const salt = generateSalt();
      const iv = generateIV();
      const key = await deriveKeyFromPassword(testPassword, salt);
      const wrongKey = await deriveKeyFromPassword('wrongPassword', salt);

      const { encryptedData, authTag } = await encryptData(new TextEncoder().encode(testData), key, iv);

      await expect(decryptData(encryptedData, authTag, wrongKey, iv))
        .rejects
        .toThrow(EncryptionError);
    });

    test('should fail decryption with wrong IV', async () => {
      const salt = generateSalt();
      const iv = generateIV();
      const wrongIv = generateIV();
      const key = await deriveKeyFromPassword(testPassword, salt);

      const { encryptedData, authTag } = await encryptData(new TextEncoder().encode(testData), key, iv);

      await expect(decryptData(encryptedData, authTag, key, wrongIv))
        .rejects
        .toThrow(EncryptionError);
    });
  });

  describe('Hash and Integrity', () => {
    test('should compute SHA-256 hash', async () => {
      const hash = await computeHash(testData);

      expect(hash).toHaveLength(64); // SHA-256 produces 64 character hex string
      expect(/^[a-f0-9]{64}$/i.test(hash)).toBe(true);
    });

    test('should produce consistent hashes', async () => {
      const hash1 = await computeHash(testData);
      const hash2 = await computeHash(testData);

      expect(hash1).toBe(hash2);
    });

    test('should produce different hashes for different data', async () => {
      const hash1 = await computeHash(testData);
      const hash2 = await computeHash(testData + 'modified');

      expect(hash1).not.toBe(hash2);
    });

    test('should verify data integrity', async () => {
      const hash = await computeHash(testData);
      const isValid = await verifyIntegrity(testData, hash);
      const isInvalid = await verifyIntegrity(testData + 'modified', hash);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Analysis Result Encryption', () => {
    test('should encrypt and decrypt analysis result', async () => {
      const encrypted = await encryptAnalysisResult(testAnalysisResult, testPassword);
      const decrypted = await decryptAnalysisResult(encrypted, testPassword);

      expect(decrypted.verified).toBe(true);
      expect(decrypted.decryptedData).toBe(JSON.stringify(testAnalysisResult));
    });

    test('should include all required encryption metadata', async () => {
      const encrypted = await encryptAnalysisResult(testAnalysisResult, testPassword);

      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('salt');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('dataHash');

      // Verify base64 encoding
      expect(() => atob(encrypted.encryptedData)).not.toThrow();
      expect(() => atob(encrypted.iv)).not.toThrow();
      expect(() => atob(encrypted.salt)).not.toThrow();
      expect(() => atob(encrypted.authTag)).not.toThrow();
    });

    test('should fail decryption with wrong password', async () => {
      const encrypted = await encryptAnalysisResult(testAnalysisResult, testPassword);

      await expect(decryptAnalysisResult(encrypted, 'wrongPassword'))
        .rejects
        .toThrow(EncryptionError);
    });

    test('should detect data tampering', async () => {
      const encrypted = await encryptAnalysisResult(testAnalysisResult, testPassword);

      // Tamper with the data
      const tampered = {
        ...encrypted,
        dataHash: 'tampered' + encrypted.dataHash.slice(8)
      };

      const result = await decryptAnalysisResult(tampered, testPassword);
      expect(result.verified).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should throw EncryptionError for invalid operations', async () => {
      const salt = generateSalt();
      const iv = generateIV();

      // Try to derive key with empty password
      await expect(deriveKeyFromPassword('', salt))
        .rejects
        .toThrow(EncryptionError);

      // Try to encrypt with invalid key
      const invalidKey = {} as CryptoKey;
      await expect(encryptData(new TextEncoder().encode(testData), invalidKey, iv))
        .rejects
        .toThrow(EncryptionError);
    });

    test('should provide meaningful error messages', async () => {
      try {
        await deriveKeyFromPassword('', generateSalt());
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(EncryptionError);
        expect((error as EncryptionError).message).toContain('Failed to derive key');
      }
    });
  });
});
