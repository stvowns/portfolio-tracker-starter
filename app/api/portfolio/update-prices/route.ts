import { NextRequest, NextResponse } from "next/server";
import { db, assets } from "@/db";
import { requireAuth } from "@/lib/auth-utils";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/portfolio/update-prices
 * Belirtilen varlık türlerinin fiyatlarını günceller
 */
export async function POST(request: NextRequest) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        const body = await request.json();
        const { assetTypes, updateAll } = body; // updateAll true ise tüm varlıkları güncelle
        
        if (!updateAll && (!assetTypes || !Array.isArray(assetTypes))) {
            return NextResponse.json(
                { success: false, error: "assetTypes array is required or set updateAll to true" },
                { status: 400 }
            );
        }
        
        const results = [];
        
        // Eğer updateAll true ise, tüm varlık türlerini güncelle
        const typesToUpdate = updateAll ?
            ["GOLD", "SILVER", "CRYPTO", "STOCK", "FUND", "EUROBOND", "ETF"] :
            assetTypes;
        
        for (const assetType of typesToUpdate) {
        // Kullanıcının bu türdeki varlıklarını getir
        const userAssets = await db
            .select()
            .from(assets)
            .where(and(
                eq(assets.userId, session.user.id),
                eq(assets.assetType, assetType)
            ));
        
        for (const asset of userAssets) {
            try {
                // Güncel fiyatı çek
                let symbol = "";
                let priceType = "";
                
                if (assetType === "GOLD") {
                    symbol = "GOLD";
                    priceType = "COMMODITY";
                } else if (assetType === "SILVER") {
                    symbol = "SILVER";
                    priceType = "COMMODITY";
                } else if (assetType === "CRYPTO") {
                    // Kripto için symbol'ı belirle
                    if (asset.name.toLowerCase().includes("bitcoin")) {
                        symbol = "BTC";
                    } else if (asset.name.toLowerCase().includes("ethereum")) {
                        symbol = "ETH";
                    } else if (asset.symbol) {
                        symbol = asset.symbol.replace("-USD", "").replace("USD", "");
                    } else {
                        symbol = asset.name.toUpperCase();
                    }
                    priceType = "CRYPTO";
                } else {
                    symbol = asset.symbol || "";
                    priceType = "STOCK";
                }
                
                if (!symbol) continue;
                    const marketPriceResponse = await fetch(
                        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/prices/latest?symbol=${symbol}&type=${priceType}`
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
        }
        
        return NextResponse.json({
            success: true,
            message: "Fiyat güncelleme tamamlandı",
            data: {
                updated: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results
            }
        });
        
    } catch (error) {
        console.error("Price update error:", error);
        return NextResponse.json(
            { success: false, error: "Fiyat güncellenirken hata oluştu" },
            { status: 500 }
        );
    }
}