// Tests for the EncryptionService class
// Run with: npm test src/lib/__tests__/encryption-service.test.ts

import { EncryptionService, EncryptedAnalysisData } from '../encryption-service';
import type { AnalysisResult } from '../billing-rules';

describe('EncryptionService', () => {
  const testPassword = 'testPassword123!';
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

  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('encryptAnalysisResult', () => {
    test('should encrypt analysis result successfully', async () => {
      const encrypted = await EncryptionService.encryptAnalysisResult(testAnalysisResult, testPassword);

      expect(encrypted).toHaveProperty('id');
      expect(encrypted).toHaveProperty('encryptedResult');
      expect(encrypted).toHaveProperty('dataHash');
      expect(encrypted).toHaveProperty('keyInfo');
      expect(encrypted).toHaveProperty('createdAt');

      expect(encrypted.keyInfo.passwordDerived).toBe(true);
      expect(typeof encrypted.id).toBe('string');
      expect(encrypted.id.length).toBeGreaterThan(0);
    });

    test('should include optional metadata', async () => {
      const encrypted = await EncryptionService.encryptAnalysisResult(
        testAnalysisResult,
        testPassword,
        {
          fileName: 'test-document.pdf',
          documentId: 'doc-123'
        }
      );

      expect(encrypted.metadata?.fileName).toBe('test-document.pdf');
      expect(encrypted.metadata?.documentId).toBe('doc-123');
    });
  });

  describe('decryptAnalysisResult', () => {
    test('should decrypt analysis result successfully', async () => {
      const encrypted = await EncryptionService.encryptAnalysisResult(testAnalysisResult, testPassword);
      const decrypted = await EncryptionService.decryptAnalysisResult(encrypted, testPassword);

      expect(decrypted.overallScore).toBe(testAnalysisResult.overallScore);
      expect(decrypted.documentationLevel).toBe(testAnalysisResult.documentationLevel);
      expect(decrypted.gaps).toHaveLength(testAnalysisResult.gaps.length);
      expect(decrypted.strengths).toEqual(testAnalysisResult.strengths);
    });

    test('should fail decryption with wrong password', async () => {
      const encrypted = await EncryptionService.encryptAnalysisResult(testAnalysisResult, testPassword);

      await expect(EncryptionService.decryptAnalysisResult(encrypted, 'wrongPassword'))
        .rejects
        .toThrow();
    });
  });

  describe('Local Storage Operations', () => {
    test('should store and retrieve encrypted data locally', async () => {
      const encrypted = await EncryptionService.encryptAnalysisResult(testAnalysisResult, testPassword);

      await EncryptionService.storeEncryptedDataLocally(encrypted);
      const retrieved = await EncryptionService.retrieveEncryptedDataLocally(encrypted.id);

      expect(retrieved).toBeTruthy();
      expect(retrieved?.id).toBe(encrypted.id);
      expect(retrieved?.dataHash).toBe(encrypted.dataHash);
    });

    test('should list encrypted data IDs', async () => {
      const encrypted1 = await EncryptionService.encryptAnalysisResult(testAnalysisResult, testPassword);
      const encrypted2 = await EncryptionService.encryptAnalysisResult(testAnalysisResult, testPassword);

      await EncryptionService.storeEncryptedDataLocally(encrypted1);
      await EncryptionService.storeEncryptedDataLocally(encrypted2);

      const ids = await EncryptionService.listEncryptedDataIds();
      expect(ids).toContain(encrypted1.id);
      expect(ids).toContain(encrypted2.id);
      expect(ids).toHaveLength(2);
    });

    test('should remove encrypted data', async () => {
      const encrypted = await EncryptionService.encryptAnalysisResult(testAnalysisResult, testPassword);
      await EncryptionService.storeEncryptedDataLocally(encrypted);

      let retrieved = await EncryptionService.retrieveEncryptedDataLocally(encrypted.id);
      expect(retrieved).toBeTruthy();

      await EncryptionService.removeEncryptedData(encrypted.id);

      retrieved = await EncryptionService.retrieveEncryptedDataLocally(encrypted.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Data Export/Import', () => {
    test('should export encrypted data without sensitive keys', async () => {
      const encrypted = await EncryptionService.encryptAnalysisResult(testAnalysisResult, testPassword);
      const exported = await EncryptionService.exportEncryptedData(encrypted.id);

      const parsed = JSON.parse(exported);
      expect(parsed.id).toBe(encrypted.id);
      expect(parsed.encryptedResult).toBeDefined();
      expect(parsed.keyInfo.userKey).toBeUndefined(); // Sensitive key should not be exported
    });

    test('should import encrypted data', async () => {
      const encrypted = await EncryptionService.encryptAnalysisResult(testAnalysisResult, testPassword);
      const exported = await EncryptionService.exportEncryptedData(encrypted.id);

      // Clear local storage
      await EncryptionService.removeEncryptedData(encrypted.id);

      // Import the data
      const imported = await EncryptionService.importEncryptedData(exported);

      expect(imported.id).toBe(encrypted.id);
      expect(imported.dataHash).toBe(encrypted.dataHash);
    });
  });

  describe('Encryption Validation', () => {
    test('should validate encryption/decryption cycle', async () => {
      const isValid = await EncryptionService.validateEncryption(testAnalysisResult, testPassword);
      expect(isValid).toBe(true);
    });

    test('should detect encryption failures', async () => {
      // Test with empty password
      const isValid = await EncryptionService.validateEncryption(testAnalysisResult, '');
      expect(isValid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle localStorage unavailable', async () => {
      // Mock localStorage as unavailable
      const originalLocalStorage = global.localStorage;
      delete (global as any).localStorage;

      try {
        const encrypted = await EncryptionService.encryptAnalysisResult(testAnalysisResult, testPassword);
        // Should still work even without localStorage
        expect(encrypted).toBeDefined();
      } finally {
        // Restore localStorage
        global.localStorage = originalLocalStorage;
      }
    });

    test('should handle missing encrypted data', async () => {
      const retrieved = await EncryptionService.retrieveEncryptedDataLocally('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });
});
