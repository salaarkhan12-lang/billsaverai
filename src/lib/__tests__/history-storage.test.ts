import {
  getAnalysisHistory,
  saveToHistory,
  deleteHistoryItem,
  clearHistory,
  getHistoryStats,
  type AnalysisHistoryItem,
} from '../history-storage';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Setup and teardown
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();

  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
});

describe('History Storage', () => {
  const mockAnalysisResult = {
    overallScore: 85,
    documentationLevel: 'Good',
    gaps: [
      {
        id: '1',
        category: 'critical',
        title: 'Missing Chief Complaint',
        description: 'No clear chief complaint documented',
        impact: 'Cannot bill without documented reason for visit',
        potentialRevenueLoss: '$50-150',
        recommendation: 'Add chief complaint section',
      },
    ],
    strengths: ['Good HPI documentation', 'Clear assessment'],
    currentEMLevel: '99213',
    suggestedEMLevel: '99214',
    potentialUpcodeOpportunity: true,
    totalPotentialRevenueLoss: '$75-125',
    mdmComplexity: 'Moderate',
    timeDocumented: true,
    meatCriteriaMet: false,
  };

  describe('saveToHistory', () => {
    it('should save analysis to history', () => {
      localStorageMock.getItem.mockReturnValue('[]');

      saveToHistory('test-file.pdf', mockAnalysisResult);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'billsaver_analysis_history',
        expect.stringContaining('"fileName":"test-file.pdf"')
      );
    });

    it('should deduplicate files with same name', () => {
      const existingHistory: AnalysisHistoryItem[] = [
        {
          id: '1',
          fileName: 'test-file.pdf',
          timestamp: Date.now() - 1000,
          result: { ...mockAnalysisResult, overallScore: 70 },
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingHistory));

      saveToHistory('test-file.pdf', mockAnalysisResult);

      // getAnalysisHistory saves deduplicated data first, then saveToHistory saves the new data
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);

      const finalSavedData = JSON.parse(localStorageMock.setItem.mock.calls[1][1]);
      expect(finalSavedData.length).toBe(1);
      expect(finalSavedData[0].result.overallScore).toBe(85); // Should have new score
    });
  });

  describe('getAnalysisHistory', () => {
    it('should return empty array when no history exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const history = getAnalysisHistory();

      expect(history).toEqual([]);
    });

    it('should return parsed history sorted by timestamp', () => {
      const mockHistory: AnalysisHistoryItem[] = [
        {
          id: '1',
          fileName: 'file1.pdf',
          timestamp: 1000,
          result: mockAnalysisResult,
        },
        {
          id: '2',
          fileName: 'file2.pdf',
          timestamp: 2000,
          result: mockAnalysisResult,
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      const history = getAnalysisHistory();

      expect(history.length).toBe(2);
      expect(history[0].timestamp).toBe(2000); // Most recent first
      expect(history[1].timestamp).toBe(1000);
    });

    it('should deduplicate history on load', () => {
      const duplicateHistory: AnalysisHistoryItem[] = [
        {
          id: '1',
          fileName: 'duplicate.pdf',
          timestamp: 1000,
          result: { ...mockAnalysisResult, overallScore: 70 },
        },
        {
          id: '2',
          fileName: 'duplicate.pdf',
          timestamp: 2000,
          result: { ...mockAnalysisResult, overallScore: 85 },
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(duplicateHistory));

      const history = getAnalysisHistory();

      expect(history.length).toBe(1);
      expect(history[0].result.overallScore).toBe(85); // Should keep most recent
    });
  });

  describe('getHistoryStats', () => {
    it('should calculate correct statistics', () => {
      const mockHistory: AnalysisHistoryItem[] = [
        {
          id: '1',
          fileName: 'file1.pdf',
          timestamp: 1000,
          result: { ...mockAnalysisResult, overallScore: 80 },
        },
        {
          id: '2',
          fileName: 'file2.pdf',
          timestamp: 2000,
          result: { ...mockAnalysisResult, overallScore: 90 },
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      const stats = getHistoryStats();

      expect(stats.totalAnalyses).toBe(2);
      expect(stats.uniqueDocuments).toBe(2);
      expect(stats.averageScore).toBe(85);
    });
  });

  describe('deleteHistoryItem', () => {
    it('should remove specific item from history', () => {
      const mockHistory: AnalysisHistoryItem[] = [
        {
          id: '1',
          fileName: 'file1.pdf',
          timestamp: 1000,
          result: mockAnalysisResult,
        },
        {
          id: '2',
          fileName: 'file2.pdf',
          timestamp: 2000,
          result: mockAnalysisResult,
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      deleteHistoryItem('1');

      // getAnalysisHistory saves first, then deleteHistoryItem saves filtered data
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);

      const finalSavedData = JSON.parse(localStorageMock.setItem.mock.calls[1][1]);
      expect(finalSavedData.length).toBe(1);
      expect(finalSavedData[0].id).toBe('2');
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', () => {
      clearHistory();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('billsaver_analysis_history');
    });
  });
});
