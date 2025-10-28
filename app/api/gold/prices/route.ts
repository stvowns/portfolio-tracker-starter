/**
 * Gold Prices API
 *
 * GET /api/gold/prices
 * GET /api/gold/prices?type=ceyrek
 * GET /api/gold/prices?types=ceyrek,yarim,tam
 *
 * Returns calculated prices for different gold types based on gram price
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllGoldPrices, getGoldPrice, getGoldPrices, GOLD_TYPES } from '@/lib/services/gold-price-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const types = searchParams.get('types');

    let prices;

    if (type) {
      // Get specific gold type
      const price = await getGoldPrice(type);
      if (!price) {
        return NextResponse.json({
          success: false,
          error: `Gold type not found: ${type}`,
          availableTypes: GOLD_TYPES.map(g => g.id)
        }, { status: 400 });
      }
      prices = [price];
    } else if (types) {
      // Get multiple gold types
      const typeIds = types.split(',').map(t => t.trim());
      prices = await getGoldPrices(typeIds);
    } else {
      // Get all gold types
      prices = await getAllGoldPrices();
    }

    return NextResponse.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString(),
      count: prices.length
    });

  } catch (error) {
    console.error('[Gold Prices API] Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch gold prices',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}