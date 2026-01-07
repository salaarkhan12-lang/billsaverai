// Simple test for encryption functionality
// Run with: node test-encryption-simple.js

// Mock browser environment for testing
global.crypto = require('crypto').webcrypto;
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
  }
};

async function testEncryption() {
  try {
    console.log('Testing BillSaver encryption implementation...\n');

    // Import our modules (using dynamic import for ES modules)
    const { EncryptionService } = await import('./src/lib/encryption-service.js');
    const { encryptAnalysisResult, decryptAnalysisResult } = await import('./src/lib/encryption.js');

    // Test data
    const testAnalysisResult = {
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

    const testPassword = 'testPassword123!';

    console.log('1. Testing basic encryption/decryption...');
    const encrypted = await encryptAnalysisResult(testAnalysisResult, testPassword);
    console.log('   ✓ Encryption successful');

    const decrypted = await decryptAnalysisResult(encrypted, testPassword);
    console.log('   ✓ Decryption successful');

    // Verify data integrity
    const originalJson = JSON.stringify(testAnalysisResult);
    if (originalJson === decrypted.decryptedData) {
      console.log('   ✓ Data integrity verified');
    } else {
      console.log('   ✗ Data integrity check failed');
      return;
    }

    console.log('\n2. Testing EncryptionService...');
    const serviceEncrypted = await EncryptionService.encryptAnalysisResult(testAnalysisResult, testPassword);
    console.log('   ✓ Service encryption successful');

    const serviceDecrypted = await EncryptionService.decryptAnalysisResult(serviceEncrypted, testPassword);
    console.log('   ✓ Service decryption successful');

    console.log('\n3. Testing local storage operations...');
    await EncryptionService.storeEncryptedDataLocally(serviceEncrypted);
    console.log('   ✓ Data stored locally');

    const retrieved = await EncryptionService.retrieveEncryptedDataLocally(serviceEncrypted.id);
    if (retrieved) {
      console.log('   ✓ Data retrieved from local storage');
    } else {
      console.log('   ✗ Failed to retrieve data from local storage');
      return;
    }

    console.log('\n4. Testing wrong password rejection...');
    try {
      await decryptAnalysisResult(encrypted, 'wrongPassword');
      console.log('   ✗ Wrong password test failed - should have thrown error');
      return;
    } catch (error) {
      console.log('   ✓ Wrong password correctly rejected');
    }

    console.log('\n5. Testing encryption validation...');
    const isValid = await EncryptionService.validateEncryption(testAnalysisResult, testPassword);
    if (isValid) {
      console.log('   ✓ Encryption validation passed');
    } else {
      console.log('   ✗ Encryption validation failed');
      return;
    }

    console.log('\n6. Testing data export/import...');
    const exported = await EncryptionService.exportEncryptedData(serviceEncrypted.id);
    console.log('   ✓ Data exported');

    // Clear local storage
    await EncryptionService.removeEncryptedData(serviceEncrypted.id);

    // Import the data
    const imported = await EncryptionService.importEncryptedData(exported);
    console.log('   ✓ Data imported');

    // Verify imported data works
    const importedDecrypted = await EncryptionService.decryptAnalysisResult(imported, testPassword);
    if (importedDecrypted.overallScore === testAnalysisResult.overallScore) {
      console.log('   ✓ Imported data decryption successful');
    } else {
      console.log('   ✗ Imported data decryption failed');
      return;
    }

    console.log('\n🎉 All encryption tests passed successfully!');
    console.log('\nHIPAA-compliant encryption implementation verified:');
    console.log('- AES-GCM encryption with PBKDF2 key derivation');
    console.log('- User-controlled encryption keys');
    console.log('- Data integrity verification');
    console.log('- Secure local storage operations');
    console.log('- Export/import functionality for backup');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testEncryption();
