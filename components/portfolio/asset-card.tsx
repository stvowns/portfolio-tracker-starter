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
        <Card className="hover:shadow-md transition-all cursor-pointer bg-card/50" onClick={onAssetClick}>
            <CardContent className="p-2">
                {/* Header - Asset Name and Symbol */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h3 className="font-semibold text-xs truncate" title={asset.name}>
                            {asset.name}
                        </h3>
                        {asset.symbol && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0">
                                {asset.symbol}
                            </Badge>
                        )}
                    </div>
                    <Eye className="h-3 w-3 text-muted-foreground shrink-0" />
                </div>

                {/* Main Content - Desktop Layout */}
                <div className="hidden sm:block">
                    <div className="grid grid-cols-4 gap-2">
                        {/* Quantity */}
                        <div>
                            <div className="text-[10px] text-muted-foreground mb-0.5">Adet</div>
                            <div className="text-xs font-semibold">
                                {formatQuantity(asset.holdings.netQuantity)}
                            </div>
                        </div>

                        {/* Average Cost */}
                        <div>
                            <div className="text-[10px] text-muted-foreground mb-0.5">Ort. Maliyet</div>
                            <span className="text-xs font-semibold">{formatCurrency(asset.holdings.averagePrice)}</span>
                        </div>

                        {/* Total Value */}
                        <div>
                            <div className="text-[10px] text-muted-foreground mb-0.5">Değer</div>
                            <div className="text-sm font-bold">
                                {formatCurrency(currentValue)}
                            </div>
                        </div>

                        {/* Profit/Loss */}
                        <div>
                            <div className="text-[10px] text-muted-foreground mb-0.5">Kar/Zarar</div>
                            <div className={`text-xs font-bold ${profitLoss === 0 ? "text-muted-foreground" : profitColor}`}>
                                {formatCurrency(profitLoss)}
                            </div>
                            {profitLossPercent !== 0 && (
                                <div className={`text-[10px] font-medium ${profitColor} mt-0.5`}>
                                    {formatPercent(profitLossPercent)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="sm:hidden space-y-1.5">
                    {/* First Row - Quantity and Value */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <div className="text-[10px] text-muted-foreground mb-0.5">Adet</div>
                            <div className="text-xs font-semibold">
                                {formatQuantity(asset.holdings.netQuantity)}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] text-muted-foreground mb-0.5">Değer</div>
                            <div className="text-sm font-bold">
                                {formatCurrency(currentValue)}
                            </div>
                        </div>
                    </div>

                    {/* Second Row - Average Cost and Profit/Loss */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <div className="text-[10px] text-muted-foreground mb-0.5">Ort. Maliyet</div>
                            <span className="text-xs font-semibold">{formatCurrency(asset.holdings.averagePrice)}</span>
                        </div>
                        <div>
                            <div className="text-[10px] text-muted-foreground mb-0.5">Kar/Zarar</div>
                            <div className={`text-xs font-bold ${profitLoss === 0 ? "text-muted-foreground" : profitColor}`}>
                                {formatCurrency(profitLoss)}
                            </div>
                            {profitLossPercent !== 0 && (
                                <div className={`text-[10px] font-medium ${profitColor} mt-0.5`}>
                                    {formatPercent(profitLossPercent)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
