import { NextRequest } from "next/server";
import { db, transactions, assets } from "@/db";
import { requireAuth } from "@/lib/auth-utils";
import { UpdateTransactionSchema } from "@/lib/validations/portfolio";
import { eq, and } from "drizzle-orm";

/**
 * PUT /api/portfolio/transactions/[id]
 * Mevcut işlemi günceller
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        const { id } = params;
        
        // Transaction'ın varlığını ve kullanıcıya ait olduğunu kontrol et
        const existingTransaction = await db
            .select()
            .from(transactions)
            .where(and(
                eq(transactions.id, id),
                eq(transactions.userId, session.user.id)
            ))
            .limit(1);

        if (existingTransaction.length === 0) {
            return Response.json(
                { success: false, error: "İşlem bulunamadı veya size ait değil" },
                { status: 404 }
            );
        }

        const body = await request.json();
        
        // Validation
        const validatedData = UpdateTransactionSchema.parse(body);
        
        // Eğer assetId değiştiriliyorsa, yeni asset'in kullanıcıya ait olduğunu kontrol et
        if (validatedData.assetId && validatedData.assetId !== existingTransaction[0].assetId) {
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
        }

        // Güncelleme verileri hazırla
        const updateData: any = {
            updatedAt: new Date()
        };

        if (validatedData.assetId) updateData.assetId = validatedData.assetId;
        if (validatedData.transactionType) updateData.transactionType = validatedData.transactionType;
        if (validatedData.quantity) updateData.quantity = validatedData.quantity.toString();
        if (validatedData.pricePerUnit) updateData.pricePerUnit = validatedData.pricePerUnit.toString();
        if (validatedData.transactionDate) updateData.transactionDate = new Date(validatedData.transactionDate);
        if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

        // Eğer quantity veya pricePerUnit değiştiriliyorsa totalAmount'u yeniden hesapla
        if (validatedData.quantity || validatedData.pricePerUnit) {
            const finalQuantity = validatedData.quantity || parseFloat(existingTransaction[0].quantity);
            const finalPrice = validatedData.pricePerUnit || parseFloat(existingTransaction[0].pricePerUnit);
            updateData.totalAmount = (finalQuantity * finalPrice).toString();
        }

        // Transaction'ı güncelle
        const updatedTransaction = await db
            .update(transactions)
            .set(updateData)
            .where(eq(transactions.id, id))
            .returning();

        return Response.json({
            success: true,
            message: "İşlem başarıyla güncellendi",
            data: updatedTransaction[0]
        });

    } catch (error) {
        console.error("Transaction güncelleme hatası:", error);
        
        if (error instanceof Error && error.name === "ZodError") {
            return Response.json(
                { success: false, error: "Geçersiz veri formatı", details: error.message },
                { status: 400 }
            );
        }
        
        return Response.json(
            { success: false, error: "İşlem güncellenirken hata oluştu" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/portfolio/transactions/[id]
 * İşlemi siler
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        const { id } = params;
        
        // Transaction'ın varlığını ve kullanıcıya ait olduğunu kontrol et
        const existingTransaction = await db
            .select()
            .from(transactions)
            .where(and(
                eq(transactions.id, id),
                eq(transactions.userId, session.user.id)
            ))
            .limit(1);

        if (existingTransaction.length === 0) {
            return Response.json(
                { success: false, error: "İşlem bulunamadı veya size ait değil" },
                { status: 404 }
            );
        }

        // Transaction'ı sil
        await db
            .delete(transactions)
            .where(eq(transactions.id, id));

        return Response.json({
            success: true,
            message: "İşlem başarıyla silindi"
        });

    } catch (error) {
        console.error("Transaction silme hatası:", error);
        return Response.json(
            { success: false, error: "İşlem silinirken hata oluştu" },
            { status: 500 }
        );
    }
}