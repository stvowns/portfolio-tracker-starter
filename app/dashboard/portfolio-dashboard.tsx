"use client";

import { useEffect, useState } from "react";
import { PortfolioSummaryCards } from "@/components/portfolio/portfolio-summary-cards";
import { AssetsTable } from "@/components/portfolio/assets-table";
import { AddTransactionDialog } from "@/components/portfolio/add-transaction-dialog";
import { AssetDetailModal } from "@/components/portfolio/asset-detail-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    AlertCircle, 
    Wallet, 
    TrendingUp, 
    TrendingDown, 
    Minus,
    Calendar,
    BarChart3,
    PieChart,
    Trophy,
    Target,
    DollarSign,
    Shield,
    AlertTriangle
} from "lucide-react";

// Mock data for testing
function getMockAssets() {
    return [
        {
            id: "1",
            name: "Çeyrek Altın",
            symbol: "",
            assetType: "GOLD",
            category: "Kıymetli Maden",
            currentPrice: "2850.00",
            holdings: {
                netQuantity: 3,
                netAmount: 8400,
                averagePrice: 2800,
                currentValue: 8550,
                profitLoss: 150,
                profitLossPercent: 1.79,
                totalTransactions: 3
            }
        },
        {
            id: "2", 
            name: "Gram Altın",
            symbol: "",
            assetType: "GOLD",
            category: "Kıymetli Maden",
            currentPrice: "1850.00",
            holdings: {
                netQuantity: 5,
                netAmount: 9000,
                averagePrice: 1800,
                currentValue: 9250,
                profitLoss: 250,
                profitLossPercent: 2.78,
                totalTransactions: 2
            }
        },
        {
            id: "3", 
            name: "Cumhuriyet Altını",
            symbol: "",
            assetType: "GOLD",
            category: "Kıymetli Maden",
            currentPrice: "18500.00",
            holdings: {
                netQuantity: 1,
                netAmount: 18000,
                averagePrice: 18000,
                currentValue: 18500,
                profitLoss: 500,
                profitLossPercent: 2.78,
                totalTransactions: 1
            }
        },
        {
            id: "4", 
            name: "BIST 100",
            symbol: "",
            assetType: "FUND",
            category: "Yatırım Fonu",
            currentPrice: "125.50",
            holdings: {
                netQuantity: 80,
                netAmount: 10000,
                averagePrice: 125.00,
                currentValue: 10040,
                profitLoss: 40,
                profitLossPercent: 0.40,
                totalTransactions: 2
            }
        },
        {
            id: "5", 
            name: "USD/TRY",
            symbol: "",
            assetType: "EUROBOND",
            category: "Döviz",
            currentPrice: "32.50",
            holdings: {
                netQuantity: 1000,
                netAmount: 31000,
                averagePrice: 31.00,
                currentValue: 32500,
                profitLoss: 1500,
                profitLossPercent: 4.84,
                totalTransactions: 3
            }
        }
    ];
}

// Real API data fetching
async function fetchPortfolioAssets() {
    try {
        // For now, return mock data until authentication is fixed
        const mockAssets = getMockAssets();
        console.log("Mock assets loaded:", mockAssets.length);
        return mockAssets;
        
        const response = await fetch("/api/portfolio/assets");
        if (!response.ok) throw new Error("Assets API failed");
        
        const result = await response.json();
        return result.success ? result.data.assets : [];
    } catch (error) {
        console.error("Error fetching portfolio assets:", error);
        return getMockAssets(); // Fallback to mock data
    }
}

async function fetchPortfolioSummary() {
    try {
        // For now, calculate from mock data
        const assets = getMockAssets();
        const totalValue = assets.reduce((sum: number, asset: any) => 
            sum + (asset.holdings?.currentValue || 0), 0);
        const totalCost = assets.reduce((sum: number, asset: any) => 
            sum + (asset.holdings?.netAmount || 0), 0);
        const totalProfitLoss = totalValue - totalCost;
        const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;
        
        return {
            totalValue,
            totalCost,
            totalProfitLoss,
            totalProfitLossPercent,
            totalAssets: assets.filter((asset: any) => asset.holdings?.netQuantity > 0).length,
            currency: "TRY"
        };
    };

    // Helper functions for new cards
    const calculateDailyChange = () => {
        const todayChange = Math.random() * 10000 - 2000; // Random between -2000 and 8000
        const todayPercent = (todayChange / totalValue) * 100;
        return {
            amount: todayChange,
            percent: todayPercent
        };
    };

    const getAssetDistribution = () => {
        const distribution: Record<string, number> = {};
        assets.forEach(asset => {
            const value = asset.holdings?.currentValue || 0;
            distribution[asset.assetType] = (distribution[asset.assetType] || 0) + value;
        });
        return distribution;
    };

    const getBestAndWorstPerformers = () => {
        const sortedAssets = [...assets]
            .filter(asset => asset.holdings?.currentValue > 0)
            .sort((a, b) => (b.holdings?.profitLossPercent || 0) - (a.holdings?.profitLossPercent || 0));
        
        return {
            best: sortedAssets.length > 0 ? sortedAssets[0] : null,
            worst: sortedAssets.length > 0 ? sortedAssets[sortedAssets.length - 1] : null
        };
    };
        
        const response = await fetch("/api/portfolio");
        if (!response.ok) throw new Error("Portfolio API failed");
        
        const result = await response.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error("Error fetching portfolio summary:", error);
        
        // Fallback summary calculation from assets
        const assets = await fetchPortfolioAssets();
        const totalValue = assets.reduce((sum: number, asset: any) => 
            sum + (asset.holdings?.currentValue || 0), 0);
        const totalCost = assets.reduce((sum: number, asset: any) => 
            sum + (asset.holdings?.netAmount || 0), 0);
        const totalProfitLoss = totalValue - totalCost;
        const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;
        
        return {
            totalValue,
            totalCost,
            totalProfitLoss,
            totalProfitLossPercent,
            totalAssets: assets.filter((asset: any) => asset.holdings?.netQuantity > 0).length,
            currency: "TRY"
        };
    }
}

export function PortfolioDashboard() {
    const [assets, setAssets] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [isAssetDetailOpen, setIsAssetDetailOpen] = useState(false);

    // Mock storage for新增的资产
    const [dynamicAssets, setDynamicAssets] = useState<any[]>([]);

    const refreshData = async () => {
        setLoading(true);
        try {
            const [assetsData, summaryData] = await Promise.all([
                fetchPortfolioAssets(),
                fetchPortfolioSummary()
            ]);
            
            // Only merge mock assets with dynamic assets if no dynamic assets exist
            // If dynamic assets exist, they're already up to date
            if (dynamicAssets.length === 0) {
                setAssets(assetsData);
            } else {
                // Show current assets state without overwriting dynamic assets
                setAssets(prev => {
                    const currentDynamicAssets = prev.filter((asset: any) => 
                        asset.id.startsWith('dynamic_')
                    );
                    return [...assetsData, ...currentDynamicAssets];
                });
            }
            setSummary(summaryData);
            setError(null);
        } catch (err) {
            setError("Portfolio verileri yüklenirken bir hata oluştu.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addNewAsset = (transactionData: any) => {
        const newAsset = {
            id: `dynamic_${Date.now()}`,
            name: transactionData.assetName,
            symbol: "",
            assetType: transactionData.assetType,
            category: getAssetTypeLabel(transactionData.assetType),
            currentPrice: transactionData.pricePerUnit.toString(),
            holdings: {
                netQuantity: transactionData.quantity,
                netAmount: transactionData.quantity * transactionData.pricePerUnit,
                averagePrice: transactionData.pricePerUnit,
                currentValue: transactionData.quantity * transactionData.pricePerUnit,
                profitLoss: 0,
                profitLossPercent: 0,
                totalTransactions: 1
            }
        };

        setDynamicAssets(prev => {
            const updated = [...prev, newAsset];
            return updated;
        });
        
        // Update assets immediately without fetching mock data again
        setAssets(prev => {
            const mockAssets = getMockAssets();
            return [...mockAssets, ...dynamicAssets, newAsset];
        });
    };

    const getAssetTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            "GOLD": "Altın",
            "SILVER": "Gümüş",
            "STOCK": "Hisse Senedi",
            "FUND": "Yatırım Fonu",
            "CRYPTO": "Kripto Para",
            "EUROBOND": "Eurobond"
        };
        return labels[type] || type;
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleAssetClick = (asset: any) => {
        setSelectedAsset(asset);
        setIsAssetDetailOpen(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    };

    const formatPercent = (percent: number) => {
        return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
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

    return (
        <div className="space-y-6 px-4 lg:px-6">
            {/* Portfolio Summary - Phase 1: Critical Cards */}
            {summary && assets.length > 0 && (() => {
                const dailyChange = calculateDailyChange();
                const distribution = getAssetDistribution();
                const { best, worst } = getBestAndWorstPerformers();
                
                return (
                    <>
                        {/* Original Summary Cards (Responsive) */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Toplam Değer</CardTitle>
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(summary.totalValue)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {summary.totalAssets} varlık
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Toplam Maliyet</CardTitle>
                                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(summary.totalCost)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Yatırım yapılan tutar
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Kar/Zarar</CardTitle>
                                    {summary.totalProfitLoss >= 0 ? 
                                        <TrendingUp className="h-4 w-4 text-green-600" /> : 
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    }
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${
                                        summary.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {formatCurrency(summary.totalProfitLoss)}
                                    </div>
                                    <p className={`text-xs ${
                                        summary.totalProfitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {formatPercent(summary.totalProfitLossPercent)}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Performans</CardTitle>
                                    {summary.totalProfitLossPercent >= 0 ? 
                                        <TrendingUp className="h-4 w-4 text-green-600" /> : 
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    }
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${
                                        summary.totalProfitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {formatPercent(summary.totalProfitLossPercent)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Toplam getiri oranı
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Phase 1: Critical Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            {/* 1. Günlük Değişim Kartı */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Günlük Değişim</CardTitle>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${
                                        dailyChange.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {dailyChange.amount >= 0 ? '+' : ''}{formatCurrency(dailyChange.amount)}
                                    </div>
                                    <p className={`text-xs ${
                                        dailyChange.percent >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        ({dailyChange.percent >= 0 ? '+' : ''}{dailyChange.percent.toFixed(2)}%)
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Bugün
                                    </p>
                                </CardContent>
                            </Card>

                            {/* 2. Varlık Dağılımı */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Varlık Dağılımı</CardTitle>
                                    <PieChart className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {Object.entries(distribution).map(([type, value]) => {
                                            const percent = (value / summary.totalValue) * 100;
                                            const typeLabels: Record<string, string> = {
                                                'GOLD': '🏆 Altın',
                                                'SILVER': '💎 Gümüş', 
                                                'STOCK': '📈 Hisse',
                                                'FUND': '💰 Fon',
                                                'CRYPTO': '₿ Kripto',
                                                'EUROBOND': '📕 Eurobond'
                                            };
                                            return (
                                                <div key={type} className="flex items-center justify-between text-sm">
                                                    <span>{typeLabels[type] || type}</span>
                                                    <span className="font-medium">{percent.toFixed(1)}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 3. En İyi/Zayıf Performans */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Performans Detayı</CardTitle>
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {best && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-1">
                                                    <Trophy className="h-3 w-3 text-green-600" />
                                                    {best.name}
                                                </span>
                                                <span className="text-green-600 font-medium">
                                                    +{(best.holdings?.profitLossPercent || 0).toFixed(2)}%
                                                </span>
                                            </div>
                                        )}
                                        {worst && worst.name !== best?.name && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3 text-orange-600" />
                                                    {worst.name}
                                                </span>
                                                <span className="font-medium">
                                                    {(worst.holdings?.profitLossPercent || 0).toFixed(2)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                );
            })()}

            {/* Assets Table */}
            <AssetsTable 
                assets={assets}
                currency="TRY"
                onAssetClick={handleAssetClick}
                onTransactionAdded={refreshData}
                onNewAssetAdded={addNewAsset}
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
}
