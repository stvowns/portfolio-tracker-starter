/**
 * Ticker Sync API Endpoint
 * 
 * POST /api/tickers/sync
 * Manually trigger BIST/TEFAS ticker synchronization
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';

const execAsync = promisify(exec);

// Request validation schema
const TickerSyncRequestSchema = z.object({
    sync_type: z.enum(['BIST', 'TEFAS', 'FULL']).default('BIST'),
    force: z.boolean().optional().default(false),
    triggered_by: z.enum(['manual', 'cron', 'api']).default('api')
});

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = await request.json().catch(() => ({}));
        const validated = TickerSyncRequestSchema.parse(body);
        
        if (validated.sync_type !== 'BIST') {
            return NextResponse.json({
                success: false,
                error: 'Only BIST sync is supported currently'
            }, { status: 400 });
        }
        
        // Execute sync script as child process (avoids XLSX import issues in Next.js)
        console.log('[Ticker Sync API] Starting BIST sync via script...');
        const startTime = Date.now();
        
        const { stdout, stderr } = await execAsync('npx tsx scripts/sync-bist-tickers.ts', {
            cwd: process.cwd(),
            timeout: 60000 // 60 seconds max
        });
        
        const duration = Date.now() - startTime;
        
        console.log('[Ticker Sync API] Script output:', stdout);
        if (stderr) {
            console.error('[Ticker Sync API] Script stderr:', stderr);
        }
        
        // Parse output to extract stats
        const successMatch = stdout.match(/Success: (\d+)/);
        const failedMatch = stdout.match(/Failed: (\d+)/);
        const totalMatch = stdout.match(/Total: (\d+)/);
        
        const successful = successMatch ? parseInt(successMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        const total = totalMatch ? parseInt(totalMatch[1]) : 0;
        
        return NextResponse.json({
            success: failed === 0,
            message: failed === 0 
                ? 'Ticker synchronization completed successfully'
                : 'Ticker synchronization completed with some failures',
            data: {
                sync_type: 'BIST',
                results: [{
                    type: 'BIST',
                    total_records: total,
                    successful,
                    failed,
                    duration_ms: duration,
                    status: failed === 0 ? 'completed' : 'partial'
                }]
            }
        });
        
    } catch (error) {
        console.error('[Ticker Sync API] Error:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: 'Invalid request parameters',
                details: error.errors
            }, { status: 400 });
        }
        
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Health check
export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Ticker sync API is operational',
        endpoints: {
            sync: 'POST /api/tickers/sync',
            search: 'GET /api/tickers/search?q=GARAN&type=STOCK'
        }
    });
}
