import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test verileri - MiniPriceMonitor bileşeninin beklediği formatta
    const testResults = [
      {
        symbol: 'USD/TRY',
        success: true,
        data: {
          currentPrice: 34.25,
          currency: 'TRY'
        }
      },
      {
        symbol: 'EUR/TRY',
        success: true,
        data: {
          currentPrice: 37.12,
          currency: 'TRY'
        }
      },
      {
        symbol: 'GC=F',
        success: true,
        data: {
          gramTRY: 2458.50,
          currency: 'TRY'
        }
      },
      {
        symbol: 'SI=F',
        success: true,
        data: {
          gramTRY: 28.75,
          currency: 'TRY'
        }
      },
      {
        symbol: 'BTC-USD',
        success: true,
        data: {
          priceTRY: 2450000,
          currency: 'TRY'
        }
      }
    ];

    return NextResponse.json({
      success: true,
      results: testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test prices error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}