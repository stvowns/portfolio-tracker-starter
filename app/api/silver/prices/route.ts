/**
 * Silver Prices API
 *
 * GET /api/silver/prices
 * GET /api/silver/prices?type=ceyrek
 * GET /api/silver/prices?types=ceyrek,yarim,tam
 *
 * Returns calculated prices for different silver types based on gram price
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllSilverPrices, getSilverPrice, getSilverPrices, SILVER_TYPES } from '@/lib/services/gold-price-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const types = searchParams.get('types');

    let prices;

    if (type) {
      // Get specific silver type
      const price = await getSilverPrice(type);
      if (!price) {
        return NextResponse.json({
          success: false,
          error: `Silver type not found: ${type}`,
          availableTypes: SILVER_TYPES.map(g => g.id)
        }, { status: 400 });
      }
      prices = [price];
    } else if (types) {
      // Get multiple silver types
      const typeIds = types.split(',').map(t => t.trim());
      prices = await getSilverPrices(typeIds);
    } else {
      // Get all silver types
      prices = await getAllSilverPrices();
    }

    return NextResponse.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString(),
      count: prices.length
    });

  } catch (error) {
    console.error('[Silver Prices API] Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch silver prices',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}