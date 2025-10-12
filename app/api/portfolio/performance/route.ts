import { NextRequest } from "next/server";
import { db, assets, transactions, portfolios } from "@/db";
import { requireAuth } from "@/lib/auth-utils";
import { PortfolioPerformanceQuerySchema } from "@/lib/validations/portfolio";
import { eq, and, sum, gte, lte, desc } from "drizzle-orm";
import { subDays, subMonths, subYears, startOfDay, endOfDay } from "date-fns";

/**
 * GET /api/portfolio/performance
 * Kullanıcının portföy performans metriklerini hesaplar
 */
export async function GET(request: NextRequest) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        const { searchParams } = new URL(request.url);
        
        // Query parametrelerini parse et
        const queryParams = {
            portfolioId: searchParams.get("portfolioId") || undefined,
            period: (searchParams.get("period") as any) || "30d",
            currency: searchParams.get("currency") || "TRY",
        };

        // Validation
        const validatedQuery = PortfolioPerformanceQuerySchema.parse(queryParams);
        
        // Tarih aralığını hesapla
        const now = new Date();
        let startDate: Date | undefined;
        
        switch (validatedQuery.period) {
            case "1d":
                startDate = subDays(now, 1);
                break;
            case "7d":
                startDate = subDays(now, 7);
                break;
            case "30d":
                startDate = subDays(now, 30);
                break;
            case "90d":
                startDate = subDays(now, 90);
                break;
            case "1y":
                startDate = subYears(now, 1);
                break;
            case "all":
                startDate = undefined;
                break;
        }

        // Portfolio filtreleme koşulu
        let portfolioCondition = eq(assets.userId, session.user.id);
        if (validatedQuery.portfolioId) {
            portfolioCondition = and(
                portfolioCondition,
                eq(assets.portfolioId, validatedQuery.portfolioId)
            ) as any;
        }

        // Kullanıcının tüm assets'larını al
        const userAssets = await db
            .select()
            .from(assets)
            .where(portfolioCondition);

        if (userAssets.length === 0) {
            return Response.json({
                success: true,
                data: {
                    summary: {
                        totalValue: 0,
                        totalCost: 0,
                        totalProfitLoss: 0,
                        totalProfitLossPercent: 0,
                        totalAssets: 0,
                        currency: validatedQuery.currency
                    },
                    assets: [],
                    periodTransactions: []
                }
            });
        }

        // Her asset için performans hesapla
        const assetPerformances = await Promise.all(
            userAssets.map(async (asset) => {
                // Buy ve Sell toplamlarını hesapla
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

                // Mevcut değer hesapla (şimdilik manual price yoksa cost price kullan)
                const currentPrice = asset.currentPrice ? parseFloat(asset.currentPrice) : averagePrice;
                const currentValue = netQuantity > 0 ? currentPrice * netQuantity : 0;
                
                const profitLoss = currentValue - netAmount;
                const profitLossPercent = netAmount > 0 ? (profitLoss / netAmount) * 100 : 0;

                return {
                    assetId: asset.id,
                    assetName: asset.name,
                    assetType: asset.assetType,
                    netQuantity,
                    netAmount,
                    currentValue,
                    profitLoss,
                    profitLossPercent,
                    averagePrice,
                    currentPrice
                };
            })
        );

        // Dönem içindeki transaction'ları al
        let periodTransactionConditions = [
            eq(transactions.userId, session.user.id)
        ];

        if (startDate) {
            periodTransactionConditions.push(gte(transactions.transactionDate, startDate));
        }

        // Asset filtresi için
        if (validatedQuery.portfolioId) {
            const portfolioAssetIds = userAssets.map(a => a.id);
            periodTransactionConditions.push(
                and(...portfolioAssetIds.map(id => eq(transactions.assetId, id))) as any
            );
        }

        const periodTransactions = await db
            .select({
                id: transactions.id,
                assetId: transactions.assetId,
                assetName: assets.name,
                transactionType: transactions.transactionType,
                quantity: transactions.quantity,
                pricePerUnit: transactions.pricePerUnit,
                totalAmount: transactions.totalAmount,
                transactionDate: transactions.transactionDate
            })
            .from(transactions)
            .innerJoin(assets, eq(transactions.assetId, assets.id))
            .where(and(...periodTransactionConditions))
            .orderBy(desc(transactions.transactionDate))
            .limit(50);

        // Toplam portföy metrikleri
        const totalValue = assetPerformances.reduce((sum, asset) => sum + asset.currentValue, 0);
        const totalCost = assetPerformances.reduce((sum, asset) => sum + Math.max(0, asset.netAmount), 0);
        const totalProfitLoss = assetPerformances.reduce((sum, asset) => sum + asset.profitLoss, 0);
        const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

        // Sadece holding'i olan assets'ları filtrele
        const activeAssets = assetPerformances.filter(asset => asset.netQuantity > 0);

        return Response.json({
            success: true,
            data: {
                summary: {
                    totalValue: Math.round(totalValue * 100) / 100,
                    totalCost: Math.round(totalCost * 100) / 100,
                    totalProfitLoss: Math.round(totalProfitLoss * 100) / 100,
                    totalProfitLossPercent: Math.round(totalProfitLossPercent * 100) / 100,
                    totalAssets: activeAssets.length,
                    currency: validatedQuery.currency,
                    period: validatedQuery.period
                },
                assets: activeAssets.map(asset => ({
                    ...asset,
                    currentValue: Math.round(asset.currentValue * 100) / 100,
                    profitLoss: Math.round(asset.profitLoss * 100) / 100,
                    profitLossPercent: Math.round(asset.profitLossPercent * 100) / 100,
                    netAmount: Math.round(asset.netAmount * 100) / 100
                })),
                periodTransactions: periodTransactions.map(tx => ({
                    ...tx,
                    quantity: parseFloat(tx.quantity),
                    pricePerUnit: parseFloat(tx.pricePerUnit),
                    totalAmount: parseFloat(tx.totalAmount)
                })),
                dateRange: {
                    startDate: startDate?.toISOString() || null,
                    endDate: now.toISOString()
                }
            }
        });

    } catch (error) {
        console.error("Portfolio performans hesaplama hatası:", error);
        return Response.json(
            { success: false, error: "Portföy performansı hesaplanırken hata oluştu" },
            { status: 500 }
        );
    }
}