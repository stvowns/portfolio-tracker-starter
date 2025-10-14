/**
 * Standalone script to sync BIST tickers
 * Run: npx tsx scripts/sync-bist-tickers.ts
 */

import { db } from '../db';
import { tickerCache, tickerSyncLogs } from '../db/schema/price-cache';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as XLSX from 'xlsx';

const KAP_EXCEL_URL = 'https://www.kap.org.tr/tr/api/company/generic/excel/IGS/A';

async function fetchBISTTickers() {
    console.log('📥 Fetching BIST companies from KAP...');
    
    const response = await fetch(KAP_EXCEL_URL, {
        headers: {
            'Accept': '*/*',
            'Accept-Language': 'tr',
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            'Referer': 'https://www.kap.org.tr/tr/bist-sirketler'
        }
    });
    
    if (!response.ok) {
        throw new Error(`KAP API returned ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<any>(firstSheet, { header: 1 });
    
    const companies: Array<{ ticker: string; name: string; city?: string }> = [];
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 3) continue;
        
        const tickerField = String(row[0] || '').trim();
        const name = String(row[1] || '').trim();
        const city = String(row[2] || '').trim();
        
        if (!tickerField || !name || tickerField === 'BIST KODU') continue;
        
        if (tickerField.includes(',')) {
            const tickers = tickerField.split(',').map(t => t.trim());
            for (const ticker of tickers) {
                if (ticker) {
                    companies.push({ ticker, name, city: city || undefined });
                }
            }
        } else {
            companies.push({ ticker: tickerField, name, city: city || undefined });
        }
    }
    
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
                    symbol: company.ticker,
                    name: company.name,
                    city: company.city || null,
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
                console.error(`  ✗ Failed: ${company.ticker}`, error);
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
