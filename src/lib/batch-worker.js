// Web Worker for batch document processing
// Runs document analysis in a separate thread for performance

// Import functions will be passed from main thread
let parsePDF, analyzeDocument;

self.onmessage = async (e) => {
  const { type, itemId, file, functions } = e.data;

  // Initialize functions if provided
  if (functions) {
    parsePDF = functions.parsePDF;
    analyzeDocument = functions.analyzeDocument;
  }

  if (type === 'process') {
    try {
      // Send initial progress
      self.postMessage({
        type: 'progress',
        itemId,
        progress: 10,
      });

      // Parse PDF
      console.log(`Worker: Starting PDF parse for ${file.name}`);
      const parseResult = await parsePDF(file);
      console.log(`Worker: PDF parsed successfully: ${parseResult.pageCount} pages`);

      // Send progress update
      self.postMessage({
        type: 'progress',
        itemId,
        progress: 60,
      });

      // Analyze document
      console.log(`Worker: Starting analysis for ${file.name}`);
      const analysisResult = await analyzeDocument(parseResult.text);
      console.log(`Worker: Analysis complete for ${file.name}`);

      // Send final progress
      self.postMessage({
        type: 'progress',
        itemId,
        progress: 100,
      });

      // Send completion message
      self.postMessage({
        type: 'complete',
        itemId,
        result: analysisResult,
      });

    } catch (error) {
      console.error(`Worker: Error processing ${file.name}:`, error);
      self.postMessage({
        type: 'error',
        itemId,
        error: error instanceof Error ? error.message : 'Unknown processing error',
      });
    }
  }
};

// Handle worker errors
self.onerror = (error) => {
  console.error('Worker error:', error);
  // Send error message to main thread
  self.postMessage({
    type: 'error',
    itemId: 'unknown',
    error: 'Worker encountered an error',
  });
};
