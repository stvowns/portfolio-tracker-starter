import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { syncAssetPrices } from "@/lib/services/price-sync-service";

/**
 * POST /api/portfolio/sync-prices
 * Manually sync prices for portfolio assets
 */
export async function POST(request: NextRequest) {
    const session = await requireAuth(request);
    if (session instanceof Response) return session;

    try {
        const body = await request.json();
        const { assetIds, force = true } = body;

        console.log(`[Sync API] Starting price sync for user ${session.user.id}`);
        console.log(`[Sync API] Asset IDs:`, assetIds || 'all assets');
        console.log(`[Sync API] Force:`, force);

        const syncOptions: any = { force };

        if (assetIds && Array.isArray(assetIds) && assetIds.length > 0) {
            syncOptions.assetIds = assetIds;
        }

        const result = await syncAssetPrices(syncOptions);

        return Response.json({
            success: true,
            message: "Fiyat senkronizasyonu tamamlandı",
            data: {
                totalAssets: result.totalAssets,
                successful: result.successful,
                failed: result.failed,
                skipped: result.skipped,
                duration: result.duration,
                errors: result.errors
            }
        });

    } catch (error) {
        console.error("[Sync API] Price sync failed:", error);
        return Response.json(
            {
                success: false,
                error: "Fiyat senkronizasyonu başarısız",
                details: error instanceof Error ? error.message : "Bilinmeyen hata"
            },
            { status: 500 }
        );
    }
}