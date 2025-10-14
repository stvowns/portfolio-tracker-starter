import { NextRequest } from "next/server";
import { db, assets, transactions, portfolios } from "@/db";
import { requireAuth } from "@/lib/auth-utils";
import { 
    CreateAssetSchema, 
    AssetListQuerySchema,
    AssetListQuery 
} from "@/lib/validations/portfolio";
import { eq, and, sum, count, sql } from "drizzle-orm";
import { generateId } from "@/lib/utils";

/**
 * GET /api/portfolio/assets
 * Kullanıcının varlıklarını mevcut holdingleri ile birlikte listeler
 */
export async function GET(request: NextRequest) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        const { searchParams } = new URL(request.url);
        
        // Query parametrelerini parse et
        const queryParams: Partial<AssetListQuery> = {
            assetType: (searchParams.get("assetType") as "GOLD" | "SILVER" | "STOCK" | "FUND" | "CRYPTO" | "EUROBOND") || undefined,
            portfolioId: searchParams.get("portfolioId") || undefined,
            page: Number(searchParams.get("page")) || 1,
            limit: Number(searchParams.get("limit")) || 20,
        };

        // Validation
        const validatedQuery = AssetListQuerySchema.parse(queryParams);
        
        // Query conditions oluştur
        const whereConditions = [eq(assets.userId, session.user.id)];
        
        if (validatedQuery.assetType) {
            whereConditions.push(eq(assets.assetType, validatedQuery.assetType));
        }
        
        if (validatedQuery.portfolioId) {
            whereConditions.push(eq(assets.portfolioId, validatedQuery.portfolioId));
        }

        // Sayfalama için offset hesapla
        const offset = (validatedQuery.page - 1) * validatedQuery.limit;
        
        // Assets'ları transaction summaries ile birlikte getir
        const userAssets = await db
            .select({
                id: assets.id,
                name: assets.name,
                symbol: assets.symbol,
                assetType: assets.assetType,
                category: assets.category,
                currency: assets.currency,
                currentPrice: assets.currentPrice,
                lastUpdated: assets.lastUpdated,
                createdAt: assets.createdAt,
                // Transaction summaries
                totalBuyQuantity: sum(transactions.quantity).mapWith(Number),
                totalBuyAmount: sum(transactions.totalAmount).mapWith(Number),
                transactionCount: count(transactions.id).mapWith(Number)
            })
            .from(assets)
            .leftJoin(transactions, and(
                eq(transactions.assetId, assets.id),
                eq(transactions.transactionType, "BUY")
            ))
            .where(and(...whereConditions))
            .groupBy(assets.id)
            .orderBy(assets.createdAt)
            .limit(validatedQuery.limit)
            .offset(offset);

        // Her asset için net holding miktarını hesapla (Buy - Sell)
        const enrichedAssets = await Promise.all(
            userAssets.map(async (asset) => {
                // Buy ve Sell toplamlarını ayrı ayrı hesapla
                const buyTotal = await db
                    .select({
                        totalQuantity: sum(transactions.quantity).mapWith(Number),
                        totalAmount: sum(transactions.totalAmount).mapWith(Number)
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

                // Gerçekleşen kar/zarar (Realized P&L) - FIFO yaklaşımı
                const averageBuyPrice = buyQuantity > 0 ? buyAmount / buyQuantity : 0;
                const realizedProfitLoss = sellQuantity > 0 
                    ? sellAmount - (sellQuantity * averageBuyPrice)
                    : 0;

                // Mevcut değer hesapla
                let currentValue: number;
                if (netQuantity <= 0) {
                    currentValue = 0;
                } else if (asset.currentPrice) {
                    currentValue = parseFloat(asset.currentPrice) * netQuantity;
                } else {
                    // Current price yoksa maliyet değerini kullan
                    currentValue = netAmount;
                }

                // Gerçekleşmemiş kar/zarar (Unrealized P&L) - sadece elimizde bulunan varlıklar için
                const unrealizedProfitLoss = netQuantity > 0 && asset.currentPrice
                    ? currentValue - netAmount 
                    : 0;

                // Toplam kar/zarar = gerçekleşen + gerçekleşmemiş
                const profitLoss = realizedProfitLoss + unrealizedProfitLoss;
                
                // Kar/zarar yüzdesi - toplam yatırıma göre
                const profitLossPercent = buyAmount > 0 
                    ? (profitLoss / buyAmount) * 100 
                    : null;

                return {
                    ...asset,
                    holdings: {
                        netQuantity,
                        netAmount,
                        averagePrice,
                        currentValue,
                        profitLoss,
                        profitLossPercent,
                        totalTransactions: asset.transactionCount
                    }
                };
            })
        );

        // Toplam asset sayısı
        const totalAssets = await db
            .select({ count: assets.id })
            .from(assets)
            .where(and(...whereConditions));

        const totalPages = Math.ceil(totalAssets.length / validatedQuery.limit);

        return Response.json({
            success: true,
            data: {
                assets: enrichedAssets.filter(asset => asset.holdings.netQuantity > 0), // Sadece holding'i olan assets
                pagination: {
                    currentPage: validatedQuery.page,
                    totalPages,
                    totalCount: totalAssets.length,
                    hasMore: validatedQuery.page < totalPages
                }
            }
        });

    } catch (error) {
        console.error("Assets listesi alma hatası:", error);
        return Response.json(
            { success: false, error: "Varlıklar alınırken hata oluştu" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/portfolio/assets
 * Yeni varlık oluşturur
 */
export async function POST(request: NextRequest) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        const body = await request.json();
        
        // Validation
        const validatedData = CreateAssetSchema.parse(body);
        
        // Eğer portfolioId belirtilmişse, portfolio'nun kullanıcıya ait olduğunu kontrol et
        if (validatedData.portfolioId) {
            const portfolio = await db
                .select()
                .from(portfolios)
                .where(and(
                    eq(portfolios.id, validatedData.portfolioId),
                    eq(portfolios.userId, session.user.id)
                ))
                .limit(1);

            if (portfolio.length === 0) {
                return Response.json(
                    { success: false, error: "Belirtilen portföy bulunamadı veya size ait değil" },
                    { status: 404 }
                );
            }
        }
        
        // Aynı isim ve tipe sahip asset zaten var mı kontrol et
        const existingAsset = await db
            .select()
            .from(assets)
            .where(and(
                eq(assets.userId, session.user.id),
                eq(assets.name, validatedData.name),
                eq(assets.assetType, validatedData.assetType)
            ))
            .limit(1);

        // Eğer varsa, mevcut asset'i döndür
        if (existingAsset.length > 0) {
            return Response.json({
                success: true,
                message: "Mevcut varlık kullanıldı",
                data: existingAsset[0]
            }, { status: 200 });
        }
        
        // Yoksa yeni asset oluştur
        const newAsset = await db
            .insert(assets)
            .values({
                id: generateId(),
                userId: session.user.id,
                portfolioId: validatedData.portfolioId,
                name: validatedData.name,
                assetType: validatedData.assetType,
                symbol: validatedData.symbol,
                category: validatedData.category,
                currency: validatedData.currency || "TRY",
            })
            .returning();

        return Response.json({
            success: true,
            message: "Varlık başarıyla eklendi",
            data: newAsset[0]
        }, { status: 201 });

    } catch (error) {
        console.error("Asset ekleme hatası:", error);
        
        if (error instanceof Error && error.name === "ZodError") {
            return Response.json(
                { success: false, error: "Geçersiz veri formatı", details: error.message },
                { status: 400 }
            );
        }
        
        const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
        return Response.json(
            { success: false, error: "Varlık eklenirken hata oluştu", details: errorMessage },
            { status: 500 }
        );
    }
}