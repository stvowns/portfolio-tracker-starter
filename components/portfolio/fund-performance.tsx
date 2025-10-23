"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Eye
} from "lucide-react";
import { AssetDetailModal } from "./asset-detail-modal";

interface FundPerformance {
    fundId: string;
    fundName: string;
    fundSymbol?: string;
    netQuantity: number;
    netAmount: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
    averagePrice: number;
    currentPrice: number;
    lastUpdated?: string;
}

interface FundPerformanceSummary {
    totalValue: number;
    totalCost: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    totalFunds: number;
    currency: string;
}

interface FundPerformanceData {
    summary: FundPerformanceSummary;
    funds: FundPerformance[];
}

interface FundPerformanceProps {
    availableCash?: number;
    onTransactionAdded?: () => void;
}

export function FundPerformance({
    availableCash = 0,
    onTransactionAdded
}: FundPerformanceProps) {
    const [data, setData] = useState<FundPerformanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFund, setSelectedFund] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    };

    const formatQuantity = (quantity: number) => {
        if (Number.isInteger(quantity)) {
            return quantity.toString();
        }
        return parseFloat(quantity.toFixed(8)).toString();
    };

    const formatPercent = (percent: number) => {
        return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
    };

    const fetchFundPerformance = async () => {
        try {
            const response = await fetch("/api/portfolio/funds/performance");
            if (!response.ok) {
                throw new Error("Performans verileri alınamadı");
            }
            const result = await response.json();
            if (result.success) {
                setData(result.data);
                setError(null);
            } else {
                throw new Error(result.error || "Veri alınamadı");
            }
        } catch (err) {
            console.error("Fund performance fetch error:", err);
            setError(err instanceof Error ? err.message : "Bilinmeyen hata");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const refreshData = async () => {
        setRefreshing(true);
        await fetchFundPerformance();
    };

    useEffect(() => {
        fetchFundPerformance();
    }, []);

    const handleFundClick = (fund: FundPerformance) => {
        // Asset detail modal için formatla
        const assetData = {
            id: fund.fundId,
            name: fund.fundName,
            symbol: fund.fundSymbol,
            assetType: "FUND",
            currentPrice: fund.currentPrice.toString(),
            holdings: {
                netQuantity: fund.netQuantity,
                averagePrice: fund.averagePrice,
                currentValue: fund.currentValue,
                netAmount: fund.netAmount,
                profitLoss: fund.profitLoss,
                profitLossPercent: fund.profitLossPercent
            }
        };

        setSelectedFund(assetData);
        setIsDetailModalOpen(true);
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Yatırım Fonları Performansı</CardTitle>
                    <CardDescription>Yükleniyor...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-muted rounded-lg w-1/3" />
                        <div className="h-12 bg-muted rounded-lg w-1/2" />
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-16 bg-muted rounded-lg" />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Yatırım Fonları Performansı</CardTitle>
                    <CardDescription className="text-red-500">Hata: {error}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={refreshData} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tekrar Dene
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.funds.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Yatırım Fonları Performansı</CardTitle>
                    <CardDescription>Henüz yatırım fonu bulunmuyor</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Portföyünüze yatırım fonu eklemek için "Yeni İşlem" butonunu kullanın.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                Yatırım Fonları Performansı
                                <Badge variant="secondary">{data.summary.totalFunds} Fon</Badge>
                            </CardTitle>
                            <CardDescription>
                                Toplam {data.summary.totalFunds} yatırım fonunuz bulunuyor
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshData}
                            disabled={refreshing}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Yenile
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Toplam Değer</p>
                                        <p className="text-lg font-bold">{formatCurrency(data.summary.totalValue)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Toplam Maliyet</p>
                                        <p className="text-lg font-bold">{formatCurrency(data.summary.totalCost)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    {data.summary.totalProfitLoss >= 0 ? (
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-600" />
                                    )}
                                    <div>
                                        <p className="text-xs text-muted-foreground">Kar/Zarar</p>
                                        <p className={`text-lg font-bold ${
                                            data.summary.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {formatCurrency(data.summary.totalProfitLoss)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    {data.summary.totalProfitLossPercent >= 0 ? (
                                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                                    )}
                                    <div>
                                        <p className="text-xs text-muted-foreground">Getiri Oranı</p>
                                        <p className={`text-lg font-bold ${
                                            data.summary.totalProfitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {formatPercent(data.summary.totalProfitLossPercent)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Separator className="my-4" />

                    {/* Fund List */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Fon Detayları</h3>
                        <div className="space-y-2">
                            {data.funds.map((fund, index) => (
                                <Card
                                    key={fund.fundId}
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => handleFundClick(fund)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-semibold">{fund.fundName}</h4>
                                                    {fund.fundSymbol && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {fund.fundSymbol}
                                                        </Badge>
                                                    )}
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {formatQuantity(fund.netQuantity)} adet
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground">Ort. Maliyet</p>
                                                        <p className="font-medium">{formatCurrency(fund.averagePrice)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Mevcut Fiyat</p>
                                                        <p className="font-medium text-blue-600">{formatCurrency(fund.currentPrice)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Mevcut Değer</p>
                                                        <p className="font-medium">{formatCurrency(fund.currentValue)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Kar/Zarar</p>
                                                        <p className={`font-medium ${
                                                            fund.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {formatCurrency(fund.profitLoss)} ({formatPercent(fund.profitLossPercent)})
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Asset Detail Modal */}
            {selectedFund && (
                <AssetDetailModal
                    asset={selectedFund}
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    onTransactionAdded={() => {
                        onTransactionAdded?.();
                        fetchFundPerformance();
                    }}
                    availableCash={availableCash}
                />
            )}
        </>
    );
}