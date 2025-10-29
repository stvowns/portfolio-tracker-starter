/**
 * Latest Price API
 *
 * GET /api/prices/latest?symbol=GARAN&type=STOCK
 * GET /api/prices/latest?symbol=YKT&type=FUND
 * GET /api/prices/latest?symbol=GOLD&type=COMMODITY
 * GET /api/prices/latest?symbol=USDTRY&type=CURRENCY
 *
 * Supports: STOCK, FUND, COMMODITY, CURRENCY, CRYPTO
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Get TEFAS fund price from TEFAS service
 */
async function getTEFASFundPrice(fundCode: string) {
    try {
        console.log(`[TEFAS Price] Fetching price for ${fundCode}...`);
        const { tefasService } = await import('../../../../lib/services/tefas-service');
        const fundPrice = await tefasService.fetchFundPrice(fundCode);

        return NextResponse.json({
            success: true,
            data: fundPrice
        });

    } catch (error) {
        console.error('[TEFAS Price API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * Get BIST stock price from BIST service
 */
async function getBISTStockPrice(symbol: string) {
    try {
        console.log(`[BIST Price] Fetching price for ${symbol}...`);
        const { bistService } = await import('../../../../lib/services/bist-service');
        const stockPrice = await bistService.fetchStockPrice(symbol);

        return NextResponse.json({
            success: true,
            data: stockPrice
        });

    } catch (error) {
        console.error('[BIST Price API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * Get Gold price from Yahoo Finance
 */
async function getGoldPrice() {
    try {
        console.log('[Gold Price] Fetching gold price...');

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

        // Fetch gold price
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d';
        const response = await fetch(url);
        const data = await response.json();

        if (!data?.chart?.result?.[0]) {
            throw new Error('Invalid response structure from Yahoo Finance');
        }

        const result = data.chart.result[0];
        const meta = result.meta;

        const currentPriceUSD = meta.regularMarketPrice;
        const previousCloseUSD = meta.chartPreviousClose;
        const changePercent = ((currentPriceUSD - previousCloseUSD) / previousCloseUSD) * 100;

        // Convert to TRY (1 ounce = 31.1035 grams)
        const GRAMS_PER_OUNCE = 31.1035;
        const gramPriceTRY = (currentPriceUSD / GRAMS_PER_OUNCE) * usdTryRate;
        const previousGramTRY = (previousCloseUSD / GRAMS_PER_OUNCE) * usdTryRate;

        return NextResponse.json({
            success: true,
            data: {
                symbol: 'GOLD',
                name: 'Altın',
                currentPrice: gramPriceTRY,
                previousClose: previousGramTRY,
                changeAmount: gramPriceTRY - previousGramTRY,
                changePercent,
                currency: 'TRY',
                timestamp: new Date().toISOString(),
                source: 'yahoo-finance',
                metadata: {
                    ounceUSD: currentPriceUSD,
                    usdTryRate: usdTryRate,
                    gramsPerOunce: GRAMS_PER_OUNCE
                }
            }
        });

    } catch (error) {
        console.error('[Gold Price API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * Get Silver price from Yahoo Finance
 */
async function getSilverPrice() {
    try {
        console.log('[Silver Price] Fetching silver price...');

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

        // Fetch silver price
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/SI=F?interval=1d&range=1d';
        const response = await fetch(url);
        const data = await response.json();

        if (!data?.chart?.result?.[0]) {
            throw new Error('Invalid response structure from Yahoo Finance');
        }

        const result = data.chart.result[0];
        const meta = result.meta;

        const currentPriceUSD = meta.regularMarketPrice;
        const previousCloseUSD = meta.chartPreviousClose;
        const changePercent = ((currentPriceUSD - previousCloseUSD) / previousCloseUSD) * 100;

        // Convert to TRY (1 ounce = 31.1035 grams)
        const GRAMS_PER_OUNCE = 31.1035;
        const gramPriceTRY = (currentPriceUSD / GRAMS_PER_OUNCE) * usdTryRate;
        const previousGramTRY = (previousCloseUSD / GRAMS_PER_OUNCE) * usdTryRate;

        return NextResponse.json({
            success: true,
            data: {
                symbol: 'SILVER',
                name: 'Gümüş',
                currentPrice: gramPriceTRY,
                previousClose: previousGramTRY,
                changeAmount: gramPriceTRY - previousGramTRY,
                changePercent,
                currency: 'TRY',
                timestamp: new Date().toISOString(),
                source: 'yahoo-finance',
                metadata: {
                    ounceUSD: currentPriceUSD,
                    usdTryRate: usdTryRate,
                    gramsPerOunce: GRAMS_PER_OUNCE
                }
            }
        });

    } catch (error) {
        console.error('[Silver Price API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * Get Currency price from Yahoo Finance
 */
async function getCurrencyPrice(symbol: string) {
    try {
        console.log(`[Currency Price] Fetching price for ${symbol}...`);

        let yahooSymbol = symbol;
        const currency = 'TRY';
        let name = '';

        // Handle common currency pairs
        switch (symbol.toUpperCase()) {
            case 'USDTRY':
                yahooSymbol = 'TRY=X';
                name = 'ABD Doları / Türk Lirası';
                break;
            case 'EURTRY':
                yahooSymbol = 'EURTRY=X';
                name = 'Euro / Türk Lirası';
                break;
            case 'GBPTRY':
                yahooSymbol = 'GBPTRY=X';
                name = 'İngiliz Sterlini / Türk Lirası';
                break;
            default:
                throw new Error(`Unsupported currency pair: ${symbol}`);
        }

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data?.chart?.result?.[0]) {
            throw new Error('Invalid response structure from Yahoo Finance');
        }

        const result = data.chart.result[0];
        const meta = result.meta;

        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose;
        const changeAmount = currentPrice - previousClose;
        const changePercent = (changeAmount / previousClose) * 100;

        return NextResponse.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                name,
                currentPrice,
                previousClose,
                changeAmount,
                changePercent,
                currency,
                timestamp: new Date().toISOString(),
                source: 'yahoo-finance'
            }
        });

    } catch (error) {
        console.error('[Currency Price API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * Get Crypto price from Yahoo Finance
 */
async function getCryptoPrice(symbol: string) {
    try {
        console.log(`[Crypto Price] Fetching price for ${symbol}...`);

        let yahooSymbol = symbol;
        let name = '';

        // Handle common crypto symbols
        switch (symbol.toUpperCase()) {
            case 'BTC':
            case 'BTCUSD':
                yahooSymbol = 'BTC-USD';
                name = 'Bitcoin';
                break;
            case 'ETH':
            case 'ETHUSD':
                yahooSymbol = 'ETH-USD';
                name = 'Ethereum';
                break;
            default:
                // If symbol already has -USD format, use as is
                if (!symbol.includes('-')) {
                    yahooSymbol = `${symbol}-USD`;
                }
                name = symbol.toUpperCase();
        }

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data?.chart?.result?.[0]) {
            throw new Error('Invalid response structure from Yahoo Finance');
        }

        const result = data.chart.result[0];
        const meta = result.meta;

        const currentPriceUSD = meta.regularMarketPrice;
        const previousCloseUSD = meta.chartPreviousClose;
        const changePercent = ((currentPriceUSD - previousCloseUSD) / previousCloseUSD) * 100;

        // Fetch USD/TRY rate for conversion
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

        const currentPriceTRY = currentPriceUSD * usdTryRate;
        const previousCloseTRY = previousCloseUSD * usdTryRate;

        return NextResponse.json({
            success: true,
            data: {
                symbol: symbol.toUpperCase(),
                name,
                currentPrice: currentPriceTRY,
                previousClose: previousCloseTRY,
                changeAmount: currentPriceTRY - previousCloseTRY,
                changePercent,
                currency: 'TRY',
                timestamp: new Date().toISOString(),
                source: 'yahoo-finance',
                metadata: {
                    priceUSD: currentPriceUSD,
                    usdTryRate: usdTryRate
                }
            }
        });

    } catch (error) {
        console.error('[Crypto Price API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const symbol = searchParams.get('symbol');
        const assetType = searchParams.get('type');
        
        if (!symbol) {
            return NextResponse.json({
                success: false,
                error: 'Symbol parameter is required'
            }, { status: 400 });
        }
        
        // Handle different asset types
        switch (assetType?.toUpperCase()) {
            case 'FUND':
                // TEFAS funds - fetch from TEFAS service
                return await getTEFASFundPrice(symbol);

            case 'STOCK':
                // BIST stocks - fetch from BIST service
                return await getBISTStockPrice(symbol);

            case 'COMMODITY':
                // Handle commodities (Gold, Silver)
                if (symbol.toUpperCase() === 'GOLD') {
                    return await getGoldPrice();
                } else if (symbol.toUpperCase() === 'SILVER') {
                    return await getSilverPrice();
                } else {
                    return NextResponse.json({
                        success: false,
                        error: `Unsupported commodity: ${symbol}. Supported: GOLD, SILVER`
                    }, { status: 400 });
                }

            case 'CURRENCY':
                // Handle currency pairs
                return await getCurrencyPrice(symbol);

            case 'CRYPTO':
                // Handle cryptocurrencies
                return await getCryptoPrice(symbol);

            default:
                return NextResponse.json({
                    success: false,
                    error: `Invalid or missing asset type. Supported types: STOCK, FUND, COMMODITY, CURRENCY, CRYPTO`
                }, { status: 400 });
        }
        
    } catch (error) {
        console.error('[Price API] Error:', error);
        
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
