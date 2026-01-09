// Quick script to extract all ICD-10 codes from the package
import icd10Module from '@lowlysre/icd-10-cm';

console.log('Package exports:', Object.keys(icd10Module));

// Try to access the internal data
if (icd10Module.default) {
    console.log('Default export type:', typeof icd10Module.default);
}

// Check if there's a way to get all codes
const testCodes = ['E11.9', 'E11.65', 'I10', 'Z23', 'F90.0', 'M79.645', 'R07.9', 'F31.9'];
console.log('\nTesting sample codes:');
testCodes.forEach(code => {
    const desc = icd10Module.getICD10Description(code);
    console.log(`${code}: ${desc || 'NOT FOUND'}`);
});

// Try to iterate through possible codes more efficiently
// ICD-10 format: Letter + 2 digits + optional decimal + 1-2 more digits
let foundCodes = 0;
const sampleCodes = [];

console.log('\nScanning for valid codes...');
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

for (let letter of letters) {
    for (let i = 0; i < 100; i++) {
        const baseCode = `${letter}${i.toString().padStart(2, '0')}`;

        // Test base code
        let desc = icd10Module.getICD10Description(baseCode);
        if (desc) {
            foundCodes++;
            if (sampleCodes.length < 20) {
                sampleCodes.push({ code: baseCode, description: desc });
            }
        }

        // Test with decimal variants
        for (let j = 0; j < 100; j++) {
            const detailedCode = `${baseCode}.${j.toString().padStart(2, '0')}`;
            desc = icd10Module.getICD10Description(detailedCode);
            if (desc) {
                foundCodes++;
                if (sampleCodes.length < 20) {
                    sampleCodes.push({ code: detailedCode, description: desc });
                }
            }
        }
    }

    if (foundCodes > 0 && foundCodes % 1000 === 0) {
        console.log(`Found ${foundCodes} codes so far...`);
    }
}

console.log(`\n✅ Total valid codes found: ${foundCodes}`);
console.log('\nSample codes:');
sampleCodes.forEach(({ code, description }) => {
    console.log(`  ${code}: ${description.substring(0, 60)}...`);
});
