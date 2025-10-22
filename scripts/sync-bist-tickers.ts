/**
 * Standalone script to sync BIST tickers
 * Run: npx tsx scripts/sync-bist-tickers.ts
 */

import { db } from '../db';
import { tickerCache, tickerSyncLogs } from '../db/schema/price-cache';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { bistService } from '../lib/services/bist-service';

async function fetchBISTTickers() {
    console.log('📥 Fetching BIST companies from BIST Service...');

    const companies = await bistService.fetchCompanies();
    console.log(`✅ Found ${companies.length} companies`);
    return companies;
}

async function syncTickers() {
    const logId = randomUUID();
    const startTime = Date.now();
    
    try {
        // Create sync log
        await db.insert(tickerSyncLogs).values({
            id: logId,
            syncType: 'BIST',
            triggeredBy: 'manual',
            startedAt: new Date(startTime),
            status: 'running',
            createdAt: new Date()
        });
        
        // Fetch companies
        const companies = await fetchBISTTickers();
        
        // Clear existing
        console.log('🗑️  Clearing existing tickers...');
        await db.delete(tickerCache).where(eq(tickerCache.assetType, 'STOCK'));
        
        // Insert new
        console.log('💾 Inserting tickers into database...');
        let successful = 0;
        let failed = 0;
        
        for (const company of companies) {
            try {
                const now = new Date();
                await db.insert(tickerCache).values({
                    id: randomUUID(),
                    assetType: 'STOCK',
                    symbol: company.ticker_kodu,
                    name: company.sirket_adi,
                    city: company.sehir || null,
                    category: null,
                    extraData: null,
                    lastUpdated: now,
                    dataSource: 'kap-direct',
                    createdAt: now,
                    updatedAt: now
                });
                successful++;

                if (successful % 100 === 0) {
                    console.log(`  ✓ Inserted ${successful}/${companies.length}`);
                }
            } catch (error) {
                console.error(`  ✗ Failed: ${company.ticker_kodu}`, error);
                failed++;
            }
        }
        
        const duration = Date.now() - startTime;
        
        // Update log
        await db.update(tickerSyncLogs)
            .set({
                totalRecords: companies.length,
                successfulInserts: successful,
                failedInserts: failed,
                completedAt: new Date(),
                durationMs: duration,
                status: failed === 0 ? 'completed' : 'partial'
            })
            .where(eq(tickerSyncLogs.id, logId));
        
        console.log(`\n✅ Sync completed!`);
        console.log(`   Total: ${companies.length}`);
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
