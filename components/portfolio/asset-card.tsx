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

    // Use the current price from database
    const displayPrice = parseFloat(asset.currentPrice || '0');
    const priceDisplayText = formatCurrency(displayPrice);

    // Use calculated currentValue from API
    const currentValue = asset.holdings.currentValue;

    const profitColor = profitLoss >= 0 ? "text-green-600" : "text-red-600";
    const dailyChangeColor = (dailyChange ?? 0) >= 0 ? "text-green-600" : "text-red-600";

    return (
        <div className="grid grid-cols-5 gap-2" onClick={onAssetClick}>
            {/* Asset Name */}
            <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="p-2">
                    <div className="text-xs text-muted-foreground mb-1">Varlık</div>
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-xs truncate" title={asset.name}>
                            {asset.name.length > 20 ? `${asset.name.substring(0, 20)}...` : asset.name}
                        </h3>
                        {asset.symbol && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 ml-1">
                                {asset.symbol}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Quantity */}
            <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="p-2">
                    <div className="text-xs text-muted-foreground mb-1">Adet</div>
                    <div className="text-xs font-semibold">
                        {formatQuantity(asset.holdings.netQuantity)}
                    </div>
                </CardContent>
            </Card>

            {/* Average Cost */}
            <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="p-2">
                    <div className="text-xs text-muted-foreground mb-1">Ort. Maliyet</div>
                    <span className="text-xs font-semibold">{formatCurrency(asset.holdings.averagePrice)}</span>
                </CardContent>
            </Card>

            {/* Total Value */}
            <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="p-2">
                    <div className="text-xs text-muted-foreground mb-1">Değer</div>
                    <div className="text-sm font-bold">
                        {formatCurrency(currentValue)}
                    </div>
                </CardContent>
            </Card>

            {/* Profit/Loss */}
            <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="p-2">
                    <div className="text-xs text-muted-foreground mb-1">Kar/Zarar</div>
                    <div className={`text-xs font-bold ${profitLoss === 0 ? "text-muted-foreground" : profitColor}`}>
                        {formatCurrency(profitLoss)}
                    </div>
                    {profitLossPercent !== 0 && (
                        <div className={`text-[10px] font-medium ${profitColor} mt-0.5`}>
                            {formatPercent(profitLossPercent)}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
