// Inline test for migration functionality
// Run with: node test-migration-inline.js

const crypto = require('crypto').webcrypto;

// Mock browser environment
global.crypto = crypto;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock localStorage
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  },
  get length() {
    return Object.keys(this.data).length;
  },
  key(index) {
    const keys = Object.keys(this.data);
    return keys[index] || null;
  }
};

// Mock window
global.window = { localStorage };

// Simplified encryption service mock
class MockEncryptionService {
  static encryptedData = new Map();

  static async encryptAnalysisResult(analysisResult, password, metadata = {}) {
    const id = `encrypted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const encrypted = {
      id,
      encryptedResult: btoa(JSON.stringify(analysisResult)),
      dataHash: 'mock_hash',
      keyInfo: { passwordDerived: true },
      createdAt: new Date().toISOString(),
      metadata
    };
    this.encryptedData.set(id, encrypted);
    return encrypted;
  }

  static async decryptAnalysisResult(encrypted, password) {
    const data = JSON.parse(atob(encrypted.encryptedResult));
    return data;
  }

  static async storeEncryptedDataLocally(encrypted) {
    localStorage.setItem(`billsaver_encrypted_${encrypted.id}`, JSON.stringify(encrypted));
  }

  static async retrieveEncryptedDataLocally(id) {
    const stored = localStorage.getItem(`billsaver_encrypted_${id}`);
    return stored ? JSON.parse(stored) : null;
  }

  static async listEncryptedDataIds() {
    const ids = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('billsaver_encrypted_')) {
        ids.push(key.replace('billsaver_encrypted_', ''));
      }
    }
    return ids;
  }

  static async removeEncryptedData(id) {
    localStorage.removeItem(`billsaver_encrypted_${id}`);
  }
}

// Copy migration functions inline
function getExistingLocalStorageData() {
  const STORAGE_KEY = "billsaver_analysis_history";

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored);

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

function generateEncryptedId(originalId) {
  return `encrypted_${btoa(originalId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`;
}

async function migrateSingleItem(item, options, result) {
  const existingIds = await MockEncryptionService.listEncryptedDataIds();
  const encryptedId = generateEncryptedId(item.id);

  if (existingIds.includes(encryptedId) && !options.forceOverwrite) {
    result.skippedCount++;
    console.log(`⏭️ Skipping existing item: ${item.id}`);
    return;
  }

  const encryptedData = await MockEncryptionService.encryptAnalysisResult(
    item.result,
    options.userPassword,
    {
      fileName: item.fileName
    }
  );

  await MockEncryptionService.storeEncryptedDataLocally(encryptedData);

  result.migratedCount++;
  console.log(`✅ Migrated item: ${item.id} -> ${encryptedData.id}`);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function migrateLocalStorageToEncrypted(options) {
  const result = {
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

function validateMigrationOptions(options) {
  const errors = [];

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

async function getMigrationStatus() {
  const existingData = getExistingLocalStorageData();
  const encryptedIds = await MockEncryptionService.listEncryptedDataIds();

  const backups = [];
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

async function testMigration() {
  try {
    console.log('🧪 Testing BillSaver migration functionality...\n');

    // Simulate existing localStorage data
    const mockAnalysisResult = {
      overallScore: 85,
      documentationLevel: 'Good',
      gaps: [
        {
          id: 'test-gap',
          category: 'major',
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
      mdmComplexity: 'Moderate',
      timeDocumented: true,
      meatCriteriaMet: true
    };

    const mockHistoryData = [
      {
        id: 'item-1',
        fileName: 'test-document-1.pdf',
        timestamp: Date.now() - 1000,
        result: mockAnalysisResult
      },
      {
        id: 'item-2',
        fileName: 'test-document-2.pdf',
        timestamp: Date.now(),
        result: mockAnalysisResult
      }
    ];

    // Set up localStorage with mock data
    localStorage.setItem('billsaver_analysis_history', JSON.stringify(mockHistoryData));

    console.log('1. Testing migration status check...');
    const status = await getMigrationStatus();
    console.log('   ✓ Migration status retrieved');
    console.log('   - Has existing data:', status.hasExistingData);
    console.log('   - Existing data count:', status.existingDataCount);

    if (!status.hasExistingData || status.existingDataCount !== 2) {
      console.log('   ✗ Migration status check failed');
      return;
    }

    console.log('\n2. Testing migration options validation...');
    const validOptions = { userPassword: 'ValidPassword123!' };
    const invalidOptions = { userPassword: 'short' };

    const validResult = validateMigrationOptions(validOptions);
    const invalidResult = validateMigrationOptions(invalidOptions);

    if (validResult.valid && !invalidResult.valid) {
      console.log('   ✓ Migration options validation works');
    } else {
      console.log('   ✗ Migration options validation failed');
      return;
    }

    console.log('\n3. Testing dry run migration...');
    const dryRunResult = await migrateLocalStorageToEncrypted({
      userPassword: 'TestPassword123!',
      dryRun: true
    });

    if (dryRunResult.success && dryRunResult.migratedCount === 2) {
      console.log('   ✓ Dry run migration successful');
    } else {
      console.log('   ✗ Dry run migration failed');
      return;
    }

    console.log('\n4. Testing actual migration...');
    const migrationResult = await migrateLocalStorageToEncrypted({
      userPassword: 'TestPassword123!',
      forceOverwrite: false
    });

    if (migrationResult.success && migrationResult.migratedCount === 2) {
      console.log('   ✓ Actual migration successful');
    } else {
      console.log('   ✗ Actual migration failed');
      return;
    }

    console.log('\n5. Testing duplicate migration prevention...');
    const duplicateResult = await migrateLocalStorageToEncrypted({
      userPassword: 'TestPassword123!',
      forceOverwrite: false
    });

    if (duplicateResult.success && duplicateResult.skippedCount === 2) {
      console.log('   ✓ Duplicate migration correctly prevented');
    } else {
      console.log('   ✗ Duplicate migration prevention failed');
      return;
    }

    console.log('\n🎉 All migration tests passed successfully!');

  } catch (error) {
    console.error('\n❌ Migration test failed with error:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testMigration();
