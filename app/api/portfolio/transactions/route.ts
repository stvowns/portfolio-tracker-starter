import { NextRequest } from "next/server";
import { db, transactions, assets } from "@/db";
import { requireAuth } from "@/lib/auth-utils";
import { 
    CreateTransactionSchema, 
    TransactionListQuerySchema,
    TransactionListQuery 
} from "@/lib/validations/portfolio";
import { eq, and, desc, asc, gte, lte } from "drizzle-orm";
import { generateId } from "@/lib/utils";

/**
 * GET /api/portfolio/transactions
 * Kullanıcının işlemlerini listeler (filtreleme ve sayfalama ile)
 */
export async function GET(request: NextRequest) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        const { searchParams } = new URL(request.url);
        
        // Query parametrelerini parse et
        const queryParams: Partial<TransactionListQuery> = {
            assetId: searchParams.get("assetId") || undefined,
            transactionType: (searchParams.get("transactionType") as "BUY" | "SELL") || undefined,
            startDate: searchParams.get("startDate") || undefined,
            endDate: searchParams.get("endDate") || undefined,
            page: Number(searchParams.get("page")) || 1,
            limit: Number(searchParams.get("limit")) || 20,
        };

        // Validation
        const validatedQuery = TransactionListQuerySchema.parse(queryParams);
        
        // Query conditions oluştur
        const whereConditions = [eq(transactions.userId, session.user.id)];
        
        if (validatedQuery.assetId) {
            whereConditions.push(eq(transactions.assetId, validatedQuery.assetId));
        }
        
        if (validatedQuery.transactionType) {
            whereConditions.push(eq(transactions.transactionType, validatedQuery.transactionType));
        }
        
        if (validatedQuery.startDate) {
            whereConditions.push(gte(transactions.transactionDate, new Date(validatedQuery.startDate)));
        }
        
        if (validatedQuery.endDate) {
            whereConditions.push(lte(transactions.transactionDate, new Date(validatedQuery.endDate)));
        }

        // Sayfalama için offset hesapla
        const offset = (validatedQuery.page - 1) * validatedQuery.limit;
        
        // Transactions'ları asset bilgileri ile birlikte getir
        const userTransactions = await db
            .select({
                id: transactions.id,
                assetId: transactions.assetId,
                assetName: assets.name,
                assetSymbol: assets.symbol,
                assetType: assets.assetType,
                transactionType: transactions.transactionType,
                quantity: transactions.quantity,
                pricePerUnit: transactions.pricePerUnit,
                totalAmount: transactions.totalAmount,
                transactionDate: transactions.transactionDate,
                notes: transactions.notes,
                createdAt: transactions.createdAt
            })
            .from(transactions)
            .innerJoin(assets, eq(transactions.assetId, assets.id))
            .where(and(...whereConditions))
            .orderBy(desc(transactions.transactionDate))
            .limit(validatedQuery.limit)
            .offset(offset);

        // Toplam sayfa sayısı için count
        const totalCount = await db
            .select({ count: transactions.id })
            .from(transactions)
            .innerJoin(assets, eq(transactions.assetId, assets.id))
            .where(and(...whereConditions));

        const totalPages = Math.ceil(totalCount.length / validatedQuery.limit);

        return Response.json({
            success: true,
            data: {
                transactions: userTransactions,
                pagination: {
                    currentPage: validatedQuery.page,
                    totalPages,
                    totalCount: totalCount.length,
                    hasMore: validatedQuery.page < totalPages
                }
            }
        });

    } catch (error) {
        console.error("Transactions listesi alma hatası:", error);
        return Response.json(
            { success: false, error: "İşlemler alınırken hata oluştu" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/portfolio/transactions
 * Yeni işlem (alım/satım) ekler
 */
export async function POST(request: NextRequest) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        const body = await request.json();
        
        // Validation
        const validatedData = CreateTransactionSchema.parse(body);
        
        // Asset'in kullanıcıya ait olduğunu kontrol et
        const asset = await db
            .select()
            .from(assets)
            .where(and(
                eq(assets.id, validatedData.assetId),
                eq(assets.userId, session.user.id)
            ))
            .limit(1);

        if (asset.length === 0) {
            return Response.json(
                { success: false, error: "Belirtilen varlık bulunamadı veya size ait değil" },
                { status: 404 }
            );
        }

        // Toplam tutarı hesapla
        const totalAmount = validatedData.quantity * validatedData.pricePerUnit;
        
        // Transaction'ı veritabanına ekle
        const newTransaction = await db
            .insert(transactions)
            .values({
                id: generateId(),
                userId: session.user.id,
                assetId: validatedData.assetId,
                transactionType: validatedData.transactionType,
                quantity: validatedData.quantity,
                pricePerUnit: validatedData.pricePerUnit,
                totalAmount: totalAmount,
                transactionDate: new Date(validatedData.transactionDate),
                notes: validatedData.notes,
            })
            .returning();

        return Response.json({
            success: true,
            message: "İşlem başarıyla eklendi",
            data: newTransaction[0]
        }, { status: 201 });

    } catch (error) {
        console.error("Transaction ekleme hatası:", error);
        
        if (error instanceof Error && error.name === "ZodError") {
            return Response.json(
                { success: false, error: "Geçersiz veri formatı", details: error.message },
                { status: 400 }
            );
        }
        
        return Response.json(
            { success: false, error: "İşlem eklenirken hata oluştu" },
            { status: 500 }
        );
    }
}