/**
 * Price Sync API Endpoint
 * 
 * POST /api/prices/sync
 * Manually trigger price synchronization
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAssetPrices } from '@/lib/services/price-sync-service';
import { z } from 'zod';

// Request validation schema
const SyncRequestSchema = z.object({
    asset_types: z.array(z.enum([
        'gold', 'silver', 'stock', 'fund', 
        'crypto', 'currency', 'commodity'
    ])).optional(),
    asset_ids: z.array(z.string()).optional(),
    force: z.boolean().optional(),
    max_age: z.number().min(0).max(86400000).optional(),
    limit: z.number().min(1).max(50).optional()  // Performance optimization
});

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = await request.json();
        const validated = SyncRequestSchema.parse(body);
        
        // Execute sync
        const result = await syncAssetPrices({
            assetTypes: validated.asset_types,
            assetIds: validated.asset_ids,
            force: validated.force,
            maxAge: validated.max_age,
            limit: validated.limit
        });
        
        return NextResponse.json({
            success: true,
            message: 'Price synchronization completed',
            data: {
                log_id: result.logId,
                total_assets: result.totalAssets,
                successful: result.successful,
                failed: result.failed,
                skipped: result.skipped,
                duration_ms: result.duration,
                errors: result.errors.length > 0 ? result.errors : undefined
            }
        });
        
    } catch (error) {
        console.error('[Price Sync API] Error:', error);
        
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
        message: 'Price sync API is operational',
        endpoints: {
            sync: 'POST /api/prices/sync'
        }
    });
}
