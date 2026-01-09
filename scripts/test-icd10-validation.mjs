import { getICD10Description } from '@lowlysre/icd-10-cm';

const testCodes = [
    'M54.5',  // Low back pain
    'K76.0',  // Fatty liver
    'F31.9',  // Bipolar disorder
    'E66.9',  // Obesity
    'K58.9',  // IBS
    'F43.10', // PTSD
];

console.log('Testing ICD-10 code validation:');
testCodes.forEach(code => {
    const desc = getICD10Description(code);
    console.log(`  ${code}: ${desc || 'UNDEFINED/NOT FOUND'}`);
});
