// Input validation and sanitization utilities
// Prevents malicious file uploads, XSS, and injection attacks

interface FileValidationResult {
    valid: boolean;
    error?: string;
    warnings?: string[];
}

interface RateLimitState {
    count: number;
    resetAt: number;
}

/**
 * PDF magic bytes for file type verification
 */
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46]; // %PDF

/**
 * Maximum file size (50MB)
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
    maxUploads: 10,
    windowMs: 60 * 1000, // 1 minute
};

/**
 * Rate limiter state (in-memory)
 */
const rateLimitState = new Map<string, RateLimitState>();

/**
 * Validate file type using magic bytes (not just extension)
 */
export async function validateFileType(file: File): Promise<FileValidationResult> {
    // Check file extension first (quick check)
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        return {
            valid: false,
            error: 'File must be a PDF document (.pdf extension required)',
        };
    }

    // Read first 4 bytes to verify PDF magic bytes
    try {
        const buffer = await file.slice(0, 4).arrayBuffer();
        const bytes = new Uint8Array(buffer);

        // Check if bytes match PDF magic bytes
        const isPDF = PDF_MAGIC_BYTES.every((byte, index) => bytes[index] === byte);

        if (!isPDF) {
            return {
                valid: false,
                error: 'File is not a valid PDF document (magic byte verification failed)',
            };
        }

        return { valid: true };
    } catch (error) {
        return {
            valid: false,
            error: 'Failed to read file for validation',
        };
    }
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): FileValidationResult {
    if (file.size === 0) {
        return {
            valid: false,
            error: 'File is empty (0 bytes)',
        };
    }

    if (file.size > MAX_FILE_SIZE) {
        const sizeMB = Math.round(file.size / 1024 / 1024);
        const maxMB = Math.round(MAX_FILE_SIZE / 1024 / 1024);
        return {
            valid: false,
            error: `File is too large (${sizeMB}MB). Maximum size is ${maxMB}MB`,
        };
    }

    // Warning for large files
    const warnings: string[] = [];
    if (file.size > 10 * 1024 * 1024) {
        const sizeMB = Math.round(file.size / 1024 / 1024);
        warnings.push(`Large file (${sizeMB}MB) may take longer to process`);
    }

    return {
        valid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

/**
 * Validate MIME type
 */
export function validateMimeType(file: File): FileValidationResult {
    const allowedMimeTypes = [
        'application/pdf',
        'application/x-pdf',
        'application/acrobat',
        'applications/vnd.pdf',
        'text/pdf',
        'text/x-pdf',
    ];

    if (!allowedMimeTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid MIME type: ${file.type}. Expected: application/pdf`,
        };
    }

    return { valid: true };
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
    // Remove any directory path components
    let sanitized = filename.replace(/^.*[\\\/]/, '');

    // Remove any non-alphanumeric characters except dots, hyphens, and underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Prevent double extensions and hidden files
    sanitized = sanitized.replace(/\.+/g, '.');
    if (sanitized.startsWith('.')) {
        sanitized = sanitized.substring(1);
    }

    // Ensure filename isn't too long
    if (sanitized.length > 255) {
        const ext = sanitized.substring(sanitized.lastIndexOf('.'));
        sanitized = sanitized.substring(0, 255 - ext.length) + ext;
    }

    return sanitized;
}

/**
 * Check for malicious patterns in filename
 */
export function checkMaliciousPatterns(filename: string): FileValidationResult {
    const maliciousPatterns = [
        /\.\./,           // Path traversal
        /[<>:"|?*]/,      // Invalid filename characters
        /\0/,             // Null bytes
        /\.exe$/i,        // Executable
        /\.scr$/i,        // Screensaver
        /\.bat$/i,        // Batch file
        /\.cmd$/i,        // Command file
        /\.com$/i,        // COM file
        /\.pif$/i,        // Program information file
        /\.vbs$/i,        // VBScript
        /\.js$/i,         // JavaScript (suspicious in this context)
    ];

    for (const pattern of maliciousPatterns) {
        if (pattern.test(filename)) {
            return {
                valid: false,
                error: 'Filename contains suspicious or forbidden patterns',
            };
        }
    }

    return { valid: true };
}

/**
 * Rate limiting for file uploads
 */
export function checkRateLimit(userId: string = 'anonymous'): FileValidationResult {
    const now = Date.now();
    const state = rateLimitState.get(userId);

    // Initialize or reset if window expired
    if (!state || now > state.resetAt) {
        rateLimitState.set(userId, {
            count: 1,
            resetAt: now + RATE_LIMIT_CONFIG.windowMs,
        });
        return { valid: true };
    }

    // Check if limit exceeded
    if (state.count >= RATE_LIMIT_CONFIG.maxUploads) {
        const secondsRemaining = Math.ceil((state.resetAt - now) / 1000);
        return {
            valid: false,
            error: `Rate limit exceeded. Please wait ${secondsRemaining} seconds before uploading more files`,
        };
    }

    // Increment count
    state.count++;
    rateLimitState.set(userId, state);

    return { valid: true };
}

/**
 * Comprehensive file validation
 */
export async function validateFile(
    file: File,
    userId?: string
): Promise<FileValidationResult> {
    // 1. Check rate limit
    const rateLimitResult = checkRateLimit(userId);
    if (!rateLimitResult.valid) {
        return rateLimitResult;
    }

    // 2. Validate filename for malicious patterns
    const patternResult = checkMaliciousPatterns(file.name);
    if (!patternResult.valid) {
        return patternResult;
    }

    // 3. Validate file size
    const sizeResult = validateFileSize(file);
    if (!sizeResult.valid) {
        return sizeResult;
    }

    // 4. Validate MIME type
    const mimeResult = validateMimeType(file);
    if (!mimeResult.valid) {
        return mimeResult;
    }

    // 5. Validate file type with magic bytes (most thorough)
    const typeResult = await validateFileType(file);
    if (!typeResult.valid) {
        return typeResult;
    }

    // Combine warnings
    const warnings = [...(sizeResult.warnings || []), ...(typeResult.warnings || [])];

    return {
        valid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
    // Remove any HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');

    // Encode special characters
    sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');

    return sanitized;
}

/**
 * Validate and sanitize URL
 */
export function validateUrl(url: string): { valid: boolean; sanitized?: string; error?: string } {
    try {
        const parsed = new URL(url);

        // Only allow https and http protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return {
                valid: false,
                error: 'Invalid URL protocol. Only HTTP and HTTPS are allowed',
            };
        }

        return {
            valid: true,
            sanitized: parsed.toString(),
        };
    } catch {
        return {
            valid: false,
            error: 'Invalid URL format',
        };
    }
}

/**
 * Clear rate limit state (for testing)
 */
export function clearRateLimitState(): void {
    rateLimitState.clear();
}

// Export configuration for testing/customization
export const ValidationConfig = {
    maxFileSize: MAX_FILE_SIZE,
    rateLimitConfig: RATE_LIMIT_CONFIG,
};
