/**
 * Test API Upload Endpoint
 * POST /api/test/upload
 * Accepts file path and returns file data for client-side processing
 * OR accepts fileData (base64) directly for processing
 */

import { NextResponse } from 'next/server';
import { validateApiKey, unauthorizedResponse } from '@/lib/test/auth-middleware';
import testStorage from '@/lib/test/test-storage';
import { readFile } from 'fs/promises';
import { basename } from 'path';

interface UploadRequestBody {
    filePath?: string;
    fileData?: string; // base64 encoded file data
    fileName?: string;
    result?: any; // Pre-computed analysis result from client
    payerId?: string;
}

export async function POST(request: Request) {
    // Validate API key
    const authResult = validateApiKey(request);
    if (!authResult.authorized) {
        return unauthorizedResponse(authResult.error!);
    }

    try {
        // Parse request body
        const body: UploadRequestBody = await request.json();

        // Mode 1: Client sends pre-computed analysis result
        if (body.result) {
            console.log('[Test API] Storing pre-computed result');
            const testId = testStorage.storeResult(body.result, body.fileName || 'unknown.pdf');

            return NextResponse.json({
                success: true,
                testId,
                result: body.result,
                mode: 'precomputed'
            });
        }

        // Mode 2: Return file data for client-side processing
        if (body.filePath) {
            console.log(`[Test API] Reading file: ${body.filePath}`);

            // Read file from disk
            let fileBuffer: Buffer;
            try {
                fileBuffer = await readFile(body.filePath);
            } catch (error) {
                console.error('[Test API] File read error:', error);
                return NextResponse.json(
                    {
                        success: false,
                        error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
                    },
                    { status: 400 }
                );
            }

            const fileName = basename(body.filePath);
            const fileBase64 = fileBuffer.toString('base64');

            console.log(`[Test API] File read successfully: ${fileName}, Size: ${fileBuffer.length} bytes`);

            // Return file data for client-side processing
            return NextResponse.json({
                success: true,
                mode: 'file_data',
                fileData: fileBase64,
                fileName,
                payerId: body.payerId || 'bcbs-national',
                message: 'File loaded successfully. Process on client side and send result back.'
            });
        }

        return NextResponse.json(
            { success: false, error: 'Missing required field: filePath or result' },
            { status: 400 }
        );

    } catch (error) {
        console.error('[Test API] Error processing upload:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
