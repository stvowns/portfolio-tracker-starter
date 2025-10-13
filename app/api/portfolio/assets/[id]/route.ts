import { NextRequest } from "next/server";
import { db, assets, transactions } from "@/db";
import { requireAuth } from "@/lib/auth-utils";
import { eq, and } from "drizzle-orm";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        const assetId = params.id;
        
        if (!assetId) {
            return Response.json(
                { success: false, error: "Asset ID gereklidir" },
                { status: 400 }
            );
        }

        const asset = await db
            .select()
            .from(assets)
            .where(and(
                eq(assets.id, assetId),
                eq(assets.userId, session.user.id)
            ))
            .limit(1);

        if (asset.length === 0) {
            return Response.json(
                { success: false, error: "Varlık bulunamadı veya size ait değil" },
                { status: 404 }
            );
        }

        await db
            .delete(transactions)
            .where(eq(transactions.assetId, assetId));

        await db
            .delete(assets)
            .where(eq(assets.id, assetId));

        return Response.json({
            success: true,
            message: "Varlık ve ilgili işlemler başarıyla silindi"
        });

    } catch (error) {
        console.error("Asset silme hatası:", error);
        return Response.json(
            { success: false, error: "Varlık silinirken hata oluştu" },
            { status: 500 }
        );
    }
}
