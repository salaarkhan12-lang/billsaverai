"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { extractSections } from '@/lib/blackbox_pdf-parser';
import { cn } from "@/lib/cn";
import { InteractiveAnnotation } from './pdf/InteractiveAnnotation';
import { AnnotationTooltip } from './pdf/AnnotationTooltip';
import { AnnotationDetailsPanel } from './pdf/AnnotationDetailsPanel';

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
    title: string;
    description: string;
    impact: string;
    recommendation: string;
    potentialRevenueLoss: string;
    location?: {
      page: number;
      position: number;
      textSnippet: string;
    };
  }>;
  onClose?: () => void;
  variant?: 'modal' | 'embedded';
  className?: string;
  fixedGapIds?: string[];
  onGapSelect?: (gapId: string) => void;
  onMarkFixed?: (gapId: string) => void;
}

interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export function PDFViewer({
  file,
  highlightedGap,
  allGaps = [],
  onClose,
  variant = 'modal',
  className,
  fixedGapIds = [],
  onGapSelect,
  onMarkFixed
}: PDFViewerProps) {
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

  // Interactive annotation state
  const [hoveredGapId, setHoveredGapId] = useState<string | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number, y: number } | null>(null);

  // Load PDF when file changes
  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {


      setLoading(true);
      try {
        const pdfjsLib = await import('pdfjs-dist');

        // Ensure worker is configured
        if (typeof window !== 'undefined') {
          // Try local worker first, fallback to CDN
          try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

          } catch (error) {
            console.warn('Local worker failed, using CDN');
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

          }
        }


        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;


        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);

        // Extract text items from all pages for highlighting

        const allTextItems: TextItem[] = [];
        let extractedText = '';
        const pageTextsArray: string[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

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

          extractedText += pageText + '\n\n';
          pageTextsArray.push(pageText.trim());
        }


        setTextItems(allTextItems);
        setFullText(extractedText);
        setPageTexts(pageTextsArray);

        // Extract sections for navigation

        const extractedSections = extractSections(extractedText);

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


      // Cancel any previous render task
      if (currentRenderTaskRef.current) {

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


        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        currentRenderTaskRef.current = renderTask;
        await renderTask.promise;
        currentRenderTaskRef.current = null;

      } catch (error: any) {
        if (error?.name !== 'RenderingCancelledException') {
          console.error('❌ PDFViewer: Error rendering page:', error);
        } else {

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
      return [];
    }

    const snippet = highlightedGap.textSnippet.toLowerCase().trim();
    const snippetWords = snippet.split(/\s+/).filter(word => word.length > 0);
    const rects: { x: number; y: number; width: number; height: number }[] = [];

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


    // Fast single-pass matching using substring search - O(n) instead of O(n²)
    let bestMatch: { x: number; y: number; width: number; height: number } | null = null;

    // Try exact substring match first (fastest)
    const pageText = pageTextItems.map(item => item.text).join(' ').toLowerCase();
    const snippetIndex = pageText.indexOf(snippet);

    if (snippetIndex >= 0) {
      // Found exact match - calculate position
      let charCount = 0;
      for (const item of pageTextItems) {
        const itemText = item.text.toLowerCase();
        if (charCount + itemText.length >= snippetIndex) {
          // This item contains the match
          bestMatch = {
            x: item.x * scale,
            y: item.y * scale,
            width: item.width * scale,
            height: item.height * scale,
          };
          break;
        }
        charCount += itemText.length + 1; // +1 for space
      }
    }


    // Fallback: try with first few words if exact match failed
    if (!bestMatch && snippetWords.length > 3) {
      const partialSnippet = snippetWords.slice(0, 3).join(' ');
      const partialIndex = pageText.indexOf(partialSnippet);

      if (partialIndex >= 0) {
        let charCount = 0;
        for (const item of pageTextItems) {
          const itemText = item.text.toLowerCase();
          if (charCount + itemText.length >= partialIndex) {
            bestMatch = {
              x: item.x * scale,
              y: item.y * scale,
              width: item.width * scale * 2, // Wider highlight for partial match
              height: item.height * scale,
            };
            break;
          }
          charCount += itemText.length + 1;
        }
      }
    }

    if (bestMatch) {
      rects.push(bestMatch);
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




    relevantGaps.forEach(gap => {
      if (!gap.location) {

        return;
      }

      const snippet = gap.location.textSnippet.toLowerCase().trim();

      // Find text items that match the snippet - use fast substring search
      const pageTextItems = textItems.filter(item => item.page === currentPage);
      const pageText = pageTextItems.map(item => item.text).join(' ').toLowerCase();
      const snippetIndex = pageText.indexOf(snippet);

      if (snippetIndex >= 0) {
        // Found match - calculate position
        let charCount = 0;
        for (const item of pageTextItems) {
          const itemText = item.text.toLowerCase();
          if (charCount + itemText.length >= snippetIndex) {
            annotations.push({
              x: item.x * scale,
              y: item.y * scale,
              width: item.width * scale,
              height: item.height * scale,
              category: gap.category,
              snippet: gap.location!.textSnippet,
              id: gap.id,
            });
            break;
          }
          charCount += itemText.length + 1;
        }
      } else {

      }
    });


    return annotations;
  };

  // TEMPORARILY DISABLED - Performance optimization (calculations not needed if not rendering)
  // const highlightRects = useMemo(() => getHighlightRects(), [highlightedGap, currentPage, textItems, scale]);
  // const gapAnnotations = useMemo(() => getGapAnnotations(), [allGaps, currentPage, textItems, scale]);

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

                  // Find the page where this section appears by checking pageTexts
                  const targetPage = pageTexts.findIndex(pageText =>
                    pageText.toLowerCase().includes(sectionName.toLowerCase())
                  ) + 1; // +1 because array is 0-indexed

                  if (targetPage > 0) {

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

              {/* TEMPORARILY DISABLED - Performance optimization */}
              {/* Highlight overlay for selected gap */}
              {/* {highlightRects.map((rect, index) => (
                <div
                  key={index}
                  className="absolute bg-yellow-400/30 border-2 border-yellow-400 mix-blend-multiply pointer-events-none z-10"
                  style={{
                    left: rect.x,
                    top: rect.y,
                    width: rect.width,
                    height: rect.height,
                  }}
                />
              ))} */}

              {/* Interactive Gap Annotations */}
              {/* {gapAnnotations.map((annotation) => {
                const gap = allGaps.find(g => g.id === annotation.id);
                if (!gap) return null;

                return (
                  <InteractiveAnnotation
                    key={annotation.id}
                    gap={gap}
                    bounds={{
                      x: annotation.x,
                      y: annotation.y,
                      width: annotation.width,
                      height: annotation.height,
                    }}
                    isHovered={hoveredGapId === gap.id}
                    isSelected={selectedAnnotationId === gap.id}
                    isFixed={fixedGapIds.includes(gap.id)}
                    onHover={(gapId) => {
                      setHoveredGapId(gapId);
                      if (gapId) {
                        // Update tooltip position based on annotation bounds
                        setTooltipPosition({
                          x: annotation.x + annotation.width / 2,
                          y: annotation.y,
                        });
                      } else {
                        setTooltipPosition(null);
                      }
                    }}
                    onClick={(gapId) => {
                      setSelectedAnnotationId(gapId);
                      onGapSelect?.(gapId);
                    }}
                    scale={scale}
                  />
                );
              })} */}
            </div>
          </div>
        )}
      </div>

      {/* TEMPORARILY DISABLED - Performance optimization */}
      {/* Annotation Tooltip */}
      {/* {hoveredGapId && tooltipPosition && (
        <AnnotationTooltip
          gap={allGaps.find(g => g.id === hoveredGapId)!}
          position={tooltipPosition}
          isVisible={true}
          onMarkFixed={() => {
            if (hoveredGapId) {
              onMarkFixed?.(hoveredGapId);
            }
          }}
          onViewDetails={() => {
            setSelectedAnnotationId(hoveredGapId);
            setHoveredGapId(null);
          }}
        />
      )} */}

      {/* TEMPORARILY DISABLED - Performance optimization */}
      {/* Annotation Details Panel */}
      {/* {selectedAnnotationId && (
        <AnnotationDetailsPanel
          gap={allGaps.find(g => g.id === selectedAnnotationId)!}
          isOpen={true}
          onClose={() => setSelectedAnnotationId(null)}
          onMarkFixed={() => {
            if (selectedAnnotationId) {
              onMarkFixed?.(selectedAnnotationId);
              setSelectedAnnotationId(null);
            }
          }}
          relatedGaps={allGaps.filter(
            g => g.id !== selectedAnnotationId &&
              g.location?.page === allGaps.find(a => a.id === selectedAnnotationId)?.location?.page
          )}
        />
      )} */}
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
