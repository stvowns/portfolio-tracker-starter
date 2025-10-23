import { NextRequest, NextResponse } from 'next/server';
import { db, assets } from "@/db";
import { requireAuth } from "@/lib/auth-utils";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        // Kullanıcının TEFAS varlıklarını getir
        const tefasAssets = await db
            .select()
            .from(assets)
            .where(and(
                eq(assets.userId, session.user.id),
                eq(assets.assetType, "FUND")
            ));
        
        const results = [];
        
        for (const asset of tefasAssets) {
            try {
                // TEFAS fon fiyatını çek
                const symbol = asset.symbol || asset.name;
                const marketPriceResponse = await fetch(
                    `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/prices/latest?symbol=${symbol}&type=FUND`
                );
                
                if (marketPriceResponse.ok) {
                    const marketData = await marketPriceResponse.json();
                    if (marketData.success && marketData.data?.currentPrice) {
                        // Asset'i güncelle
                        await db.update(assets).set({
                            currentPrice: marketData.data.currentPrice,
                            lastUpdated: new Date()
                        }).where(eq(assets.id, asset.id));
                        
                        results.push({
                            assetId: asset.id,
                            assetName: asset.name,
                            symbol: symbol,
                            oldPrice: asset.currentPrice,
                            newPrice: marketData.data.currentPrice,
                            success: true
                        });
                    }
                }
            } catch (error) {
                console.error(`Failed to update price for ${asset.name}:`, error);
                results.push({
                    assetId: asset.id,
                    assetName: asset.name,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        
        return NextResponse.json({
            success: true,
            data: {
                updated: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results
            }
        });
    } catch (error) {
        console.error('TEFAS assets update error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}