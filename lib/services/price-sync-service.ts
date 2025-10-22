/**
 * Price Sync Service
 *
 * Updates current prices for portfolio assets by fetching from:
 * - TEFAS API for funds
 * - Yahoo Finance for stocks, commodities, crypto, currencies
 * - Internal price cache for frequently updated assets
 */

import { db, assets, priceCache, priceSyncLogs } from '@/db';
import { eq, and, desc, gt, lt, isNull, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { bistService } from './bist-service';
import { tefasService } from './tefas-service';

interface PriceUpdateResult {
  success: boolean;
  assetId: string;
  assetName: string;
  assetType: string;
  oldPrice?: string;
  newPrice?: number;
  error?: string;
}

interface SyncOptions {
  assetTypes?: string[];
  assetIds?: string[];
  force?: boolean;
  maxAge?: number; // milliseconds
  limit?: number;
}

interface SyncResult {
  logId: string;
  totalAssets: number;
  successful: number;
  failed: number;
  skipped: number;
  duration: number;
  errors: string[];
}

const PRICE_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Main function to sync asset prices
 */
export async function syncAssetPrices(options: SyncOptions = {}): Promise<SyncResult> {
  const logId = randomUUID();
  const startTime = Date.now();
  const errors: string[] = [];

  let successful = 0;
  let failed = 0;
  let skipped = 0;

  try {
    // Create sync log
    await db.insert(priceSyncLogs).values({
      id: logId,
      syncType: 'ASSET_PRICES',
      triggeredBy: 'api',
      startedAt: new Date(startTime),
      status: 'running',
      createdAt: new Date()
    });

    // Build query conditions
    const conditions = [];

    if (options.assetIds && options.assetIds.length > 0) {
      conditions.push(
        assets.id.in(options.assetIds)
      );
    }

    // Only sync assets that need updating (unless forced)
    if (!options.force) {
      const maxAge = options.maxAge || PRICE_UPDATE_INTERVAL;
      const cutoffTime = new Date(Date.now() - maxAge);

      conditions.push(
        or(
          isNull(assets.lastUpdated),
          lt(assets.lastUpdated, cutoffTime)
        )
      );
    }

    // Get assets to update
    let query = db
      .select({
        id: assets.id,
        name: assets.name,
        symbol: assets.symbol,
        assetType: assets.assetType,
        currentPrice: assets.currentPrice,
        lastUpdated: assets.lastUpdated
      })
      .from(assets)
      .where(and(...conditions));

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const allAssetsToUpdate = await query;

    // Filter by asset types if specified
    let assetsToUpdate = allAssetsToUpdate;
    if (options.assetTypes && options.assetTypes.length > 0) {
      const targetTypes = options.assetTypes.map(type => type.toUpperCase());
      assetsToUpdate = allAssetsToUpdate.filter(asset =>
        targetTypes.includes(asset.assetType)
      );
    }

    console.log(`[Price Sync] Found ${assetsToUpdate.length} assets to update`);

    // Update prices for each asset
    for (const asset of assetsToUpdate) {
      try {
        const result = await updateAssetPrice(asset);

        if (result.success) {
          successful++;
          console.log(`[Price Sync] ✓ Updated ${asset.name}: ${result.oldPrice || 'null'} → ${result.newPrice}`);
        } else {
          failed++;
          const errorMsg = `Failed to update ${asset.name}: ${result.error}`;
          errors.push(errorMsg);
          console.error(`[Price Sync] ✗ ${errorMsg}`);
        }
      } catch (error) {
        failed++;
        const errorMsg = `Error updating ${asset.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`[Price Sync] ✗ ${errorMsg}`);
      }
    }

    const duration = Date.now() - startTime;

    // Update sync log
    await db.update(priceSyncLogs)
      .set({
        totalRecords: assetsToUpdate.length,
        successfulInserts: successful,
        failedInserts: failed,
        completedAt: new Date(),
        durationMs: duration,
        status: failed === 0 ? 'completed' : 'partial',
        errorMessage: errors.length > 0 ? errors.join('; ') : null
      })
      .where(eq(priceSyncLogs.id, logId));

    console.log(`[Price Sync] Completed: ${successful} successful, ${failed} failed, ${skipped} skipped (${duration}ms)`);

    return {
      logId,
      totalAssets: assetsToUpdate.length,
      successful,
      failed,
      skipped,
      duration,
      errors
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

    await db.update(priceSyncLogs)
      .set({
        completedAt: new Date(),
        durationMs: duration,
        status: 'failed',
        errorMessage: errorMsg
      })
      .where(eq(priceSyncLogs.id, logId));

    throw error;
  }
}

/**
 * Update price for a single asset
 */
async function updateAssetPrice(asset: any): Promise<PriceUpdateResult> {
  const result: PriceUpdateResult = {
    success: false,
    assetId: asset.id,
    assetName: asset.name,
    assetType: asset.assetType,
    oldPrice: asset.currentPrice
  };

  try {
    let newPrice: number | null = null;

    switch (asset.assetType.toUpperCase()) {
      case 'STOCK':
        if (asset.symbol) {
          const stockData = await bistService.fetchStockPrice(asset.symbol);
          newPrice = stockData.price;
        }
        break;

      case 'FUND':
        if (asset.symbol) {
          const fundData = await tefasService.fetchFundPrice(asset.symbol);
          newPrice = fundData.price;
        }
        break;

      case 'GOLD':
        // Gold price from Yahoo Finance
        const goldResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3004'}/api/prices/latest?symbol=GOLD&type=COMMODITY`);
        if (goldResponse.ok) {
          const goldData = await goldResponse.json();
          if (goldData.success) {
            newPrice = goldData.data.currentPrice;
          }
        }
        break;

      case 'SILVER':
        // Silver price from Yahoo Finance
        const silverResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3004'}/api/prices/latest?symbol=SILVER&type=COMMODITY`);
        if (silverResponse.ok) {
          const silverData = await silverResponse.json();
          if (silverData.success) {
            newPrice = silverData.data.currentPrice;
          }
        }
        break;

      case 'CRYPTO':
        if (asset.symbol) {
          // Convert symbol to Yahoo format if needed
          let yahooSymbol = asset.symbol;
          if (!asset.symbol.includes('-')) {
            yahooSymbol = `${asset.symbol}-USD`;
          }

          const cryptoResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3004'}/api/prices/latest?symbol=${yahooSymbol}&type=CRYPTO`);
          if (cryptoResponse.ok) {
            const cryptoData = await cryptoResponse.json();
            if (cryptoData.success) {
              newPrice = cryptoData.data.currentPrice;
            }
          }
        }
        break;

      case 'CURRENCY':
        if (asset.symbol) {
          const currencyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3004'}/api/prices/latest?symbol=${asset.symbol}&type=CURRENCY`);
          if (currencyResponse.ok) {
            const currencyData = await currencyResponse.json();
            if (currencyData.success) {
              newPrice = currencyData.data.currentPrice;
            }
          }
        }
        break;

      default:
        result.error = `Unsupported asset type: ${asset.assetType}`;
        return result;
    }

    if (newPrice !== null && newPrice > 0) {
      // Update asset price
      await db.update(assets)
        .set({
          currentPrice: newPrice.toString(),
          lastUpdated: new Date()
        })
        .where(eq(assets.id, asset.id));

      result.newPrice = newPrice;
      result.success = true;
    } else {
      result.error = 'Failed to fetch valid price';
    }

    return result;

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}


/**
 * Get price sync status and logs
 */
export async function getPriceSyncStatus(limit = 10) {
  const logs = await db
    .select()
    .from(priceSyncLogs)
    .where(eq(priceSyncLogs.syncType, 'ASSET_PRICES'))
    .orderBy(desc(priceSyncLogs.startedAt))
    .limit(limit);

  return logs;
}

/**
 * Manual price update for specific asset
 */
export async function updateSingleAssetPrice(assetId: string): Promise<PriceUpdateResult> {
  const assetList = await db
    .select()
    .from(assets)
    .where(eq(assets.id, assetId))
    .limit(1);

  if (assetList.length === 0) {
    return {
      success: false,
      assetId,
      assetName: 'Unknown',
      assetType: 'Unknown',
      error: 'Asset not found'
    };
  }

  return await updateAssetPrice(assetList[0]);
}