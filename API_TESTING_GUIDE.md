# API Testing Interface - Developer Guide

## Overview

The BillSaver API Testing Interface provides a programmatic way to upload files and retrieve analysis results for automated testing. This solves the limitation where browser automation tools couldn't easily upload files or extract analysis results from the UI.

## Quick Start

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Get your API key** from `.env.local`:
   ```
   TEST_API_KEY=billsaver_test_dae35bcbbcd915ab5d06d6708c133c8c73c9087402fc14aac2a05316bf0da58d
   ```

3. **Navigate to the testing interface**: [http://localhost:3000/test](http://localhost:3000/test)

---

## Authentication

All test API endpoints (except `/health`) require authentication via the `X-Test-API-Key` header.

**API Key Location**: `.env.local` (excluded from git)

**Example Header**:
```
X-Test-API-Key: billsaver_test_dae35bcbbcd915ab5d06d6708c133c8c73c9087402fc14aac2a05316bf0da58d
```

---

## API Endpoints

### POST `/api/test/upload`

Upload and analyze a medical note PDF file.

**Request**:
```bash
curl -X POST http://localhost:3000/api/test/upload \
  -H "Content-Type: application/json" \
  -H "X-Test-API-Key: YOUR_API_KEY" \
  -d '{
    "filePath": "c:\\path\\to\\medical-note.pdf",
    "payerId": "bcbs-national"
  }'
```

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `filePath` | string | Yes | Absolute path to PDF file |
| `payerId` | string | No | Payer ID for revenue calculations (default: `bcbs-national`) |

**Response**:
```json
{
  "success": true,
  "testId": "test_87a415ffaa0d5bd704260758301ef7af",
  "result": {
    "overallScore": 87.5,
    "documentationLevel": "Good",
    "suggestedEMLevel": "99215",
    "currentEMLevel": "99214",
    "gaps": [...],
    "strengths": [...],
    "dataSecurity": {...}
  },
  "metadata": {
    "fileName": "note_WITH_PHI.pdf",
    "pageCount": 2,
    "usedOCR": false,
    "textLength": 3456
  }
}
```

---

### GET `/api/test/results`

Retrieve stored analysis results.

**Request**:
```bash
# Get latest result
curl http://localhost:3000/api/test/results \
  -H "X-Test-API-Key: YOUR_API_KEY"

# Get specific result by ID
curl "http://localhost:3000/api/test/results?testId=test_xxx" \
  -H "X-Test-API-Key: YOUR_API_KEY"
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `testId` | string | No | Specific test ID to retrieve |

**Response**:
```json
{
  "success": true,
  "testId": "test_87a415ffaa0d5bd704260758301ef7af",
  "result": {...},
  "fileName": "note_WITH_PHI.pdf",
  "timestamp": "2026-01-08T22:47:32.123Z"
}
```

---

### GET `/api/test/health`

Health check endpoint (no authentication required).

**Request**:
```bash
curl http://localhost:3000/api/test/health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-08T22:47:32.123Z",
  "message": "BillSaver Testing API is operational"
}
```

---

## Testing UI

Visit [http://localhost:3000/test](http://localhost:3000/test) for a web-based interface with:

- **API Key Input**: Automatically persists to localStorage
- **File Path Input**: Enter absolute path to PDF file
- **Payer Selector**: Choose from 6 major payers
- **JSON Result Viewer**: Displays full analysis with syntax highlighting
- **Copy to Clipboard**: One-click JSON export
- **cURL Examples**: Auto-generated API commands

---

## Browser Automation Example

```javascript
// Playwright/Puppeteer example
await page.goto('http://localhost:3000/test');

// Fill in credentials
await page.fill('input[type="password"]', process.env.TEST_API_KEY);
await page.fill('input[type="text"]', 'c:\\path\\to\\test-file.pdf');

// Start analysis
await page.click('button:has-text("Upload & Analyze")');

// Wait for completion
await page.waitForSelector('.bg-green-500\\/10', { timeout: 30000 });

// Extract result
const jsonText = await page.textContent('pre');
const result = JSON.parse(jsonText);

// Assertions
expect(result.overallScore).toBeGreaterThan(0);
expect(result.documentationLevel).toBeTruthy();
console.log(`Test ID: ${result.testId}`);
```

---

## Architecture

### Two-Step Processing Flow

The system uses a hybrid client/server approach to respect Next.js's module boundaries:

1. **Server (API Route)**: Reads file from disk, returns as base64
2. **Client (Browser)**: Decodes file, parses PDF, runs analysis
3. **Server (API Route)**: Stores result in memory, returns test ID

This avoids the `"use client"` directive conflict with server-side API routes.

### File Structure

```
src/
├── app/
│   ├── api/test/
│   │   ├── upload/route.ts      # File upload endpoint
│   │   ├── results/route.ts     # Result retrieval endpoint
│   │   └── health/route.ts      # Health check endpoint
│   └── test/page.tsx            # Testing UI
├── lib/
│   └── test/
│       ├── auth-middleware.ts   # API key validation
│       └── test-storage.ts      # In-memory result storage
└── .env.local                   # API key (gitignored)
```

---

## Storage

Results are stored **in-memory** with the following characteristics:

- **Capacity**: 10 most recent results (LRU eviction)
- **Lifetime**: Until server restart
- **Test IDs**: Generated via `crypto.randomBytes(16)`
- **Thread-safe**: Singleton pattern

---

## Supported Payers

| Payer ID | Name |
|----------|------|
| `bcbs-national` | BCBS National |
| `bcbs-local` | BCBS Local |
| `uhc` | UnitedHealthcare |
| `aetna` | Aetna |
| `cigna` | Cigna |
| `medicare` | Traditional Medicare |

---

## Security Considerations

- ✅ API key required for all test endpoints
- ✅ API key excluded from version control (`.env*` in `.gitignore`)
- ✅ PHI detection and redaction (Data Moat) active on all uploads
- ✅ Client-side processing ensures no PHI sent to external servers
- ⚠️ Test API intended for **local development only**
- ⚠️ Do not expose to public networks without additional authentication

---

## Troubleshooting

### Error: "Missing X-Test-API-Key header"
**Solution**: Include the API key header in your request:
```bash
-H "X-Test-API-Key: billsaver_test_..."
```

### Error: "Failed to read file"
**Solution**: 
- Verify file path is absolute (e.g., `c:\full\path\to\file.pdf`)
- Ensure file exists and is readable
- Check Windows path escaping in JSON: `"c:\\\\Users\\\\..."`

### Error: "Invalid API key"
**Solution**: 
- Check `.env.local` for the correct key
- Restart dev server after changing `.env.local`
- Verify no extra spaces in the key

### Processing takes too long
**Note**: OCR-based PDFs can take 15-30 seconds. This is normal.

---

## Related Documentation

- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - General testing procedures
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API documentation
- [SECURITY.md](./SECURITY.md) - Security best practices

---

## Version History

- **v1.0.0** (2026-01-08): Initial implementation
  - POST `/api/test/upload` endpoint
  - GET `/api/test/results` endpoint
  - GET `/api/test/health` endpoint
  - Web-based testing UI at `/test`
  - API key authentication
  - In-memory result storage
