#!/usr/bin/env node

/**
 * PDFViewer Debug Script
 *
 * This script helps debug PDFViewer issues by:
 * 1. Testing PDF parsing and text extraction
 * 2. Simulating gap data with location information
 * 3. Testing the PDFViewer component logic
 */

const fs = require('fs');
const path = require('path');

// Mock PDF.js for testing
const mockPDFJS = {
  GlobalWorkerOptions: {
    workerSrc: '/pdf.worker.min.mjs'
  },
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: jest.fn((pageNum) => ({
        getTextContent: jest.fn(() => ({
          items: [
            {
              str: 'CHIEF COMPLAINT',
              transform: [12, 0, 0, 12, 50, 700],
              width: 120,
              height: 14
            },
            {
              str: 'Patient presents with diabetes follow-up',
              transform: [10, 0, 0, 10, 50, 650],
              width: 250,
              height: 12
            },
            {
              str: 'HISTORY OF PRESENT ILLNESS',
              transform: [12, 0, 0, 12, 50, 600],
              width: 180,
              height: 14
            }
          ]
        })),
        getViewport: jest.fn(() => ({
          height: 792,
          width: 612
        }))
      }))
    })
  }))
};

// Mock gap data with location information
const mockGaps = [
  {
    id: 'gap-1',
    category: 'critical',
    title: 'Missing MDM',
    description: 'No medical decision making documented',
    impact: 'Potential downcoding',
    recommendation: 'Add MDM documentation',
    potentialRevenueLoss: '$150',
    location: {
      page: 1,
      position: 100,
      textSnippet: 'Patient presents with diabetes follow-up'
    }
  },
  {
    id: 'gap-2',
    category: 'major',
    title: 'Incomplete HPI',
    description: 'History of present illness lacks detail',
    impact: 'May affect E/M level',
    recommendation: 'Add more HPI elements',
    potentialRevenueLoss: '$75',
    location: {
      page: 1,
      position: 200,
      textSnippet: 'HISTORY OF PRESENT ILLNESS'
    }
  }
];

// Test functions
function testGapDataStructure() {
  console.log('🔍 Testing gap data structure...\n');

  mockGaps.forEach((gap, index) => {
    console.log(`Gap ${index + 1}:`);
    console.log(`  ID: ${gap.id}`);
    console.log(`  Category: ${gap.category}`);
    console.log(`  Title: ${gap.title}`);
    console.log(`  Has location: ${!!gap.location}`);
    if (gap.location) {
      console.log(`  Page: ${gap.location.page}`);
      console.log(`  Position: ${gap.location.position}`);
      console.log(`  Text snippet: "${gap.location.textSnippet}"`);
    }
    console.log('');
  });
}

function testTextExtraction() {
  console.log('📝 Testing text extraction simulation...\n');

  // Simulate text extraction from PDF
  const mockTextItems = [
    { text: 'CHIEF COMPLAINT', x: 50, y: 700, width: 120, height: 14, page: 1 },
    { text: 'Patient presents with diabetes follow-up', x: 50, y: 650, width: 250, height: 12, page: 1 },
    { text: 'HISTORY OF PRESENT ILLNESS', x: 50, y: 600, width: 180, height: 14, page: 1 }
  ];

  console.log(`Extracted ${mockTextItems.length} text items:`);
  mockTextItems.forEach((item, index) => {
    console.log(`  ${index + 1}. "${item.text}" at (${item.x}, ${item.y}) on page ${item.page}`);
  });
  console.log('');
}

function testHighlightMatching() {
  console.log('🔍 Testing highlight matching logic...\n');

  const mockTextItems = [
    { text: 'CHIEF COMPLAINT', x: 50, y: 700, width: 120, height: 14, page: 1 },
    { text: 'Patient presents with diabetes follow-up', x: 50, y: 650, width: 250, height: 12, page: 1 },
    { text: 'HISTORY OF PRESENT ILLNESS', x: 50, y: 600, width: 180, height: 14, page: 1 }
  ];

  const scale = 1.5;
  const targetSnippet = 'Patient presents with diabetes follow-up';

  console.log(`Looking for snippet: "${targetSnippet}"`);
  console.log(`Scale factor: ${scale}`);

  const matches = [];
  mockTextItems.forEach(item => {
    if (item.text.toLowerCase().includes(targetSnippet.toLowerCase().slice(0, 20))) {
      matches.push({
        x: item.x * scale,
        y: item.y * scale,
        width: item.width * scale,
        height: item.height * scale,
        text: item.text
      });
    }
  });

  console.log(`Found ${matches.length} matches:`);
  matches.forEach((match, index) => {
    console.log(`  ${index + 1}. "${match.text}" -> rect(${match.x}, ${match.y}, ${match.width}, ${match.height})`);
  });
  console.log('');
}

function testAnnotationCreation() {
  console.log('🏷️ Testing annotation creation logic...\n');

  const criticalGaps = mockGaps.filter(gap => gap.category === 'critical');
  console.log(`Found ${criticalGaps.length} critical gaps`);

  const annotations = [];
  criticalGaps.forEach(gap => {
    if (gap.location) {
      const scale = 1.5;
      annotations.push({
        x: 50 * scale, // Mock position
        y: 650 * scale,
        width: 250 * scale,
        height: 12 * scale,
        category: gap.category,
        snippet: gap.location.textSnippet
      });
    }
  });

  console.log(`Created ${annotations.length} annotations:`);
  annotations.forEach((annotation, index) => {
    console.log(`  ${index + 1}. ${annotation.category} - "${annotation.snippet}"`);
  });
  console.log('');
}

function generateDebugReport() {
  console.log('📊 PDFViewer Debug Report\n');
  console.log('='.repeat(50));

  testGapDataStructure();
  testTextExtraction();
  testHighlightMatching();
  testAnnotationCreation();

  console.log('🎯 Recommendations:');
  console.log('1. Ensure gaps have location data with page, position, and textSnippet');
  console.log('2. Verify text extraction is working and returning textItems array');
  console.log('3. Check that highlight matching logic finds text in extracted content');
  console.log('4. Confirm annotation creation uses correct coordinates and scaling');
  console.log('5. Test with real PDF that triggers analysis rules to create gaps');

  console.log('\n🔧 Debug Checklist:');
  console.log('□ Gaps have location.location property');
  console.log('□ PDFViewer receives allGaps prop with location data');
  console.log('□ Text extraction returns textItems array');
  console.log('□ Highlight rectangles are created and positioned');
  console.log('□ Annotations appear for critical gaps');
  console.log('□ Section navigation buttons work');

  console.log('\n' + '='.repeat(50));
}

// Run the debug tests
if (require.main === module) {
  generateDebugReport();
}

module.exports = {
  testGapDataStructure,
  testTextExtraction,
  testHighlightMatching,
  testAnnotationCreation,
  generateDebugReport
};
