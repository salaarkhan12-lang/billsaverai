// Client-side encryption utilities for HIPAA-compliant data storage
// Uses Web Crypto API for AES-GCM encryption with user-controlled keys

export interface EncryptionResult {
  encryptedData: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  salt: string; // Base64 encoded salt for key derivation
  authTag: string; // Base64 encoded authentication tag (for AES-GCM)
  dataHash: string; // SHA-256 hash for integrity verification
}

export interface DecryptionResult {
  decryptedData: string; // Decrypted JSON string
  verified: boolean; // Whether integrity check passed
}

export class EncryptionError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'EncryptionError';
  }
}

/**
 * Generates a cryptographically secure random salt
 */
export function generateSalt(length: number = 32): Uint8Array {
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Generates a cryptographically secure random initialization vector
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12)); // 96 bits for AES-GCM
}

/**
 * Derives a cryptographic key from a password using PBKDF2
 * SECURITY: Updated to 500,000 iterations (OWASP 2024 recommendation)
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = 500000 // Increased from 100,000
): Promise<CryptoKey> {
  try {
    // Convert password to key material
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive AES-GCM key
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    throw new EncryptionError('Failed to derive key from password', error as Error);
  }
}

/**
 * Encrypts data using AES-GCM with the provided key
 */
export async function encryptData(
  data: BufferSource,
  key: CryptoKey,
  iv: Uint8Array
): Promise<{ encryptedData: ArrayBuffer; authTag: ArrayBuffer }> {
  try {
    let dataBuffer: Uint8Array;
    if (data instanceof ArrayBuffer) {
      dataBuffer = new Uint8Array(data);
    } else {
      dataBuffer = data as Uint8Array;
    }

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      dataBuffer as BufferSource
    );

    // For AES-GCM, the auth tag is included in the encrypted data
    // We need to separate it for storage (last 16 bytes)
    const encryptedArray = new Uint8Array(encrypted);
    const authTag = encryptedArray.slice(-16);
    const encryptedData = encryptedArray.slice(0, -16);

    return {
      encryptedData: encryptedData.buffer,
      authTag: authTag.buffer,
    };
  } catch (error) {
    throw new EncryptionError('Failed to encrypt data', error as Error);
  }
}

/**
 * Decrypts data using AES-GCM with the provided key
 */
export async function decryptData(
  encryptedData: ArrayBuffer,
  authTag: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<string> {
  try {
    // Reconstruct the encrypted data with auth tag
    const encryptedArray = new Uint8Array(encryptedData.byteLength + authTag.byteLength);
    encryptedArray.set(new Uint8Array(encryptedData), 0);
    encryptedArray.set(new Uint8Array(authTag), encryptedData.byteLength);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      encryptedArray.buffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new EncryptionError('Failed to decrypt data - invalid key or corrupted data', error as Error);
  }
}

/**
 * Computes SHA-256 hash of data for integrity verification
 */
export async function computeHash(data: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = new Uint8Array(hashBuffer);

    // Convert to hex string
    return Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    throw new EncryptionError('Failed to compute hash', error as Error);
  }
}

/**
 * Verifies data integrity by comparing computed hash with stored hash
 */
export async function verifyIntegrity(data: string, expectedHash: string): Promise<boolean> {
  try {
    const computedHash = await computeHash(data);
    return computedHash === expectedHash;
  } catch (error) {
    console.error('Integrity verification failed:', error);
    return false;
  }
}

/**
 * Encrypts analysis result data with user-controlled key
 */
export async function encryptAnalysisResult(
  analysisResult: any,
  userPassword: string
): Promise<EncryptionResult> {
  try {
    // Generate salt and IV
    const salt = generateSalt();
    const iv = generateIV();

    // Derive key from password
    const key = await deriveKeyFromPassword(userPassword, salt);

    // Convert analysis result to JSON string
    const jsonString = JSON.stringify(analysisResult);
    const jsonData = new TextEncoder().encode(jsonString);

    // Compute hash for integrity verification
    const dataHash = await computeHash(jsonString);

    // Encrypt the data
    const { encryptedData, authTag } = await encryptData(jsonData, key, iv);

    // Convert to base64 for storage
    const encryptedDataArr = new Uint8Array(encryptedData);
    let encryptedDataStr = '';
    for (let i = 0; i < encryptedDataArr.length; i++) {
      encryptedDataStr += String.fromCharCode(encryptedDataArr[i]);
    }
    const encryptedDataB64 = btoa(encryptedDataStr);

    let ivStr = '';
    for (let i = 0; i < iv.length; i++) {
      ivStr += String.fromCharCode(iv[i]);
    }
    const ivB64 = btoa(ivStr);

    let saltStr = '';
    for (let i = 0; i < salt.length; i++) {
      saltStr += String.fromCharCode(salt[i]);
    }
    const saltB64 = btoa(saltStr);

    const authTagArr = new Uint8Array(authTag);
    let authTagStr = '';
    for (let i = 0; i < authTagArr.length; i++) {
      authTagStr += String.fromCharCode(authTagArr[i]);
    }
    const authTagB64 = btoa(authTagStr);

    return {
      encryptedData: encryptedDataB64,
      iv: ivB64,
      salt: saltB64,
      authTag: authTagB64,
      dataHash,
    };
  } catch (error) {
    throw new EncryptionError('Failed to encrypt analysis result', error as Error);
  }
}

/**
 * Decrypts analysis result data with user-controlled key
 */
export async function decryptAnalysisResult(
  encryptedResult: EncryptionResult,
  userPassword: string,
  expectedHash?: string
): Promise<DecryptionResult> {
  try {
    // Convert from base64
    const encryptedData = Uint8Array.from(atob(encryptedResult.encryptedData), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedResult.iv), c => c.charCodeAt(0));
    const salt = Uint8Array.from(atob(encryptedResult.salt), c => c.charCodeAt(0));
    const authTag = Uint8Array.from(atob(encryptedResult.authTag), c => c.charCodeAt(0));

    // Derive key from password
    const key = await deriveKeyFromPassword(userPassword, salt);

    // Decrypt the data
    const decryptedJson = await decryptData(encryptedData.buffer, authTag.buffer, key, iv);

    // Verify integrity using stored hash or provided expected hash
    let verified = true;
    const hashToCheck = expectedHash || encryptedResult.dataHash;
    if (hashToCheck) {
      verified = await verifyIntegrity(decryptedJson, hashToCheck);
      if (!verified && expectedHash) {
        throw new EncryptionError('Data integrity check failed - data may be corrupted');
      }
    }

    return {
      decryptedData: decryptedJson,
      verified,
    };
  } catch (error) {
    if (error instanceof EncryptionError) {
      throw error;
    }
    throw new EncryptionError('Failed to decrypt analysis result', error as Error);
  }
}

/**
 * Generates a user-specific encryption key for additional security layers
 * This can be used for additional encryption beyond password-based encryption
 */
export async function generateUserKey(): Promise<{ key: CryptoKey; exportedKey: string }> {
  try {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    const exportedKey = await crypto.subtle.exportKey('raw', key);
    const exportedKeyArr = new Uint8Array(exportedKey);
    let exportedKeyStr = '';
    for (let i = 0; i < exportedKeyArr.length; i++) {
      exportedKeyStr += String.fromCharCode(exportedKeyArr[i]);
    }
    const exportedKeyB64 = btoa(exportedKeyStr);

    return {
      key,
      exportedKey: exportedKeyB64,
    };
  } catch (error) {
    throw new EncryptionError('Failed to generate user key', error as Error);
  }
}

/**
 * Imports a previously exported user key
 */
export async function importUserKey(exportedKeyB64: string): Promise<CryptoKey> {
  try {
    const exportedKey = Uint8Array.from(atob(exportedKeyB64), c => c.charCodeAt(0));

    return crypto.subtle.importKey(
      'raw',
      exportedKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    throw new EncryptionError('Failed to import user key', error as Error);
  }
}
