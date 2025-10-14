"use client";

import { useEffect, useState } from "react";
import { AssetsTable } from "@/components/portfolio/assets-table";
import { AssetDetailModal } from "@/components/portfolio/asset-detail-modal";
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
            'gold': 'Altın',
            'silver': 'Gümüş',
            'stock': 'Hisse',
            'fund': 'Fon',
            'crypto': 'Kripto',
            'bond': 'Tahvil',
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

    // Asset Type Distribution
    const getAssetDistribution = () => {
        if (!assets.length) return [];
        
        const typeMap = new Map<string, { value: number; emoji: string }>();
        const totalValue = summary?.totalValue || 0;
        
        const emojiMap: Record<string, string> = {
            'cash': '💵',
            'gold': '🪙',
            'silver': '🥈',
            'stock': '📈',
            'fund': '💰',
            'crypto': '₿',
            'bond': '📕',
            'currency': '💵',
            'commodity': '🌾',
            'real_estate': '🏠'
        };
        
        assets.forEach(asset => {
            const currentValue = asset.holdings.currentValue || 0;
            const assetType = asset.assetType.toLowerCase();
            
            if (!typeMap.has(assetType)) {
                typeMap.set(assetType, { 
                    value: 0, 
                    emoji: emojiMap[assetType] || '📊' 
                });
            }
            const current = typeMap.get(assetType)!;
            current.value += currentValue;
        });
        
        // Sort: CASH first, then by percentage
        return Array.from(typeMap.entries()).map(([type, data]) => ({
            type,
            value: data.value,
            percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
            emoji: data.emoji
        })).sort((a, b) => {
            if (a.type === 'cash') return -1;
            if (b.type === 'cash') return 1;
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

            {summary && assets.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Toplam Değer"
                        value={formatCurrency(summary.totalValue)}
                        description={`${summary.totalAssets} varlık`}
                        icon={Wallet}
                    />
                    
                    <StatCard
                        title="Toplam Maliyet"
                        value={formatCurrency(summary.totalCost)}
                        description="Yatırım yapılan tutar"
                        icon={TrendingDown}
                    />
                    
                    <StatCard
                        title="Kar/Zarar"
                        value={formatCurrency(summary.totalProfitLoss)}
                        description={formatPercent(summary.totalProfitLossPercent)}
                        icon={isProfit ? TrendingUp : TrendingDown}
                        iconColor={profitColor}
                        valueColor={profitColor}
                        descriptionColor={profitColor}
                    />
                    
                    <StatCard
                        title="Performans"
                        value={formatPercent(summary.totalProfitLossPercent)}
                        description="Toplam getiri oranı"
                        icon={isProfit ? TrendingUp : TrendingDown}
                        iconColor={profitColor}
                        valueColor={profitColor}
                    />
                </div>
            )}

            {/* Basit Özet - Varlık Dağılımı Badgeleri */}
            {summary && assets.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {assetDistribution.map((item) => (
                        <div 
                            key={item.type} 
                            className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm flex items-center gap-2"
                        >
                            <span>{item.emoji}</span>
                            <span>{getAssetTypeLabel(item.type)}: {item.percentage.toFixed(2)}%</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Merkez - Toplam Değer */}
            {summary && assets.length > 0 && (
                <Card className="mb-6">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="text-center mb-4">
                            <p className="text-muted-foreground text-sm mb-2">Toplam Değer</p>
                            <p className="text-5xl font-bold">{formatCurrency(summary.totalValue)}</p>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className="text-sm text-muted-foreground">{currency}</span>
                                {onCurrencyChange && (
                                    <Button variant="ghost" size="sm" onClick={onCurrencyChange} className="h-6 px-2">
                                        🔄
                                    </Button>
                                )}
                            </div>
                        </div>
                        
                        {/* Kar/Zarar Özeti */}
                        <div className="grid grid-cols-2 gap-6 mt-6 w-full max-w-md">
                            <div className="text-center p-4 rounded-lg bg-muted/30">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <p className="text-xs text-muted-foreground">Toplam K/Z</p>
                                    <div className="group relative">
                                        <span className="text-xs cursor-help">ℹ️</span>
                                        <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg z-10">
                                            Gerçekleşen + Gerçekleşmemiş kar/zarar toplamı
                                        </div>
                                    </div>
                                </div>
                                <p className={`text-2xl font-bold ${profitColor}`}>
                                    {formatCurrency(summary.totalProfitLoss)}
                                </p>
                                <p className={`text-sm ${profitColor}`}>
                                    {formatPercent(summary.totalProfitLossPercent)}
                                </p>
                            </div>
                            <div className="text-center p-4 rounded-lg bg-muted/30">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <p className="text-xs text-muted-foreground">Gerçekleşen K/Z</p>
                                    <div className="group relative">
                                        <span className="text-xs cursor-help">ℹ️</span>
                                        <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg z-10">
                                            Satışlardan elde edilen gerçek kar/zarar
                                        </div>
                                    </div>
                                </div>
                                <p className={`text-2xl font-bold ${(summary.totalRealizedPL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(summary.totalRealizedPL || 0)}
                                </p>
                                <p className="text-xs text-muted-foreground">💰 Cebinizdeki</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Assets Table */}
            <AssetsTable 
                assets={assets}
                currency={currency}
                onAssetClick={handleAssetClick}
                onTransactionAdded={refreshData}
                onAssetDeleted={refreshData}
            />

            {/* Asset Detail Modal */}
            <AssetDetailModal 
                asset={selectedAsset}
                isOpen={isAssetDetailOpen}
                onClose={() => setIsAssetDetailOpen(false)}
                onTransactionAdded={refreshData}
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
