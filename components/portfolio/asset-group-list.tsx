"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AssetCard } from "./asset-card";
import { extractCurrencyFromName, getCurrencySymbol } from "@/lib/utils";

interface Asset {
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
        totalTransactions: number;
    };
}

interface AssetGroup {
    key: string;
    label: string;
    emoji: string;
    assets: Asset[];
    totalValue: number;
    profitLoss: number;
    count: number;
}

interface AssetGroupListProps {
    assets: Asset[];
    currency: string;
    onAssetClick: (asset: Asset) => void;
    formatCurrency: (amount: number | null | undefined) => string;
}

export function AssetGroupList({
    assets,
    currency,
    onAssetClick,
    formatCurrency
}: AssetGroupListProps) {
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["cash", "gold", "stock"]));

    const toggleGroup = (key: string) => {
        const newOpenGroups = new Set(openGroups);
        if (newOpenGroups.has(key)) {
            newOpenGroups.delete(key);
        } else {
            newOpenGroups.add(key);
        }
        setOpenGroups(newOpenGroups);
    };

    const getAssetTypeLabel = (type: string): string => {
        const labels: Record<string, string> = {
            'cash': 'Nakit',
            'gold': 'Altın',
            'silver': 'Gümüş',
            'stock': 'BIST',
            'international_stock': 'Yabancı Hisse',
            'fund': 'Fon',
            'crypto': 'Kripto',
            'bond': 'Tahvil',
            'eurobond': 'Eurobond',
            'etf': 'ETF',
            'commodity': 'Emtia'
        };
        return labels[type] || type;
    };

    const getAssetTypeEmoji = (type: string): string => {
        const emojis: Record<string, string> = {
            'cash': '💵',
            'gold': '🪙',
            'silver': '🥈',
            'stock': '🇹🇷',
            'international_stock': '🌍',
            'fund': '💰',
            'crypto': '₿',
            'bond': '📕',
            'eurobond': '📕',
            'etf': '📦',
            'commodity': '🌾'
        };
        return emojis[type] || '📊';
    };

    // Varlıkları gruplara ayır
    const groupAssets = (): AssetGroup[] => {
        const groups = new Map<string, Asset[]>();

        assets.forEach(asset => {
            const type = asset.assetType.toLowerCase();
            const groupKey = type; // Tüm cash varlıkları tek grupta

            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey)!.push(asset);
        });

        // Gruplara dönüştür ve sırala
        return Array.from(groups.entries())
            .map(([key, groupAssets]) => {
                const totalValue = groupAssets.reduce((sum, a) => sum + (a.holdings.currentValue || 0), 0);
                const totalCost = groupAssets.reduce((sum, a) => sum + a.holdings.netAmount, 0);
                const profitLoss = totalValue - totalCost;

                return {
                    key,
                    label: getAssetTypeLabel(key),
                    emoji: getAssetTypeEmoji(key),
                    assets: groupAssets,
                    totalValue,
                    profitLoss,
                    count: groupAssets.length
                };
            })
            .sort((a, b) => {
                // CASH önce, sonra değere göre
                if (a.key === 'cash' && b.key !== 'cash') return -1;
                if (a.key !== 'cash' && b.key === 'cash') return 1;
                return b.totalValue - a.totalValue;
            });
    };

    const groups = groupAssets();

    if (groups.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Henüz varlık bulunmuyor</p>
                </CardContent>
            </Card>
        );
    }

    // Nakit varlıklarını formatlayan yardımcı fonksiyon
    const formatCashAmount = (asset: Asset) => {
        const currencyCode = extractCurrencyFromName(asset.name) || 'TRY';
        const symbol = getCurrencySymbol(currencyCode);
        const amount = asset.holdings.currentValue || asset.holdings.netAmount;
        
        return new Intl.NumberFormat("tr-TR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="space-y-1.5">
            {groups.map(group => {
                // Nakit varlıkları için özel görünüm
                if (group.key === 'cash') {
                    return (
                        <Card key={group.key}>
                            <CardContent className="p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="text-base">{group.emoji}</div>
                                    <span className="font-semibold text-sm">{group.label}</span>
                                    <Badge variant="secondary" className="text-xs h-4 px-1">
                                        {group.count}
                                    </Badge>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {group.assets.map(asset => {
                                        const currencyCode = extractCurrencyFromName(asset.name) || 'TRY';
                                        const symbol = getCurrencySymbol(currencyCode);
                                        const amount = formatCashAmount(asset);
                                        
                                        return (
                                            <Card 
                                                key={asset.id}
                                                className="hover:shadow-sm transition-shadow cursor-pointer bg-muted/30 flex-1 min-w-0"
                                                onClick={() => onAssetClick(asset)}
                                            >
                                                <CardContent className="p-2 flex items-center justify-center gap-1">
                                                    <span className="text-xs text-muted-foreground">{currencyCode}:</span>
                                                    <span className="text-sm font-bold">{symbol}{amount}</span>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    );
                }

                // Diğer varlık tipleri için akordion görünüm
                const isOpen = openGroups.has(group.key);
                const profitColor = group.profitLoss >= 0 ? "text-green-600" : "text-red-600";

                return (
                    <Collapsible
                        key={group.key}
                        open={isOpen}
                        onOpenChange={() => toggleGroup(group.key)}
                    >
                        <Card className="overflow-hidden">
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-between p-3 h-auto hover:bg-muted/50"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="text-xl">{group.emoji}</div>
                                        <div className="flex flex-col items-start">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-base">{group.label}</span>
                                                <Badge variant="secondary" className="text-xs h-4 px-1">
                                                    {group.count}
                                                </Badge>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xs font-medium">
                                                    {formatCurrency(group.totalValue)}
                                                </span>
                                                {group.profitLoss !== 0 && (
                                                    <span className={`text-xs font-medium ${profitColor}`}>
                                                        {group.profitLoss >= 0 ? '+' : ''}
                                                        {formatCurrency(group.profitLoss)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {isOpen ? (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="pt-0 pb-1 px-2 space-y-1.5">
                                    {group.assets.map(asset => (
                                        <AssetCard
                                            key={asset.id}
                                            asset={asset}
                                            currency={currency}
                                            onAssetClick={() => onAssetClick(asset)}
                                            dailyChange={undefined}
                                        />
                                    ))}
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                );
            })}
        </div>
    );
}
