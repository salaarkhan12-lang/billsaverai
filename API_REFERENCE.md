# BillSaver - API Reference

Complete reference for all functions, components, and types in BillSaver.

---

## 📚 Table of Contents

1. [Components](#components)
2. [Library Functions](#library-functions)
3. [Backend API Endpoints](#backend-api-endpoints)
4. [Types & Interfaces](#types--interfaces)
5. [Utilities](#utilities)

---

## Components

### UploadZone

File upload component with drag-and-drop support.

**Location**: `src/components/UploadZone.tsx`

**Props**:
```typescript
interface UploadZoneProps {
  onFileSelect: (file: File) => void;  // Callback when file is selected
  isProcessing?: boolean;               // Show processing state
  progress?: number;                    // Progress percentage (0-100)
}
```

**Usage**:
```typescript
<UploadZone
  onFileSelect={handleFileSelect}
  isProcessing={appState === "processing"}
  progress={progress}
/>
```

**Features**:
- Drag-and-drop file upload
- Click to browse files
- PDF validation
- Animated feedback
- Progress indicator

---

### AnalysisResults

Results dashboard displaying analysis findings.

**Location**: `src/components/AnalysisResults.tsx`

**Props**:
```typescript
interface AnalysisResultsProps {
  result: AnalysisResult;  // Analysis results to display
  onReset: () => void;     // Callback to reset and analyze another file
}
```

**Usage**:
```typescript
<AnalysisResults 
  result={analysisResult} 
  onReset={handleReset} 
/>
```

**Features**:
- Animated score ring
- E/M level comparison
- Revenue impact display
- Expandable gap cards
- Documentation strengths
- Reset functionality

---

### GlassCard

Reusable glassmorphic card component.

**Location**: `src/components/GlassCard.tsx`

**Props**:
```typescript
interface GlassCardProps extends HTMLMotionProps<"div"> {
  children?: ReactNode;
  variant?: "default" | "elevated" | "inset" | "glow";
  intensity?: "light" | "medium" | "strong";
  hoverEffect?: boolean;
  glowColor?: string;
}
```

**Usage**:
```typescript
<GlassCard 
  variant="elevated" 
  intensity="medium"
  hoverEffect={true}
>
  <Content />
</GlassCard>
```

**Variants**:
- `default`: Standard glass effect
- `elevated`: Enhanced shadow
- `inset`: Inset shadow
- `glow`: Glowing border

**Intensity**:
- `light`: Subtle blur
- `medium`: Standard blur
- `strong`: Heavy blur

---

### ParticleField

Interactive particle animation system.

**Location**: `src/components/ParticleField.tsx`

**Props**:
```typescript
interface ParticleFieldProps {
  isActive?: boolean;      // Increase particle activity
  isAnalyzing?: boolean;   // Show analyzing state
  particleCount?: number;  // Number of particles (default: 50)
  className?: string;      // Additional CSS classes
}
```

**Usage**:
```typescript
<ParticleField
  isActive={isDragging || isHovering}
  isAnalyzing={isProcessing}
  particleCount={40}
/>
```

**Features**:
- Canvas-based rendering
- Mouse interaction
- Particle connections when analyzing
- Smooth 60fps animation
- Automatic cleanup

---

## Library Functions

### parsePDF

Extracts text from PDF files.

**Location**: `src/lib/pdf-parser.ts`

**Signature**:
```typescript
async function parsePDF(file: File): Promise<PDFParseResult>
```

**Parameters**:
- `file: File` - PDF file to parse

**Returns**:
```typescript
interface PDFParseResult {
  text: string;           // Extracted text content
  pageCount: number;      // Number of pages
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
}
```

**Usage**:
```typescript
const result = await parsePDF(pdfFile);
console.log(result.text);        // Full text
console.log(result.pageCount);   // Number of pages
```

**Error Handling**:
```typescript
try {
  const result = await parsePDF(file);
} catch (error) {
  console.error("PDF parsing failed:", error);
}
```

---

### extractSections

Extracts structured sections from medical note text.

**Location**: `src/lib/pdf-parser.ts`

**Signature**:
```typescript
function extractSections(text: string): Record<string, string>
```

**Parameters**:
- `text: string` - Full medical note text

**Returns**:
```typescript
{
  "Chief Complaint": "...",
  "History of Present Illness": "...",
  "Review of Systems": "...",
  "Physical Exam": "...",
  "Assessment": "...",
  "Plan": "...",
  // ... other sections
}
```

**Usage**:
```typescript
const sections = extractSections(noteText);
console.log(sections["Chief Complaint"]);
```

---

### analyzeDocument

Analyzes medical documentation for completeness and billing optimization.

**Location**: `src/lib/billing-rules.ts`

**Signature**:
```typescript
function analyzeDocument(text: string): AnalysisResult
```

**Parameters**:
- `text: string` - Medical note text to analyze

**Returns**: `AnalysisResult` (see Types section)

**Usage**:
```typescript
const analysis = analyzeDocument(noteText);
console.log(analysis.overallScore);      // 0-100
console.log(analysis.currentEMLevel);    // e.g., "99213"
console.log(analysis.gaps);              // Array of gaps
```

**Analysis Process**:
1. Check for chief complaint
2. Count HPI elements (8 possible)
3. Count ROS systems (14 possible)
4. Count exam areas (11+ possible)
5. Validate assessment and plan
6. Check time documentation
7. Verify MEAT criteria
8. Calculate overall score
9. Determine MDM complexity
10. Identify E/M level
11. Generate gap recommendations

---

### cn

Utility for merging Tailwind CSS classes.

**Location**: `src/lib/cn.ts`

**Signature**:
```typescript
function cn(...inputs: ClassValue[]): string
```

**Parameters**:
- `...inputs: ClassValue[]` - Class names to merge

**Returns**: `string` - Merged class names

**Usage**:
```typescript
const className = cn(
  "base-class",
  isActive && "active-class",
  "another-class"
);
// Result: "base-class active-class another-class"
```

**Benefits**:
- Handles conditional classes
- Resolves Tailwind conflicts
- Removes duplicates

---

## Backend API Endpoints

### Authentication Endpoints

#### Register User
**Endpoint**: `POST /api/auth/register`

**Description**: Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "healthcareRole": "PHYSICIAN",
  "licenseNumber": "MD12345",
  "specialty": "Internal Medicine",
  "organization": "Medical Center"
}
```

**Response**:
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

#### Login
**Endpoint**: `POST /api/auth/login`

**Description**: Authenticate user and return tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password",
  "mfaCode": "123456"
}
```

**Response**:
```json
{
  "user": { "id": "user_id", "email": "user@example.com" },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "requiresMFA": false
}
```

#### Refresh Token
**Endpoint**: `POST /api/auth/refresh`

**Description**: Refresh access token using refresh token.

**Request Body**:
```json
{
  "refreshToken": "refresh_token"
}
```

**Response**:
```json
{
  "accessToken": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

### User Management Endpoints

#### Get User Profile
**Endpoint**: `GET /api/user/profile`

**Description**: Get current user's profile information.

**Authentication**: Required

**Response**:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "healthcareRole": "PHYSICIAN",
  "licenseNumber": "MD12345",
  "specialty": "Internal Medicine",
  "organization": "Medical Center",
  "mfaEnabled": true,
  "emailVerified": true,
  "lastLoginAt": "2025-01-02T10:00:00.000Z",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

#### Update User Profile
**Endpoint**: `PUT /api/user/profile`

**Description**: Update user profile information.

**Authentication**: Required

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "licenseNumber": "MD12345",
  "specialty": "Cardiology",
  "organization": "Heart Center"
}
```

### Backup & Export Endpoints

#### Create Database Backup
**Endpoint**: `POST /api/admin/backup`

**Description**: Create an encrypted database backup.

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "includeFiles": true,
  "encrypt": true,
  "password": "backup_password"
}
```

**Response**:
```json
{
  "message": "Backup created successfully",
  "backupPath": "/backups/backup_12345.backup",
  "metadata": {
    "version": "1.0.0",
    "timestamp": "2025-01-02T10:00:00.000Z",
    "checksum": "sha256_hash",
    "recordCounts": {
      "users": 150,
      "documents": 1250,
      "analysisResults": 3200
    },
    "encryptionInfo": {
      "algorithm": "AES-GCM",
      "keyDerivation": "PBKDF2"
    }
  },
  "size": 10485760
}
```

#### List Backups
**Endpoint**: `GET /api/admin/backups`

**Description**: List all available backups.

**Authentication**: Required (Admin only)

**Response**:
```json
[
  {
    "filename": "backup_12345.backup",
    "path": "/backups/backup_12345.backup",
    "size": 10485760,
    "createdAt": "2025-01-02T10:00:00.000Z",
    "metadata": {
      "version": "1.0.0",
      "recordCounts": { "users": 150, "documents": 1250, "analysisResults": 3200 }
    }
  }
]
```

#### Restore from Backup
**Endpoint**: `POST /api/admin/restore`

**Description**: Restore database from backup.

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "backupPath": "/backups/backup_12345.backup",
  "password": "backup_password",
  "dryRun": false
}
```

**Response**:
```json
{
  "success": true,
  "imported": {
    "users": 150,
    "documents": 1250,
    "analysisResults": 3200,
    "files": 1250
  },
  "errors": [],
  "warnings": []
}
```

#### Export User Data
**Endpoint**: `POST /api/user/export`

**Description**: Export user's data in various formats.

**Authentication**: Required

**Request Body**:
```json
{
  "format": "json",
  "includeAnalysisResults": true,
  "password": "export_password"
}
```

**Response**: File download with appropriate content type.

#### Import User Data
**Endpoint**: `POST /api/user/import`

**Description**: Import user data from export.

**Authentication**: Required

**Request Body**:
```json
{
  "data": "encrypted_or_json_data",
  "format": "json",
  "password": "import_password"
}
```

**Response**:
```json
{
  "success": true,
  "imported": {
    "users": 0,
    "documents": 5,
    "analysisResults": 15,
    "files": 0
  },
  "errors": [],
  "warnings": []
}
```

### MFA Endpoints

#### Setup TOTP MFA
**Endpoint**: `POST /api/mfa/setup/totp`

**Description**: Setup Time-based One-Time Password MFA.

**Authentication**: Required

**Response**:
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/BillSaver:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=BillSaver",
  "backupCodes": ["12345678", "87654321", "11223344", "44332211"]
}
```

#### Verify MFA Setup
**Endpoint**: `POST /api/mfa/verify`

**Description**: Verify and activate MFA.

**Authentication**: Required

**Request Body**:
```json
{
  "code": "123456"
}
```

#### Get MFA Status
**Endpoint**: `GET /api/mfa/status`

**Description**: Get current MFA status.

**Authentication**: Required

**Response**:
```json
{
  "enabled": true,
  "method": "TOTP",
  "verifiedAt": "2025-01-02T10:00:00.000Z"
}
```

### Admin Endpoints

#### Get All Users
**Endpoint**: `GET /api/admin/users`

**Description**: Get all users (admin only).

**Authentication**: Required (Admin only)

**Response**:
```json
[
  {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "healthcareRole": "PHYSICIAN",
    "status": "ACTIVE",
    "mfaEnabled": true,
    "emailVerified": true,
    "lastLoginAt": "2025-01-02T10:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

#### Update User Status
**Endpoint**: `PUT /api/admin/users/:userId/status`

**Description**: Update user status (admin only).

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "status": "SUSPENDED"
}
```

#### Assign User Role
**Endpoint**: `POST /api/admin/users/:userId/roles`

**Description**: Assign role to user (admin only).

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "roleName": "ADMIN"
}
```

#### Get User Roles
**Endpoint**: `GET /api/admin/users/:userId/roles`

**Description**: Get user's roles.

**Authentication**: Required

**Response**:
```json
[
  {
    "id": "role_id",
    "name": "USER",
    "permissions": ["user_read", "user_write"],
    "assignedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

---

## Types & Interfaces

### AnalysisResult

Complete analysis results.

```typescript
interface AnalysisResult {
  overallScore: number;                    // 0-100 documentation quality score
  documentationLevel: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  gaps: DocumentationGap[];                // Array of identified gaps
  strengths: string[];                     // What's documented well
  suggestedEMLevel: string;                // Recommended E/M code (e.g., "99214")
  currentEMLevel: string;                  // Currently supported E/M code
  potentialUpcodeOpportunity: boolean;     // Can upcode with improvements
  totalPotentialRevenueLoss: string;       // e.g., "$150-300"
  mdmComplexity: 'Straightforward' | 'Low' | 'Moderate' | 'High';
  timeDocumented: boolean;                 // Is time documented?
  meatCriteriaMet: boolean;                // MEAT criteria satisfied?
}
```

---

### DocumentationGap

Individual documentation deficiency.

```typescript
interface DocumentationGap {
  id: string;                              // Unique identifier
  category: 'critical' | 'major' | 'moderate' | 'minor';
  title: string;                           // Short description
  description: string;                     // Detailed explanation
  impact: string;                          // Business/clinical impact
  recommendation: string;                  // How to address
  potentialRevenueLoss: string;            // Dollar amount (e.g., "$50-100")
  cptCodes?: string[];                     // Related CPT codes
  icdCodes?: string[];                     // Related ICD codes
}
```

**Gap Categories**:
- `critical`: Must fix - significant revenue/compliance risk
- `major`: Should fix - moderate revenue impact
- `moderate`: Nice to fix - minor revenue impact
- `minor`: Optional - documentation improvement

---

### PDFParseResult

Result from PDF parsing.

```typescript
interface PDFParseResult {
  text: string;              // Extracted text content
  pageCount: number;         // Number of pages in PDF
  metadata?: {
    title?: string;          // PDF title
    author?: string;         // PDF author
    creationDate?: string;   // PDF creation date
  };
}
```

---

### AppState

Application state type.

```typescript
type AppState = "idle" | "processing" | "results";
```

**States**:
- `idle`: Waiting for file upload
- `processing`: Analyzing document
- `results`: Displaying analysis results

---

## Utilities

### Class Name Merging

```typescript
import { cn } from "@/lib/cn";

// Merge classes
cn("base", "additional");
// → "base additional"

// Conditional classes
cn("base", isActive && "active");
// → "base active" (if isActive is true)
// → "base" (if isActive is false)

// Tailwind conflict resolution
cn("p-4", "p-6");
// → "p-6" (later class wins)
```

---

## Constants

### E/M Levels

```typescript
const EM_LEVELS = {
  '99211': { 
    name: 'Level 1', 
    mdm: 'N/A', 
    minTime: 0, 
    description: 'Minimal problem' 
  },
  '99212': { 
    name: 'Level 2', 
    mdm: 'Straightforward', 
    minTime: 10, 
    description: 'Self-limited problem' 
  },
  '99213': { 
    name: 'Level 3', 
    mdm: 'Low', 
    minTime: 20, 
    description: 'Low complexity' 
  },
  '99214': { 
    name: 'Level 4', 
    mdm: 'Moderate', 
    minTime: 30, 
    description: 'Moderate complexity' 
  },
  '99215': { 
    name: 'Level 5', 
    mdm: 'High', 
    minTime: 40, 
    description: 'High complexity' 
  },
};
```

---

## Hooks

### Custom Hooks (Potential Extensions)

```typescript
// Example: useFileUpload hook
function useFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const upload = useCallback(async (file: File) => {
    setIsUploading(true);
    // ... upload logic
    setIsUploading(false);
  }, []);
  
  return { file, isUploading, upload };
}

// Example: useAnalysis hook
function useAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const analyze = useCallback(async (text: string) => {
    setIsAnalyzing(true);
    const result = analyzeDocument(text);
    setResult(result);
    setIsAnalyzing(false);
  }, []);
  
  return { result, isAnalyzing, analyze };
}
```

---

## Events

### File Upload Events

```typescript
// Drag events
onDragOver: (e: React.DragEvent) => void
onDragLeave: (e: React.DragEvent) => void
onDrop: (e: React.DragEvent) => void

// File input event
onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
```

### User Interaction Events

```typescript
// Click events
onClick: () => void
onReset: () => void

// Mouse events
onMouseEnter: () => void
onMouseLeave: () => void
```

---

## Animation Configurations

### Framer Motion Variants

```typescript
// Fade in
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Slide up
const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Scale
const scale = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};
```

### Transition Presets

```typescript
// Smooth ease
const smoothEase = {
  duration: 0.5,
  ease: [0.16, 1, 0.3, 1],
};

// Spring
const spring = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

// Infinite loop
const infinite = {
  duration: 2,
  repeat: Infinity,
  ease: "easeInOut",
};
```

---

## Error Handling

### Error Types

```typescript
// PDF parsing errors
try {
  const result = await parsePDF(file);
} catch (error) {
  // Handle: Invalid PDF, corrupted file, etc.
}

// Analysis errors
try {
  const analysis = analyzeDocument(text);
} catch (error) {
  // Handle: Invalid text format, etc.
}
```

### Error Messages

```typescript
// User-friendly error messages
const ERROR_MESSAGES = {
  INVALID_FILE_TYPE: "Please upload a PDF file",
  PDF_PARSE_ERROR: "Unable to read PDF. Please try another file",
  ANALYSIS_ERROR: "Analysis failed. Please try again",
  FILE_TOO_LARGE: "File is too large. Maximum size is 50MB",
};
```

---

## Performance APIs

### Progress Tracking

```typescript
// Simulated progress for UX
const progressInterval = setInterval(() => {
  setProgress((prev) => {
    if (prev >= 90) {
      clearInterval(progressInterval);
      return prev;
    }
    return prev + Math.random() * 15;
  });
}, 200);

// Actual progress points
setProgress(0);    // Start
setProgress(50);   // PDF parsed
setProgress(100);  // Analysis complete
```

---

## Styling APIs

### Tailwind Utilities

```typescript
// cn() utility for class merging
import { cn } from "@/lib/cn";

cn(
  "base-classes",
  condition && "conditional-classes",
  variant === "elevated" && "elevated-classes"
)
```

### CSS Variables

```css
/* Defined in globals.css */
--background: #0a0a0f
--foreground: #ededed
--font-inter: var(--font-inter)
--font-space: var(--font-space)
```

---

## Configuration APIs

### Next.js Config

**Location**: `next.config.ts`

```typescript
const config = {
  // Compiler options
  reactStrictMode: true,
  
  // Image optimization
  images: {
    domains: [],
  },
  
  // Experimental features
  experimental: {
    optimizeCss: true,
  },
};
```

### TypeScript Config

**Location**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Browser APIs Used

### File API

```typescript
// FileReader for PDF
const arrayBuffer = await file.arrayBuffer();

// File validation
if (file.type === "application/pdf") {
  // Process
}
```

### Canvas API

```typescript
// ParticleField rendering
const ctx = canvas.getContext("2d");
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();
```

### Animation API

```typescript
// RequestAnimationFrame for smooth animations
const animate = () => {
  // ... render logic
  requestAnimationFrame(animate);
};
```

---

## Extension APIs

### Adding Custom Analysis Rules

```typescript
// In billing-rules.ts

// 1. Add to DOCUMENTATION_CHECKS
const DOCUMENTATION_CHECKS = {
  // ... existing checks
  customCheck: {
    patterns: [/your pattern/i],
    required: true,
    category: 'major' as const,
  },
};

// 2. Implement check in analyzeDocument
const customCheckFound = DOCUMENTATION_CHECKS.customCheck.patterns.some(
  p => text.match(p)
);

// 3. Add to scoring
if (customCheckFound) score += 5;

// 4. Add gap if missing
if (!customCheckFound) {
  gaps.push({
    id: 'custom-check',
    category: 'major',
    title: 'Missing Custom Element',
    description: 'Description of what is missing',
    impact: 'Impact on billing/compliance',
    recommendation: 'How to address this gap',
    potentialRevenueLoss: '$X-Y',
  });
}
```

---

## Debugging APIs

### Console Logging

```typescript
// Development mode logging
if (process.env.NODE_ENV === 'development') {
  console.log('Analysis result:', result);
}

// Error logging
console.error('Error processing file:', error);
```

### React DevTools

- Install React DevTools browser extension
- Inspect component tree
- View props and state
- Profile performance

---

## Testing APIs

### Manual Testing Helpers

```typescript
// Test with sample data
const sampleText = `
  Chief Complaint: Test
  HPI: Location, Quality, Severity, Duration, Timing, Context, Modifying, Associated
  ROS: All systems reviewed
  Exam: Complete exam documented
  Assessment: Diagnosis
  Plan: Treatment plan
`;

const result = analyzeDocument(sampleText);
console.log('Score:', result.overallScore); // Should be high
```

---

## Version Information

```typescript
// Package version
import packageJson from '../package.json';
console.log(packageJson.version); // "0.1.0"

// Next.js version
console.log(process.env.NEXT_PUBLIC_VERSION);
```

---

## Browser Support

### Minimum Requirements

```json
{
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

### Required Browser Features

- ES2017 support
- Canvas API
- File API
- Fetch API
- CSS Grid
- CSS Flexbox
- CSS Backdrop Filter

---

## Performance Metrics

### Target Metrics

```typescript
const PERFORMANCE_TARGETS = {
  firstContentfulPaint: 1500,  // ms
  timeToInteractive: 3000,     // ms
  pdfParseTime: 5000,          // ms (for 3-page note)
  animationFPS: 60,            // frames per second
  bundleSize: 500,             // KB (initial load)
};
```

---

## Security APIs

### Content Security Policy (Future)

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' cdnjs.cloudflare.com;",
  },
];
```

---

**API Reference Version**: 1.0.0  
**Last Updated**: January 2, 2025  
**Status**: ✅ Complete and Production Ready
