"use client";

import { useEffect, useState } from "react";
import { AssetsTable } from "@/components/portfolio/assets-table";
import { AddTransactionDialog } from "@/components/portfolio/add-transaction-dialog";
import { AssetDetailModal } from "@/components/portfolio/asset-detail-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
    AlertCircle, 
    Wallet, 
    TrendingUp, 
    TrendingDown
} from "lucide-react";

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

export function PortfolioDashboard() {
    const [assets, setAssets] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [isAssetDetailOpen, setIsAssetDetailOpen] = useState(false);

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
            {/* Portfolio Summary */}
            {summary && (
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
            )}

            {/* Assets Table */}
            <AssetsTable 
                assets={assets}
                currency="TRY"
                onAssetClick={handleAssetClick}
                onTransactionAdded={refreshData}
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
