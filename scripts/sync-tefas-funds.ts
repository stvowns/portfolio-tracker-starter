/**
 * Standalone script to sync TEFAS funds
 * Run: npx tsx scripts/sync-tefas-funds.ts
 */

import { db } from '../db';
import { tickerCache, tickerSyncLogs } from '../db/schema/price-cache';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '8087c41afbmsh30bf3e0c8b0b777p155f23jsn0c33bae3cbe8';

async function syncTickers() {
    const logId = randomUUID();
    const startTime = Date.now();
    
    try {
        // Create sync log
        await db.insert(tickerSyncLogs).values({
            id: logId,
            syncType: 'TEFAS',
            triggeredBy: 'manual',
            startedAt: new Date(startTime),
            status: 'running',
            createdAt: new Date()
        });
        
        // Fetch all TEFAS funds from RapidAPI
        // RapidAPI Free Plan: 10 requests/day
        // /api/v1/funds = 1 request → ALL 3285 funds
        // Daily syncs (11:00 + 17:00) = only 2 requests/day
        // Remaining 8 requests for price fetching
        console.log('📥 Fetching all TEFAS funds from RapidAPI...');
        
        const response = await fetch('https://tefas-api.p.rapidapi.com/api/v1/funds', {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': 'tefas-api.p.rapidapi.com'
            }
        });
        
        if (!response.ok) {
            throw new Error(`RapidAPI returned ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success || !result.data) {
            throw new Error('Invalid response from RapidAPI');
        }
        
        // Transform to our format
        const funds = result.data.map((fund: any) => ({
            fon_kodu: fund.key,
            fon_adi: fund.value,
            fon_turu: null // Type info not available in list endpoint
        }));
        
        console.log(`✅ Fetched ${funds.length} funds from RapidAPI (total: ${result.meta?.total || funds.length})`);
        
        // Clear existing
        console.log('🗑️  Clearing existing TEFAS funds...');
        await db.delete(tickerCache).where(eq(tickerCache.assetType, 'FUND'));
        
        // Insert new
        console.log('💾 Inserting funds into database...');
        let successful = 0;
        let failed = 0;
        
        for (const fund of funds) {
            try {
                const now = new Date();
                await db.insert(tickerCache).values({
                    id: randomUUID(),
                    assetType: 'FUND',
                    symbol: fund.fon_kodu,
                    name: fund.fon_adi,
                    city: null,
                    category: fund.fon_turu || null,
                    extraData: null,
                    lastUpdated: now,
                    dataSource: 'takasbank',
                    createdAt: now,
                    updatedAt: now
                });
                successful++;
                
                if (successful % 100 === 0) {
                    console.log(`  ✓ Inserted ${successful}/${funds.length}`);
                }
            } catch (error) {
                console.error(`  ✗ Failed: ${fund.fon_kodu}`, error);
                failed++;
            }
        }
        
        const duration = Date.now() - startTime;
        
        // Update log
        await db.update(tickerSyncLogs)
            .set({
                totalRecords: funds.length,
                successfulInserts: successful,
                failedInserts: failed,
                completedAt: new Date(),
                durationMs: duration,
                status: failed === 0 ? 'completed' : 'partial'
            })
            .where(eq(tickerSyncLogs.id, logId));
        
        console.log(`\n✅ Sync completed!`);
        console.log(`   Total: ${funds.length}`);
        console.log(`   Success: ${successful}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
        
    } catch (error) {
        console.error('❌ Sync failed:', error);
        const duration = Date.now() - startTime;
        
        await db.update(tickerSyncLogs)
            .set({
                completedAt: new Date(),
                durationMs: duration,
                status: 'failed',
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            })
            .where(eq(tickerSyncLogs.id, logId));
        
        process.exit(1);
    }
}

// Run
syncTickers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
