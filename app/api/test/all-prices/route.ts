import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test verileri - gerçek price API'sinden alınabilir
    const testResults = [
      { symbol: 'THYAO', price: 245.50, change: 2.5, changePercent: 1.02 },
      { symbol: 'AKBNK', price: 12.75, change: -0.15, changePercent: -1.17 },
      { symbol: 'GARAN', price: 38.90, change: 0.45, changePercent: 1.17 },
      { symbol: 'ISCTR', price: 5.82, change: 0.08, changePercent: 1.39 },
      { symbol: 'SASA', price: 18.65, change: -0.23, changePercent: -1.22 },
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