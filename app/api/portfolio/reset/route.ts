import { NextRequest } from "next/server";
import { db, assets, transactions } from "@/db";
import { requireAuth } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";

/**
 * DELETE /api/portfolio/reset
 * Kullanıcının TÜM varlıklarını ve işlemlerini siler
 * ⚠️ TEHLİKELİ İŞLEM - GERİ ALINAMAZ
 */
export async function DELETE(request: NextRequest) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        // Önce transactions'ları sil (foreign key constraint nedeniyle)
        const deletedTransactions = await db
            .delete(transactions)
            .where(eq(transactions.userId, session.user.id))
            .returning();

        // Sonra assets'leri sil
        const deletedAssets = await db
            .delete(assets)
            .where(eq(assets.userId, session.user.id))
            .returning();

        return Response.json({
            success: true,
            message: "Tüm varlıklar ve işlemler başarıyla silindi",
            data: {
                deletedTransactions: deletedTransactions.length,
                deletedAssets: deletedAssets.length
            }
        });

    } catch (error) {
        console.error("Portfolio reset hatası:", error);
        
        const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
        return Response.json(
            { success: false, error: "Sıfırlama sırasında hata oluştu", details: errorMessage },
            { status: 500 }
        );
    }
}
