import { NextRequest, NextResponse } from 'next/server';
import { db, assets, transactions } from "@/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;
    
    try {
        // Kullanıcının altın varlıklarını getir
        const goldAssets = await db
            .select()
            .from(assets)
            .where(and(
                eq(assets.userId, session.user.id),
                eq(assets.assetType, "GOLD")
            ));
        
        // Her altın varlığı için işlemleri getir
        const assetsWithTransactions = await Promise.all(
            goldAssets.map(async (asset) => {
                const assetTransactions = await db
                    .select()
                    .from(transactions)
                    .where(eq(transactions.assetId, asset.id))
                    .orderBy(transactions.transactionDate);
                
                return {
                    ...asset,
                    transactions: assetTransactions
                };
            })
        );
        
        return NextResponse.json({
            success: true,
            data: assetsWithTransactions
        });
    } catch (error) {
        console.error('Gold assets test error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}