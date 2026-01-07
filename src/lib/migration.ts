// Migration script to move localStorage data to encrypted database
// This handles the transition from unencrypted localStorage to HIPAA-compliant encrypted storage

import type { AnalysisResult } from "./billing-rules";
import type { AnalysisHistoryItem } from "./history-storage";
import { EncryptionService } from "./encryption-service";

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: string[];
  skippedCount: number;
}

export interface MigrationOptions {
  userPassword: string;
  forceOverwrite?: boolean;
  dryRun?: boolean;
  batchSize?: number;
}

/**
 * Migrates existing localStorage analysis results to encrypted database storage
 */
export async function migrateLocalStorageToEncrypted(
  options: MigrationOptions
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    failedCount: 0,
    errors: [],
    skippedCount: 0
  };

  try {
    console.log('🔄 Starting localStorage to encrypted database migration...');

    if (typeof window === 'undefined' || !window.localStorage) {
      result.success = false;
      result.errors.push('localStorage is not available');
      return result;
    }

    const existingData = getExistingLocalStorageData();
    if (existingData.length === 0) {
      console.log('ℹ️ No existing localStorage data found to migrate');
      return result;
    }

    console.log(`📊 Found ${existingData.length} analysis results to migrate`);

    if (options.dryRun) {
      console.log('🔍 Dry run mode - would migrate:', existingData.length, 'items');
      result.migratedCount = existingData.length;
      return result;
    }

    const batchSize = options.batchSize || 10;
    const batches = chunkArray(existingData, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} items)`);

      for (const item of batch) {
        try {
          await migrateSingleItem(item, options, result);
        } catch (error) {
          result.failedCount++;
          const errorMsg = `Failed to migrate item ${item.id}: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      if (i < batches.length - 1) {
        await delay(100);
      }
    }

    if (result.migratedCount > 0 && !options.dryRun) {
      await createMigrationBackup(existingData);
    }

    console.log('✅ Migration completed:', {
      migrated: result.migratedCount,
      failed: result.failedCount,
      skipped: result.skippedCount
    });

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error('💥 Migration failed:', error);
  }

  return result;
}

/**
 * Gets existing analysis data from localStorage
 */
function getExistingLocalStorageData(): AnalysisHistoryItem[] {
  const STORAGE_KEY = "billsaver_analysis_history";

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored) as AnalysisHistoryItem[];

    return history.filter(item => {
      return item &&
             typeof item.id === 'string' &&
             typeof item.fileName === 'string' &&
             typeof item.timestamp === 'number' &&
             item.result &&
             typeof item.result.overallScore === 'number';
    });
  } catch (error) {
    console.warn('⚠️ Failed to parse existing localStorage data:', error);
    return [];
  }
}

/**
 * Migrates a single analysis result item
 */
async function migrateSingleItem(
  item: AnalysisHistoryItem,
  options: MigrationOptions,
  result: MigrationResult
): Promise<void> {
  const existingIds = await EncryptionService.listEncryptedDataIds();
  const encryptedId = generateEncryptedId(item.id);

  if (existingIds.includes(encryptedId) && !options.forceOverwrite) {
    result.skippedCount++;
    console.log(`⏭️ Skipping existing item: ${item.id}`);
    return;
  }

  const encryptedData = await EncryptionService.encryptAnalysisResult(
    item.result,
    options.userPassword,
    {
      fileName: item.fileName
    }
  );

  await EncryptionService.storeEncryptedDataLocally(encryptedData);

  result.migratedCount++;
  console.log(`✅ Migrated item: ${item.id} -> ${encryptedData.id}`);
}

/**
 * Creates a backup of the original localStorage data
 */
async function createMigrationBackup(originalData: AnalysisHistoryItem[]): Promise<void> {
  try {
    const backupKey = `billsaver_migration_backup_${Date.now()}`;
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: originalData,
      checksum: await computeSimpleChecksum(JSON.stringify(originalData))
    };

    localStorage.setItem(backupKey, JSON.stringify(backupData));
    console.log('💾 Migration backup created:', backupKey);
  } catch (error) {
    console.warn('⚠️ Failed to create migration backup:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Generates a consistent encrypted ID from the original localStorage ID
 */
function generateEncryptedId(originalId: string): string {
  return `encrypted_${btoa(originalId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`;
}

/**
 * Computes a simple checksum for backup verification
 */
async function computeSimpleChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  if (crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

/**
 * Utility function to chunk arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Utility function for delays
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validates migration options
 */
export function validateMigrationOptions(options: MigrationOptions): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!options.userPassword || options.userPassword.length < 8) {
    errors.push('User password must be at least 8 characters long');
  }

  if (options.batchSize && (options.batchSize < 1 || options.batchSize > 100)) {
    errors.push('Batch size must be between 1 and 100');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Gets migration status and statistics
 */
export async function getMigrationStatus(): Promise<{
  hasExistingData: boolean;
  existingDataCount: number;
  encryptedDataCount: number;
  backupsAvailable: string[];
}> {
  const existingData = getExistingLocalStorageData();
  const encryptedIds = await EncryptionService.listEncryptedDataIds();

  const backups: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('billsaver_migration_backup_')) {
      backups.push(key);
    }
  }

  return {
    hasExistingData: existingData.length > 0,
    existingDataCount: existingData.length,
    encryptedDataCount: encryptedIds.length,
    backupsAvailable: backups
  };
}
