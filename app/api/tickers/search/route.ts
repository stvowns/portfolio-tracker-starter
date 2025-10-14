/**
 * Ticker Search API Endpoint
 * 
 * GET /api/tickers/search?q=GARAN&type=STOCK&limit=10
 * Search cached tickers for autocomplete
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tickerCache } from '@/db/schema/price-cache';
import { eq, and, or, like, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q')?.trim();
        const assetType = searchParams.get('type'); // 'STOCK', 'FUND', or null for all
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 20;
        
        // Validate query length (minimum 2 characters)
        if (!query || query.length < 2) {
            return NextResponse.json({
                success: false,
                error: 'Query must be at least 2 characters',
                data: []
            }, { status: 400 });
        }
        
        // Build search conditions
        const conditions = [];
        
        // Asset type filter
        if (assetType && (assetType === 'STOCK' || assetType === 'FUND')) {
            conditions.push(eq(tickerCache.assetType, assetType));
        }
        
        // Search in symbol and name (case-insensitive)
        const searchPattern = `%${query}%`;
        const searchConditions = or(
            like(sql`UPPER(${tickerCache.symbol})`, searchPattern.toUpperCase()),
            like(sql`UPPER(${tickerCache.name})`, searchPattern.toUpperCase())
        );
        
        if (searchConditions) {
            conditions.push(searchConditions);
        }
        
        // Execute search
        const results = await db.select({
            id: tickerCache.id,
            assetType: tickerCache.assetType,
            symbol: tickerCache.symbol,
            name: tickerCache.name,
            city: tickerCache.city,
            category: tickerCache.category,
            lastUpdated: tickerCache.lastUpdated
        })
            .from(tickerCache)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .limit(Math.min(limit, 50)) // Cap at 50 results
            .orderBy(tickerCache.symbol);
        
        // Calculate relevance score (exact matches first)
        const scored = results.map(result => {
            const queryUpper = query.toUpperCase();
            const symbolUpper = result.symbol.toUpperCase();
            const nameUpper = result.name.toUpperCase();
            
            let score = 0;
            
            // Exact symbol match (highest priority)
            if (symbolUpper === queryUpper) {
                score = 100;
            }
            // Symbol starts with query
            else if (symbolUpper.startsWith(queryUpper)) {
                score = 80;
            }
            // Symbol contains query
            else if (symbolUpper.includes(queryUpper)) {
                score = 60;
            }
            // Name starts with query
            else if (nameUpper.startsWith(queryUpper)) {
                score = 40;
            }
            // Name contains query
            else if (nameUpper.includes(queryUpper)) {
                score = 20;
            }
            
            return {
                ...result,
                relevanceScore: score
            };
        });
        
        // Sort by relevance score (descending)
        scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        // Remove relevance score from response
        const finalResults = scored.map(({ relevanceScore, ...rest }) => rest);
        
        return NextResponse.json({
            success: true,
            data: finalResults,
            meta: {
                query,
                asset_type: assetType || 'ALL',
                count: finalResults.length,
                limit
            }
        });
        
    } catch (error) {
        console.error('[Ticker Search API] Error:', error);
        
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: []
        }, { status: 500 });
    }
}
