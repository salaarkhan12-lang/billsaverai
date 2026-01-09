/**
 * Test API Results Endpoint
 * GET /api/test/results
 * Retrieves analysis results by test ID or latest
 */

import { NextResponse } from 'next/server';
import { validateApiKey, unauthorizedResponse } from '@/lib/test/auth-middleware';
import testStorage from '@/lib/test/test-storage';

export async function GET(request: Request) {
    // Validate API key
    const authResult = validateApiKey(request);
    if (!authResult.authorized) {
        return unauthorizedResponse(authResult.error!);
    }

    try {
        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const testId = searchParams.get('testId');

        let testResult;

        if (testId) {
            // Get specific result by ID
            testResult = testStorage.getResult(testId);

            if (!testResult) {
                return NextResponse.json(
                    { success: false, error: `Test result not found for ID: ${testId}` },
                    { status: 404 }
                );
            }
        } else {
            // Get latest result
            testResult = testStorage.getLatestResult();

            if (!testResult) {
                return NextResponse.json(
                    { success: false, error: 'No test results available' },
                    { status: 404 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            testId: testResult.testId,
            result: testResult.result,
            fileName: testResult.fileName,
            timestamp: testResult.timestamp
        });

    } catch (error) {
        console.error('Error retrieving test result:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
