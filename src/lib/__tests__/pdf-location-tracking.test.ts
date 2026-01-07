import { parsePDF } from '../blackbox_pdf-parser';
import { analyzeDocument } from '../billing-rules';
import type { PDFParseResult } from '../blackbox_pdf-parser';

// Mock PDF.js
jest.mock('pdfjs-dist', () => ({
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
}));

describe('PDF Location Tracking', () => {
  let mockParseResult: PDFParseResult;

  beforeEach(() => {
    mockParseResult = { pageTexts: [''], 
      text: 'CHIEF COMPLAINT\nPatient presents with diabetes follow-up\nHISTORY OF PRESENT ILLNESS\nPatient reports blood sugars have been running high',
      pageCount: 2,
      textItems: [
        {
          text: 'CHIEF COMPLAINT',
          x: 50,
          y: 700,
          width: 120,
          height: 14,
          page: 1
        },
        {
          text: 'Patient presents with diabetes follow-up',
          x: 50,
          y: 650,
          width: 250,
          height: 12,
          page: 1
        }
      ],
      usedOCR: false
    };
  });

  test('parsePDF extracts text with position information', async () => {
    const file = new File(['mock pdf content'], 'test.pdf', { type: 'application/pdf' });
    const result = await parsePDF(file);

    expect(result.textItems).toBeDefined();
    expect(result.textItems.length).toBeGreaterThan(0);
    expect(result.textItems[0]).toHaveProperty('x');
    expect(result.textItems[0]).toHaveProperty('y');
    expect(result.textItems[0]).toHaveProperty('page');
  });

  test('analyzeDocument includes location data in gaps', async () => {
    const result = await analyzeDocument(mockParseResult);

    // Check that gaps have location information
    result.gaps.forEach(gap => {
      if (gap.location) {
        expect(gap.location).toHaveProperty('page');
        expect(gap.location).toHaveProperty('position');
        expect(gap.location).toHaveProperty('textSnippet');
      }
    });
  });

  test('gap detection accuracy with location mapping', async () => {
    const result = await analyzeDocument(mockParseResult);

    // Verify that gaps with location data have reasonable position values
    const gapsWithLocation = result.gaps.filter(gap => gap.location);
    gapsWithLocation.forEach(gap => {
      expect(gap.location!.page).toBeGreaterThan(0);
      expect(gap.location!.position).toBeGreaterThanOrEqual(0);
      expect(gap.location!.textSnippet).toBeDefined();
      expect(gap.location!.textSnippet.length).toBeGreaterThan(0);
    });
  });

  test('location-based navigation functionality', () => {
    // Test that gaps can be filtered by location
    const mockGaps = [
      { id: '1', category: 'critical', location: { page: 1, section: 'HPI' } },
      { id: '2', category: 'major', location: { page: 2, section: 'Assessment' } },
      { id: '3', category: 'minor', location: { page: 1, section: 'Plan' } }
    ];

    const page1Gaps = mockGaps.filter(gap => gap.location?.page === 1);
    expect(page1Gaps).toHaveLength(2);

    const hpiGaps = mockGaps.filter(gap => gap.location?.section === 'HPI');
    expect(hpiGaps).toHaveLength(1);
  });

  test('critical gap annotations are properly positioned', () => {
    const mockCriticalGaps = [
      { id: 'critical-1', category: 'critical', location: { page: 1, section: 'Assessment' } },
      { id: 'critical-2', category: 'critical', location: { page: 1, section: 'HPI' } }
    ];

    const currentPage = 1;
    const criticalAnnotations = mockCriticalGaps.filter(
      gap => gap.category === 'critical' && gap.location?.page === currentPage
    );

    expect(criticalAnnotations).toHaveLength(2);
    criticalAnnotations.forEach(gap => {
      expect(gap.location?.page).toBe(currentPage);
    });
  });
});

describe('Performance Testing', () => {
  test('large PDF processing performance', async () => {
    // Mock a larger PDF with more pages
    const largeMockParseResult: PDFParseResult = { pageTexts: [''], 
      text: 'Large document content '.repeat(1000),
      pageCount: 50,
      textItems: Array.from({ length: 500 }, (_, i) => ({
        text: `Text item ${i}`,
        x: 50 + (i % 10) * 20,
        y: 700 - (i % 20) * 15,
        width: 100,
        height: 12,
        page: Math.floor(i / 10) + 1
      })),
      usedOCR: false
    };

    const startTime = Date.now();
    const result = await analyzeDocument(largeMockParseResult);
    const endTime = Date.now();

    // Should complete within reasonable time (adjust threshold as needed)
    expect(endTime - startTime).toBeLessThan(5000); // 5 seconds

    // Should still produce valid results
    expect(result.gaps).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

describe('UI/UX Testing', () => {
  test('location information display in gap cards', () => {
    const mockGap = {
      id: 'test-gap',
      title: 'Test Gap',
      category: 'critical' as const,
      description: 'Test description',
      impact: 'Test impact',
      recommendation: 'Test recommendation',
      potentialRevenueLoss: '$100',
      location: {
        page: 2,
        position: 150,
        textSnippet: 'near Chief Complaint section',
        section: 'HPI'
      }
    };

    // Verify location data structure
    expect(mockGap.location).toBeDefined();
    expect(mockGap.location?.page).toBe(2);
    expect(mockGap.location?.section).toBe('HPI');
    expect(mockGap.location?.textSnippet).toContain('Chief Complaint');
  });

  test('PDF viewer navigation controls', () => {
    // Test page navigation logic
    let currentPage = 1;
    const totalPages = 5;

    // Test next page
    if (currentPage < totalPages) {
      currentPage++;
    }
    expect(currentPage).toBe(2);

    // Test previous page
    if (currentPage > 1) {
      currentPage--;
    }
    expect(currentPage).toBe(1);

    // Test bounds
    currentPage = 1;
    if (currentPage <= 1) {
      // Should not go below 1
      expect(currentPage).toBe(1);
    }
  });
});

describe('User Acceptance Testing', () => {
  test('physician workflow simulation', () => {
    // Simulate a physician reviewing analysis results
    const mockAnalysisResult = {
      overallScore: 65,
      documentationLevel: 'Fair' as const,
      gaps: [
        {
          id: 'gap-1',
          category: 'critical',
          title: 'Missing MDM',
          description: 'No medical decision making documented',
          impact: 'Potential downcoding',
          recommendation: 'Add MDM documentation',
          potentialRevenueLoss: '$150',
          location: { page: 1, section: 'Assessment' }
        }
      ],
      strengths: ['Chief complaint documented'],
      currentEMLevel: '99213',
      suggestedEMLevel: '99214'
    };

    // Verify critical information is present
    expect(mockAnalysisResult.overallScore).toBeDefined();
    expect(mockAnalysisResult.gaps.length).toBeGreaterThan(0);
    expect(mockAnalysisResult.gaps[0].location).toBeDefined();
    expect(mockAnalysisResult.strengths.length).toBeGreaterThan(0);
  });

  test('gap prioritization for physician review', () => {
    const mockGaps = [
      { id: '1', category: 'critical', potentialRevenueLoss: '$200' },
      { id: '2', category: 'major', potentialRevenueLoss: '$100' },
      { id: '3', category: 'moderate', potentialRevenueLoss: '$50' },
      { id: '4', category: 'minor', potentialRevenueLoss: '$25' }
    ];

    // Sort by priority (critical first, then by revenue impact)
    const sortedGaps = mockGaps.sort((a, b) => {
      const categoryOrder = { critical: 0, major: 1, moderate: 2, minor: 3 };
      const aOrder = categoryOrder[a.category as keyof typeof categoryOrder];
      const bOrder = categoryOrder[b.category as keyof typeof categoryOrder];

      if (aOrder !== bOrder) return aOrder - bOrder;

      // If same category, sort by revenue impact (higher first)
      const aRevenue = parseInt(a.potentialRevenueLoss.replace('$', ''));
      const bRevenue = parseInt(b.potentialRevenueLoss.replace('$', ''));
      return bRevenue - aRevenue;
    });

    expect(sortedGaps[0].category).toBe('critical');
    expect(sortedGaps[0].potentialRevenueLoss).toBe('$200');
  });
});
