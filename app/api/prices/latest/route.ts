/**
 * Latest Price API
 * 
 * GET /api/prices/latest?symbol=GARAN&type=STOCK
 * Get current/latest price for a ticker from Yahoo Finance
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Format date for TEFAS API (DD.MM.YYYY)
 */
function formatDateForTEFAS(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Get TEFAS fund price from official TEFAS API
 * Falls back to GitHub API if official API is blocked
 */
async function getTEFASFundPrice(fundCode: string) {
    try {
        console.log(`[TEFAS Price] Fetching from official TEFAS API for ${fundCode} using new crawler...`);

        // Import and use the new TEFAS crawler
        const { TEFASCrawler } = await import('../../../../lib/services/tefas-crawler');
        const crawler = new TEFASCrawler();

        // Get today's data
        const funds = await crawler.fetch(new Date(), new Date(), fundCode);

        if (funds.length === 0) {
            throw new Error(`Fund ${fundCode} not found or no price data available for today`);
        }

        // Get the latest price data
        const latestData = funds[funds.length - 1];
        const currentPrice = latestData.price;

        // Get previous day's data for comparison
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const previousFunds = await crawler.fetch(yesterday, yesterday, fundCode);

        let previousClose = currentPrice;
        let changePercent = 0;

        if (previousFunds.length > 0) {
            previousClose = previousFunds[previousFunds.length - 1].price;
            changePercent = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
        }

        const changeAmount = currentPrice - previousClose;

        return NextResponse.json({
            success: true,
            data: {
                symbol: fundCode,
                name: latestData.name,
                currentPrice,
                previousClose,
                changeAmount,
                changePercent,
                currency: 'TRY',
                timestamp: new Date().toISOString(),
                source: 'tefas-official-v2'
            }
        });

    } catch (error) {
        console.error('[TEFAS Price API] Error:', error);

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
        if (assetType === 'FUND') {
            // TEFAS funds - fetch from TEFAS API
            return await getTEFASFundPrice(symbol);
        }
        
        // Build Yahoo Finance symbol for stocks
        let yahooSymbol = symbol;
        if (assetType === 'STOCK') {
            // BIST symbols need .IS suffix for Yahoo Finance
            yahooSymbol = `${symbol}.IS`;
        }
        
        console.log(`[Price API] Fetching price for ${yahooSymbol}...`);
        
        // Fetch from Yahoo Finance v8 API
        const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
        const response = await fetch(yahooUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            console.error(`[Price API] Yahoo Finance returned ${response.status}`);
            return NextResponse.json({
                success: false,
                error: `Failed to fetch price: ${response.statusText}`
            }, { status: response.status });
        }
        
        const data = await response.json();
        
        // Extract price data
        const result = data?.chart?.result?.[0];
        if (!result || !result.meta) {
            console.error('[Price API] Invalid response structure from Yahoo Finance');
            return NextResponse.json({
                success: false,
                error: 'Invalid price data received'
            }, { status: 500 });
        }
        
        const meta = result.meta;
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose || meta.previousClose;
        const currency = meta.currency || 'TRY';
        
        if (!currentPrice) {
            console.error('[Price API] No price data available');
            return NextResponse.json({
                success: false,
                error: 'Price data not available'
            }, { status: 404 });
        }
        
        const changeAmount = currentPrice - (previousClose || currentPrice);
        const changePercent = previousClose 
            ? ((currentPrice - previousClose) / previousClose) * 100 
            : 0;
        
        console.log(`[Price API] Success: ${yahooSymbol} = ${currentPrice} ${currency}`);
        
        return NextResponse.json({
            success: true,
            data: {
                symbol,
                yahooSymbol,
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
        console.error('[Price API] Error:', error);
        
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
