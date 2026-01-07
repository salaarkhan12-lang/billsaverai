"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { extractSections } from '@/lib/blackbox_pdf-parser';
import { cn } from "@/lib/cn";

interface PDFViewerProps {
  file: File | null;
  highlightedGap?: {
    page: number;
    position: number;
    textSnippet: string;
  } | null;
  allGaps?: Array<{
    id: string;
    category: 'critical' | 'major' | 'moderate' | 'minor';
    location?: {
      page: number;
      position: number;
      textSnippet: string;
    };
  }>;
  onClose?: () => void;
  variant?: 'modal' | 'embedded';
  className?: string;
}

interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export function PDFViewer({ file, highlightedGap, allGaps = [], onClose, variant = 'modal', className }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentRenderTaskRef = useRef<any>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(false);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [fullText, setFullText] = useState('');
  const [pageTexts, setPageTexts] = useState<string[]>([]);
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Load PDF when file changes
  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      console.log('🔄 PDFViewer: Starting PDF load process...');
      console.log(`   File: ${file.name}, Size: ${Math.round(file.size / 1024)}KB`);
      setLoading(true);
      try {
        const pdfjsLib = await import('pdfjs-dist');

        // Ensure worker is configured
        if (typeof window !== 'undefined') {
          // Try local worker first, fallback to CDN
          try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
            console.log('✓ PDFViewer: PDF.js worker configured (local)');
          } catch (error) {
            console.warn('Local worker failed, using CDN');
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
            console.log('✓ PDFViewer: PDF.js worker configured (CDN)');
          }
        }

        console.log('📖 PDFViewer: Creating PDF document...');
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        console.log(`✓ PDFViewer: PDF loaded successfully. Pages: ${pdf.numPages}`);

        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);

        // Extract text items from all pages for highlighting
        console.log('📝 PDFViewer: Extracting text items from all pages...');
        const allTextItems: TextItem[] = [];
        let extractedText = '';
        const pageTextsArray: string[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          console.log(`   Processing page ${pageNum}/${pdf.numPages}...`);
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const viewport = page.getViewport({ scale: 1 });

          let pageText = '';
          let textItemCount = 0;
          textContent.items.forEach((item: any) => {
            if (item.str && item.transform) {
              const [scaleX, skewX, skewY, scaleY, x, y] = item.transform;
              allTextItems.push({
                text: item.str,
                x: x,
                y: viewport.height - y, // Flip Y coordinate
                width: item.width || (item.str.length * 12), // Estimate width
                height: item.height || 14, // Estimate height
                page: pageNum,
              });
              pageText += item.str + ' ';
              textItemCount++;
            }
          });
          console.log(`   ✓ Page ${pageNum}: ${textItemCount} text items, ${pageText.trim().length} characters`);
          extractedText += pageText + '\n\n';
          pageTextsArray.push(pageText.trim());
        }

        console.log(`📊 PDFViewer: Text extraction complete. Total text items: ${allTextItems.length}, Total characters: ${extractedText.trim().length}`);
        setTextItems(allTextItems);
        setFullText(extractedText);
        setPageTexts(pageTextsArray);

        // Extract sections for navigation
        console.log('🏷️ PDFViewer: Extracting sections for navigation...');
        const extractedSections = extractSections(extractedText);
        console.log(`✓ PDFViewer: Found ${Object.keys(extractedSections).length} sections: ${Object.keys(extractedSections).join(', ')}`);
        setSections(extractedSections);
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        setLoading(false);
        // Force re-render to ensure PDF displays
        setRenderTrigger(prev => prev + 1);
      }
    };

    loadPDF();
  }, [file]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      console.log(`🎨 PDFViewer: Rendering page ${currentPage} at scale ${scale}...`);

      // Cancel any previous render task
      if (currentRenderTaskRef.current) {
        console.log('   Cancelling previous render task...');
        currentRenderTaskRef.current.cancel();
        currentRenderTaskRef.current = null;
      }

      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        console.log(`   Canvas dimensions: ${canvas.width}x${canvas.height}px`);
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        currentRenderTaskRef.current = renderTask;
        await renderTask.promise;
        currentRenderTaskRef.current = null;
        console.log(`✓ PDFViewer: Page ${currentPage} rendered successfully`);
      } catch (error: any) {
        if (error?.name !== 'RenderingCancelledException') {
          console.error('❌ PDFViewer: Error rendering page:', error);
        } else {
          console.log('   Render was cancelled (expected)');
        }
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale, renderTrigger]);

  // Navigate to highlighted gap
  useEffect(() => {
    if (highlightedGap && pdfDoc) {
      setCurrentPage(highlightedGap.page);
    }
  }, [highlightedGap, pdfDoc]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.25));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25));
  };

  // Find text to highlight with improved word-based matching
  const getHighlightRects = () => {
    if (!highlightedGap || currentPage !== highlightedGap.page) {
      console.log('🔍 PDFViewer: No highlight needed - no gap or wrong page');
      return [];
    }

    const snippet = highlightedGap.textSnippet.toLowerCase().trim();
    const snippetWords = snippet.split(/\s+/).filter(word => word.length > 0);
    const rects: { x: number; y: number; width: number; height: number }[] = [];

    console.log(`🔍 PDFViewer: Finding highlights for snippet: "${snippet.slice(0, 50)}..." (${snippetWords.length} words) on page ${currentPage}`);

    // Find text items that match the snippet
    const pageTextItems = textItems.filter(item => item.page === currentPage);
    console.log(`   Found ${pageTextItems.length} text items on page ${currentPage}`);

    // Build page text as array of words with positions
    const pageWords: Array<{ word: string, item: TextItem, index: number }> = [];
    pageTextItems.forEach((item, itemIndex) => {
      const words = item.text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      words.forEach(word => {
        pageWords.push({ word, item, index: itemIndex });
      });
    });

    console.log(`   Page has ${pageWords.length} words total`);

    // Find best sequence match
    let bestMatch: { x: number; y: number; width: number; height: number } | null = null;
    let bestScore = 0;

    // Try to find consecutive word sequences that match
    for (let startIdx = 0; startIdx < pageWords.length; startIdx++) {
      for (let snippetStart = 0; snippetStart < snippetWords.length; snippetStart++) {
        let matchLength = 0;
        let currentPageIdx = startIdx;

        // Try to match as many consecutive words as possible
        while (
          matchLength < snippetWords.length - snippetStart &&
          currentPageIdx < pageWords.length &&
          pageWords[currentPageIdx].word === snippetWords[snippetStart + matchLength]
        ) {
          matchLength++;
          currentPageIdx++;
        }

        if (matchLength > 0) {
          // Calculate score based on matched words
          const matchedWords = matchLength;
          const totalSnippetWords = snippetWords.length;
          const score = matchedWords / totalSnippetWords;

          // Only consider if we match at least 50% of the snippet words
          if (score >= 0.5 && score > bestScore) {
            // Get bounding box for matched sequence
            const matchedItems = pageWords.slice(startIdx, startIdx + matchLength);
            const minX = Math.min(...matchedItems.map(m => m.item.x));
            const maxX = Math.max(...matchedItems.map(m => m.item.x + m.item.width));
            const y = matchedItems[0].item.y; // Use first item's Y
            const height = matchedItems[0].item.height;

            bestScore = score;
            bestMatch = {
              x: minX * scale,
              y: y * scale,
              width: (maxX - minX) * scale,
              height: height * scale,
            };

            console.log(`   Found match: ${matchedWords}/${totalSnippetWords} words, score: ${score.toFixed(2)}`);
          }
        }
      }
    }

    // Fallback: try substring matching if word matching failed
    if (!bestMatch || bestScore < 0.7) {
      console.log('   Word matching insufficient, trying substring fallback...');

      for (let i = 0; i < pageTextItems.length; i++) {
        const item = pageTextItems[i];
        const itemText = item.text.toLowerCase();

        // Look for exact substring matches
        const snippetIndex = itemText.indexOf(snippet);
        if (snippetIndex >= 0) {
          // Found exact match
          const charWidth = item.width / itemText.length;
          const startX = item.x + (snippetIndex * charWidth);
          const matchWidth = snippet.length * charWidth;

          bestScore = 1.0; // Exact match
          bestMatch = {
            x: startX * scale,
            y: item.y * scale,
            width: matchWidth * scale,
            height: item.height * scale,
          };
          console.log('   Found exact substring match');
          break;
        }

        // Check combined text from consecutive items
        let combinedText = itemText;
        let totalWidth = item.width;
        let minX = item.x;
        let maxX = item.x + item.width;
        let y = item.y;

        for (let j = 1; j <= 3 && i + j < pageTextItems.length; j++) {
          const nextItem = pageTextItems[i + j];
          combinedText += ' ' + nextItem.text.toLowerCase();
          totalWidth += nextItem.width + 10;
          minX = Math.min(minX, nextItem.x);
          maxX = Math.max(maxX, nextItem.x + nextItem.width);
        }

        const combinedIndex = combinedText.indexOf(snippet);
        if (combinedIndex >= 0) {
          bestScore = 0.8; // Good substring match
          bestMatch = {
            x: minX * scale,
            y: y * scale,
            width: (maxX - minX) * scale,
            height: item.height * scale,
          };
          console.log('   Found combined substring match');
          break;
        }
      }
    }

    if (bestMatch && bestScore > 0.3) {
      rects.push(bestMatch);
      console.log(`✓ PDFViewer: Found highlight with score ${bestScore.toFixed(2)}`);
    } else {
      console.log(`⚠️ PDFViewer: No good highlight found (best score: ${bestScore.toFixed(2)})`);
    }

    return rects;
  };

  // Get ALL gap annotations (not just critical) with improved word-based matching
  const getGapAnnotations = () => {
    // Show ALL gaps on the current page, not just critical ones
    const relevantGaps = allGaps.filter(gap => gap.location?.page === currentPage);
    const annotations: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      category: string;
      snippet: string;
      id: string; // Add ID for key
    }> = [];

    console.log(`🏷️ PDFViewer: Finding gap annotations on page ${currentPage}`);
    console.log(`   Found ${relevantGaps.length} gaps on this page`);

    relevantGaps.forEach(gap => {
      if (!gap.location) {
        console.log('   Skipping gap without location data');
        return;
      }

      const snippet = gap.location.textSnippet.toLowerCase().trim();
      const snippetWords = snippet.split(/\s+/).filter(word => word.length > 0);
      console.log(`   Processing gap "${gap.id}" with snippet: "${snippet.slice(0, 50)}..." (${snippetWords.length} words)`);

      // Find text items that match the snippet
      const pageTextItems = textItems.filter(item => item.page === currentPage);

      // Build page text as array of words with positions
      const pageWords: Array<{ word: string, item: TextItem, index: number }> = [];
      pageTextItems.forEach((item, itemIndex) => {
        const words = item.text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
        words.forEach(word => {
          pageWords.push({ word, item, index: itemIndex });
        });
      });

      // Find best sequence match
      let bestMatch: { x: number; y: number; width: number; height: number } | null = null;
      let bestScore = 0;

      // Try to find consecutive word sequences that match
      for (let startIdx = 0; startIdx < pageWords.length; startIdx++) {
        for (let snippetStart = 0; snippetStart < snippetWords.length; snippetStart++) {
          let matchLength = 0;
          let currentPageIdx = startIdx;

          // Try to match as many consecutive words as possible
          while (
            matchLength < snippetWords.length - snippetStart &&
            currentPageIdx < pageWords.length &&
            pageWords[currentPageIdx].word === snippetWords[snippetStart + matchLength]
          ) {
            matchLength++;
            currentPageIdx++;
          }

          if (matchLength > 0) {
            // Calculate score based on matched words
            const matchedWords = matchLength;
            const totalSnippetWords = snippetWords.length;
            const score = matchedWords / totalSnippetWords;

            // Only consider if we match at least 50% of the snippet words
            if (score >= 0.5 && score > bestScore) {
              // Get bounding box for matched sequence
              const matchedItems = pageWords.slice(startIdx, startIdx + matchLength);
              const minX = Math.min(...matchedItems.map(m => m.item.x));
              const maxX = Math.max(...matchedItems.map(m => m.item.x + m.item.width));
              const y = matchedItems[0].item.y; // Use first item's Y
              const height = matchedItems[0].item.height;

              bestScore = score;
              bestMatch = {
                x: minX * scale,
                y: y * scale,
                width: (maxX - minX) * scale,
                height: height * scale,
              };

              console.log(`   Found annotation match: ${matchedWords}/${totalSnippetWords} words, score: ${score.toFixed(2)}`);
            }
          }
        }
      }

      // Fallback: try substring matching if word matching failed
      if (!bestMatch || bestScore < 0.7) {
        console.log('   Word matching insufficient for annotation, trying substring fallback...');

        for (let i = 0; i < pageTextItems.length; i++) {
          const item = pageTextItems[i];
          const itemText = item.text.toLowerCase();

          // Look for exact substring matches
          const snippetIndex = itemText.indexOf(snippet);
          if (snippetIndex >= 0) {
            // Found exact match
            const charWidth = item.width / itemText.length;
            const startX = item.x + (snippetIndex * charWidth);
            const matchWidth = snippet.length * charWidth;

            bestScore = 1.0; // Exact match
            bestMatch = {
              x: startX * scale,
              y: item.y * scale,
              width: matchWidth * scale,
              height: item.height * scale,
            };
            console.log('   Found exact substring match for annotation');
            break;
          }

          // Check combined text from consecutive items
          let combinedText = itemText;
          let totalWidth = item.width;
          let minX = item.x;
          let maxX = item.x + item.width;
          let y = item.y;

          for (let j = 1; j <= 3 && i + j < pageTextItems.length; j++) {
            const nextItem = pageTextItems[i + j];
            combinedText += ' ' + nextItem.text.toLowerCase();
            totalWidth += nextItem.width + 10;
            minX = Math.min(minX, nextItem.x);
            maxX = Math.max(maxX, nextItem.x + nextItem.width);
          }

          const combinedIndex = combinedText.indexOf(snippet);
          if (combinedIndex >= 0) {
            bestScore = 0.8; // Good substring match
            bestMatch = {
              x: minX * scale,
              y: y * scale,
              width: (maxX - minX) * scale,
              height: item.height * scale,
            };
            console.log('   Found combined substring match for annotation');
            break;
          }
        }
      }

      if (bestMatch && bestScore > 0.3) { // Threshold for acceptable match
        annotations.push({
          ...bestMatch,
          category: gap.category,
          snippet: gap.location!.textSnippet,
          id: gap.id,
        });
        console.log(`✓ PDFViewer: Created annotation with score ${bestScore.toFixed(2)}`);
      } else {
        console.log(`⚠️ PDFViewer: No good annotation found for gap (best score: ${bestScore.toFixed(2)})`);
      }
    });

    console.log(`✓ PDFViewer: Created ${annotations.length} annotations`);
    return annotations;
  };

  if (!file) return null;

  const content = (
    <div className={cn("flex flex-col h-full bg-gray-900 overflow-hidden", variant === 'modal' ? "rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh]" : "w-full h-full", className)} onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <span className="text-red-400">📄</span>
            PDF Viewer
          </h3>
          {highlightedGap && (
            <div className="flex items-center gap-2 text-blue-400 text-xs bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
              <span className="animate-pulse">●</span>
              Highlighting on page {highlightedGap.page}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Section Navigation */}
      {Object.keys(sections).length > 0 && (
        <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-white/60 text-xs font-medium whitespace-nowrap">Navigate:</span>
            {Object.keys(sections).map((sectionName) => (
              <button
                key={sectionName}
                onClick={() => {
                  console.log(`🧭 PDFViewer: Section navigation clicked: ${sectionName}`);
                  // Find the page where this section appears by checking pageTexts
                  const targetPage = pageTexts.findIndex(pageText =>
                    pageText.toLowerCase().includes(sectionName.toLowerCase())
                  ) + 1; // +1 because array is 0-indexed

                  if (targetPage > 0) {
                    console.log(`   Found section "${sectionName}" on page ${targetPage} (current: ${currentPage})`);
                    setCurrentPage(targetPage);
                  } else {
                    console.warn(`❌ PDFViewer: Could not find section "${sectionName}" in any page`);
                  }
                }}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded whitespace-nowrap transition-colors"
              >
                {sectionName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm"
          >
            ← Prev
          </button>
          <span className="text-white text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm"
          >
            Next →
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            Zoom Out
          </button>
          <span className="text-white text-sm">{Math.round(scale * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            Zoom In
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-auto bg-gray-900/50"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-white/50 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-sm font-medium">Rendering Document...</span>
          </div>
        ) : (
          <div className="relative min-h-full flex justify-center p-8">
            <div className="relative shadow-2xl shadow-black/50">
              <canvas ref={canvasRef} className="block bg-white" />

              {/* Highlight overlay */}
              {getHighlightRects().map((rect, index) => (
                <div
                  key={index}
                  className="absolute bg-yellow-400/30 border-2 border-yellow-400 mix-blend-multiply pointer-events-none z-10"
                  style={{
                    left: rect.x,
                    top: rect.y, // Exact highlighting
                    width: rect.width,
                    height: rect.height,
                  }}
                />
              ))}

              {/* Gap annotations - RENAMED from critical */}
              {getGapAnnotations().map((annotation, index) => {
                const colorMap: Record<string, string> = {
                  critical: "bg-red-500 border-red-500",
                  major: "bg-orange-500 border-orange-500",
                  moderate: "bg-yellow-500 border-yellow-500",
                  minor: "bg-blue-500 border-blue-500",
                };
                const bgColors: Record<string, string> = {
                  critical: "bg-red-500",
                  major: "bg-orange-500",
                  moderate: "bg-yellow-500",
                  minor: "bg-blue-500",
                };
                const styles = colorMap[annotation.category] || "bg-gray-500 border-gray-500";
                const bgStyle = bgColors[annotation.category] || "bg-gray-500";

                return (
                  <div
                    key={`gap-${index}`}
                    className="absolute pointer-events-none z-20"
                    style={{
                      left: annotation.x,
                      top: annotation.y - 30, // Position above the text
                      width: Math.max(annotation.width, 140),
                      height: 30,
                    }}
                  >
                    {/* Annotation marker */}
                    <div className="absolute top-0 left-0 -translate-y-1">
                      <div className={cn("text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap flex items-center gap-1", bgStyle)}>
                        <span>{annotation.category === 'critical' || annotation.category === 'major' ? '🚨' : '⚠️'}</span>
                        {annotation.category.toUpperCase()}
                      </div>
                    </div>

                    {/* Underline for the text */}
                    <div
                      className={cn("absolute bottom-0 opacity-50", bgStyle)}
                      style={{
                        height: '4px',
                        width: annotation.width,
                        left: 0,
                        top: 30 + annotation.height
                      }}
                    />
                    {/* Border Box */}
                    <div
                      className={cn("absolute border-2 rounded-sm opacity-50", styles.split(' ')[1])} // Use border color
                      style={{
                        top: 30,
                        left: 0,
                        width: annotation.width,
                        height: annotation.height
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (variant === 'modal') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return content;
}
