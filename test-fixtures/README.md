# PDFViewer Test Fixtures

This directory contains test PDFs and utilities for testing the PDFViewer component.

## Test PDFs

### `text-based-medical-note.pdf`
- **Type**: Text-based PDF
- **Content**: Simple medical note with basic sections
- **Use Case**: Test normal PDF loading and text extraction
- **Expected Behavior**: Should load quickly, display text clearly, sections should be extracted

### `image-based-medical-note.pdf`
- **Type**: Image-based PDF (simulated)
- **Content**: PDF that appears to contain images/scanned content
- **Use Case**: Test OCR functionality and fallback text extraction
- **Expected Behavior**: May trigger OCR processing, text extraction might be limited

### `comprehensive-medical-note.pdf`
- **Type**: Text-based PDF
- **Content**: Multi-page medical note with standard sections (CC, HPI, PMH, etc.)
- **Use Case**: Test section navigation, multi-page handling, comprehensive text extraction
- **Expected Behavior**: Should show section navigation buttons, handle page switching correctly

## Usage

### Generating Test PDFs

```bash
node test-fixtures/create-test-pdfs.js
```

This will regenerate all test PDFs in the fixtures directory.

### Testing with PDFViewer

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Upload each test PDF and observe:
   - Loading behavior
   - Text extraction (check browser console for logs)
   - Section navigation (if applicable)
   - Highlighting and annotations
   - Zoom and page navigation

### Manual Testing Checklist

For each test PDF, verify:

- [ ] PDF loads without errors
- [ ] Console shows appropriate logging messages
- [ ] Text content is extracted and displayed
- [ ] Section navigation buttons appear (for comprehensive PDF)
- [ ] Clicking section buttons navigates to correct pages
- [ ] Highlighting works for gaps
- [ ] Critical gap annotations appear
- [ ] Zoom controls function properly
- [ ] Page navigation works

## Console Logging

The PDFViewer component now includes comprehensive logging. Watch for these messages:

- `🔄 PDFViewer: Starting PDF load process...` - PDF loading initiated
- `✓ PDFViewer: PDF loaded successfully. Pages: X` - PDF loaded
- `📝 PDFViewer: Extracting text items from all pages...` - Text extraction started
- `📊 PDFViewer: Text extraction complete...` - Text extraction finished
- `🎨 PDFViewer: Rendering page X at scale Y...` - Page rendering
- `🔍 PDFViewer: Finding highlights...` - Highlight calculation
- `🏷️ PDFViewer: Finding critical gap annotations...` - Annotation processing
- `🧭 PDFViewer: Section navigation clicked...` - Section navigation

## Troubleshooting

If tests fail or PDFs don't load:

1. Check browser console for error messages
2. Verify PDF.js worker is loading (`/pdf.worker.min.mjs`)
3. Ensure PDFs are valid (try opening in a PDF viewer)
4. Check network tab for failed resource loads

## Adding New Test PDFs

To add new test PDFs:

1. Create PDF content as a string in `create-test-pdfs.js`
2. Add it to the `createTestPDFs()` function
3. Update this README with the new PDF description
4. Update test cases if needed
