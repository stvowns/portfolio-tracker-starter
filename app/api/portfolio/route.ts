import { NextRequest } from "next/server";
import { db, portfolios, assets, transactions } from "@/db";
import { requireAuth } from "@/lib/auth-utils";
import { eq, sum, count, and } from "drizzle-orm";

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

        // Her asset için holdings hesapla
        const assetSummary = await Promise.all(
            userAssets.map(async (asset) => {
                const buyTotal = await db
                    .select({
                        totalQuantity: sum(transactions.quantity).mapWith(Number),
                        totalAmount: sum(transactions.totalAmount).mapWith(Number),
                        transactionCount: count(transactions.id).mapWith(Number)
                    })
                    .from(transactions)
                    .where(and(
                        eq(transactions.assetId, asset.id),
                        eq(transactions.transactionType, "BUY")
                    ));

                const sellTotal = await db
                    .select({
                        totalQuantity: sum(transactions.quantity).mapWith(Number),
                        totalAmount: sum(transactions.totalAmount).mapWith(Number)
                    })
                    .from(transactions)
                    .where(and(
                        eq(transactions.assetId, asset.id),
                        eq(transactions.transactionType, "SELL")
                    ));

                const buyQuantity = buyTotal[0]?.totalQuantity || 0;
                const sellQuantity = sellTotal[0]?.totalQuantity || 0;
                const buyAmount = buyTotal[0]?.totalAmount || 0;
                const sellAmount = sellTotal[0]?.totalAmount || 0;

                const netQuantity = buyQuantity - sellQuantity;
                const netAmount = buyAmount - sellAmount;
                const averagePrice = netQuantity > 0 ? netAmount / netQuantity : 0;
                
                const currentValue = asset.currentPrice && netQuantity > 0 
                    ? parseFloat(asset.currentPrice) * netQuantity 
                    : netAmount;

                return {
                    assetId: asset.id,
                    assetName: asset.name,
                    assetType: asset.assetType,
                    netQuantity,
                    netAmount,
                    averagePrice,
                    currentValue,
                    transactionCount: buyTotal[0]?.transactionCount || 0
                };
            })
        );

        // Sadece holding'i olan asset'ları filtrele
        const activeAssets = assetSummary.filter(asset => asset.netQuantity > 0);

        // Portföy özetini hesapla
        const totalValue = activeAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
        const totalCost = activeAssets.reduce((sum, asset) => sum + asset.netAmount, 0);
        const totalAssets = activeAssets.length;

        return Response.json({
            success: true,
            data: {
                totalValue,
                totalCost,
                totalProfitLoss: totalValue - totalCost,
                totalProfitLossPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
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
            { success: false, error: "Portföy özeti alınırken hata oluştu: " + error.message },
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
            { success: false, error: "Portföy oluşturulurken hata oluştu: " + error.message },
            { status: 500 }
        );
    }
}
