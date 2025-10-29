"use client";

import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react";
import { AssetDetailModal } from "@/components/portfolio/asset-detail-modal";
import { PortfolioPieChart } from "@/components/portfolio/portfolio-pie-chart";
import { AssetGroupList } from "@/components/portfolio/asset-group-list";
import { GoldPieChart } from "@/components/portfolio/gold-pie-chart";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    AlertCircle,
    Wallet,
    AlertTriangle,
    Trash2,
    RefreshCw
} from "lucide-react";
import { toast } from "sonner";

// Real API data fetching
async function fetchPortfolioAssets() {
    try {
        const response = await fetch("/api/portfolio/assets");
        if (!response.ok) throw new Error("Assets API failed");

        const result = await response.json();
        return result.success ? result.data.assets : [];
    } catch {
        console.error("Error fetching portfolio assets:");
        return [];
    }
}

async function fetchPortfolioSummary() {
    try {
        const response = await fetch("/api/portfolio");
        if (!response.ok) throw new Error("Portfolio API failed");
        
        const result = await response.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error("Error fetching portfolio summary:", error);
        return null;
    }
}

interface Asset {
    id: string;
    name: string;
    symbol?: string;
    assetType: string;
    currentPrice?: string;
    holdings: {
        netQuantity: number;
        netAmount: number;
        averagePrice: number;
        currentValue: number | null;
        profitLoss: number | null;
        profitLossPercent: number | null;
        totalTransactions: number;
    };
}

interface Summary {
    totalValue: number | null;
    totalCost: number | null;
    totalProfitLoss: number | null;
    totalProfitLossPercent: number | null;
    totalRealizedPL?: number | null;
    totalUnrealizedPL?: number | null;
    totalAssets: number;
}

interface PortfolioDashboardProps {
    currency?: "TRY" | "USD";
    onCurrencyChange?: () => void;
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ currency = "TRY", onCurrencyChange }) => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [isAssetDetailOpen, setIsAssetDetailOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isSyncingPrices, setIsSyncingPrices] = useState(false);
    const [showGoldPieChart, setShowGoldPieChart] = useState(false);
    const [goldHoldings, setGoldHoldings] = useState<Asset[]>([]);

    const USD_TRY_RATE = 35.12; // TODO: Gerçek zamanlı kur çekebiliriz

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) {
            return currency === 'TRY' ? '₺0,00' : '$0.00';
        }

        const displayAmount = currency === 'USD' ? amount / USD_TRY_RATE : amount;

        return new Intl.NumberFormat(currency === 'TRY' ? 'tr-TR' : 'en-US', {
            style: 'currency',
            currency: currency
        }).format(displayAmount);
    };

    const getAssetTypeLabel = (type: string): string => {
        const labels: Record<string, string> = {
            'cash': 'Nakit',
            'CASH': 'Nakit',
            'gold': 'Altın',
            'GOLD': 'Altın',
            'silver': 'Gümüş',
            'SILVER': 'Gümüş',
            'stock': 'Hisse',
            'STOCK': 'Hisse Senedi',
            'fund': 'Fon',
            'FUND': 'Yatırım Fonu',
            'crypto': 'Kripto',
            'CRYPTO': 'Kripto Para',
            'bond': 'Tahvil',
            'eurobond': 'Eurobond',
            'EUROBOND': 'Eurobond',
            'etf': 'ETF',
            'ETF': 'ETF',
            'currency': 'Döviz',
            'commodity': 'Emtia',
            'real_estate': 'Gayrimenkul'
        };
        return labels[type] || type;
    };

    // Add caching to prevent unnecessary refreshes
    const lastRefreshTime = useRef<number>(0);
    const CACHE_DURATION = 30000; // 30 seconds cache

    // Memoized calculations - MUST be before conditional returns
    const assetDistribution = useMemo(() => {
        if (!assets.length) return [];

        const typeMap = new Map<string, { value: number; emoji: string; label: string }>();
        const totalValue = summary?.totalValue || 0;

        const emojiMap: Record<string, string> = {
            'cash': '💵',
            'gold': '🪙',
            'silver': '🥈',
            'stock': '📈',
            'fund': '💰',
            'crypto': '₿',
            'bond': '📕',
            'eurobond': '📕',
            'etf': '📦',
            'currency': '💵',
            'commodity': '🌾',
            'real_estate': '🏠'
        };

        assets.forEach(asset => {
            const currentValue = asset.holdings.currentValue || 0;
            const assetType = asset.assetType.toLowerCase();

            // CASH varlıkları için currency bazlı ayrım yap
            let mapKey = assetType;
            if (assetType === 'cash' && asset.name) {
                // "Nakit (TRY)" veya "Nakit TRY" -> "cash_try"
                const currencyMatch = asset.name.match(/Nakit\s*\(?\s*(\w+)\)?/i);
                if (currencyMatch) {
                    mapKey = `cash_${currencyMatch[1].toLowerCase()}`;
                }
            }

            if (!typeMap.has(mapKey)) {
                const label = mapKey.startsWith('cash_')
                    ? `Nakit (${mapKey.split('_')[1].toUpperCase()})`
                    : getAssetTypeLabel(assetType);

                typeMap.set(mapKey, {
                    value: 0,
                    emoji: emojiMap[assetType] || '📊',
                    label
                });
            }
            const current = typeMap.get(mapKey)!;
            current.value += currentValue;
        });

        // Sort: CASH currencies first, then by percentage
        return Array.from(typeMap.entries()).map(([type, data]) => ({
            type,
            value: data.value,
            percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
            emoji: data.emoji,
            label: data.label
        })).sort((a, b) => {
            const aIsCash = a.type.startsWith('cash');
            const bIsCash = b.type.startsWith('cash');
            if (aIsCash && !bIsCash) return -1;
            if (!aIsCash && bIsCash) return 1;
            return b.percentage - a.percentage;
        });
    }, [assets, summary?.totalValue]); // Only recalculate when assets or totalValue changes

    const totalTransactions = useMemo(() => {
        return assets.reduce((sum, asset) => sum + (asset.holdings.totalTransactions || 0), 0);
    }, [assets]); // Only recalculate when assets changes

    const refreshData = useCallback(async (force = false) => {
        const now = Date.now();
        if (!force && now - lastRefreshTime.current < CACHE_DURATION) {
            console.log('[Portfolio] Using cached data');
            return;
        }

        setLoading(true);
        try {
            const [assetsData, summaryData] = await Promise.all([
                fetchPortfolioAssets(),
                fetchPortfolioSummary()
            ]);

            setAssets(assetsData);
            setSummary(summaryData);
            setError(null);
            lastRefreshTime.current = now;

            // Eğer modal açıksa ve bir asset seçiliyse, güncellenmiş bilgileri al
            if (selectedAsset && isAssetDetailOpen) {
                const updatedAsset = assetsData.find((a: Asset) => a.id === selectedAsset.id);
                if (updatedAsset) {
                    setSelectedAsset(updatedAsset);
                }
            }
        } catch (err) {
            setError("Portfolio verileri yüklenirken bir hata oluştu.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedAsset, isAssetDetailOpen]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const handleAssetClick = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsAssetDetailOpen(true);
    };

    const handleGoldGroupClick = () => {
        const goldAssets = assets.filter(asset => 
            asset.assetType.toLowerCase() === 'gold' && 
            asset.holdings && 
            asset.holdings.netQuantity > 0
        );
        
        if (goldAssets.length > 1) {
            setGoldHoldings(goldAssets);
            setShowGoldPieChart(true);
        }
    };

    const handleResetPortfolio = async () => {
        setIsResetting(true);
        try {
            const response = await fetch("/api/portfolio/reset", {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Sıfırlama başarısız");
            }

            const result = await response.json();

            toast.success("Portföy sıfırlandı!", {
                description: `${result.data.deletedAssets} varlık ve ${result.data.deletedTransactions} işlem silindi.`,
            });

            // Sayfayı yenle (force cache invalidation)
            await refreshData(true);
        } catch (err) {
            console.error("Reset hatası:", err);
            const errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata";
            toast.error("Sıfırlama hatası", {
                description: errorMessage,
            });
        } finally {
            setIsResetting(false);
        }
    };

    const handleSyncPrices = async (assetIds?: string[]) => {
        setIsSyncingPrices(true);
        try {
            const response = await fetch("/api/portfolio/sync-prices", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ assetIds, force: true }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Fiyat senkronizasyonu başarısız");
            }

            const result = await response.json();

            toast.success("Fiyatlar güncellendi!", {
                description: `${result.data.successful} varlık güncellendi${result.data.failed > 0 ? `, ${result.data.failed} başarısız` : ''}`,
            });

            // Sayfayı yenle (force cache invalidation)
            await refreshData(true);
        } catch (err) {
            console.error("Sync hatası:", err);
            const errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata";
            toast.error("Fiyat güncelleme hatası", {
                description: errorMessage,
            });
        } finally {
            setIsSyncingPrices(false);
        }
    };

    if (loading && assets.length === 0) {
        return (
            <div className="space-y-6 px-4 lg:px-6">
                <div className="animate-pulse">
                    <div className="h-32 bg-muted rounded-lg mb-6" />
                    <div className="h-96 bg-muted rounded-lg" />
                </div>
            </div>
        );
    }

    // Error handling after all hooks
    if (error && assets.length === 0) {
        return (
            <div className="px-4 lg:px-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error || "Portfolio verileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin."}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6 px-4 lg:px-6">
            {/* Reset Button - Danger Zone */}
            {assets.length > 0 && (
                <div className="flex justify-end">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button 
                                variant="destructive" 
                                size="sm"
                                disabled={isResetting}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Tüm Varlıkları Sıfırla
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    Emin misiniz?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="space-y-2">
                                    <div className="font-semibold">
                                        Bu işlem GERİ ALINAMAZ!
                                    </div>
                                    <div>
                                        Tüm varlıklarınız ve işlem geçmişiniz kalıcı olarak silinecek:
                                    </div>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>{assets.length} varlık</li>
                                        <li>{totalTransactions} işlem</li>
                                        <li>Toplam {formatCurrency(summary?.totalValue)} değerinde portföy</li>
                                    </ul>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleResetPortfolio}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={isResetting}
                                >
                                    {isResetting ? "Siliniyor..." : "Evet, Tümünü Sil"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}



            {/* Varlık Dağılımı Badgeleri */}
            {summary && assets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {assetDistribution.map((item) => (
                        <div 
                            key={item.type} 
                            className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm flex items-center gap-2"
                        >
                            <span>{item.emoji}</span>
                            <span>{item.label}: {item.percentage.toFixed(2)}%</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Pie Chart - Toplam Değer */}
            {summary && assets.length > 0 && (
                <PortfolioPieChart
                    distribution={assetDistribution}
                    totalValue={summary.totalValue || 0}
                    currency={currency}
                    onCurrencyChange={onCurrencyChange}
                    profitLoss={summary.totalProfitLoss || 0}
                    profitLossPercent={summary.totalProfitLossPercent || 0}
                    realizedPL={summary.totalRealizedPL || 0}
                    formatCurrency={formatCurrency}
                />
            )}

            {/* Assets View - Grouped by Category */}
            {assets.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div>
                            <h2 className="text-xl font-semibold">Portföyümdeki Varlıklar</h2>
                            <p className="text-sm text-muted-foreground">
                                {new Date().toLocaleDateString('tr-TR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                        <Button
                            onClick={() => handleSyncPrices()}
                            disabled={isSyncingPrices}
                            size="sm"
                            variant="outline"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingPrices ? 'animate-spin' : ''}`} />
                            {isSyncingPrices ? "Güncelleniyor..." : "Fiyatları Güncelle"}
                        </Button>
                    </div>
                    <AssetGroupList
                        assets={assets}
                        currency={currency}
                        onAssetClick={handleAssetClick}
                        formatCurrency={formatCurrency}
                        onGoldGroupClick={handleGoldGroupClick}
                    />
                </div>
            )}

            {/* Gold Pie Chart Modal */}
            {showGoldPieChart && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold">Altın Varlık Dağılımı</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Sahip olunan altın çeşitlerinin dağılımı
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowGoldPieChart(false)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    ✕
                                </button>
                            </div>
                            <GoldPieChart 
                                goldHoldings={goldHoldings}
                                currency={currency as "TRY" | "USD" | "EUR"}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Asset Detail Modal */}
            <AssetDetailModal 
                asset={selectedAsset}
                isOpen={isAssetDetailOpen}
                onClose={() => setIsAssetDetailOpen(false)}
                onTransactionAdded={refreshData}
                availableCash={
                    assets
                        .filter(a => a.assetType === "CASH" && a.name.includes("TRY"))
                        .reduce((sum, asset) => sum + (asset.holdings.currentValue || 0), 0)
                }
            />

            {/* Empty State */}
            {assets.length === 0 && !error && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                        <CardTitle className="text-xl mb-2">Henüz varlık eklenmedi</CardTitle>
                        <CardDescription className="text-center mb-4">
                            Portföyünüze ilk varlığı ekleyerek yatırım takibine başlayın
                        </CardDescription>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export { PortfolioDashboard };
