"use client";

import { useEffect, useState } from "react";
import { AssetDetailModal } from "@/components/portfolio/asset-detail-modal";
import { PortfolioPieChart } from "@/components/portfolio/portfolio-pie-chart";
import { AssetCard } from "@/components/portfolio/asset-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    TrendingUp, 
    TrendingDown,
    LucideIcon,
    Calendar,
    PieChart,
    BarChart3,
    Trophy,
    AlertTriangle,
    Shield,
    Activity,
    Zap,
    Target,
    Trash2
} from "lucide-react";
import { toast } from "sonner";

interface StatCardProps {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    iconColor?: string;
    valueColor?: string;
    descriptionColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
    title, 
    value, 
    description, 
    icon: Icon,
    iconColor = "text-muted-foreground",
    valueColor,
    descriptionColor = "text-muted-foreground"
}) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${iconColor}`} />
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold ${valueColor || ''}`}>
                {value}
            </div>
            <p className={`text-xs ${descriptionColor}`}>
                {description}
            </p>
        </CardContent>
    </Card>
);

// Real API data fetching
async function fetchPortfolioAssets() {
    try {
        const response = await fetch("/api/portfolio/assets");
        if (!response.ok) throw new Error("Assets API failed");
        
        const result = await response.json();
        return result.success ? result.data.assets : [];
    } catch (error) {
        console.error("Error fetching portfolio assets:", error);
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

    const formatPercent = (percent: number | null | undefined) => {
        if (percent === null || percent === undefined) {
            return '-';
        }
        return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
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

    const refreshData = async () => {
        setLoading(true);
        try {
            const [assetsData, summaryData] = await Promise.all([
                fetchPortfolioAssets(),
                fetchPortfolioSummary()
            ]);
            
            setAssets(assetsData);
            setSummary(summaryData);
            setError(null);
            
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
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleAssetClick = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsAssetDetailOpen(true);
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

            // Sayfayı yenile
            await refreshData();
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

    const isProfit = (summary?.totalProfitLoss ?? 0) >= 0;
    const profitColor = isProfit ? 'text-green-600' : 'text-red-600';

    // Asset Type Distribution with Currency breakdown for CASH
    const getAssetDistribution = () => {
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
    };

    // Performance Details
    const getPerformanceDetails = () => {
        if (!assets.length) return { best: null, worst: null };
        
        const validAssets = assets.filter(a => 
            a.holdings.profitLossPercent !== null && 
            a.holdings.profitLossPercent !== undefined && 
            a.holdings.profitLossPercent !== 0
        );
        if (!validAssets.length) return { best: null, worst: null };
        
        const sortedByPerformance = [...validAssets].sort(
            (a, b) => (b.holdings.profitLossPercent ?? 0) - (a.holdings.profitLossPercent ?? 0)
        );
        
        return {
            best: sortedByPerformance[0] || null,
            worst: sortedByPerformance[sortedByPerformance.length - 1] || null
        };
    };

    // Risk Distribution
    const getRiskDistribution = () => {
        if (!assets.length) return { low: 0, medium: 0, high: 0 };
        
        const totalValue = summary?.totalValue || 0;
        if (totalValue === 0) return { low: 0, medium: 0, high: 0 };
        
        const riskMap = {
            low: 0,
            medium: 0,
            high: 0
        };
        
        const riskLevels: Record<string, 'low' | 'medium' | 'high'> = {
            'gold': 'low',
            'bond': 'low',
            'fund': 'low',
            'stock': 'medium',
            'currency': 'medium',
            'silver': 'medium',
            'crypto': 'high',
            'commodity': 'high',
            'real_estate': 'medium'
        };
        
        assets.forEach(asset => {
            const value = asset.holdings.currentValue || 0;
            const risk = riskLevels[asset.assetType] || 'medium';
            riskMap[risk] += value;
        });
        
        return {
            low: (riskMap.low / totalValue) * 100,
            medium: (riskMap.medium / totalValue) * 100,
            high: (riskMap.high / totalValue) * 100
        };
    };

    // Total Transactions Count
    const getTotalTransactions = () => {
        return assets.reduce((sum, asset) => sum + (asset.holdings.totalTransactions || 0), 0);
    };

    // Most Active Asset
    const getMostActiveAsset = () => {
        if (!assets.length) return null;
        return assets.reduce((max, asset) => 
            (asset.holdings.totalTransactions || 0) > (max.holdings.totalTransactions || 0) ? asset : max
        , assets[0]);
    };

    // Monthly Performance (simplified - based on current profit/loss)
    const getMonthlyPerformance = () => {
        const currentDate = new Date();
        const monthName = currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
        
        return {
            monthName,
            profit: summary?.totalProfitLoss || 0,
            profitPercent: summary?.totalProfitLossPercent || 0
        };
    };

    const assetDistribution = getAssetDistribution();
    const performanceDetails = getPerformanceDetails();
    const riskDistribution = getRiskDistribution();
    const totalTransactions = getTotalTransactions();
    const mostActiveAsset = getMostActiveAsset();
    const monthlyPerformance = getMonthlyPerformance();

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
                                    <p className="font-semibold">
                                        Bu işlem GERİ ALINAMAZ!
                                    </p>
                                    <p>
                                        Tüm varlıklarınız ve işlem geçmişiniz kalıcı olarak silinecek:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>{assets.length} varlık</li>
                                        <li>{getTotalTransactions()} işlem</li>
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

            {/* Assets View - Cards Only */}
            {assets.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Portföyümdeki Varlıklar</CardTitle>
                                <CardDescription>
                                    {new Date().toLocaleDateString('tr-TR', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {assets.map((asset) => (
                                <AssetCard
                                    key={asset.id}
                                    asset={asset}
                                    currency={currency}
                                    onAssetClick={() => handleAssetClick(asset)}
                                    dailyChange={undefined}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
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
