// High-level encryption service for managing medical data encryption
// Provides user-controlled encryption with key management

import {
  encryptAnalysisResult,
  decryptAnalysisResult,
  generateUserKey,
  importUserKey,
  EncryptionResult,
  DecryptionResult,
  EncryptionError,
  computeHash,
} from './encryption';
import type { AnalysisResult } from './billing-rules';

export interface UserEncryptionKeys {
  passwordDerived: boolean; // Whether keys are derived from password
  userKey?: string; // Base64 encoded user-specific key (optional additional layer)
  keyVersion: number; // Version of key derivation algorithm
}

export interface EncryptedAnalysisData {
  id: string;
  encryptedResult: EncryptionResult;
  dataHash: string; // SHA-256 hash of original data
  keyInfo: UserEncryptionKeys;
  createdAt: number;
  metadata?: {
    fileName?: string;
    documentId?: string;
    tags?: string[];
  };
}

export class EncryptionService {
  private static readonly STORAGE_KEY_PREFIX = 'billsaver_encryption_keys_';
  private static readonly ENCRYPTED_DATA_PREFIX = 'billsaver_encrypted_data_';

  /**
   * Encrypts an analysis result with user-controlled encryption
   */
  static async encryptAnalysisResult(
    analysisResult: AnalysisResult,
    userPassword: string,
    options: {
      fileName?: string;
      documentId?: string;
      useAdditionalKey?: boolean;
    } = {}
  ): Promise<EncryptedAnalysisData> {
    try {
      // Generate unique ID for this encrypted data
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Compute hash of original data for integrity verification
      const dataHash = await computeHash(JSON.stringify(analysisResult));

      // Encrypt the data
      const encryptedResult = await encryptAnalysisResult(analysisResult, userPassword);

      // Generate additional user key if requested
      let userKey: string | undefined;
      if (options.useAdditionalKey) {
        const { exportedKey } = await generateUserKey();
        userKey = exportedKey;
      }

      const encryptedData: EncryptedAnalysisData = {
        id,
        encryptedResult,
        dataHash,
        keyInfo: {
          passwordDerived: true,
          userKey,
          keyVersion: 1, // Current version
        },
        createdAt: Date.now(),
        metadata: {
          fileName: options.fileName,
          documentId: options.documentId,
        },
      };

      // Store encryption keys securely (in a more secure storage in production)
      await this.storeEncryptionKeys(id, encryptedData.keyInfo);

      return encryptedData;
    } catch (error) {
      throw new EncryptionError('Failed to encrypt analysis result', error as Error);
    }
  }

  /**
   * Decrypts an analysis result with user-controlled decryption
   */
  static async decryptAnalysisResult(
    encryptedData: EncryptedAnalysisData,
    userPassword: string
  ): Promise<AnalysisResult> {
    try {
      // Retrieve encryption keys
      const keyInfo = await this.retrieveEncryptionKeys(encryptedData.id);
      if (!keyInfo) {
        throw new EncryptionError('Encryption keys not found');
      }

      // Decrypt the data
      const decryptionResult = await decryptAnalysisResult(
        encryptedData.encryptedResult,
        userPassword,
        encryptedData.dataHash
      );

      if (!decryptionResult.verified) {
        throw new EncryptionError('Data integrity verification failed');
      }

      // Parse the decrypted JSON
      const analysisResult: AnalysisResult = JSON.parse(decryptionResult.decryptedData);

      return analysisResult;
    } catch (error) {
      if (error instanceof EncryptionError) {
        throw error;
      }
      throw new EncryptionError('Failed to decrypt analysis result', error as Error);
    }
  }

  /**
   * Stores encryption keys securely (uses sessionStorage for demo to ensure ephemeral storage)
   */
  private static async storeEncryptionKeys(id: string, keyInfo: UserEncryptionKeys): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const key = `${this.STORAGE_KEY_PREFIX}${id}`;
      sessionStorage.setItem(key, JSON.stringify(keyInfo));
    } catch (error) {
      console.error('Failed to store encryption keys:', error);
      throw new EncryptionError('Failed to store encryption keys');
    }
  }

  /**
   * Retrieves encryption keys
   */
  private static async retrieveEncryptionKeys(id: string): Promise<UserEncryptionKeys | null> {
    if (typeof window === 'undefined') return null;

    try {
      const key = `${this.STORAGE_KEY_PREFIX}${id}`;
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to retrieve encryption keys:', error);
      return null;
    }
  }

  /**
   * Stores encrypted data locally (for offline access)
   * SECURITY UPDATE: Uses sessionStorage to ensure data is cleared on session end
   */
  static async storeEncryptedDataLocally(encryptedData: EncryptedAnalysisData): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const key = `${this.ENCRYPTED_DATA_PREFIX}${encryptedData.id}`;
      sessionStorage.setItem(key, JSON.stringify(encryptedData));
    } catch (error) {
      console.error('Failed to store encrypted data locally:', error);
      throw new EncryptionError('Failed to store encrypted data locally');
    }
  }

  /**
   * Retrieves encrypted data from local storage
   */
  static async retrieveEncryptedDataLocally(id: string): Promise<EncryptedAnalysisData | null> {
    if (typeof window === 'undefined') return null;

    try {
      const key = `${this.ENCRYPTED_DATA_PREFIX}${id}`;
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to retrieve encrypted data locally:', error);
      return null;
    }
  }

  /**
   * Lists all encrypted data IDs for a user
   */
  static async listEncryptedDataIds(): Promise<string[]> {
    if (typeof window === 'undefined') return [];

    try {
      const keys = Object.keys(sessionStorage).filter(key =>
        key.startsWith(this.ENCRYPTED_DATA_PREFIX)
      );
      return keys.map(key => key.replace(this.ENCRYPTED_DATA_PREFIX, ''));
    } catch (error) {
      console.error('Failed to list encrypted data IDs:', error);
      return [];
    }
  }

  /**
   * Removes encrypted data and keys from local storage
   */
  static async removeEncryptedData(id: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.removeItem(`${this.ENCRYPTED_DATA_PREFIX}${id}`);
      sessionStorage.removeItem(`${this.STORAGE_KEY_PREFIX}${id}`);
    } catch (error) {
      console.error('Failed to remove encrypted data:', error);
      throw new EncryptionError('Failed to remove encrypted data');
    }
  }

  /**
   * Exports encrypted data for backup (without sensitive keys)
   */
  static async exportEncryptedData(id: string): Promise<string> {
    const encryptedData = await this.retrieveEncryptedDataLocally(id);
    if (!encryptedData) {
      throw new EncryptionError('Encrypted data not found');
    }

    // Remove sensitive key information from export
    const exportData = {
      ...encryptedData,
      keyInfo: {
        ...encryptedData.keyInfo,
        userKey: undefined, // Don't export the user key
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Imports encrypted data from backup
   */
  static async importEncryptedData(encryptedDataJson: string): Promise<EncryptedAnalysisData> {
    try {
      const encryptedData: EncryptedAnalysisData = JSON.parse(encryptedDataJson);

      // Validate the data structure
      if (!encryptedData.id || !encryptedData.encryptedResult || !encryptedData.keyInfo) {
        throw new EncryptionError('Invalid encrypted data format');
      }

      // Store the imported data
      await this.storeEncryptedDataLocally(encryptedData);

      return encryptedData;
    } catch (error) {
      if (error instanceof EncryptionError) {
        throw error;
      }
      throw new EncryptionError('Failed to import encrypted data', error as Error);
    }
  }

  /**
   * Validates that encryption/decryption works correctly
   */
  static async validateEncryption(analysisResult: AnalysisResult, userPassword: string): Promise<boolean> {
    try {
      // Encrypt the data
      const encrypted = await this.encryptAnalysisResult(analysisResult, userPassword);

      // Decrypt the data
      const decrypted = await this.decryptAnalysisResult(encrypted, userPassword);

      // Compare original with decrypted
      const originalJson = JSON.stringify(analysisResult);
      const decryptedJson = JSON.stringify(decrypted);

      return originalJson === decryptedJson;
    } catch (error) {
      console.error('Encryption validation failed:', error);
      return false;
    }
  }
}
