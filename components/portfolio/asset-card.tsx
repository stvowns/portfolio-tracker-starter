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
            className="hover:shadow-sm transition-shadow cursor-pointer"
            onClick={onAssetClick}
        >
            <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-3 items-center">
                    {/* Left Section - Name & Current Price */}
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base">{asset.name}</h3>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold">
                                {formatCurrency(currentPrice)}
                            </span>
                            {dailyChange !== undefined && dailyChange !== 0 && (
                                <span className={`text-xs font-medium ${dailyChangeColor}`}>
                                    {formatPercent(dailyChange)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Middle Section - Quantity & Cost */}
                    <div className="flex flex-col gap-0.5 text-center">
                        <div className="flex items-baseline justify-center gap-1">
                            <p className="text-sm font-semibold">
                                {formatQuantity(asset.holdings.netQuantity)}
                            </p>
                            <span className="text-xs text-muted-foreground">Adet</span>
                        </div>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-xs text-muted-foreground">Maliyet:</span>
                            <p className="text-xs font-medium">
                                {formatCurrency(asset.holdings.averagePrice)}
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Total Value & P/L */}
                    <div className="flex flex-col gap-0.5 text-right">
                        <p className="text-sm font-semibold">
                            {formatCurrency(currentValue)}
                        </p>
                        <div className="flex items-baseline justify-end gap-1">
                            <p className={`text-xs font-semibold ${profitColor}`}>
                                {formatCurrency(profitLoss)}
                            </p>
                            <p className={`text-xs font-medium ${profitColor}`}>
                                {formatPercent(profitLossPercent)}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
