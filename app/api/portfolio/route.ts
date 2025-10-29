import { NextRequest } from "next/server";
import { db, portfolios, assets, transactions } from "@/db";
import { requireAuth } from "@/lib/auth-utils";
import { eq, sum, count, and, inArray } from "drizzle-orm";

/**
 * GET /api/portfolio
 * Kullanıcının genel portföy özetini getirir
 */
export async function GET(request: NextRequest) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        // Kullanıcının portfolyo'larını al (şema uyumsuzluğuna dikkat)
        const userPortfolios = await db
            .select()
            .from(portfolios)
            .where(eq(portfolios.userId, session.user.id));

        // Eğer hiç portfolyo yoksa, varsayılan bir tane oluştur
        if (userPortfolios.length === 0) {
            const defaultPortfolio = await db
                .insert(portfolios)
                .values({
                    id: `portfolio_${Date.now()}_${Math.random()}`,
                    userId: session.user.id,
                    name: "Ana Portföy",
                    baseCurrency: "TRY"
                })
                .returning();

            userPortfolios.push(defaultPortfolio[0]);
        }

        // Kullanıcının varlıklarını al
        const userAssets = await db
            .select()
            .from(assets)
            .where(eq(assets.userId, session.user.id));

        // Eğer hiç asset yoksa boş sonuç döndür
        if (userAssets.length === 0) {
            return Response.json({
                success: true,
                data: {
                    totalValue: 0,
                    totalCost: 0,
                    totalProfitLoss: 0,
                    totalProfitLossPercent: 0,
                    totalRealizedPL: 0,
                    totalUnrealizedPL: 0,
                    totalAssets: 0,
                    currency: "TRY",
                    assets: []
                }
            });
        }

        // Asset ID'lerini al
        const assetIds = userAssets.map(asset => asset.id);

        // OPTIMIZATION: Tek sorgu ile tüm BUY transaction'ları çek (N+1 → 1)
        const allBuyTransactions = await db
            .select({
                assetId: transactions.assetId,
                totalQuantity: sum(transactions.quantity).mapWith(Number),
                totalAmount: sum(transactions.totalAmount).mapWith(Number),
                transactionCount: count(transactions.id).mapWith(Number)
            })
            .from(transactions)
            .where(and(
                inArray(transactions.assetId, assetIds),
                eq(transactions.transactionType, "BUY")
            ))
            .groupBy(transactions.assetId);

        // OPTIMIZATION: Tek sorgu ile tüm SELL transaction'ları çek (N+1 → 1)
        const allSellTransactions = await db
            .select({
                assetId: transactions.assetId,
                totalQuantity: sum(transactions.quantity).mapWith(Number),
                totalAmount: sum(transactions.totalAmount).mapWith(Number)
            })
            .from(transactions)
            .where(and(
                inArray(transactions.assetId, assetIds),
                eq(transactions.transactionType, "SELL")
            ))
            .groupBy(transactions.assetId);

        // Map'ler oluştur (O(1) lookup için)
        const buyMap = new Map(allBuyTransactions.map(t => [t.assetId, t]));
        const sellMap = new Map(allSellTransactions.map(t => [t.assetId, t]));

        // Her asset için hesaplamaları yap (artık memory'de)
        const assetSummary = userAssets.map(asset => {
            const buyData = buyMap.get(asset.id) || { totalQuantity: 0, totalAmount: 0, transactionCount: 0 };
            const sellData = sellMap.get(asset.id) || { totalQuantity: 0, totalAmount: 0 };

            const buyQuantity = buyData.totalQuantity || 0;
            const sellQuantity = sellData.totalQuantity || 0;
            const buyAmount = buyData.totalAmount || 0;
            const sellAmount = sellData.totalAmount || 0;

            const netQuantity = buyQuantity - sellQuantity;

            // Net maliyet = Kalan miktar × Ortalama alış fiyatı
            const averageBuyPrice = buyQuantity > 0 ? buyAmount / buyQuantity : 0;
            const netAmount = netQuantity * averageBuyPrice;
            const averagePrice = averageBuyPrice;

            // Gerçekleşen kar/zarar (Realized P&L)
            const realizedProfitLoss = sellQuantity > 0
                ? sellAmount - (sellQuantity * averageBuyPrice)
                : 0;

            // Mevcut değer hesapla
            let currentValue: number;
            if (netQuantity <= 0) {
                currentValue = 0;
            } else if (asset.currentPrice) {
                currentValue = parseFloat(asset.currentPrice.toString()) * netQuantity;
            } else {
                // Fiyat yoksa ortalama maliyeti kullan (geçici çözüm)
                console.log(`[Portfolio API] No current price for asset ${asset.name}, using average price`);
                currentValue = averagePrice * netQuantity;
            }

            // Gerçekleşmemiş kar/zarar (Unrealized P&L)
            const unrealizedProfitLoss = netQuantity > 0 && asset.currentPrice
                ? currentValue - netAmount
                : 0;

            // Toplam kar/zarar
            const totalProfitLoss = realizedProfitLoss + unrealizedProfitLoss;

            return {
                assetId: asset.id,
                assetName: asset.name,
                assetType: asset.assetType,
                netQuantity,
                netAmount,
                averagePrice,
                currentValue,
                realizedProfitLoss,
                unrealizedProfitLoss,
                totalProfitLoss,
                transactionCount: buyData.transactionCount || 0
            };
        });

        // Sadece holding'i olan asset'ları filtrele
        const activeAssets = assetSummary.filter(asset => asset.netQuantity > 0);

        // Portföy özetini hesapla
        const totalValue = activeAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
        const totalCost = activeAssets.reduce((sum, asset) => sum + asset.netAmount, 0);
        const totalRealizedPL = activeAssets.reduce((sum, asset) => sum + asset.realizedProfitLoss, 0);
        const totalUnrealizedPL = activeAssets.reduce((sum, asset) => sum + asset.unrealizedProfitLoss, 0);
        const totalAssets = activeAssets.length;

        return Response.json({
            success: true,
            data: {
                totalValue,
                totalCost,
                totalProfitLoss: totalRealizedPL + totalUnrealizedPL,
                totalProfitLossPercent: totalCost > 0 ? ((totalRealizedPL + totalUnrealizedPL) / totalCost) * 100 : 0,
                totalRealizedPL,
                totalUnrealizedPL,
                totalAssets,
                currency: "TRY",
                assets: activeAssets.map(asset => ({
                    id: asset.assetId,
                    name: asset.assetName,
                    assetType: asset.assetType,
                    holdings: {
                        netQuantity: asset.netQuantity,
                        netAmount: asset.netAmount,
                        averagePrice: asset.averagePrice,
                        currentValue: asset.currentValue,
                        profitLoss: asset.currentValue - asset.netAmount,
                        profitLossPercent: asset.netAmount > 0 ? ((asset.currentValue - asset.netAmount) / asset.netAmount) * 100 : 0,
                        totalTransactions: asset.transactionCount
                    }
                }))
            }
        });

    } catch (error) {
        console.error("Portfolio özeti alma hatası:", error);
        return Response.json(
            { success: false, error: "Portföy özeti alınırken hata oluştu: " + (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}

/**
 * POST /api/portfolio
 * Yeni portföy oluşturur
 */
export async function POST(request: NextRequest) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        const body = await request.json();
        
        // Validation basit - geliştirme için
        const { name, baseCurrency = "TRY" } = body;
        
        if (!name) {
            return Response.json(
                { success: false, error: "Portföy adı gereklidir" },
                { status: 400 }
            );
        }
        
        // Portföy'ü veritabanına ekle
        const newPortfolio = await db
            .insert(portfolios)
            .values({
                id: `portfolio_${Date.now()}_${Math.random()}`,
                userId: session.user.id,
                name: name,
                baseCurrency: baseCurrency,
            })
            .returning();

        return Response.json({
            success: true,
            message: "Portföy başarıyla oluşturuldu",
            data: newPortfolio[0]
        }, { status: 201 });

    } catch (error) {
        console.error("Portföy oluşturma hatası:", error);
        
        return Response.json(
            { success: false, error: "Portföy oluşturulurken hata oluştu: " + (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}
