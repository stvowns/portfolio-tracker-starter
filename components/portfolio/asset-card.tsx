"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Eye } from "lucide-react";

interface AssetCardProps {
    asset: {
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
        };
    };
    currency: string;
    onAssetClick?: () => void;
    dailyChange?: number;
}

export function AssetCard({ asset, currency, onAssetClick, dailyChange }: AssetCardProps) {
    
    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) {
            return currency === 'TRY' ? '₺0,00' : '$0.00';
        }
        
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatQuantity = (quantity: number) => {
        if (Number.isInteger(quantity)) {
            return quantity.toLocaleString('tr-TR');
        }
        
        return parseFloat(quantity.toFixed(8)).toLocaleString('tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 8
        });
    };

    const formatPercent = (percent: number | null | undefined) => {
        if (percent === null || percent === undefined) {
            return '-';
        }
        return `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;
    };

    const profitLoss = asset.holdings.profitLoss ?? 0;
    const profitLossPercent = asset.holdings.profitLossPercent ?? 0;
    const currentPrice = asset.currentPrice ? parseFloat(asset.currentPrice) : asset.holdings.averagePrice;
    const currentValue = asset.holdings.currentValue ?? asset.holdings.netAmount;

    const profitColor = profitLoss >= 0 ? "text-green-600" : "text-red-600";
    const dailyChangeColor = (dailyChange ?? 0) >= 0 ? "text-green-600" : "text-red-600";

    return (
        <Card 
            className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
            style={{ 
                borderLeftColor: profitLoss >= 0 ? "#10b981" : "#ef4444" 
            }}
            onClick={onAssetClick}
        >
            <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4">
                    {/* Left Section - Name & Current Price */}
                    <div className="flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{asset.name}</h3>
                                {asset.symbol && (
                                    <Badge variant="outline" className="text-xs">
                                        {asset.symbol}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">
                                    {formatCurrency(currentPrice)}
                                </span>
                                {dailyChange !== undefined && dailyChange !== 0 && (
                                    <span className={`text-sm font-medium ${dailyChangeColor}`}>
                                        {formatPercent(dailyChange)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Middle Section - Quantity & Cost */}
                    <div className="flex flex-col justify-between text-center border-l border-r px-4">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Adet</p>
                            <p className="text-xl font-semibold">
                                {formatQuantity(asset.holdings.netQuantity)}
                            </p>
                        </div>
                        <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Maliyet</p>
                            <p className="text-sm font-medium">
                                {formatCurrency(asset.holdings.averagePrice)}
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Total Value & P/L */}
                    <div className="flex flex-col justify-between text-right">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Toplam Değer</p>
                            <p className="text-2xl font-bold">
                                {formatCurrency(currentValue)}
                            </p>
                        </div>
                        <div className="mt-2">
                            <div className="flex items-center justify-end gap-1">
                                <p className={`text-lg font-semibold ${profitColor}`}>
                                    {formatCurrency(profitLoss)}
                                </p>
                                {profitLoss >= 0 ? (
                                    <TrendingUp className={`h-4 w-4 ${profitColor}`} />
                                ) : (
                                    <TrendingDown className={`h-4 w-4 ${profitColor}`} />
                                )}
                            </div>
                            <p className={`text-sm font-medium ${profitColor}`}>
                                {formatPercent(profitLossPercent)}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
