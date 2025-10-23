import { NextRequest } from "next/server";
import { db, assets, transactions } from "@/db";
import { requireAuth } from "@/lib/auth-utils";
import { eq, and, sum, desc } from "drizzle-orm";

/**
 * GET /api/portfolio/funds/performance
 * Sadece yatırım fonları için performans metriklerini hesaplar
 */
export async function GET(request: NextRequest) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;

    try {
        const { searchParams } = new URL(request.url);
        const currency = searchParams.get("currency") || "TRY";

        // Sadece FUND türündeki varlıkları al
        const fundAssets = await db
            .select()
            .from(assets)
            .where(and(
                eq(assets.userId, session.user.id),
                eq(assets.assetType, "FUND")
            ));

        if (fundAssets.length === 0) {
            return Response.json({
                success: true,
                data: {
                    summary: {
                        totalValue: 0,
                        totalCost: 0,
                        totalProfitLoss: 0,
                        totalProfitLossPercent: 0,
                        totalFunds: 0,
                        currency: currency
                    },
                    funds: []
                }
            });
        }

        // Her fon için performans hesapla
        const fundPerformances = await Promise.all(
            fundAssets.map(async (fund) => {
                // Buy ve Sell toplamlarını hesapla
                const buyTotal = await db
                    .select({
                        totalQuantity: sum(transactions.quantity).mapWith(Number),
                        totalAmount: sum(transactions.totalAmount).mapWith(Number)
                    })
                    .from(transactions)
                    .where(and(
                        eq(transactions.assetId, fund.id),
                        eq(transactions.transactionType, "BUY")
                    ));

                const sellTotal = await db
                    .select({
                        totalQuantity: sum(transactions.quantity).mapWith(Number),
                        totalAmount: sum(transactions.totalAmount).mapWith(Number)
                    })
                    .from(transactions)
                    .where(and(
                        eq(transactions.assetId, fund.id),
                        eq(transactions.transactionType, "SELL")
                    ));

                const buyQuantity = buyTotal[0]?.totalQuantity || 0;
                const sellQuantity = sellTotal[0]?.totalQuantity || 0;
                const buyAmount = buyTotal[0]?.totalAmount || 0;
                const sellAmount = sellTotal[0]?.totalAmount || 0;

                const netQuantity = buyQuantity - sellQuantity;
                const netAmount = buyAmount - sellAmount;
                const averagePrice = netQuantity > 0 ? netAmount / netQuantity : 0;

                // Mevcut değer hesapla - HER ZAMAN TEFAS API'den güncel fiyatı çek
                let currentPrice: number;
                try {
                    const { tefasService } = await import("@/lib/services/tefas-service");
                    if (fund.symbol) {
                        const fundData = await tefasService.fetchFundPrice(fund.symbol);
                        currentPrice = fundData.currentPrice;

                        // Asset'i güncelle (API'den gelen gerçek mevcut fiyat)
                        await db.update(assets).set({
                            currentPrice: currentPrice,
                            lastUpdated: new Date()
                        }).where(eq(assets.id, fund.id));

                        console.log(`[Fund Performance] Updated ${fund.name} price: ${currentPrice}`);
                    } else {
                        console.log(`[Fund Performance] No symbol for ${fund.name}, using average price`);
                        currentPrice = averagePrice;
                    }
                } catch (error) {
                    console.log('[Fund Performance] TEFAS price fetch failed for', fund.name, error);
                    currentPrice = averagePrice;
                }

                const currentValue = netQuantity > 0 ? currentPrice * netQuantity : 0;
                const profitLoss = currentValue - netAmount;
                const profitLossPercent = netAmount > 0 ? (profitLoss / netAmount) * 100 : 0;

                return {
                    fundId: fund.id,
                    fundName: fund.name,
                    fundSymbol: fund.symbol,
                    netQuantity,
                    netAmount,
                    currentValue,
                    profitLoss,
                    profitLossPercent,
                    averagePrice,
                    currentPrice,
                    lastUpdated: fund.lastUpdated
                };
            })
        );

        // Toplam portföy metrikleri
        const totalValue = fundPerformances.reduce((sum, fund) => sum + fund.currentValue, 0);
        const totalCost = fundPerformances.reduce((sum, fund) => sum + Math.max(0, fund.netAmount), 0);
        const totalProfitLoss = fundPerformances.reduce((sum, fund) => sum + fund.profitLoss, 0);
        const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

        // Sadece holding'i olan fonları filtrele
        const activeFunds = fundPerformances.filter(fund => fund.netQuantity > 0);

        // Performansa göre sırala (en yüksek kar/zarar yüzdesi önce)
        const sortedFunds = activeFunds.sort((a, b) => b.profitLossPercent - a.profitLossPercent);

        return Response.json({
            success: true,
            data: {
                summary: {
                    totalValue: Math.round(totalValue * 100) / 100,
                    totalCost: Math.round(totalCost * 100) / 100,
                    totalProfitLoss: Math.round(totalProfitLoss * 100) / 100,
                    totalProfitLossPercent: Math.round(totalProfitLossPercent * 100) / 100,
                    totalFunds: activeFunds.length,
                    currency: currency
                },
                funds: sortedFunds.map(fund => ({
                    ...fund,
                    currentValue: Math.round(fund.currentValue * 100) / 100,
                    profitLoss: Math.round(fund.profitLoss * 100) / 100,
                    profitLossPercent: Math.round(fund.profitLossPercent * 100) / 100,
                    netAmount: Math.round(fund.netAmount * 100) / 100,
                    averagePrice: Math.round(fund.averagePrice * 100) / 100,
                    currentPrice: Math.round(fund.currentPrice * 100) / 100
                }))
            }
        });

    } catch (error) {
        console.error("Fon performans hesaplama hatası:", error);
        return Response.json(
            { success: false, error: "Fon performansı hesaplanırken hata oluştu" },
            { status: 500 }
        );
    }
}