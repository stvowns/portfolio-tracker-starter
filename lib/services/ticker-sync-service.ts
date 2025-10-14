/**
 * Ticker Sync Service
 * 
 * Syncs BIST and TEFAS ticker data from Borsa MCP to local cache
 * Enables fast autocomplete and search functionality
 */

import { db } from '@/db';
import { tickerCache, tickerSyncLogs, NewTickerCache } from '@/db/schema/price-cache';
import { fetchBISTCompaniesFromKAP } from './kap-direct-client';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Sync configuration
interface TickerSyncConfig {
    syncType: 'BIST' | 'TEFAS' | 'FULL';
    triggeredBy: 'manual' | 'cron' | 'api';
    force?: boolean; // Force sync even if recently synced
}

// Sync result
interface TickerSyncResult {
    logId: string;
    syncType: string;
    totalRecords: number;
    successfulInserts: number;
    failedInserts: number;
    duration: number;
    status: 'completed' | 'failed' | 'partial';
    error?: string;
}

// BIST company interface (from Borsa MCP)
interface BISTCompany {
    ticker_kodu: string;
    sirket_adi: string;
    sehir?: string;
}

/**
 * Sync BIST tickers from Borsa MCP
 */
export async function syncBISTTickers(
    config: Omit<TickerSyncConfig, 'syncType'>
): Promise<TickerSyncResult> {
    const logId = randomUUID();
    const startTime = Date.now();
    const syncType = 'BIST';
    
    let successfulInserts = 0;
    let failedInserts = 0;
    let totalRecords = 0;
    
    try {
        // Create sync log
        await db.insert(tickerSyncLogs).values({
            id: logId,
            syncType,
            triggeredBy: config.triggeredBy,
            startedAt: new Date(startTime),
            status: 'running',
            createdAt: new Date()
        });
        
        // Fetch BIST tickers directly from KAP (faster than Borsa MCP)
        console.log('[Ticker Sync] Fetching BIST tickers from KAP...');
        const companies: BISTCompany[] = await fetchBISTCompaniesFromKAP();
        
        console.log('[Ticker Sync] Found companies:', companies.length);
        
        totalRecords = companies.length;
        
        if (totalRecords === 0) {
            throw new Error('No BIST tickers found from KAP');
        }
        
        // Clear existing BIST tickers if force sync
        if (config.force) {
            await db.delete(tickerCache)
                .where(eq(tickerCache.assetType, 'STOCK'));
        }
        
        // Insert tickers into database
        console.log('[Ticker Sync] Starting database insert for', totalRecords, 'tickers');
        
        for (const company of companies) {
            try {
                const tickerId = randomUUID();
                const now = new Date();
                
                const tickerData: NewTickerCache = {
                    id: tickerId,
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
                };
                
                // Upsert: insert or update if symbol already exists
                await db.insert(tickerCache)
                    .values(tickerData)
                    .onConflictDoUpdate({
                        target: tickerCache.symbol,
                        set: {
                            name: company.sirket_adi,
                            city: company.sehir || null,
                            lastUpdated: now,
                            updatedAt: now
                        }
                    });
                
                successfulInserts++;
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                console.error(`[Ticker Sync] Failed to insert ticker ${company.ticker_kodu}:`, errorMsg);
                console.error('[Ticker Sync] Error details:', error);
                failedInserts++;
            }
        }
        
        // Update sync log
        const duration = Date.now() - startTime;
        const status = failedInserts > 0 && successfulInserts === 0 
            ? 'failed' 
            : failedInserts > 0 
                ? 'partial' 
                : 'completed';
        
        console.log('[Ticker Sync] Completed:', {
            totalRecords,
            successfulInserts,
            failedInserts,
            duration,
            status
        });
        
        await db.update(tickerSyncLogs)
            .set({
                totalRecords,
                successfulInserts,
                failedInserts,
                completedAt: new Date(),
                durationMs: duration,
                status
            })
            .where(eq(tickerSyncLogs.id, logId));
        
        return {
            logId,
            syncType,
            totalRecords,
            successfulInserts,
            failedInserts,
            duration,
            status
        };
        
    } catch (error) {
        // Update sync log with error
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        await db.update(tickerSyncLogs)
            .set({
                totalRecords,
                successfulInserts,
                failedInserts,
                completedAt: new Date(),
                durationMs: duration,
                status: 'failed',
                errorMessage
            })
            .where(eq(tickerSyncLogs.id, logId));
        
        return {
            logId,
            syncType,
            totalRecords,
            successfulInserts,
            failedInserts,
            duration,
            status: 'failed',
            error: errorMessage
        };
    }
}

/**
 * Sync TEFAS fund tickers (placeholder for future implementation)
 */
export async function syncTEFASTickers(
    config: Omit<TickerSyncConfig, 'syncType'>
): Promise<TickerSyncResult> {
    const logId = randomUUID();
    const startTime = Date.now();
    const syncType = 'TEFAS';
    
    try {
        // Create sync log
        await db.insert(tickerSyncLogs).values({
            id: logId,
            syncType,
            triggeredBy: config.triggeredBy,
            startedAt: new Date(startTime),
            status: 'running',
            createdAt: new Date()
        });
        
        // TODO: Implement TEFAS sync
        // For now, just mark as completed with 0 records
        
        const duration = Date.now() - startTime;
        
        await db.update(tickerSyncLogs)
            .set({
                totalRecords: 0,
                successfulInserts: 0,
                failedInserts: 0,
                completedAt: new Date(),
                durationMs: duration,
                status: 'completed',
                errorMessage: 'TEFAS sync not implemented yet'
            })
            .where(eq(tickerSyncLogs.id, logId));
        
        return {
            logId,
            syncType,
            totalRecords: 0,
            successfulInserts: 0,
            failedInserts: 0,
            duration,
            status: 'completed'
        };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
            logId,
            syncType,
            totalRecords: 0,
            successfulInserts: 0,
            failedInserts: 0,
            duration,
            status: 'failed',
            error: errorMessage
        };
    }
}

/**
 * Sync all tickers (BIST + TEFAS)
 */
export async function syncAllTickers(
    config: Omit<TickerSyncConfig, 'syncType'>
): Promise<TickerSyncResult[]> {
    const results: TickerSyncResult[] = [];
    
    // Sync BIST
    const bistResult = await syncBISTTickers(config);
    results.push(bistResult);
    
    // Sync TEFAS (when implemented)
    // const tefasResult = await syncTEFASTickers(config);
    // results.push(tefasResult);
    
    return results;
}

/**
 * Get sync statistics
 */
export async function getSyncStats() {
    // Get total tickers by type
    const allTickers = await db.select().from(tickerCache);
    
    const bistCount = allTickers.filter(t => t.assetType === 'STOCK').length;
    const tefasCount = allTickers.filter(t => t.assetType === 'FUND').length;
    
    // Get last sync log
    const lastSync = await db.select()
        .from(tickerSyncLogs)
        .orderBy(tickerSyncLogs.startedAt)
        .limit(1);
    
    return {
        totalTickers: allTickers.length,
        bistCount,
        tefasCount,
        lastSync: lastSync[0] || null
    };
}
