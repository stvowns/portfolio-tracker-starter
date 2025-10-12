import { NextRequest } from "next/server";
import { db, portfolios, assets, transactions } from "@/db";
import { requireAuth } from "@/lib/auth-utils";
import { CreatePortfolioSchema } from "@/lib/validations/portfolio";
import { eq, and, sum, count } from "drizzle-orm";

/**
 * GET /api/portfolio
 * Kullanıcının genel portföy özetini getirir
 */
export async function GET(request: NextRequest) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        // Kullanıcının portfolyo'larını al
        const userPortfolios = await db
            .select()
            .from(portfolios)
            .where(eq(portfolios.userId, session.user.id))
            .orderBy(portfolios.createdAt);

        // Eğer hiç portfolyo yoksa, varsayılan bir tane oluştur
        if (userPortfolios.length === 0) {
            const defaultPortfolio = await db
                .insert(portfolios)
                .values({
                    userId: session.user.id,
                    name: "Ana Portföy",
                    baseCurrency: "TRY"
                })
                .returning();

            userPortfolios.push(defaultPortfolio[0]);
        }

        // Genel portföy istatistikleri hesapla
        const portfolioSummaries = await Promise.all(
            userPortfolios.map(async (portfolio) => {
                // Portfolio'daki asset sayısı
                const assetCount = await db
                    .select({ count: assets.id })
                    .from(assets)
                    .where(and(
                        eq(assets.userId, session.user.id),
                        eq(assets.portfolioId, portfolio.id)
                    ));

                // Portfolio'daki toplam transaction sayısı
                const transactionCount = await db
                    .select({ count: transactions.id })
                    .from(transactions)
                    .innerJoin(assets, eq(transactions.assetId, assets.id))
                    .where(and(
                        eq(transactions.userId, session.user.id),
                        eq(assets.portfolioId, portfolio.id)
                    ));

                // Portfolio'daki toplam yatırım miktarı (buy transactions)
                const totalInvestment = await db
                    .select({ 
                        total: sum(transactions.totalAmount).mapWith(Number)
                    })
                    .from(transactions)
                    .innerJoin(assets, eq(transactions.assetId, assets.id))
                    .where(and(
                        eq(transactions.userId, session.user.id),
                        eq(assets.portfolioId, portfolio.id),
                        eq(transactions.transactionType, "BUY")
                    ));

                // Son işlem tarihi
                const lastTransaction = await db
                    .select({ date: transactions.transactionDate })
                    .from(transactions)
                    .innerJoin(assets, eq(transactions.assetId, assets.id))
                    .where(and(
                        eq(transactions.userId, session.user.id),
                        eq(assets.portfolioId, portfolio.id)
                    ))
                    .orderBy(transactions.transactionDate)
                    .limit(1);

                return {
                    id: portfolio.id,
                    name: portfolio.name,
                    baseCurrency: portfolio.baseCurrency,
                    createdAt: portfolio.createdAt,
                    stats: {
                        totalAssets: assetCount[0]?.count || 0,
                        totalTransactions: transactionCount[0]?.count || 0,
                        totalInvestment: totalInvestment[0]?.total || 0,
                        lastTransactionDate: lastTransaction[0]?.date || null
                    }
                };
            })
        );

        // Genel kullanıcı istatistikleri
        const totalAssetsAllPortfolios = await db
            .select({ count: assets.id })
            .from(assets)
            .where(eq(assets.userId, session.user.id));

        const totalTransactionsAllPortfolios = await db
            .select({ count: transactions.id })
            .from(transactions)
            .where(eq(transactions.userId, session.user.id));

        const totalInvestmentAllPortfolios = await db
            .select({ 
                total: sum(transactions.totalAmount).mapWith(Number)
            })
            .from(transactions)
            .where(and(
                eq(transactions.userId, session.user.id),
                eq(transactions.transactionType, "BUY")
            ));

        // Asset türü dağılımı
        const assetTypeDistribution = await db
            .select({
                assetType: assets.assetType,
                count: count(assets.id).mapWith(Number)
            })
            .from(assets)
            .where(eq(assets.userId, session.user.id))
            .groupBy(assets.assetType);

        return Response.json({
            success: true,
            data: {
                user: {
                    id: session.user.id,
                    name: session.user.name,
                    email: session.user.email
                },
                portfolios: portfolioSummaries,
                overview: {
                    totalPortfolios: portfolioSummaries.length,
                    totalAssets: totalAssetsAllPortfolios[0]?.count || 0,
                    totalTransactions: totalTransactionsAllPortfolios[0]?.count || 0,
                    totalInvestment: totalInvestmentAllPortfolios[0]?.total || 0,
                    assetTypeDistribution: assetTypeDistribution
                }
            }
        });

    } catch (error) {
        console.error("Portfolio özeti alma hatası:", error);
        return Response.json(
            { success: false, error: "Portföy özeti alınırken hata oluştu" },
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
        
        // Validation
        const validatedData = CreatePortfolioSchema.parse(body);
        
        // Portföy'ü veritabanına ekle
        const newPortfolio = await db
            .insert(portfolios)
            .values({
                userId: session.user.id,
                name: validatedData.name,
                baseCurrency: validatedData.baseCurrency,
            })
            .returning();

        return Response.json({
            success: true,
            message: "Portföy başarıyla oluşturuldu",
            data: newPortfolio[0]
        }, { status: 201 });

    } catch (error) {
        console.error("Portföy oluşturma hatası:", error);
        
        if (error instanceof Error && error.name === "ZodError") {
            return Response.json(
                { success: false, error: "Geçersiz veri formatı", details: error.message },
                { status: 400 }
            );
        }
        
        return Response.json(
            { success: false, error: "Portföy oluşturulurken hata oluştu" },
            { status: 500 }
        );
    }
}