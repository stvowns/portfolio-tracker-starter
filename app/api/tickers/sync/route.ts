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
        
        // Determine which scripts to run
        const scriptsToRun: Array<{type: string, script: string}> = [];
        
        if (validated.sync_type === 'BIST' || validated.sync_type === 'FULL') {
            scriptsToRun.push({ type: 'BIST', script: 'scripts/sync-bist-tickers.ts' });
        }
        
        if (validated.sync_type === 'TEFAS' || validated.sync_type === 'FULL') {
            scriptsToRun.push({ type: 'TEFAS', script: 'scripts/sync-tefas-data.ts' });
        }
        
        // Execute sync scripts
        console.log(`[Ticker Sync API] Starting ${validated.sync_type} sync via scripts...`);
        const startTime = Date.now();
        
        const results = [];
        
        for (const { type, script } of scriptsToRun) {
            try {
                const scriptStart = Date.now();
                const { stdout, stderr } = await execAsync(`npx tsx ${script}`, {
                    cwd: process.cwd(),
                    timeout: 60000 // 60 seconds max
                });
                
                const scriptDuration = Date.now() - scriptStart;
                
                console.log(`[Ticker Sync API] ${type} output:`, stdout);
                if (stderr) {
                    console.error(`[Ticker Sync API] ${type} stderr:`, stderr);
                }
                
                // Parse output to extract stats
                const successMatch = stdout.match(/Success: (\d+)/);
                const failedMatch = stdout.match(/Failed: (\d+)/);
                const totalMatch = stdout.match(/Total: (\d+)/);
                
                const successful = successMatch ? parseInt(successMatch[1]) : 0;
                const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
                const total = totalMatch ? parseInt(totalMatch[1]) : 0;
                
                results.push({
                    type,
                    total_records: total,
                    successful,
                    failed,
                    duration_ms: scriptDuration,
                    status: failed === 0 ? 'completed' : 'partial'
                });
            } catch (error) {
                console.error(`[Ticker Sync API] ${type} sync failed:`, error);
                results.push({
                    type,
                    total_records: 0,
                    successful: 0,
                    failed: 0,
                    duration_ms: 0,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        
        const duration = Date.now() - startTime;
        
        // Check if all syncs were successful
        const allSuccess = results.every(r => r.status === 'completed');
        const anyFailed = results.some(r => r.status === 'failed');
        
        return NextResponse.json({
            success: !anyFailed,
            message: allSuccess
                ? 'Ticker synchronization completed successfully'
                : anyFailed
                ? 'Ticker synchronization failed'
                : 'Ticker synchronization completed with some failures',
            data: {
                sync_type: validated.sync_type,
                total_duration_ms: duration,
                results
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
