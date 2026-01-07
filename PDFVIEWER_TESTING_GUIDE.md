# PDFViewer Testing Guide

This guide provides comprehensive testing procedures for the PDFViewer component, implementing the testing plan for the three main issues.

## Issues Under Test

### Issue 1: PDF does not show until zoom or page switch
**Root Causes:**
- Canvas rendering timing issues
- Initial scale/rendering problems
- PDF loading state not properly handled

### Issue 2: Annotations do not show
**Root Causes:**
- Text extraction fails for image-based PDFs (OCR returns empty textItems)
- Position calculation issues for highlights
- Annotation rendering logic problems

### Issue 3: Section navigation buttons don't work
**Root Causes:**
- Section extraction fails or returns empty sections object
- Page estimation logic incorrect for multi-page documents
- OCR text doesn't match expected section patterns
- Button click handlers not triggering page changes

## Testing Environment Setup

### Prerequisites
- Node.js and npm installed
- Development server running (`npm run dev`)
- Test PDFs generated (`node test-fixtures/create-test-pdfs.js`)

### Test Files
- `test-fixtures/text-based-medical-note.pdf` - Text-based PDF
- `test-fixtures/image-based-medical-note.pdf` - Image-based PDF (simulated)
- `test-fixtures/comprehensive-medical-note.pdf` - Multi-page medical note

## Testing Procedures

### Test Case 1: PDF Loading and Initial Display (Issue 1)

**Objective:** Verify PDF loads and displays correctly on initial load

**Steps:**
1. Open http://localhost:3000
2. Upload `text-based-medical-note.pdf`
3. Observe initial loading:
   - ✅ Loading spinner appears
   - ✅ Console shows: `🔄 PDFViewer: Starting PDF load process...`
   - ✅ Console shows: `✓ PDFViewer: PDF loaded successfully. Pages: 1`
4. Wait for PDF to load completely
5. Verify PDF content is visible immediately (without zoom/page switch)
6. Check console for rendering logs:
   - ✅ `🎨 PDFViewer: Rendering page 1 at scale 1.5...`
   - ✅ `✓ PDFViewer: Page 1 rendered successfully`

**Expected Results:**
- PDF displays immediately after loading
- No need to zoom or switch pages to see content
- Canvas dimensions logged correctly

**Failure Indicators:**
- PDF appears blank initially
- Content only shows after zoom/page navigation
- Console shows rendering errors

### Test Case 2: Text Extraction and Highlighting (Issue 2)

**Objective:** Verify text extraction works and highlights display correctly

**Steps:**
1. Upload `text-based-medical-note.pdf`
2. Wait for loading to complete
3. Check console for text extraction logs:
   - ✅ `📝 PDFViewer: Extracting text items from all pages...`
   - ✅ `📊 PDFViewer: Text extraction complete. Total text items: X, Total characters: Y`
4. Create a mock analysis result with gaps (or use real analysis)
5. Verify gap highlighting:
   - ✅ Console shows: `🔍 PDFViewer: Finding highlights for snippet...`
   - ✅ Yellow highlight rectangles appear on PDF
6. Test with `comprehensive-medical-note.pdf`:
   - ✅ Multi-page text extraction works
   - ✅ Highlights work across pages

**Expected Results:**
- Text extraction completes successfully
- Highlight rectangles appear in correct positions
- Console shows detailed logging of the process

**Failure Indicators:**
- No text items extracted
- Highlights don't appear
- Console shows errors in text extraction

### Test Case 3: Critical Gap Annotations (Issue 2)

**Objective:** Verify critical gap annotations display correctly

**Steps:**
1. Upload `text-based-medical-note.pdf`
2. Create analysis result with critical gaps
3. Wait for PDF to load
4. Check console for annotation logs:
   - ✅ `🏷️ PDFViewer: Finding critical gap annotations on page 1`
   - ✅ `✓ PDFViewer: Created X annotations`
5. Verify visual annotations:
   - ✅ Red "🚨 Critical Gap" markers appear
   - ✅ Underlines appear under annotated text
6. Test annotation positioning by zooming and navigating

**Expected Results:**
- Critical gap annotations appear correctly
- Markers are positioned accurately
- Annotations scale with zoom level

**Failure Indicators:**
- No annotations appear
- Annotations in wrong positions
- Console shows annotation creation errors

### Test Case 4: Section Navigation (Issue 3)

**Objective:** Verify section navigation buttons work correctly

**Steps:**
1. Upload `comprehensive-medical-note.pdf` (multi-page)
2. Wait for loading to complete
3. Check console for section extraction:
   - ✅ `🏷️ PDFViewer: Extracting sections for navigation...`
   - ✅ `✓ PDFViewer: Found X sections: Chief Complaint, History of Present Illness, ...`
4. Verify section navigation UI:
   - ✅ "Navigate:" label appears
   - ✅ Section buttons visible (CC, HPI, PMH, etc.)
5. Test section navigation:
   - Click "Chief Complaint" button
   - ✅ Console shows: `🧭 PDFViewer: Section navigation clicked: Chief Complaint`
   - ✅ PDF navigates to correct page
6. Test all section buttons

**Expected Results:**
- Section buttons appear for multi-page documents
- Clicking buttons navigates to correct pages
- Console shows navigation logging

**Failure Indicators:**
- No section buttons appear
- Clicking buttons doesn't change pages
- Console shows section extraction failures

### Test Case 5: Image-Based PDF Handling (Issues 1 & 2)

**Objective:** Test OCR functionality and fallback behavior

**Steps:**
1. Upload `image-based-medical-note.pdf`
2. Monitor console for OCR processing:
   - May show OCR initialization messages
   - Check for fallback text extraction
3. Verify PDF still loads and displays
4. Test highlighting (may be limited due to OCR)

**Expected Results:**
- PDF loads without crashing
- OCR processing initiates if needed
- Graceful fallback if OCR fails

**Failure Indicators:**
- PDF fails to load
- Application crashes
- No fallback text extraction

### Test Case 6: Zoom and Page Navigation

**Objective:** Verify zoom and navigation controls work properly

**Steps:**
1. Upload any test PDF
2. Test zoom controls:
   - Click "Zoom In" - scale increases
   - Click "Zoom Out" - scale decreases
   - Console shows rendering at new scales
3. Test page navigation:
   - Click "Next →" - advances pages
   - Click "← Prev" - goes back pages
   - Buttons disable appropriately at boundaries

**Expected Results:**
- Zoom changes PDF scale correctly
- Page navigation works smoothly
- UI updates reflect current state

## Automated Testing

### Running Tests
```bash
# Run PDFViewer tests specifically
npm test -- --testPathPatterns=PDFViewer.test.tsx

# Run all tests
npm test
```

### Test Coverage
The automated tests verify:
- ✅ Component renders without crashing
- ✅ PDF loading triggers logging
- ✅ Highlighted gaps display with logging
- ✅ Critical gaps show annotations with logging
- ✅ Zoom and navigation controls work
- ✅ Close functionality works

## Debugging and Troubleshooting

### Common Issues

**PDF Not Loading:**
- Check browser console for PDF.js errors
- Verify `/pdf.worker.min.mjs` loads correctly
- Ensure PDF is valid (try opening in browser)

**No Text Extraction:**
- Check if PDF contains selectable text
- Image-based PDFs may require OCR
- Verify PDF.js text extraction API calls

**Section Navigation Not Working:**
- Check section extraction logs
- Verify PDF has recognizable section headers
- Test with `comprehensive-medical-note.pdf`

**Highlights/Annotations Not Showing:**
- Verify text extraction worked
- Check gap data structure
- Ensure current page matches gap page

### Browser Dev Tools Inspection

1. **Console Tab:** Monitor logging messages
2. **Network Tab:** Check PDF and worker loading
3. **Elements Tab:** Inspect canvas and overlay elements
4. **Application Tab:** Check for memory issues

### Performance Monitoring

- Use browser dev tools performance tab
- Monitor PDF loading times
- Check for memory leaks during PDF operations

## Test Results Summary

After running all tests, document:

- [ ] Issue 1 (PDF display) - PASS/FAIL
- [ ] Issue 2 (Annotations) - PASS/FAIL
- [ ] Issue 3 (Section navigation) - PASS/FAIL
- [ ] Automated tests - PASS/FAIL
- [ ] Performance acceptable - YES/NO
- [ ] Browser compatibility - Issues?

## Future Enhancements

- Add E2E tests with Playwright
- Implement performance benchmarks
- Add accessibility testing
- Create more diverse test PDFs
- Add automated screenshot comparison
