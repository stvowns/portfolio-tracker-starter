/**
 * Latest Price API
 * 
 * GET /api/prices/latest?symbol=GARAN&type=STOCK
 * Get current/latest price for a ticker from Yahoo Finance
 */

import { NextRequest, NextResponse } from 'next/server';

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
        
        // Build Yahoo Finance symbol
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
