/**
 * Gold Price Test API
 * 
 * GET /api/test/gold-price
 * Test Yahoo Finance gold price fetching with detailed logs
 */

import { NextResponse } from 'next/server';

export async function GET() {
    const logs: string[] = [];
    const startTime = Date.now();
    
    try {
        logs.push('🚀 [1/5] Starting gold price fetch...');
        logs.push(`⏰ Timestamp: ${new Date().toISOString()}`);
        
        // Step 1: Fetch from Yahoo Finance
        logs.push('📡 [2/5] Calling Yahoo Finance API for gold (GC=F)...');
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d`;
        logs.push(`🔗 URL: ${url}`);
        
        const fetchStart = Date.now();
        const response = await fetch(url);
        const fetchDuration = Date.now() - fetchStart;
        
        logs.push(`✅ [3/5] Yahoo Finance responded in ${fetchDuration}ms`);
        logs.push(`📊 Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            throw new Error(`Yahoo Finance API returned ${response.status}`);
        }
        
        // Step 2: Parse response
        logs.push('🔍 [4/5] Parsing JSON response...');
        const data = await response.json();
        
        if (!data?.chart?.result?.[0]) {
            logs.push('❌ Invalid response structure');
            throw new Error('Invalid Yahoo Finance response structure');
        }
        
        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators?.quote?.[0];
        
        logs.push('✅ Response structure is valid');
        logs.push(`📈 Raw data: ${JSON.stringify({
            symbol: meta.symbol,
            currency: meta.currency,
            regularMarketPrice: meta.regularMarketPrice,
            chartPreviousClose: meta.chartPreviousClose,
            regularMarketTime: meta.regularMarketTime
        }, null, 2)}`);
        
        // Step 3: Extract prices
        const currentPriceUSD = meta.regularMarketPrice;
        const previousCloseUSD = meta.chartPreviousClose;
        const changePercent = ((currentPriceUSD - previousCloseUSD) / previousCloseUSD) * 100;
        
        logs.push('💰 [5/5] Calculating TRY prices...');
        logs.push(`🔹 Gold Ounce (USD): $${currentPriceUSD.toFixed(2)}`);
        logs.push(`🔹 Previous Close: $${previousCloseUSD.toFixed(2)}`);
        logs.push(`🔹 Change: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`);
        
        // Fetch real USD/TRY rate from Yahoo Finance
        logs.push('💱 Fetching real-time USD/TRY rate...');
        let USD_TRY_RATE = 34; // Fallback
        
        try {
            const usdTryUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/TRY=X?interval=1d&range=1d';
            const usdTryResponse = await fetch(usdTryUrl);
            const usdTryData = await usdTryResponse.json();
            
            if (usdTryData?.chart?.result?.[0]?.meta?.regularMarketPrice) {
                USD_TRY_RATE = usdTryData.chart.result[0].meta.regularMarketPrice;
                logs.push(`✅ Real USD/TRY rate fetched: ${USD_TRY_RATE.toFixed(4)}`);
            } else {
                logs.push(`⚠️ Could not fetch USD/TRY rate, using fallback: ${USD_TRY_RATE}`);
            }
        } catch (error) {
            logs.push(`⚠️ USD/TRY fetch error, using fallback: ${USD_TRY_RATE}`);
        }
        
        // Convert to TRY (1 ounce = 31.1035 grams)
        const GRAMS_PER_OUNCE = 31.1035;
        
        const gramPriceTRY = (currentPriceUSD / GRAMS_PER_OUNCE) * USD_TRY_RATE;
        const previousGramTRY = (previousCloseUSD / GRAMS_PER_OUNCE) * USD_TRY_RATE;
        
        logs.push(`🔸 Grams per ounce: ${GRAMS_PER_OUNCE}`);
        logs.push(`💎 Gold Gram (TRY): ₺${gramPriceTRY.toFixed(2)}`);
        logs.push(`💎 Previous Gram: ₺${previousGramTRY.toFixed(2)}`);
        logs.push(`💎 Change Amount: ₺${(gramPriceTRY - previousGramTRY).toFixed(2)}`);
        
        const totalDuration = Date.now() - startTime;
        logs.push(`⏱️ Total duration: ${totalDuration}ms`);
        logs.push('✅ Gold price fetch successful!');
        
        return NextResponse.json({
            success: true,
            message: 'Gold price fetched successfully',
            logs,
            data: {
                ounce: {
                    currentPrice: currentPriceUSD,
                    previousClose: previousCloseUSD,
                    changeAmount: currentPriceUSD - previousCloseUSD,
                    changePercent: changePercent,
                    currency: 'USD',
                    market: 'COMEX (via Yahoo Finance)'
                },
                gram: {
                    currentPrice: gramPriceTRY,
                    previousClose: previousGramTRY,
                    changeAmount: gramPriceTRY - previousGramTRY,
                    changePercent: changePercent,
                    currency: 'TRY',
                    usdTryRate: USD_TRY_RATE,
                    gramsPerOunce: GRAMS_PER_OUNCE
                },
                timestamp: new Date().toISOString(),
                duration: totalDuration
            }
        });
        
    } catch (error) {
        const totalDuration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        logs.push(`❌ ERROR: ${errorMessage}`);
        logs.push(`⏱️ Failed after ${totalDuration}ms`);
        
        console.error('[Gold Price Test] Error:', error);
        
        return NextResponse.json({
            success: false,
            error: errorMessage,
            logs,
            duration: totalDuration
        }, { status: 500 });
    }
}
