/**
 * All Asset Prices Test API
 * 
 * GET /api/test/all-prices
 * Test all asset categories with real Yahoo Finance data
 */

import { NextResponse } from 'next/server';

interface TestResult {
    category: string;
    symbol: string;
    description: string;
    success: boolean;
    data?: any;
    error?: string;
    logs: string[];
    duration: number;
}

/**
 * Test USD/TRY Exchange Rate
 */
async function testUSDTRY(): Promise<TestResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    
    try {
        logs.push('🔄 Testing USD/TRY currency pair...');
        logs.push('📡 Source: Yahoo Finance (TRY=X)');
        
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/TRY=X?interval=1d&range=1d';
        logs.push(`🔗 URL: ${url}`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data?.chart?.result?.[0]) {
            throw new Error('Invalid response structure');
        }
        
        const result = data.chart.result[0];
        const meta = result.meta;
        
        const currentRate = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose;
        const change = currentRate - previousClose;
        const changePercent = (change / previousClose) * 100;
        
        logs.push(`✅ Current Rate: ${currentRate.toFixed(4)} TRY`);
        logs.push(`📊 Previous: ${previousClose.toFixed(4)}`);
        logs.push(`📈 Change: ${change >= 0 ? '+' : ''}${change.toFixed(4)} (${changePercent.toFixed(2)}%)`);
        
        return {
            category: 'Currency',
            symbol: 'USD/TRY',
            description: 'US Dollar to Turkish Lira exchange rate',
            success: true,
            data: {
                currentPrice: currentRate,
                previousClose,
                changeAmount: change,
                changePercent,
                currency: 'TRY'
            },
            logs,
            duration: Date.now() - startTime
        };
    } catch (error) {
        logs.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return {
            category: 'Currency',
            symbol: 'USD/TRY',
            description: 'US Dollar to Turkish Lira exchange rate',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            logs,
            duration: Date.now() - startTime
        };
    }
}

/**
 * Test Gold Price (Ounce & Gram)
 */
async function testGold(): Promise<TestResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    
    try {
        logs.push('🏆 Testing Gold price...');
        logs.push('📡 Source: Yahoo Finance (GC=F - Gold Futures)');
        
        // Get USD/TRY rate first
        logs.push('💱 Step 1: Fetching USD/TRY rate...');
        const usdTryUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/TRY=X?interval=1d&range=1d';
        const usdTryResponse = await fetch(usdTryUrl);
        const usdTryData = await usdTryResponse.json();
        const usdTryRate = usdTryData?.chart?.result?.[0]?.meta?.regularMarketPrice || 34;
        logs.push(`✅ USD/TRY: ${usdTryRate.toFixed(4)}`);
        
        // Get gold ounce price
        logs.push('🥇 Step 2: Fetching gold ounce price (USD)...');
        const goldUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d';
        const response = await fetch(goldUrl);
        const data = await response.json();
        
        if (!data?.chart?.result?.[0]) {
            throw new Error('Invalid gold data');
        }
        
        const result = data.chart.result[0];
        const meta = result.meta;
        
        const ounceUSD = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose;
        const changePercent = ((ounceUSD - previousClose) / previousClose) * 100;
        
        logs.push(`✅ Ounce (USD): $${ounceUSD.toFixed(2)}`);
        
        // Convert to gram TRY
        logs.push('🔄 Step 3: Converting to gram (TRY)...');
        const GRAMS_PER_OUNCE = 31.1035;
        const gramTRY = (ounceUSD / GRAMS_PER_OUNCE) * usdTryRate;
        logs.push(`📐 Formula: ($${ounceUSD.toFixed(2)} ÷ ${GRAMS_PER_OUNCE}) × ${usdTryRate.toFixed(4)}`);
        logs.push(`✅ Gram (TRY): ₺${gramTRY.toFixed(2)}`);
        logs.push(`📊 Change: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`);
        
        return {
            category: 'Commodity',
            symbol: 'GC=F',
            description: 'Gold (Troy Ounce → Gram TRY conversion)',
            success: true,
            data: {
                ounceUSD,
                gramTRY,
                previousClose: (previousClose / GRAMS_PER_OUNCE) * usdTryRate,
                changePercent,
                usdTryRate,
                gramsPerOunce: GRAMS_PER_OUNCE
            },
            logs,
            duration: Date.now() - startTime
        };
    } catch (error) {
        logs.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return {
            category: 'Commodity',
            symbol: 'GC=F',
            description: 'Gold price',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            logs,
            duration: Date.now() - startTime
        };
    }
}

/**
 * Test Silver Price
 */
async function testSilver(): Promise<TestResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    
    try {
        logs.push('🥈 Testing Silver price...');
        logs.push('📡 Source: Yahoo Finance (SI=F - Silver Futures)');
        
        // Get USD/TRY rate
        const usdTryUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/TRY=X?interval=1d&range=1d';
        const usdTryResponse = await fetch(usdTryUrl);
        const usdTryData = await usdTryResponse.json();
        const usdTryRate = usdTryData?.chart?.result?.[0]?.meta?.regularMarketPrice || 34;
        
        // Get silver price
        const silverUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/SI=F?interval=1d&range=1d';
        const response = await fetch(silverUrl);
        const data = await response.json();
        
        if (!data?.chart?.result?.[0]) {
            throw new Error('Invalid silver data');
        }
        
        const result = data.chart.result[0];
        const meta = result.meta;
        
        const ounceUSD = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose;
        const changePercent = ((ounceUSD - previousClose) / previousClose) * 100;
        
        const GRAMS_PER_OUNCE = 31.1035;
        const gramTRY = (ounceUSD / GRAMS_PER_OUNCE) * usdTryRate;
        
        logs.push(`✅ Ounce (USD): $${ounceUSD.toFixed(2)}`);
        logs.push(`✅ Gram (TRY): ₺${gramTRY.toFixed(2)}`);
        logs.push(`📊 Change: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`);
        
        return {
            category: 'Commodity',
            symbol: 'SI=F',
            description: 'Silver (Troy Ounce → Gram TRY conversion)',
            success: true,
            data: {
                ounceUSD,
                gramTRY,
                changePercent,
                usdTryRate
            },
            logs,
            duration: Date.now() - startTime
        };
    } catch (error) {
        logs.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return {
            category: 'Commodity',
            symbol: 'SI=F',
            description: 'Silver price',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            logs,
            duration: Date.now() - startTime
        };
    }
}

/**
 * Test Bitcoin Price
 */
async function testBitcoin(): Promise<TestResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    
    try {
        logs.push('₿ Testing Bitcoin price...');
        logs.push('📡 Source: Yahoo Finance (BTC-USD)');
        
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?interval=1d&range=1d';
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data?.chart?.result?.[0]) {
            throw new Error('Invalid Bitcoin data');
        }
        
        const result = data.chart.result[0];
        const meta = result.meta;
        
        const priceUSD = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose;
        const changePercent = ((priceUSD - previousClose) / previousClose) * 100;
        
        // Convert to TRY
        const usdTryUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/TRY=X?interval=1d&range=1d';
        const usdTryResponse = await fetch(usdTryUrl);
        const usdTryData = await usdTryResponse.json();
        const usdTryRate = usdTryData?.chart?.result?.[0]?.meta?.regularMarketPrice || 34;
        
        const priceTRY = priceUSD * usdTryRate;
        
        logs.push(`✅ Price (USD): $${priceUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        logs.push(`✅ Price (TRY): ₺${priceTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`);
        logs.push(`📊 Change: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`);
        
        return {
            category: 'Crypto',
            symbol: 'BTC-USD',
            description: 'Bitcoin (USD → TRY conversion)',
            success: true,
            data: {
                priceUSD,
                priceTRY,
                changePercent,
                usdTryRate
            },
            logs,
            duration: Date.now() - startTime
        };
    } catch (error) {
        logs.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return {
            category: 'Crypto',
            symbol: 'BTC-USD',
            description: 'Bitcoin price',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            logs,
            duration: Date.now() - startTime
        };
    }
}

/**
 * Test BIST Stock (Turkish Stock Market)
 */
async function testBISTStock(): Promise<TestResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    
    try {
        logs.push('📈 Testing BIST stock...');
        logs.push('📡 Source: Yahoo Finance (THYAO.IS - Turkish Airlines)');
        logs.push('ℹ️ Note: .IS suffix for BIST (Borsa Istanbul)');
        
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/THYAO.IS?interval=1d&range=1d';
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data?.chart?.result?.[0]) {
            throw new Error('Invalid stock data');
        }
        
        const result = data.chart.result[0];
        const meta = result.meta;
        
        const price = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose;
        const changePercent = ((price - previousClose) / previousClose) * 100;
        
        logs.push(`✅ Price: ₺${price.toFixed(2)}`);
        logs.push(`📊 Previous: ₺${previousClose.toFixed(2)}`);
        logs.push(`📈 Change: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`);
        logs.push(`💼 Market: BIST (Borsa Istanbul)`);
        
        return {
            category: 'Stock',
            symbol: 'THYAO.IS',
            description: 'Turkish Airlines (BIST stock example)',
            success: true,
            data: {
                price,
                previousClose,
                changePercent,
                currency: 'TRY',
                market: 'BIST'
            },
            logs,
            duration: Date.now() - startTime
        };
    } catch (error) {
        logs.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return {
            category: 'Stock',
            symbol: 'THYAO.IS',
            description: 'BIST stock price',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            logs,
            duration: Date.now() - startTime
        };
    }
}

/**
 * Test EUR/TRY Exchange Rate
 */
async function testEURTRY(): Promise<TestResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    
    try {
        logs.push('💶 Testing EUR/TRY currency pair...');
        logs.push('📡 Source: Yahoo Finance (EURTRY=X)');
        
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/EURTRY=X?interval=1d&range=1d';
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data?.chart?.result?.[0]) {
            throw new Error('Invalid EUR/TRY data');
        }
        
        const result = data.chart.result[0];
        const meta = result.meta;
        
        const currentRate = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose;
        const changePercent = ((currentRate - previousClose) / previousClose) * 100;
        
        logs.push(`✅ Current Rate: ${currentRate.toFixed(4)} TRY`);
        logs.push(`📊 Change: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`);
        
        return {
            category: 'Currency',
            symbol: 'EUR/TRY',
            description: 'Euro to Turkish Lira exchange rate',
            success: true,
            data: {
                currentPrice: currentRate,
                previousClose,
                changePercent,
                currency: 'TRY'
            },
            logs,
            duration: Date.now() - startTime
        };
    } catch (error) {
        logs.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        return {
            category: 'Currency',
            symbol: 'EUR/TRY',
            description: 'Euro to TRY exchange rate',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            logs,
            duration: Date.now() - startTime
        };
    }
}

/**
 * Main handler - Run all tests
 */
export async function GET() {
    const startTime = Date.now();
    
    try {
        console.log('🚀 Running all asset price tests...');
        
        // Run all tests in parallel for speed
        const [
            usdTryResult,
            goldResult,
            silverResult,
            bitcoinResult,
            stockResult,
            eurTryResult
        ] = await Promise.all([
            testUSDTRY(),
            testGold(),
            testSilver(),
            testBitcoin(),
            testBISTStock(),
            testEURTRY()
        ]);
        
        const results = [
            usdTryResult,
            eurTryResult,
            goldResult,
            silverResult,
            bitcoinResult,
            stockResult
        ];
        
        const totalDuration = Date.now() - startTime;
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        
        return NextResponse.json({
            success: true,
            summary: {
                total: results.length,
                successful: successCount,
                failed: failCount,
                duration: totalDuration
            },
            results
        });
        
    } catch (error) {
        console.error('[All Prices Test] Error:', error);
        
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
