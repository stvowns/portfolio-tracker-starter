/**
 * Price Sync Service
 * 
 * Core service for syncing asset prices from Borsa MCP to local cache
 * Handles market hours, rate limiting, and error recovery
 */

import { db } from '@/db';
import { assets } from '@/db/schema/portfolio';
import { priceCache, priceSyncLogs, PRICE_SYNC_STATUS, SYNC_LOG_STATUS } from '@/db/schema/price-cache';
import { bistService } from './bist-service';
import { eq, and, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Sync configuration
interface SyncConfig {
    assetTypes?: string[];
    assetIds?: string[];
    force?: boolean;          // Bypass market hours check
    maxAge?: number;          // Max cache age in ms before refresh
    limit?: number;           // Limit number of assets to sync (performance)
}

// Sync result
interface SyncResult {
    logId: string;
    totalAssets: number;
    successful: number;
    failed: number;
    skipped: number;
    duration: number;
    errors: Array<{ assetId: string; error: string }>;
}

// Asset type to market mapping (case-insensitive)
const ASSET_TYPE_MARKET_MAP: Record<string, string> = {
    'GOLD': 'dovizcom',
    'gold': 'dovizcom',
    'SILVER': 'dovizcom',
    'silver': 'dovizcom',
    'STOCK': 'bist',
    'stock': 'bist',
    'FUND': 'tefas',
    'fund': 'tefas',
    'CRYPTO': 'btcturk',
    'crypto': 'btcturk',
    'EUROBOND': 'dovizcom',
    'eurobond': 'dovizcom',
    'currency': 'dovizcom',
    'commodity': 'dovizcom'
};

// Market hours checker
function isMarketOpen(assetType: string): boolean {
    const now = new Date();
    const istanbul = new Date(now.toLocaleString('en-US', { 
        timeZone: 'Europe/Istanbul' 
    }));
    
    const hour = istanbul.getHours();
    const day = istanbul.getDay(); // 0: Sunday, 6: Saturday
    const type = assetType.toLowerCase(); // Normalize to lowercase
    
    // Weekend check (only crypto is 24/7)
    if (day === 0 || day === 6) {
        return type === 'crypto';
    }
    
    // BIST market hours: 09:30 - 18:00
    if (type === 'stock') {
        return hour >= 9 && hour < 18;
    }
    
    // TEFAS funds: Only at 11:00 on weekdays
    if (type === 'fund') {
        return hour === 11;
    }
    
    // Gold, silver, currency, commodity, eurobond: 09:00 - 18:00
    if (['gold', 'silver', 'currency', 'commodity', 'eurobond'].includes(type)) {
        return hour >= 9 && hour < 18;
    }
    
    // Crypto is 24/7
    if (type === 'crypto') {
        return true;
    }
    
    return false;
}

// Check if cache is stale
function isCacheStale(lastUpdated: Date | null, maxAge: number): boolean {
    if (!lastUpdated) return true;
    const age = Date.now() - lastUpdated.getTime();
    return age > maxAge;
}

/**
 * Sync prices for multiple assets
 */
export async function syncAssetPrices(
    config: SyncConfig = {}
): Promise<SyncResult> {
    const logId = randomUUID();
    const startTime = Date.now();
    const errors: Array<{ assetId: string; error: string }> = [];
    
    let successful = 0;
    let failed = 0;
    let skipped = 0;
    
    try {
        // Create sync log
        await db.insert(priceSyncLogs).values({
            id: logId,
            syncType: config.assetIds ? 'partial' : 'full',
            assetTypes: config.assetTypes ? JSON.stringify(config.assetTypes) : null,
            startedAt: new Date(startTime),
            status: SYNC_LOG_STATUS.RUNNING,
            triggeredBy: 'api',
            syncConfig: JSON.stringify(config),
            createdAt: new Date()
        });
        
        // Build query for assets to sync
        const conditions = [];
        
        if (config.assetTypes) {
            conditions.push(inArray(assets.assetType, config.assetTypes));
        }
        
        if (config.assetIds) {
            conditions.push(inArray(assets.id, config.assetIds));
        }
        
        // Get assets that have auto_price_update enabled
        conditions.push(eq(assets.autoPriceUpdate, true));
        conditions.push(eq(assets.priceCacheEnabled, true));
        
        const assetsToSync = await db.query.assets.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined
        });
        
        // Filter by market hours (unless force is true)
        let filteredAssets = config.force 
            ? assetsToSync
            : assetsToSync.filter(asset => isMarketOpen(asset.assetType));
        
        // Apply limit if specified (performance optimization)
        if (config.limit && config.limit > 0) {
            filteredAssets = filteredAssets.slice(0, config.limit);
        }
        
        // Sync each asset
        for (const asset of filteredAssets) {
            try {
                // Check if cache is fresh enough
                if (!config.force && asset.lastUpdated) {
                    const maxAge = asset.assetType === 'fund' 
                        ? 24 * 60 * 60 * 1000  // 24 hours for funds
                        : 60 * 60 * 1000;       // 1 hour for others
                    
                    if (!isCacheStale(asset.lastUpdated, config.maxAge || maxAge)) {
                        skipped++;
                        continue;
                    }
                }
                
                // Fetch price from Borsa MCP
                const result = await fetchAssetPrice(asset);
                
                if (result.success && result.price) {
                    // Update price cache
                    await updatePriceCache(asset, result.price);
                    
                    // Update asset current_price
                    await db.update(assets)
                        .set({
                            currentPrice: result.price.currentPrice,
                            lastUpdated: new Date(),
                            updatedAt: new Date()
                        })
                        .where(eq(assets.id, asset.id));
                    
                    successful++;
                } else {
                    failed++;
                    errors.push({
                        assetId: asset.id,
                        error: result.error || 'Unknown error'
                    });
                }
            } catch (error) {
                failed++;
                errors.push({
                    assetId: asset.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        
        // Update sync log
        const duration = Date.now() - startTime;
        await db.update(priceSyncLogs)
            .set({
                totalAssets: filteredAssets.length,
                successfulUpdates: successful,
                failedUpdates: failed,
                skippedUpdates: skipped,
                completedAt: new Date(),
                durationMs: duration,
                status: failed > 0 
                    ? SYNC_LOG_STATUS.PARTIAL 
                    : SYNC_LOG_STATUS.COMPLETED,
                errorDetails: errors.length > 0 ? JSON.stringify(errors) : null
            })
            .where(eq(priceSyncLogs.id, logId));
        
        return {
            logId,
            totalAssets: filteredAssets.length,
            successful,
            failed,
            skipped,
            duration,
            errors
        };
        
    } catch (error) {
        // Update sync log with error
        const duration = Date.now() - startTime;
        await db.update(priceSyncLogs)
            .set({
                completedAt: new Date(),
                durationMs: duration,
                status: SYNC_LOG_STATUS.FAILED,
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            })
            .where(eq(priceSyncLogs.id, logId));
        
        throw error;
    }
}

/**
 * Simple gold price fetch (direct API, no Borsa MCP)
 */
async function fetchGoldPriceSimple(symbol: string): Promise<{
    success: boolean;
    price?: any;
    error?: string;
}> {
    try {
        // Fetch USD/TRY rate first
        let usdTryRate = 34; // Fallback
        try {
            const usdTryUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/TRY=X?interval=1d&range=1d';
            const usdTryResponse = await fetch(usdTryUrl);
            const usdTryData = await usdTryResponse.json();
            
            if (usdTryData?.chart?.result?.[0]?.meta?.regularMarketPrice) {
                usdTryRate = usdTryData.chart.result[0].meta.regularMarketPrice;
            }
        } catch (error) {
            console.warn('Could not fetch USD/TRY rate, using fallback:', error);
        }
        
        // Use Yahoo Finance API (reliable and fast)
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data?.chart?.result?.[0]) {
            const result = data.chart.result[0];
            const meta = result.meta;
            const quote = result.indicators.quote[0];
            
            const currentPrice = meta.regularMarketPrice;
            const previousClose = meta.chartPreviousClose;
            const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
            
            // Convert USD to TRY (1 ounce = 31.1035 grams, real USD/TRY rate)
            const GRAMS_PER_OUNCE = 31.1035;
            const gramPrice = (currentPrice / GRAMS_PER_OUNCE) * usdTryRate;
            const previousGramPrice = (previousClose / GRAMS_PER_OUNCE) * usdTryRate;
            
            return {
                success: true,
                price: {
                    currentPrice: gramPrice,
                    previousClose: previousGramPrice,
                    changeAmount: gramPrice - previousGramPrice,
                    changePercent: changePercent,
                    market: 'Yahoo Finance (Gold)',
                    usdTryRate: usdTryRate
                }
            };
        }
        
        return { success: false, error: 'No data from Yahoo Finance' };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Fetch price for a single asset from Borsa MCP
 */
async function fetchAssetPrice(asset: any): Promise<{
    success: boolean;
    price?: any;
    error?: string;
}> {
    try {
        let result;
        const assetType = asset.assetType.toLowerCase(); // Normalize to lowercase
        
        switch (assetType) {
            case 'stock':
                result = await borsaMCPClient.getStockPrice(asset.symbol);
                return {
                    success: true,
                    price: parseStockPrice(result.data)
                };
            
            case 'fund':
                result = await borsaMCPClient.getFundPrice(asset.symbol);
                return {
                    success: true,
                    price: parseFundPrice(result.data)
                };
            
            case 'crypto':
                result = await borsaMCPClient.getCryptoPrice(asset.symbol);
                return {
                    success: true,
                    price: parseCryptoPrice(result.data)
                };
            
            case 'gold':
            case 'silver':
            case 'currency':
            case 'commodity':
            case 'eurobond':
                // Use simple HTTP fetch instead of Borsa MCP (too slow)
                result = await fetchGoldPriceSimple(asset.symbol);
                return result;
            
            default:
                return {
                    success: false,
                    error: `Unsupported asset type: ${asset.assetType}`
                };
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Price parsers (to be implemented based on Borsa MCP response format)
function parseStockPrice(data: any) {
    // TODO: Parse stock price response
    return {
        currentPrice: data.price || 0,
        previousClose: data.previousClose,
        changeAmount: data.change,
        changePercent: data.changePercent,
        market: 'BIST'
    };
}

function parseFundPrice(data: any) {
    // TODO: Parse fund price response
    return {
        currentPrice: data.price || 0,
        market: 'TEFAS'
    };
}

function parseCryptoPrice(data: any) {
    // TODO: Parse crypto price response
    return {
        currentPrice: data.last || 0,
        previousClose: data.open,
        highPrice: data.high,
        lowPrice: data.low,
        volume: data.volume,
        market: 'BtcTurk'
    };
}

function parseCurrencyPrice(data: any) {
    // TODO: Parse currency price response
    return {
        currentPrice: data.selling || 0,
        previousClose: data.previousClose,
        changeAmount: data.change,
        changePercent: data.changePercent,
        market: 'Dovizcom'
    };
}

/**
 * Update or insert price cache entry
 */
async function updatePriceCache(asset: any, priceData: any) {
    const cacheId = randomUUID();
    
    await db.insert(priceCache).values({
        id: cacheId,
        assetId: asset.id,
        assetType: asset.assetType,
        symbol: asset.symbol,
        name: asset.name,
        currentPrice: priceData.currentPrice,
        previousClose: priceData.previousClose,
        changeAmount: priceData.changeAmount,
        changePercent: priceData.changePercent,
        openPrice: priceData.openPrice,
        highPrice: priceData.highPrice,
        lowPrice: priceData.lowPrice,
        volume: priceData.volume,
        currency: asset.currency || 'TRY',
        market: priceData.market,
        lastUpdated: new Date(),
        dataSource: 'borsa-mcp',
        syncStatus: PRICE_SYNC_STATUS.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date()
    }).onConflictDoUpdate({
        target: priceCache.assetId,
        set: {
            currentPrice: priceData.currentPrice,
            previousClose: priceData.previousClose,
            changeAmount: priceData.changeAmount,
            changePercent: priceData.changePercent,
            openPrice: priceData.openPrice,
            highPrice: priceData.highPrice,
            lowPrice: priceData.lowPrice,
            volume: priceData.volume,
            lastUpdated: new Date(),
            syncStatus: PRICE_SYNC_STATUS.ACTIVE,
            errorMessage: null,
            updatedAt: new Date()
        }
    });
}
