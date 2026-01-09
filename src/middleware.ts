// Next.js middleware for security headers and CSP
// Implements OWASP security best practices

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Generate random nonce for CSP
 */
function generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Buffer.from(array).toString('base64');
}

/**
 * Build Content Security Policy header
 */
function buildCSP(nonce: string): string {
    const policies = [
        // Default: only allow same-origin
        "default-src 'self'",

        // Scripts: self + unsafe-inline + CDN for PDF.js/Tesseract workers
        // Note: unsafe-eval added in development for TensorFlow.js/ML models
        // Note: unsafe-inline is ignored when nonce/strict-dynamic present (CSP3), but needed for Next.js
        // Note: cdn.jsdelivr.net needed for PDF.js and Tesseract.js workers
        process.env.NODE_ENV === 'development'
            ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net`
            : `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`,

        // Styles: self + unsafe-inline (required for Tailwind CSS)
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

        // Images: self + data URIs + blob (for PDF viewer)
        "img-src 'self' data: blob:",

        // Fonts: self + Google Fonts
        "font-src 'self' https://fonts.gstatic.com",

        // Connect: API calls + CDN for Tesseract.js OCR training data
        // Note: localhost:3001 only in development
        process.env.NODE_ENV === 'development'
            ? "connect-src 'self' https://cdn.jsdelivr.net http://localhost:3001"
            : "connect-src 'self' https://cdn.jsdelivr.net",

        // Media: self only
        "media-src 'self'",

        // Objects: none (disable plugins)
        "object-src 'none'",

        // Frames: none (prevent clickjacking)
        "frame-ancestors 'none'",

        // Base URI: self only (prevent base tag injection)
        "base-uri 'self'",

        // Form actions: self only
        "form-action 'self'",

        // Upgrade insecure requests in production
        process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests' : '',

        // Worker sources: self + blob (for PDF.js worker)
        "worker-src 'self' blob:",
    ];

    return policies.filter(Boolean).join('; ');
}

/**
 * Build security headers
 */
function buildSecurityHeaders(nonce: string): Record<string, string> {
    return {
        // Content Security Policy
        'Content-Security-Policy': buildCSP(nonce),

        // Prevent clickjacking
        'X-Frame-Options': 'DENY',

        // Prevent MIME sniffing
        'X-Content-Type-Options': 'nosniff',

        // Enable XSS filter (legacy browsers)
        'X-XSS-Protection': '1; mode=block',

        // Control referrer information
        'Referrer-Policy': 'strict-origin-when-cross-origin',

        // Permissions Policy (disable unnecessary features)
        'Permissions-Policy': [
            'camera=()',
            'microphone=()',
            'geolocation=()',
            'payment=()',
            'usb=()',
            'magnetometer=()',
            'gyroscope=()',
            'accelerometer=()',
        ].join(', '),

        // Strict Transport Security (HTTPS only in production)
        ...(process.env.NODE_ENV === 'production'
            ? {
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            }
            : {}),

        // Cross-Origin policies
        // Note: COEP removed to allow Tesseract.js to load training data from CDN
        // 'Cross-Origin-Embedder-Policy': 'require-corp', // Blocks Tesseract.js CDN
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-origin',

        // Remove server identification
        'X-Powered-By': '',
    };
}

/**
 * Middleware function
 */
export function middleware(request: NextRequest) {
    // Generate nonce for this request
    const nonce = generateNonce();

    // Create response
    const response = NextResponse.next();

    // Add security headers
    const headers = buildSecurityHeaders(nonce);
    Object.entries(headers).forEach(([key, value]) => {
        if (value) {
            response.headers.set(key, value);
        }
    });

    // Add nonce to request headers so it can be accessed in pages
    response.headers.set('X-Nonce', nonce);

    // Add security headers for static files too
    if (request.nextUrl.pathname.startsWith('/_next/static/')) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    return response;
}

// Configure which routes use this middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api routes that need different CSP
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
