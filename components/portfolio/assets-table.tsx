"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Eye, Plus } from "lucide-react";
import { useState, useEffect } from "react";

interface AssetHolding {
    netQuantity: number;
    netAmount: number;
    averagePrice: number;
    currentValue: number | null;
    profitLoss: number | null;
    profitLossPercent: number | null;
    totalTransactions: number;
}

interface Asset {
    id: string;
    name: string;
    symbol?: string;
    assetType: string;
    category?: string;
    currentPrice?: string;
    holdings: AssetHolding;
}

interface AssetsTableProps {
    assets: Asset[];
    isLoading?: boolean;
    currency?: string;
    onAssetClick?: (asset: Asset) => void;
    onAddTransaction?: () => void;
    onTransactionAdded?: () => void;
}

export function AssetsTable({ 
    assets, 
    isLoading = false, 
    currency = "TRY",
    onAssetClick,
    onAddTransaction,
    onTransactionAdded
}: AssetsTableProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const formatCurrency = (amount: number) => {
        if (!isClient) return `${amount.toFixed(2)} ${currency}`;
        
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatNumber = (num: number, decimals: number = 4) => {
        if (!isClient) return num.toFixed(decimals);
        
        return new Intl.NumberFormat("tr-TR", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    };

    const formatPercent = (percent: number) => {
        return `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;
    };

    const getAssetTypeColor = (assetType: string) => {
        switch (assetType) {
            case "GOLD":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            case "SILVER":
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
            case "STOCK":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            case "FUND":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "CRYPTO":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
            case "EUROBOND":
                return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        }
    };

    const getAssetTypeLabel = (assetType: string) => {
        const labels: Record<string, string> = {
            "GOLD": "Altın",
            "SILVER": "Gümüş",
            "STOCK": "Hisse",
            "FUND": "Fon",
            "CRYPTO": "Kripto",
            "EUROBOND": "Eurobond"
        };
        return labels[assetType] || assetType;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (assets.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Varlıklarım</CardTitle>
                    <CardDescription>Portföyünüzdeki varlıklar burada görünecek</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                            Henüz hiç varlığınız yok. İlk işleminizi ekleyerek başlayın.
                        </p>
                        {onAddTransaction && (
                            <Button onClick={onAddTransaction} className="gap-2">
                                <Plus className="h-4 w-4" />
                                İlk İşlemi Ekle
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle>Varlıklarım</CardTitle>
                    <CardDescription>
                        {assets.length} varlık • Toplam {assets.reduce((sum, asset) => sum + asset.holdings.totalTransactions, 0)} işlem
                    </CardDescription>
                </div>
                {onAddTransaction && (
                    <Button onClick={onAddTransaction} size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Yeni İşlem
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Varlık</TableHead>
                                <TableHead className="text-right">Miktar</TableHead>
                                <TableHead className="text-right">Ort. Maliyet</TableHead>
                                <TableHead className="text-right">Mevcut Değer</TableHead>
                                <TableHead className="text-right">K/Z</TableHead>
                                <TableHead className="text-right">K/Z %</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assets.map((asset) => {
                                const profitLossColor = (asset.holdings.profitLoss ?? 0) >= 0 
                                    ? "text-green-600 dark:text-green-400" 
                                    : "text-red-600 dark:text-red-400";

                                return (
                                    <TableRow 
                                        key={asset.id}
                                        className={onAssetClick ? "cursor-pointer hover:bg-muted/50" : ""}
                                        onClick={() => onAssetClick?.(asset)}
                                    >
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{asset.name}</span>
                                                    {asset.symbol && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {asset.symbol}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge 
                                                        variant="secondary" 
                                                        className={`text-xs ${getAssetTypeColor(asset.assetType)}`}
                                                    >
                                                        {getAssetTypeLabel(asset.assetType)}
                                                    </Badge>
                                                    {asset.category && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {asset.category}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col text-right">
                                                <span className="font-mono">
                                                    {formatNumber(asset.holdings.netQuantity, 4)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {asset.holdings.totalTransactions} işlem
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(asset.holdings.averagePrice)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col text-right">
                                                <span className="font-mono font-medium">
                                                    {formatCurrency(asset.holdings.currentValue ?? asset.holdings.netAmount)}
                                                </span>
                                                {asset.currentPrice && (
                                                    <span className="text-xs text-muted-foreground">
                                                        @ {formatCurrency(parseFloat(asset.currentPrice))}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className={`text-right font-mono ${profitLossColor}`}>
                                            {asset.holdings.profitLoss !== null 
                                                ? formatCurrency(asset.holdings.profitLoss)
                                                : "-"
                                            }
                                        </TableCell>
                                        <TableCell className={`text-right font-mono ${profitLossColor}`}>
                                            <div className="flex items-center justify-end gap-1">
                                                {asset.holdings.profitLossPercent !== null ? (
                                                    <>
                                                        {asset.holdings.profitLoss! >= 0 ? (
                                                            <TrendingUp className="h-3 w-3" />
                                                        ) : (
                                                            <TrendingDown className="h-3 w-3" />
                                                        )}
                                                        {formatPercent(asset.holdings.profitLossPercent)}
                                                    </>
                                                ) : "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {onAssetClick && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAssetClick(asset.id);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
