#!/usr/bin/env node

/**
 * Script to create test PDFs for PDFViewer testing
 * Generates text-based and image-based PDFs for testing different scenarios
 */

const fs = require('fs');
const path = require('path');

// Simple PDF generation (text-based PDFs)
// This creates minimal PDF content for testing

const textBasedPDF = `%PDF-1.4
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
/Length 200
>>
stream
BT
/F1 12 Tf
50 700 Td
(CHIEF COMPLAINT) Tj
0 -50 Td
(Patient presents with chest pain and shortness of breath.) Tj
0 -50 Td
(HISTORY OF PRESENT ILLNESS) Tj
0 -50 Td
(Patient reports symptoms started 2 days ago.) Tj
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
0000000456 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
553
%%EOF`;

const imageBasedPDF = `%PDF-1.4
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
>>
endobj

4 0 obj
<<
/Length 50
>>
stream
BT
/F1 12 Tf
50 700 Td
(Image-based content - requires OCR) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000200 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
250
%%EOF`;

const medicalNotePDF = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R 6 0 R]
/Count 2
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
/F1 7 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 400
>>
stream
BT
/F1 12 Tf
50 700 Td
(CHIEF COMPLAINT) Tj
0 -30 Td
(Patient presents with diabetes follow-up) Tj
0 -50 Td
(HISTORY OF PRESENT ILLNESS) Tj
0 -30 Td
(Patient reports blood sugars have been running high) Tj
0 -30 Td
(despite current metformin regimen. Last A1c was 8.2%.) Tj
0 -50 Td
(PAST MEDICAL HISTORY) Tj
0 -30 Td
(Diabetes mellitus type 2, diagnosed 5 years ago) Tj
ET
endstream
endobj

6 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 8 0 R
/Resources <<
/Font <<
/F1 7 0 R
>>
>>
>>
endobj

8 0 obj
<<
/Length 300
>>
stream
BT
/F1 12 Tf
50 700 Td
(MEDICATIONS) Tj
0 -30 Td
(Metformin 1000mg twice daily) Tj
0 -50 Td
(ASSESSMENT) Tj
0 -30 Td
(Diabetes mellitus type 2, poorly controlled) Tj
0 -50 Td
(PLAN) Tj
0 -30 Td
(Increase metformin to 1500mg twice daily) Tj
0 -30 Td
(Recheck A1c in 3 months) Tj
ET
endstream
endobj

7 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 9
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000000000 65535 f
0000000690 00000 n
0000000850 00000 n
0000001000 00000 n
trailer
<<
/Size 9
/Root 1 0 R
>>
startxref
1100
%%EOF`;

function createTestPDFs() {
  const fixturesDir = path.join(__dirname);

  // Ensure directory exists
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // Create text-based PDF
  const textPDFPath = path.join(fixturesDir, 'text-based-medical-note.pdf');
  fs.writeFileSync(textPDFPath, textBasedPDF);
  console.log('✅ Created text-based test PDF:', textPDFPath);

  // Create image-based PDF (simulated)
  const imagePDFPath = path.join(fixturesDir, 'image-based-medical-note.pdf');
  fs.writeFileSync(imagePDFPath, imageBasedPDF);
  console.log('✅ Created image-based test PDF:', imagePDFPath);

  // Create comprehensive medical note PDF
  const medicalPDFPath = path.join(fixturesDir, 'comprehensive-medical-note.pdf');
  fs.writeFileSync(medicalPDFPath, medicalNotePDF);
  console.log('✅ Created comprehensive medical note PDF:', medicalPDFPath);

  console.log('\n📋 Test PDFs created successfully!');
  console.log('Use these files to test PDFViewer component:');
  console.log('- text-based-medical-note.pdf: Simple text-based PDF');
  console.log('- image-based-medical-note.pdf: Simulates OCR-required content');
  console.log('- comprehensive-medical-note.pdf: Multi-page medical note with sections');
}

if (require.main === module) {
  createTestPDFs();
}

module.exports = { createTestPDFs };
