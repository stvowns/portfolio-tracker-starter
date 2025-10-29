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

/**
 * Predict stock ticker from company name for BIST stocks
 */
function predictBISTTicker(companyName: string): string | null {
  const name = companyName.trim().toUpperCase();

  // Known Turkish company name patterns
  const patterns = [
    // Major banks
    { pattern: /AKBANK|AK TİCARİ/, ticker: 'AKBNK' },
    { pattern: /GARANTİ|GARANTI/, ticker: 'GARAN' },
    { pattern: /İŞ BANKASI|İŞBANKASI|TÜRKİYE İŞ BANKASI/, ticker: 'ISCTR' },
    { pattern: /YAPI KREDİ|YAPIKREDİ/, ticker: 'YKBNK' },
    { pattern: /DENİZBANK/, ticker: 'DENIZ' },
    { pattern: /QNB FİNANS/, ticker: 'QNBFB' },
    { pattern: /TEB|TÜRK EKONOMİ/, ticker: 'TEBNK' },

    // Major holdings
    { pattern: /KOÇ HOLDİNG|KOÇ HOLDING/, ticker: 'KCHOL' },
    { pattern: /SABANCI HOLDİNG|SABANCI/, ticker: 'SAHOL' },
    { pattern: /DOĞAN HOLDİNG|DOĞAN/, ticker: 'DOHOL' },
    { pattern: /ALARKO HOLDİNG|ALARKO/, ticker: 'ALARK' },

    // Automotive
    { pattern: /TOFAŞ|TÜRK OTOMOBİL FABRİKASI/, ticker: 'TOASO' },
    { pattern: /FORD OTOSAN|FORD OTOMOTİV/, ticker: 'FROTO' },
    { pattern: /TOYOTA|TOYOTASA/, ticker: 'TOYAO' },
    { pattern: /HYUNDAI|HYUNDAI ASSAN/, ticker: 'HYUNI' },
    { pattern: /OTOSAN|OTOMOTİV SANAYİ/, ticker: 'OTOSA' },

    // Technology
    { pattern: /TÜRKCELL/, ticker: 'TCELL' },
    { pattern: /TÜRK TELEKOM|TÜRKTELEKOM/, ticker: 'TTKOM' },
    { pattern: /TÜRKSAT|TÜRKSAT UYDU/, ticker: 'TURSAT' },

    // Retail
    { pattern: /BİM BİRLİK|BİM/, ticker: 'BIMAS' },
    { pattern: /A101|BAKKAL BÜYÜK/, ticker: 'AGHOL' },
    { pattern: /MİGROS/, ticker: 'MGROS' },

    // Construction
    { pattern: /ENKA İNŞAAT|ENKA/, ticker: 'ENKAI' },
    { pattern: /TEKSTEN|TEKSTEN İNŞAAT/, ticker: 'TKEN' },
    { pattern: /ARÇELİK|ARCELIK/, ticker: 'ARCLK' },
    { pattern: /VESTEL/, ticker: 'VESTL' },
    { pattern: /KOÇTAŞ|KOÇ TAŞ/, ticker: 'KOFAS' },

    // Energy
    { pattern: /TPAO|TÜRKİYE PETROLLERİ/, ticker: 'TPAO' },
    { pattern: /BOTAŞ|BORU HATTI/, ticker: 'BOTAS' },
    { pattern: /Aksa Enerji|AKSA ENERJİ/, ticker: 'AKSEN' },
    { pattern: /ENKA ENERJİ/, ticker: 'ENJSA' },

    // Mining
    { pattern: /EREĞLİ DEMİR|EREĞLİ/, ticker: 'EREGL' },
    { pattern: /KARDEMİR|KARABÜK DEMİR/, ticker: 'KRDMD' },
    { pattern: /KÜTAŞA|KÜTAHYA DEMİR/, ticker: 'KUTAS' },

    // Textile
    { pattern: /İŞKUR|İŞ KURUMU/, ticker: 'ISGYO' },
    { pattern: /SÜTAŞ|SÜT ÜRÜNLERİ/, ticker: 'SUTAS' },

    // Insurance
    { pattern: /AXA SİGORTA|AXA/, ticker: 'AXAGO' },
    { pattern: /ANADOLU SİGORTA|ANADOLU/, ticker: 'AFYON' },
    { pattern: /MAPFRE SİGORTA|MAPFRE/, ticker: 'MAPFR' }
  ];

  // Check each pattern
  for (const { pattern, ticker } of patterns) {
    if (pattern.test(name)) {
      console.log(`[Price Sync] Predicted ticker for "${companyName}": ${ticker}`);
      return ticker;
    }
  }

  // Try to extract ticker from common suffixes
  const suffixMatches = name.match(/(.*?)\s+(A\.Ş|SANAYİ|HOLDİNG|TİCARİ|ELEKTRİK|TEKSTİL|GIDA|BANKASI|OTOMOTİV|İNŞAAT|ENERJİ|DEMİR|PETROL|KİMYA|TEKNOLOJİ|TELEKOM|HABERLEŞME|ULAŞTIRMA|TURİZM|SİGORTA|FİNANS|LEASING|FAKTORİNG|MENKUL|GYO|YATIRIM|ORTAKLIĞI)$/);
  if (suffixMatches) {
    const baseName = suffixMatches[1].trim();
    const words = baseName.split(/\s+/);

    // Use first 3-5 characters of main words
    if (words.length >= 1) {
      const firstWord = words[0];
      const secondWord = words[1] || '';

      // Single word company - use first 4-5 chars
      if (!secondWord) {
        const ticker = firstWord.substring(0, Math.min(5, firstWord.length)).padEnd(4, '0');
        console.log(`[Price Sync] Generated ticker for "${companyName}": ${ticker}`);
        return ticker;
      }

      // Two words - combine
      const ticker = (firstWord.substring(0, 3) + secondWord.substring(0, 2)).padEnd(4, '0');
      console.log(`[Price Sync] Generated ticker for "${companyName}": ${ticker}`);
      return ticker;
    }
  }

  console.log(`[Price Sync] Could not predict ticker for "${companyName}"`);
  return null;
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
  const skipped = 0;

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
        let stockSymbol = asset.symbol;

        // If no symbol, try to predict from company name
        if (!stockSymbol) {
          stockSymbol = predictBISTTicker(asset.name);
          if (stockSymbol) {
            // Update the asset with the predicted symbol
            await db.update(assets)
              .set({ symbol: stockSymbol })
              .where(eq(assets.id, asset.id));
            console.log(`[Price Sync] Updated ${asset.name} with predicted symbol: ${stockSymbol}`);
          }
        }

        if (stockSymbol) {
          try {
            const stockData = await bistService.fetchStockPrice(stockSymbol);
            newPrice = stockData.currentPrice;
          } catch (error) {
            console.error(`[Price Sync] Failed to fetch price for ${asset.name} (${stockSymbol}):`, error);
            result.error = `Failed to fetch stock price: ${error instanceof Error ? error.message : 'Unknown error'}`;
            return result;
          }
        } else {
          result.error = 'No symbol available and could not predict from company name';
          return result;
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
        // Gold price from Yahoo Finance - use internal API path
        const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'http://localhost:3000';
        const goldUrl = `${baseUrl}/api/prices/latest?symbol=GOLD&type=COMMODITY`;
        console.log(`[Price Sync] Fetching gold price from: ${goldUrl}`);
        const goldResponse = await fetch(goldUrl, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'portfolio-sync-service'
          }
        });
        console.log(`[Price Sync] Gold response status: ${goldResponse.status}`);
        if (goldResponse.ok) {
          const goldData = await goldResponse.json();
          console.log(`[Price Sync] Gold data success:`, goldData.success);
          console.log(`[Price Sync] Gold data:`, JSON.stringify(goldData, null, 2));
          if (goldData.success) {
            newPrice = goldData.data.currentPrice;
            console.log(`[Price Sync] Gold price fetched: ${newPrice}`);
          } else {
            console.log(`[Price Sync] Gold data failed: ${goldData.error || 'Unknown error'}`);
          }
        } else {
          console.log(`[Price Sync] Gold HTTP error: ${goldResponse.status}`);
        }
        break;

      case 'SILVER':
        // Silver price from Yahoo Finance - use internal API path
        const silverUrl = `${baseUrl}/api/prices/latest?symbol=SILVER&type=COMMODITY`;
        console.log(`[Price Sync] Fetching silver price from: ${silverUrl}`);
        const silverResponse = await fetch(silverUrl, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'portfolio-sync-service'
          }
        });
        console.log(`[Price Sync] Silver response status: ${silverResponse.status}`);
        if (silverResponse.ok) {
          const silverData = await silverResponse.json();
          console.log(`[Price Sync] Silver data success:`, silverData.success);
          if (silverData.success) {
            newPrice = silverData.data.currentPrice;
            console.log(`[Price Sync] Silver price fetched: ${newPrice}`);
          } else {
            console.log(`[Price Sync] Silver data failed: ${silverData.error || 'Unknown error'}`);
          }
        } else {
          console.log(`[Price Sync] Silver HTTP error: ${silverResponse.status}`);
        }
        break;

      case 'CRYPTO':
        if (asset.symbol) {
          // Convert symbol to Yahoo format if needed
          let yahooSymbol = asset.symbol;
          if (!asset.symbol.includes('-')) {
            yahooSymbol = `${asset.symbol}-USD`;
          }

          const cryptoUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/prices/latest?symbol=${yahooSymbol}&type=CRYPTO`;
            const cryptoResponse = await fetch(cryptoUrl);
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
          const currencyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/prices/latest?symbol=${asset.symbol}&type=CURRENCY`;
          const currencyResponse = await fetch(currencyUrl);
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