// Debug script to test extraction logic with sample text
import { extractDiagnosisLines, fuzzyMatchICD10 } from '../src/lib/icd10-extractor.js';

const sampleProblemList = `
PROBLEM LIST:
1. Bipolar disorder
2. PTSD (Post-traumatic stress disorder)
3. Obesity
4. Irritable bowel syndrome (IBS)
5. Fatty liver disease
6. Chronic low back pain
7. Hidradenitis suppurativa
8. Housing instability
`;

console.log('Testing extraction logic:\n');

const lines = extractDiagnosisLines(sampleProblemList);
console.log(`Extracted ${lines.length} lines:`);
lines.forEach((line, i) => {
    console.log(`  ${i + 1}. "${line}"`);
    const matches = fuzzyMatchICD10(line);
    if (matches.length > 0) {
        console.log(`     ✅ Matched: ${matches.map(m => `${m.code} (${m.description})`).join(', ')}`);
    } else {
        console.log(`     ❌ No match`);
    }
});
