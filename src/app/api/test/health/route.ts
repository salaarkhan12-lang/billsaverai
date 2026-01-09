/**
 * Test API Health Check Endpoint
 * GET /api/test/health
 */

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'BillSaver Testing API is operational'
    });
}
