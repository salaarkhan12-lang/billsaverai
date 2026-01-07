"use client";

export interface TextItem {
  text: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
}

export interface PDFParseResult {
  text: string;
  pageCount: number;
  textItems: TextItem[];
  pageTexts: string[]; // Array of text per page
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
  usedOCR?: boolean;
}

async function extractTextWithOCR(file: File, pageCount: number, onProgress?: (progress: number) => void): Promise<string> {
  let worker = null;

  try {
    console.log("🔍 Starting OCR extraction for image-based PDF...");
    console.log(`   File: ${file.name}, Pages: ${pageCount}`);

    // Dynamically import Tesseract.js
    const { createWorker } = await import("tesseract.js");

    // Convert PDF pages to images and run OCR
    const pdfjsLib = await import("pdfjs-dist");

    // Ensure worker is configured - use public path directly
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
    }).promise;

    // Create Tesseract worker with detailed logging
    console.log("📝 Initializing Tesseract OCR worker...");
    worker = await createWorker('eng', 1, {
      logger: (m) => {
        const progress = m.progress ? Math.round(m.progress * 100) : 0;
        console.log(`   OCR Worker: ${m.status} ${m.progress ? `(${progress}%)` : ''}`);
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(progress);
        }
      },
      errorHandler: (err) => {
        console.error("   OCR Worker Error:", err);
      }
    });

    console.log("✓ OCR worker initialized successfully");

    let fullText = "";
    let totalCharsExtracted = 0;

    for (let i = 1; i <= pageCount; i++) {
      try {
        console.log(`\n📄 Processing page ${i}/${pageCount}...`);

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 3.0 });

        // Create canvas to render PDF page
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", {
          willReadFrequently: true
        });

        if (!context) {
          throw new Error("Failed to get canvas context");
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        console.log(`   Canvas size: ${canvas.width}x${canvas.height}px`);

        // Render PDF page to canvas
        console.log(`   Rendering PDF page to canvas...`);
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        console.log(`   ✓ Page rendered successfully`);

        // Convert canvas to data URL
        console.log(`   Converting to image...`);
        const imageDataUrl = canvas.toDataURL('image/png', 1.0);
        console.log(`   ✓ Image created (${Math.round(imageDataUrl.length / 1024)}KB)`);

        // Run OCR on the image
        console.log(`   🔍 Running OCR (this may take 10-30 seconds)...`);
        const startTime = Date.now();

        const { data } = await worker.recognize(imageDataUrl, {
          rotateAuto: true,
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const charsExtracted = data.text.length;
        totalCharsExtracted += charsExtracted;

        console.log(`   ✓ OCR complete in ${elapsed}s: ${charsExtracted} characters`);

        if (charsExtracted === 0) {
          console.warn(`   ⚠️ Warning: No text extracted from page ${i}`);
        }

        fullText += data.text + "\n\n";

      } catch (pageError) {
        console.error(`   ❌ Error processing page ${i}:`, pageError);
        throw pageError;
      }
    }

    // Terminate worker
    if (worker) {
      await worker.terminate();
      console.log("\n✓ OCR worker terminated");
    }

    const trimmedText = fullText.trim();
    console.log(`\n✅ OCR COMPLETE: ${totalCharsExtracted} total characters extracted`);

    if (trimmedText.length === 0) {
      throw new Error("OCR completed but extracted 0 characters. The PDF may be blank or the image quality may be too poor.");
    }

    return trimmedText;

  } catch (error) {
    console.error("\n❌ OCR EXTRACTION FAILED:", error);

    // Clean up worker if it exists
    if (worker) {
      try {
        await worker.terminate();
        console.log("✓ OCR worker terminated after error");
      } catch (terminateError) {
        console.error("Failed to terminate worker:", terminateError);
      }
    }

    throw new Error(`Failed to extract text using OCR: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function parsePDF(file: File, onProgress?: (progress: number) => void): Promise<PDFParseResult> {
  console.log("🔧 PDF Parser Version: Blackbox Enhanced v2.0 - FRESH RESTART");
  console.log("📁 Processing file:", file.name, `(${Math.round(file.size / 1024)}KB)`);

  try {
    // Dynamically import pdfjs-dist only on client side
    const pdfjsLib = await import("pdfjs-dist");

    // Configure PDF.js worker - use public path directly
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      console.log("✓ PDF.js worker configured to use /pdf.worker.min.mjs");
    }

    const arrayBuffer = await file.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("File is empty or could not be read");
    }

    // Load the PDF document with enhanced configuration
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;

    let fullText = "";
    const pageCount = pdf.numPages;
    let hasText = false;

    // First, try to extract embedded text
    console.log(`📖 Attempting to extract embedded text from ${pageCount} pages...`);
    let totalTextItems = 0;
    const allTextItems: TextItem[] = [];
    const pageTexts: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Add null/undefined checks for textContent.items
      if (!textContent || !textContent.items || !Array.isArray(textContent.items)) {
        console.warn(`Page ${i}: textContent.items is undefined or not an array`);
        pageTexts.push("");
        continue;
      }

      const itemCount = textContent.items.length;
      totalTextItems += itemCount;

      if (itemCount > 0) {
        hasText = true;
        console.log(`   Page ${i}: ${itemCount} text items found`);
      } else {
        console.log(`   Page ${i}: 0 text items (image-based)`);
      }

      let pageText = "";
      textContent.items.forEach((item: any) => {
        try {
          if (item && typeof item === 'object' && item !== null) {
            const str = item.str;
            if (typeof str === 'string' && str.trim()) {
              // Extract position information from transform matrix
              // transform: [scaleX, skewX, skewY, scaleY, translateX, translateY]
              const transform = item.transform || [1, 0, 0, 1, 0, 0];
              const x = transform[4] || 0;
              const y = transform[5] || 0;
              const width = item.width || 0;
              const height = item.height || 0;

              allTextItems.push({
                text: str,
                page: i,
                x,
                y,
                width,
                height,
                fontSize: item.fontSize,
              });

              pageText += str + " ";
            }
          }
        } catch (e) {
          // Silently skip items that cause errors
        }
      });

      pageTexts.push(pageText.trim());
      fullText += pageText + "\n\n";
    }

    // Get metadata
    const metadata = await pdf.getMetadata().catch(() => null);

    console.log(`\n📊 Text extraction summary:`);
    console.log(`   Total text items: ${totalTextItems}`);
    console.log(`   Total characters: ${fullText.trim().length}`);
    console.log(`   Has embedded text: ${hasText}`);

    // If no text was found, this is likely an image-based PDF - use OCR
    if (!hasText || fullText.trim().length === 0) {
      console.log("\n⚠️ No embedded text found - this is an image-based PDF");
      console.log("🔄 Switching to OCR extraction...\n");
      fullText = await extractTextWithOCR(file, pageCount, onProgress);

      // For OCR, we don't have position information, so return empty arrays
      return {
        text: fullText,
        pageCount,
        textItems: [],
        pageTexts: [],
        usedOCR: true,
        metadata: metadata?.info
          ? {
            title: (metadata.info as Record<string, unknown>).Title as string | undefined,
            author: (metadata.info as Record<string, unknown>).Author as string | undefined,
            creationDate: (metadata.info as Record<string, unknown>).CreationDate as string | undefined,
          }
          : undefined,
      };
    }

    return {
      text: fullText.trim(),
      pageCount,
      textItems: allTextItems,
      pageTexts,
      usedOCR: false,
      metadata: metadata?.info
        ? {
          title: (metadata.info as Record<string, unknown>).Title as string | undefined,
          author: (metadata.info as Record<string, unknown>).Author as string | undefined,
          creationDate: (metadata.info as Record<string, unknown>).CreationDate as string | undefined,
        }
        : undefined,
    };
  } catch (error) {
    console.error("❌ Error in parsePDF:", error);

    if (error instanceof Error) {
      // Provide more specific error messages
      if (error.message.includes("Invalid PDF")) {
        throw new Error("Failed to parse PDF: The file appears to be corrupted or is not a valid PDF");
      } else if (error.message.includes("password")) {
        throw new Error("Failed to parse PDF: The file is password protected");
      } else if (error.message.includes("worker")) {
        throw new Error("Failed to load PDF worker. Please refresh the page and try again.");
      } else {
        throw new Error(`Failed to parse PDF: ${error.message}`);
      }
    }

    throw new Error("Failed to parse PDF: An unknown error occurred");
  }
}

export function extractSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};

  // Common section headers in medical notes
  const sectionPatterns = [
    { name: "Chief Complaint", patterns: [/chief complaint[:\s]*/i, /cc[:\s]*/i, /reason for visit[:\s]*/i] },
    { name: "History of Present Illness", patterns: [/history of present illness[:\s]*/i, /hpi[:\s]*/i] },
    { name: "Past Medical History", patterns: [/past medical history[:\s]*/i, /pmh[:\s]*/i, /medical history[:\s]*/i] },
    { name: "Medications", patterns: [/medications?[:\s]*/i, /current medications?[:\s]*/i, /meds[:\s]*/i] },
    { name: "Allergies", patterns: [/allergies[:\s]*/i, /drug allergies[:\s]*/i, /nkda/i] },
    { name: "Social History", patterns: [/social history[:\s]*/i, /sh[:\s]*/i] },
    { name: "Family History", patterns: [/family history[:\s]*/i, /fh[:\s]*/i] },
    { name: "Review of Systems", patterns: [/review of systems[:\s]*/i, /ros[:\s]*/i] },
    { name: "Physical Exam", patterns: [/physical exam[:\s]*/i, /pe[:\s]*/i, /examination[:\s]*/i, /objective[:\s]*/i] },
    { name: "Vital Signs", patterns: [/vital signs?[:\s]*/i, /vitals[:\s]*/i] },
    { name: "Assessment", patterns: [/assessment[:\s]*/i, /diagnosis[:\s]*/i, /diagnoses[:\s]*/i, /impression[:\s]*/i] },
    { name: "Plan", patterns: [/plan[:\s]*/i, /treatment plan[:\s]*/i, /management[:\s]*/i, /recommendations?[:\s]*/i] },
    { name: "Labs", patterns: [/lab(s|oratory)?[:\s]*/i, /laboratory results?[:\s]*/i, /test results?[:\s]*/i] },
  ];

  // Find all section positions
  const sectionPositions: { name: string; start: number }[] = [];

  for (const section of sectionPatterns) {
    for (const pattern of section.patterns) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        sectionPositions.push({
          name: section.name,
          start: match.index,
        });
        break;
      }
    }
  }

  // Sort by position
  sectionPositions.sort((a, b) => a.start - b.start);

  // Extract content between sections
  for (let i = 0; i < sectionPositions.length; i++) {
    const current = sectionPositions[i];
    const next = sectionPositions[i + 1];
    const endPos = next ? next.start : text.length;

    const content = text.slice(current.start, endPos).trim();
    // Remove the section header from the content
    const headerMatch = content.match(/^[^:]+[:\s]*/);
    if (headerMatch) {
      sections[current.name] = content.slice(headerMatch[0].length).trim();
    } else {
      sections[current.name] = content;
    }
  }

  return sections;
}
