"use client";

import { useEffect, useState } from "react";
import { PortfolioSummaryCards } from "@/components/portfolio/portfolio-summary-cards";
import { AssetsTable } from "@/components/portfolio/assets-table";
import { RecentTransactions } from "@/components/portfolio/recent-transactions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Wallet } from "lucide-react";

// Client-side data fetching fonksiyonu
function getPortfolioData() {
    // Geliştirme ortamında mock data döneceğiz
    // Prod'da gerçek API çağrıları yapılacak
    
    return {
        overview: {
            totalPortfolios: 1,
            totalAssets: 3,
            totalTransactions: 8,
            totalInvestment: 25000,
            assetTypeDistribution: [
                { assetType: "GOLD", count: 1 },
                { assetType: "STOCK", count: 1 },
                { assetType: "FUND", count: 1 }
            ]
        },
        assets: [
            {
                id: "1",
                name: "Çeyrek Altın",
                symbol: "GOLD",
                assetType: "GOLD",
                category: "Kıymetli Maden",
                currentPrice: "2850.00",
                holdings: {
                    netQuantity: 10,
                    netAmount: 28000,
                    averagePrice: 2800,
                    currentValue: 28500,
                    profitLoss: 500,
                    profitLossPercent: 1.79,
                    totalTransactions: 3
                }
            },
            {
                id: "2", 
                name: "BIST 100",
                symbol: "XU100",
                assetType: "FUND",
                category: "Endeks Fonu",
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
            }
        ],
        recentTransactions: [
            {
                id: "1",
                assetId: "1",
                assetName: "Çeyrek Altın",
                assetSymbol: "GOLD",
                assetType: "GOLD",
                transactionType: "BUY" as const,
                quantity: 2,
                pricePerUnit: 2850,
                totalAmount: 5700,
                transactionDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                notes: "Piyasa düşüşünde alım"
            },
            {
                id: "2",
                assetId: "2", 
                assetName: "BIST 100",
                assetSymbol: "XU100",
                assetType: "FUND",
                transactionType: "BUY" as const,
                quantity: 40,
                pricePerUnit: 125.50,
                totalAmount: 5020,
                transactionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                notes: "Düzenli yatırım"
            }
        ],
        summary: {
            totalValue: 38540,
            totalCost: 38000,
            totalProfitLoss: 540,
            totalProfitLossPercent: 1.42,
            totalAssets: 2,
            currency: "TRY"
        }
    };
}

export function PortfolioDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const portfolioData = getPortfolioData();
            setData(portfolioData);
            setLoading(false);
        } catch (err) {
            setError("Portfolio verileri yüklenirken bir hata oluştu.");
            setLoading(false);
        }
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 px-4 lg:px-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
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
            {/* Summary Cards */}
            <PortfolioSummaryCards 
                summary={data.summary}
                overview={data.overview}
            />

            {/* Assets & Transactions Grid */}
            <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-2">
                {/* Assets Table */}
                <div className="xl:col-span-1">
                    <AssetsTable 
                        assets={data.assets}
                        currency="TRY"
                        onAssetClick={(assetId) => {
                            console.log("Asset clicked:", assetId);
                            // Burada asset detay sayfasına yönlendirme yapılacak
                        }}
                        onAddTransaction={() => {
                            console.log("Add transaction clicked");
                            // Burada yeni işlem modalı açılacak
                        }}
                    />
                </div>

                {/* Recent Transactions */}
                <div className="xl:col-span-1">
                    <RecentTransactions 
                        transactions={data.recentTransactions}
                        currency="TRY"
                        maxItems={5}
                        onViewAll={() => {
                            console.log("View all transactions clicked");
                            // Burada tüm işlemler sayfasına yönlendirme yapılacak
                        }}
                    />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            +₺5.720
                        </div>
                        <p className="text-xs text-muted-foreground">
                            3 alış işlemi
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En Karlı</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            Çeyrek Altın
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400">
                            +%1.79 (+₺500)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dağılım</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.overview.totalAssets} Çeşit
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {data.overview.assetTypeDistribution.length} kategori
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Info Alert */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                Bu bir demo portföy dashboard&apos;udur. Gerçek verilerinizi görmek için işlem eklemeye başlayın.
                </AlertDescription>
            </Alert>
        </div>
    );
}
