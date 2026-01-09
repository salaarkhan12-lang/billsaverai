/**
 * Authentication Middleware for Testing API
 * Validates API key from request headers
 */

import { NextResponse } from 'next/server';

export interface AuthResult {
    authorized: boolean;
    error?: string;
}

/**
 * Validates the API key from request headers
 * @param request - Next.js request object
 * @returns AuthResult indicating if request is authorized
 */
export function validateApiKey(request: Request): AuthResult {
    const apiKey = request.headers.get('X-Test-API-Key');

    if (!apiKey) {
        return {
            authorized: false,
            error: 'Missing X-Test-API-Key header'
        };
    }

    const expectedKey = process.env.TEST_API_KEY;

    if (!expectedKey) {
        return {
            authorized: false,
            error: 'Server configuration error: TEST_API_KEY not set'
        };
    }

    if (apiKey !== expectedKey) {
        return {
            authorized: false,
            error: 'Invalid API key'
        };
    }

    return { authorized: true };
}

/**
 * Creates an unauthorized response
 * @param error - Error message
 * @returns NextResponse with 401 status
 */
export function unauthorizedResponse(error: string): NextResponse {
    return NextResponse.json(
        { success: false, error },
        { status: 401 }
    );
}
