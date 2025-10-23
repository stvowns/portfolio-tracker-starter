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
            .orderBy(
                // Gram Altını en üste taşı, sonra diğerlerini createdAt tarihine göre sırala
                sql`CASE
                    WHEN ${assets.assetType} = 'GOLD' AND ${assets.name} LIKE '%Gram%' THEN 0
                    ELSE 1
                END,
                ${assets.createdAt}`
            )
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
                
                // Net maliyet = Kalan miktar × Ortalama alış fiyatı
                const averageBuyPrice = buyQuantity > 0 ? buyAmount / buyQuantity : 0;
                const netAmount = netQuantity * averageBuyPrice;
                const averagePrice = averageBuyPrice; // Ortalama maliyet zaten averageBuyPrice'dir

                // Gerçekleşen kar/zarar (Realized P&L) - FIFO yaklaşımı
                const realizedProfitLoss = sellQuantity > 0 
                    ? sellAmount - (sellQuantity * averageBuyPrice)
                    : 0;

                // Mevcut değer hesapla - HER ZAMAN CANLI FİYAT ÇEK
                let currentValue: number;
                let currentPrice: number | null = null;

                if (netQuantity <= 0) {
                    currentValue = 0;
                } else {
                    // HER ZAMAN canlı fiyatı dene çek (fiyatta güncel kalmak için)
                    try {
                        let symbol = asset.symbol || asset.name;
                        let type = asset.assetType === 'GOLD' ? 'COMMODITY' :
                                 asset.assetType === 'SILVER' ? 'COMMODITY' :
                                 asset.assetType === 'CRYPTO' ? 'CRYPTO' :
                                 asset.assetType === 'FUND' ? 'FUND' : 'STOCK';

                        // Kripto için symbol'ı düzelt
                        if (asset.assetType === 'CRYPTO') {
                            if (asset.name.toLowerCase().includes("bitcoin")) {
                                symbol = "BTC";
                            } else if (asset.name.toLowerCase().includes("ethereum")) {
                                symbol = "ETH";
                            } else if (asset.symbol) {
                                symbol = asset.symbol.replace("-USD", "").replace("USD", "");
                            } else {
                                symbol = asset.name.toUpperCase();
                            }
                        }

                        // URL encode symbol to handle special characters
                        const encodedSymbol = encodeURIComponent(symbol);
                        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
                        const port = process.env.NODE_ENV === 'development' ? '3002' : '3000';
                        const marketPriceResponse = await fetch(`${baseUrl.replace('3000', port)}/api/prices/latest?symbol=${encodedSymbol}&type=${type}`);
                        if (marketPriceResponse.ok) {
                            const marketData = await marketPriceResponse.json();
                            if (marketData.success && marketData.data?.currentPrice) {
                                currentPrice = marketData.data.currentPrice;
                                // Asset'i HER ZAMAN güncelle (canlı fiyatı tutmak için)
                                await db.update(assets).set({
                                    currentPrice: currentPrice,
                                    lastUpdated: new Date()
                                }).where(eq(assets.id, asset.id));

                                console.log(`[Assets API] Updated ${asset.name} price: ${currentPrice}`);
                            }
                        }
                    } catch (error) {
                        console.log('Market price fetch failed for', asset.name, error);
                    }

                    // Eğer canlı fiyat alınamazsa, asset'teki mevcut fiyatı kullan
                    if (currentPrice === null && asset.currentPrice) {
                        currentPrice = parseFloat(asset.currentPrice.toString());
                        console.log(`[Assets API] Using stored price for ${asset.name}: ${currentPrice}`);
                    }

                    // Eğer hala currentPrice yoksa, ortalamamaliyeti kullan (son çare)
                    if (currentPrice === null) {
                        console.log(`[Assets API] No current price for asset ${asset.name}, using average price: ${averagePrice}`);
                        currentPrice = averagePrice;
                    }

                    currentValue = currentPrice * netQuantity;
                }

                // Gerçekleşmemiş kar/zarar (Unrealized P&L) - sadece elimizde bulunan varlıklar için
                const unrealizedProfitLoss = netQuantity > 0 && currentPrice !== null
                    ? currentValue - netAmount 
                    : 0;

                // Toplam kar/zarar = gerçekleşen + gerçekleşmemiş
                const profitLoss = realizedProfitLoss + unrealizedProfitLoss;
                
                // Kar/zarar yüzdesi - toplam yatırıma göre
                const profitLossPercent = buyAmount > 0
                    ? (profitLoss / buyAmount) * 100
                    : 0;

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

        // Tüm varlık türleri için güncel piyasa fiyatını çekip asset'i güncelle
        try {
            let currentPrice = null;

            if (validatedData.assetType === "GOLD") {
                // Gold için /api/prices/latest kullan
                const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
                const port = process.env.NODE_ENV === 'development' ? '3002' : '3000';
                const marketPriceResponse = await fetch(`${baseUrl.replace('3000', port)}/api/prices/latest?symbol=GOLD&type=COMMODITY`);

                if (marketPriceResponse.ok) {
                    const marketData = await marketPriceResponse.json();
                    if (marketData.success && marketData.data?.currentPrice) {
                        currentPrice = marketData.data.currentPrice;
                    }
                }
            } else if (validatedData.assetType === "SILVER") {
                // Silver için /api/prices/latest kullan
                const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
                const port = process.env.NODE_ENV === 'development' ? '3002' : '3000';
                const marketPriceResponse = await fetch(`${baseUrl.replace('3000', port)}/api/prices/latest?symbol=SILVER&type=COMMODITY`);

                if (marketPriceResponse.ok) {
                    const marketData = await marketPriceResponse.json();
                    if (marketData.success && marketData.data?.currentPrice) {
                        currentPrice = marketData.data.currentPrice;
                    }
                }
            } else if (validatedData.assetType === "CRYPTO") {
                // Kripto için symbol'ı belirle ve /api/prices/latest kullan
                let symbol = "BTC";
                if (validatedData.name.toLowerCase().includes("bitcoin")) {
                    symbol = "BTC";
                } else if (validatedData.name.toLowerCase().includes("ethereum")) {
                    symbol = "ETH";
                } else if (validatedData.symbol) {
                    symbol = validatedData.symbol.replace("-USD", "").replace("USD", "");
                } else {
                    symbol = validatedData.name.toUpperCase();
                }

                const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
                const port = process.env.NODE_ENV === 'development' ? '3002' : '3000';
                const marketPriceResponse = await fetch(`${baseUrl.replace('3000', port)}/api/prices/latest?symbol=${symbol}&type=CRYPTO`);

                if (marketPriceResponse.ok) {
                    const marketData = await marketPriceResponse.json();
                    if (marketData.success && marketData.data?.currentPrice) {
                        currentPrice = marketData.data.currentPrice;
                    }
                }
            } else if (validatedData.assetType === "STOCK") {
                // BIST için bistService kullan
                const { bistService } = await import("@/lib/services/bist-service");
                let symbol = validatedData.symbol;

                // Eğer symbol yoksa, şirket adından tahmin et
                if (!symbol) {
                    // predictBISTTicker fonksiyonunu price-sync-service'ten al
                    const { predictBISTTicker } = await import("@/lib/services/price-sync-service");
                    const predictedSymbol = predictBISTTicker(validatedData.name);
                    if (predictedSymbol) {
                        symbol = predictedSymbol;
                    }
                }

                if (symbol) {
                    try {
                        const stockData = await bistService.fetchStockPrice(symbol);
                        currentPrice = stockData.currentPrice;
                    } catch (error) {
                        console.log('BIST price fetch failed for', validatedData.name, error);
                    }
                }
            } else if (validatedData.assetType === "FUND") {
                // TEFAS için tefasService kullan
                const { tefasService } = await import("@/lib/services/tefas-service");
                let symbol = validatedData.symbol;

                if (symbol) {
                    try {
                        const fundData = await tefasService.fetchFundPrice(symbol);
                        currentPrice = fundData.currentPrice;
                    } catch (error) {
                        console.log('TEFAS price fetch failed for', validatedData.name, error);
                    }
                }
            }

            // Eğer fiyat başarıyla çekildiyse, asset'i güncelle
            if (currentPrice !== null) {
                await db.update(assets).set({
                    currentPrice: currentPrice,
                    lastUpdated: new Date()
                }).where(eq(assets.id, newAsset[0].id));

                // Return updated asset
                const updatedAsset = await db
                    .select()
                    .from(assets)
                    .where(eq(assets.id, newAsset[0].id))
                    .limit(1);

                return Response.json({
                    success: true,
                    message: "Varlık başarıyla eklendi",
                    data: updatedAsset[0]
                }, { status: 201 });
            }
        } catch (error) {
            console.log('Market price fetch failed for', validatedData.name, error);
        }

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