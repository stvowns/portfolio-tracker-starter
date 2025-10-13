import { NextRequest } from "next/server";
import { db, portfolios, assets, transactions } from "@/db";
import { requireAuth } from "@/lib/auth-utils";
import { eq, sum, count } from "drizzle-orm";

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

        // Kullanıcının varlıklarını ve işlem özetini al
        const assetSummary = await db
            .select({
                assetId: assets.id,
                assetName: assets.name,
                assetType: assets.assetType,
                totalQuantity: sum(transactions.quantity).mapWith(Number),
                totalAmount: sum(transactions.totalAmount).mapWith(Number),
                transactionCount: count(transactions.id).mapWith(Number),
            })
            .from(assets)
            .leftJoin(transactions, eq(transactions.assetId, assets.id))
            .where(eq(assets.userId, session.user.id))
            .groupBy(assets.id, assets.name, assets.assetType);

        // Portföy özetini hesapla
        const totalValue = 0; // Şimdilik 0, sonradan gerçek fiyatlarla hesaplanır
        const totalCost = assetSummary.reduce((sum, asset) => sum + (asset.totalAmount || 0), 0);
        const totalAssets = assetSummary.length;

        return Response.json({
            success: true,
            data: {
                totalValue,
                totalCost,
                totalProfitLoss: totalValue - totalCost,
                totalProfitLossPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
                totalAssets,
                currency: "TRY",
                assets: assetSummary.map(asset => ({
                    id: asset.assetId,
                    name: asset.assetName,
                    assetType: asset.assetType,
                    holdings: {
                        netQuantity: asset.totalQuantity || 0,
                        netAmount: asset.totalAmount || 0,
                        averagePrice: asset.totalQuantity && asset.totalQuantity > 0 ? (asset.totalAmount || 0) / asset.totalQuantity : 0,
                        currentValue: 0, // Şimdilik 0
                        profitLoss: 0,
                        profitLossPercent: 0,
                        totalTransactions: asset.transactionCount || 0
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
