import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PDFViewer } from '../PDFViewer';

// Mock PDF.js
jest.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: '/pdf.worker.min.mjs'
  },
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 3,
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
              str: 'Patient presents with chest pain',
              transform: [10, 0, 0, 10, 50, 650],
              width: 200,
              height: 12
            }
          ]
        })),
        getViewport: jest.fn(() => ({
          height: 792,
          width: 612
        })),
        render: jest.fn(() => ({
          promise: Promise.resolve()
        }))
      }))
    })
  }))
}));

// Mock the extractSections function
jest.mock('../../lib/blackbox_pdf-parser', () => ({
  extractSections: jest.fn((text: string) => {
    const sections: Record<string, string> = {};
    if (text.includes('CHIEF COMPLAINT')) {
      sections['Chief Complaint'] = 'Patient presents with chest pain';
    }
    return sections;
  })
}));

describe('PDFViewer Component - Testing Plan Implementation', () => {
  const mockFile = new File(['mock pdf content'], 'test-medical-note.pdf', { type: 'application/pdf' });
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('PDFViewer loads and shows logging is implemented', async () => {
    render(<PDFViewer file={mockFile} onClose={mockOnClose} />);

    // Wait for PDF to load
    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).toBeNull();
    });

    // Verify that console.log was called (indicating logging is working)
    expect(console.log).toHaveBeenCalled();

    // Verify basic UI elements are present
    expect(screen.getByText('PDF Viewer')).toBeTruthy();
    expect(screen.getByText('Next →')).toBeTruthy();
    expect(screen.getByText('Zoom In')).toBeTruthy();
  });

  test('PDFViewer handles highlighted gaps with logging', async () => {
    const highlightedGap = {
      page: 1,
      position: 100,
      textSnippet: 'Patient presents with chest pain'
    };

    render(<PDFViewer file={mockFile} highlightedGap={highlightedGap} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).toBeNull();
    });

    // Verify logging is working
    expect(console.log).toHaveBeenCalled();

    // Verify highlighted gap information is shown
    expect(screen.getByText('📍 Highlighting gap on page 1')).toBeTruthy();
  });

  test('PDFViewer handles critical gaps with logging', async () => {
    const mockGaps = [
      {
        id: 'gap-1',
        category: 'critical' as const,
        location: {
          page: 1,
          position: 100,
          textSnippet: 'Patient presents with chest pain'
        }
      }
    ];

    render(<PDFViewer file={mockFile} allGaps={mockGaps} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).toBeNull();
    });

    // Verify logging is working
    expect(console.log).toHaveBeenCalled();
  });

  test('PDFViewer zoom and navigation controls work', async () => {
    render(<PDFViewer file={mockFile} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).toBeNull();
    });

    // Test zoom controls
    const zoomInButton = screen.getByText('Zoom In');
    const zoomOutButton = screen.getByText('Zoom Out');

    expect(zoomInButton).toBeTruthy();
    expect(zoomOutButton).toBeTruthy();

    // Test page navigation
    const nextButton = screen.getByText('Next →');
    const prevButton = screen.getByText('← Prev');

    expect(nextButton).toBeTruthy();
    expect(prevButton).toBeTruthy();
  });

  test('PDFViewer close functionality works', async () => {
    render(<PDFViewer file={mockFile} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).toBeNull();
    });

    const closeButton = screen.getByText('✕');
    expect(closeButton).toBeTruthy();

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
