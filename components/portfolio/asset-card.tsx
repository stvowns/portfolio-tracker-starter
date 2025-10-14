"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Eye } from "lucide-react";
import { extractCurrencyFromName, getCurrencySymbol } from "@/lib/utils";

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
    
    // Nakit varlıkları için kendi para birimini kullan
    const effectiveCurrency = asset.assetType.toLowerCase() === 'cash' 
        ? (extractCurrencyFromName(asset.name) || currency)
        : currency;

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) {
            return effectiveCurrency === 'TRY' ? '₺0,00' : '$0.00';
        }
        
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: effectiveCurrency,
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
            <CardContent className="p-2.5">
                <div className="grid grid-cols-3 gap-4">
                    {/* Left Column - Name & Current Price */}
                    <div className="flex flex-col gap-1">
                        <h3 className="font-semibold text-sm">{asset.name}</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-medium">
                                {formatCurrency(currentPrice)}
                            </span>
                            {dailyChange !== undefined && dailyChange !== 0 && (
                                <span className={`text-xs ${dailyChangeColor}`}>
                                    {formatPercent(dailyChange)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Middle Column - Quantity & Cost */}
                    <div className="flex flex-col gap-1">
                        <div>
                            <span className="text-sm font-medium">
                                {formatQuantity(asset.holdings.netQuantity)}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">Adet</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Maliyet: <span className="text-foreground font-medium">
                                {formatCurrency(asset.holdings.averagePrice)}
                            </span>
                        </div>
                    </div>

                    {/* Right Column - Total Value & P/L */}
                    <div className="flex flex-col gap-1 text-right">
                        <p className="text-sm font-semibold">
                            {formatCurrency(currentValue)}
                        </p>
                        <div className={`text-xs ${profitColor}`}>
                            <span className="font-semibold">{formatCurrency(profitLoss)}</span>
                            <span className="ml-1">{formatPercent(profitLossPercent)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
