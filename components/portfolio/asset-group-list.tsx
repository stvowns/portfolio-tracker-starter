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
            'stock': 'Hisse (BIST)',
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
            'stock': '📈',
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
            
            // CASH varlıkları için currency bazlı grupla
            let groupKey = type;
            if (type === 'cash' && asset.name) {
                const currencyMatch = asset.name.match(/Nakit\s*\(?\s*(\w+)\)?/i);
                if (currencyMatch) {
                    groupKey = `cash_${currencyMatch[1].toLowerCase()}`;
                }
            }

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

                // Label belirle
                let label = getAssetTypeLabel(key.split('_')[0]);
                if (key.startsWith('cash_')) {
                    const currencyCode = key.split('_')[1].toUpperCase();
                    label = `Nakit (${currencyCode})`;
                }

                return {
                    key,
                    label,
                    emoji: getAssetTypeEmoji(key.split('_')[0]),
                    assets: groupAssets,
                    totalValue,
                    profitLoss,
                    count: groupAssets.length
                };
            })
            .sort((a, b) => {
                // CASH önce, sonra değere göre
                if (a.key.startsWith('cash') && !b.key.startsWith('cash')) return -1;
                if (!a.key.startsWith('cash') && b.key.startsWith('cash')) return 1;
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

    return (
        <div className="space-y-2">
            {groups.map(group => {
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
                                    className="w-full justify-between p-4 h-auto hover:bg-muted/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">{group.emoji}</div>
                                        <div className="flex flex-col items-start">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-lg">{group.label}</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {group.count}
                                                </Badge>
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {formatCurrency(group.totalValue)}
                                                {group.profitLoss !== 0 && (
                                                    <span className={`ml-2 ${profitColor}`}>
                                                        {group.profitLoss >= 0 ? '+' : ''}
                                                        {formatCurrency(group.profitLoss)}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {isOpen ? (
                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="pt-0 pb-3 space-y-2">
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
