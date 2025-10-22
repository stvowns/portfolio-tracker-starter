/**
 * Standalone script to sync TEFAS funds
 * Run: npx tsx scripts/sync-tefas-funds.ts
 */

import { db } from '../db';
import { tickerCache, tickerSyncLogs } from '../db/schema/price-cache';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { fetchTEFASFundsFromTEFAS } from '../lib/services/kap-direct-client';

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
        
        // Fetch all TEFAS funds from official TEFAS API
        console.log('📥 Fetching all TEFAS funds from official TEFAS API...');
        
        const funds = await fetchTEFASFundsFromTEFAS();
        
        console.log(`✅ Fetched ${funds.length} funds from TEFAS API`);
        
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
                    dataSource: 'tefas',
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
