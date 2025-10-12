"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet, Target, BarChart3, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface PortfolioSummary {
    totalValue: number;
    totalCost: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    totalAssets: number;
    currency: string;
}

interface PortfolioOverview {
    totalPortfolios: number;
    totalAssets: number;
    totalTransactions: number;
    totalInvestment: number;
    assetTypeDistribution: Array<{
        assetType: string;
        count: number;
    }>;
}

interface PortfolioSummaryCardsProps {
    summary?: PortfolioSummary;
    overview?: PortfolioOverview;
    isLoading?: boolean;
}

export function PortfolioSummaryCards({ 
    summary, 
    overview, 
    isLoading = false 
}: PortfolioSummaryCardsProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const formatCurrency = (amount: number, currency: string = "TRY") => {
        if (!isClient) return `${amount.toFixed(2)} ${currency}`;
        
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatPercent = (percent: number) => {
        return `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;
    };

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
                            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const profitLossColor = (summary?.totalProfitLoss ?? 0) >= 0 
        ? "text-green-600 dark:text-green-400" 
        : "text-red-600 dark:text-red-400";

    const profitLossIcon = (summary?.totalProfitLoss ?? 0) >= 0 
        ? TrendingUp 
        : TrendingDown;

    const ProfitLossIcon = profitLossIcon;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Toplam Portfolio Değeri */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Değer</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatCurrency(summary?.totalValue ?? overview?.totalInvestment ?? 0, summary?.currency)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {summary?.totalAssets ?? overview?.totalAssets ?? 0} varlık
                    </p>
                </CardContent>
            </Card>

            {/* Kar/Zarar */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam K/Z</CardTitle>
                    <ProfitLossIcon className={`h-4 w-4 ${profitLossColor}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${profitLossColor}`}>
                        {formatCurrency(summary?.totalProfitLoss ?? 0, summary?.currency)}
                    </div>
                    <p className={`text-xs ${profitLossColor}`}>
                        {formatPercent(summary?.totalProfitLossPercent ?? 0)}
                    </p>
                </CardContent>
            </Card>

            {/* Yatırım Tutarı */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Yatırım Tutarı</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatCurrency(summary?.totalCost ?? overview?.totalInvestment ?? 0, summary?.currency)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Ana para
                    </p>
                </CardContent>
            </Card>

            {/* İşlem Sayısı */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam İşlem</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {overview?.totalTransactions ?? 0}
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                        {overview?.assetTypeDistribution?.slice(0, 3).map((type) => (
                            <Badge key={type.assetType} variant="secondary" className="text-xs">
                                {type.assetType}: {type.count}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}