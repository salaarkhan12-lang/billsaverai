#!/usr/bin/env node

/**
 * Test script to verify that the analysis pipeline finds gaps
 */

const fs = require('fs');
const path = require('path');

async function testAnalysis() {
  console.log('🧪 Testing Analysis Pipeline');
  console.log('===========================\n');

  try {
    // Read a test PDF
    const testPdfPath = path.join(__dirname, 'test-fixtures', 'text-based-medical-note.pdf');
    if (!fs.existsSync(testPdfPath)) {
      console.log('❌ Test PDF not found. Run: node test-fixtures/create-test-pdfs.js');
      return;
    }

    const pdfBuffer = fs.readFileSync(testPdfPath);
    const pdfFile = new File([pdfBuffer], 'text-based-medical-note.pdf', { type: 'application/pdf' });

    console.log('📄 Loading test PDF...');

    // Import and use the PDF parser
    const { parsePDF } = await import('./src/lib/blackbox_pdf-parser.ts');
    console.log('🔍 Parsing PDF...');
    const parseResult = await parsePDF(pdfFile);

    console.log('📊 Parse Result:');
    console.log(`  - Pages: ${parseResult.pageCount}`);
    console.log(`  - Text length: ${parseResult.text.length} characters`);
    console.log(`  - Text items: ${parseResult.textItems.length}`);
    console.log(`  - Used OCR: ${parseResult.usedOCR}`);

    console.log('\n📝 Sample text (first 200 chars):');
    console.log(parseResult.text.substring(0, 200) + '...');

    // Import and run analysis
    const { analyzeDocument } = await import('./src/lib/billing-rules.ts');
    console.log('\n🔬 Running analysis...');
    const analysisResult = await analyzeDocument(parseResult);

    console.log('📈 Analysis Result:');
    console.log(`  - Overall Score: ${analysisResult.overallScore}/100`);
    console.log(`  - Documentation Level: ${analysisResult.documentationLevel}`);
    console.log(`  - Total Gaps: ${analysisResult.gaps.length}`);
    console.log(`  - Gap Categories:`, analysisResult.gaps.reduce((acc, gap) => {
      acc[gap.category] = (acc[gap.category] || 0) + 1;
      return acc;
    }, {}));

    console.log('\n🚨 Critical Gaps:');
    const criticalGaps = analysisResult.gaps.filter(g => g.category === 'critical');
    if (criticalGaps.length === 0) {
      console.log('  No critical gaps found');
    } else {
      criticalGaps.forEach((gap, i) => {
        console.log(`  ${i + 1}. ${gap.title}`);
        console.log(`     Location: ${gap.location ? `Page ${gap.location.page}` : 'No location data'}`);
        console.log(`     Snippet: "${gap.location?.textSnippet?.substring(0, 50) || 'No snippet'}..."`);
      });
    }

    console.log('\n✅ Analysis test complete!');

    if (analysisResult.gaps.length === 0) {
      console.log('⚠️  WARNING: No gaps found. This may explain why annotations don\'t show.');
      console.log('   Possible causes:');
      console.log('   - PDF content doesn\'t match expected medical note patterns');
      console.log('   - Text extraction failed');
      console.log('   - Analysis rules are too strict');
    }

    if (criticalGaps.length === 0) {
      console.log('⚠️  WARNING: No critical gaps found. Critical gap annotations won\'t appear.');
    }

  } catch (error) {
    console.error('❌ Analysis test failed:', error);
  }
}

testAnalysis();
