#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create a more comprehensive test PDF that will trigger analysis gaps
const comprehensivePDF = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 1200
>>
stream
BT
/F1 10 Tf
50 750 Td
(CHIEF COMPLAINT) Tj
0 -20 Td
(Patient presents with chest pain) Tj
0 -40 Td
(HISTORY OF PRESENT ILLNESS) Tj
0 -20 Td
(Patient reports chest pain) Tj
0 -40 Td
(REVIEW OF SYSTEMS) Tj
0 -20 Td
(Constitutional: No fever) Tj
0 -20 Td
(Cardiovascular: Chest pain present) Tj
0 -20 Td
(Respiratory: No shortness of breath) Tj
0 -20 Td
(Gastrointestinal: No nausea) Tj
0 -40 Td
(PHYSICAL EXAM) Tj
0 -20 Td
(Vitals: BP 120/80, HR 80) Tj
0 -20 Td
(General: Well appearing) Tj
0 -20 Td
(HEENT: Normal) Tj
0 -20 Td
(Cardiovascular: Regular rhythm) Tj
0 -40 Td
(ASSESSMENT) Tj
0 -20 Td
(Chest pain, rule out cardiac etiology) Tj
0 -40 Td
(PLAN) Tj
0 -20 Td
(EKG, cardiac enzymes, consider stress test) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000001474 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1550
%%EOF`;

const fixturesDir = path.join(__dirname, 'test-fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

const pdfPath = path.join(fixturesDir, 'text-based-medical-note.pdf');
fs.writeFileSync(pdfPath, comprehensivePDF);
console.log('✅ Updated text-based test PDF with more comprehensive content that should trigger analysis gaps');
