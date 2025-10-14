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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Eye, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { AddTransactionDialog } from "./add-transaction-dialog";

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

interface TransactionData {
    assetType: string;
    assetName: string;
    transactionType: "BUY" | "SELL";
    quantity: number;
    pricePerUnit: number;
}

interface AssetsTableProps {
    assets: Asset[];
    isLoading?: boolean;
    currency?: string;
    onAssetClick?: (asset: Asset) => void;
    onAddTransaction?: () => void;
    onTransactionAdded?: () => void;
    onNewAssetAdded?: (transactionData: TransactionData) => void;
    onAssetDeleted?: () => void;
}

// Kategori tanımları
type AssetCategory = 
    | "ALL"
    | "CASH"
    | "GOLD"
    | "SILVER"
    | "STOCK_BIST"
    | "STOCK_INTERNATIONAL"
    | "ETF"
    | "FUND"
    | "CRYPTO"
    | "EUROBOND";

const CATEGORY_CONFIG = {
    ALL: { label: "Tümü", icon: "📊", color: "default" },
    CASH: { label: "Nakit", icon: "💵", color: "green" },
    GOLD: { label: "Altın", icon: "🪙", color: "yellow" },
    SILVER: { label: "Gümüş", icon: "⚪", color: "gray" },
    STOCK_BIST: { label: "BIST", icon: "🇹🇷", color: "blue" },
    STOCK_INTERNATIONAL: { label: "Yabancı Hisse", icon: "🌍", color: "blue" },
    ETF: { label: "ETF", icon: "📦", color: "purple" },
    FUND: { label: "Yatırım Fonları", icon: "💰", color: "green" },
    CRYPTO: { label: "Kripto", icon: "₿", color: "orange" },
    EUROBOND: { label: "Eurobond", icon: "📕", color: "red" },
} as const;

export function AssetsTable({ 
    assets, 
    isLoading = false, 
    currency = "TRY",
    onAssetClick,
    onAddTransaction,
    onTransactionAdded,
    onNewAssetAdded,
    onAssetDeleted
}: AssetsTableProps) {
    const [isClient, setIsClient] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<AssetCategory>("ALL");

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleAddTransactionSuccess = () => {
        setIsDialogOpen(false);
        onTransactionAdded?.();
    };

    const handleDeleteAsset = async (assetId: string, assetName: string) => {
        if (!confirm(`"${assetName}" varlığını ve tüm işlemlerini silmek istediğinizden emin misiniz?`)) {
            return;
        }

        setDeletingAssetId(assetId);
        try {
            const response = await fetch(`/api/portfolio/assets/${assetId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                onAssetDeleted?.();
            } else {
                const result = await response.json();
                alert(`Silme hatası: ${result.error || 'Bilinmeyen hata'}`);
            }
        } catch (error) {
            console.error("Asset silme hatası:", error);
            alert("Varlık silinirken bir hata oluştu.");
        } finally {
            setDeletingAssetId(null);
        }
    };

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) {
            return '₺0,00';
        }
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

    // Miktar formatlaması - akıllıca (tam sayılar için ondalık yok, kripto için esnek)
    const formatQuantity = (quantity: number) => {
        // Tam sayı ise, ondalık gösterme
        if (Number.isInteger(quantity)) {
            return quantity.toLocaleString('tr-TR');
        }
        
        // Ondalık varsa, maksimum 8 basamak göster ama trailing zeros'ları kaldır
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

    // Varlık kategorisini belirle
    const getAssetCategory = (asset: Asset): AssetCategory[] => {
        const categories: AssetCategory[] = ["ALL"];
        
        switch (asset.assetType) {
            case "CASH":
                categories.push("CASH");
                break;
            case "GOLD":
                categories.push("GOLD");
                break;
            case "SILVER":
                categories.push("SILVER");
                break;
            case "STOCK":
                // ETF kontrolü
                if (asset.category?.toUpperCase() === "ETF") {
                    categories.push("ETF");
                    break;
                }
                
                // Hisse senedi için yerli/yabancı ayrımı
                const isBIST = 
                    asset.category?.toUpperCase() === "BIST" ||
                    asset.symbol?.endsWith(".IS") ||
                    asset.symbol?.endsWith(".E");
                categories.push(isBIST ? "STOCK_BIST" : "STOCK_INTERNATIONAL");
                break;
            case "FUND":
                // ETF kontrolü (fonlar da ETF olabilir)
                if (asset.category?.toUpperCase() === "ETF") {
                    categories.push("ETF");
                } else {
                    categories.push("FUND");
                }
                break;
            case "CRYPTO":
                categories.push("CRYPTO");
                break;
            case "EUROBOND":
                categories.push("EUROBOND");
                break;
        }
        
        return categories;
    };

    // Aktif kategoriye göre varlıkları filtrele
    const filterAssetsByCategory = (category: AssetCategory) => {
        if (category === "ALL") return assets;
        return assets.filter(asset => getAssetCategory(asset).includes(category));
    };

    // Kategoriye göre özet bilgiler
    const getCategorySummary = (category: AssetCategory) => {
        const categoryAssets = filterAssetsByCategory(category);
        const totalValue = categoryAssets.reduce((sum, asset) => 
            sum + (asset.holdings.currentValue ?? 0), 0
        );
        const totalCost = categoryAssets.reduce((sum, asset) => 
            sum + asset.holdings.netAmount, 0
        );
        const profitLoss = totalValue - totalCost;
        const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
        
        return {
            count: categoryAssets.length,
            totalValue,
            totalCost,
            profitLoss,
            profitLossPercent
        };
    };

    const getAssetTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            "CASH": "Nakit",
            "GOLD": "Altın",
            "SILVER": "Gümüş",
            "STOCK": "BIST",
            "INTERNATIONAL_STOCK": "Yabancı Hisse",
            "FUND": "Yatırım Fonu",
            "CRYPTO": "Kripto Para",
            "EUROBOND": "Eurobond",
            "ETF": "ETF"
        };
        return labels[type] || type;
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
                        <AddTransactionDialog
                            trigger={
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    İlk İşlemi Ekle
                                </Button>
                            }
                            onSuccess={handleAddTransactionSuccess}
                            open={isDialogOpen}
                            onOpenChange={setIsDialogOpen}
                            onNewAssetAdded={onNewAssetAdded}
                        />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const filteredAssets = filterAssetsByCategory(activeCategory);
    const categorySummary = getCategorySummary(activeCategory);

    // Kasadaki TL miktarını hesapla
    const getAvailableCashTRY = () => {
        const cashAssets = assets.filter(a => a.assetType === "CASH" && a.name.includes("TRY"));
        return cashAssets.reduce((sum, asset) => sum + (asset.holdings.currentValue || 0), 0);
    };

    const availableCashTRY = getAvailableCashTRY();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Varlıklarım</CardTitle>
                        <CardDescription>
                            {categorySummary.count} varlık • {formatCurrency(categorySummary.totalValue)}
                            {categorySummary.profitLoss !== 0 && (
                                <span className={categorySummary.profitLoss >= 0 ? "text-green-600" : "text-red-600"}>
                                    {" • "}
                                    {formatPercent(categorySummary.profitLossPercent)}
                                </span>
                            )}
                        </CardDescription>
                    </div>
                    <AddTransactionDialog
                        trigger={
                            <Button size="sm" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Yeni İşlem
                            </Button>
                        }
                        onSuccess={handleAddTransactionSuccess}
                        open={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                        onNewAssetAdded={onNewAssetAdded}
                        defaultValues={{
                            availableCash: availableCashTRY
                        }}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as AssetCategory)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-10 mb-4">
                        {(Object.keys(CATEGORY_CONFIG) as AssetCategory[]).map((category) => {
                            const summary = getCategorySummary(category);
                            const config = CATEGORY_CONFIG[category];
                            
                            return (
                                <TabsTrigger key={category} value={category} className="text-xs">
                                    <span className="mr-1">{config.icon}</span>
                                    {config.label}
                                    {summary.count > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                                            {summary.count}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {(Object.keys(CATEGORY_CONFIG) as AssetCategory[]).map((category) => (
                        <TabsContent key={category} value={category}>
                            {filterAssetsByCategory(category).length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-4xl mb-2">{CATEGORY_CONFIG[category].icon}</div>
                                    <p className="text-muted-foreground mb-4">
                                        {category === "ALL" 
                                            ? "Henüz hiç varlığınız yok" 
                                            : `${CATEGORY_CONFIG[category].label} kategorisinde varlık yok`}
                                    </p>
                                    <AddTransactionDialog
                                        trigger={
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <Plus className="h-4 w-4" />
                                                İşlem Ekle
                                            </Button>
                                        }
                                        onSuccess={handleAddTransactionSuccess}
                                        onNewAssetAdded={onNewAssetAdded}
                                    />
                                </div>
                            ) : (
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Varlık</TableHead>
                                <TableHead className="text-right">Miktar</TableHead>
                                <TableHead className="text-right">Ort. Maliyet</TableHead>
                                <TableHead className="text-right">Mevcut Değer</TableHead>
                                <TableHead className="text-right">K/Z</TableHead>
                                <TableHead className="text-right">K/Z %</TableHead>
                                <TableHead className="text-center">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filterAssetsByCategory(category).map((asset) => {
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
                                                    {formatQuantity(asset.holdings.netQuantity)}
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
                                            <div className="flex items-center justify-center gap-1">
                                                {onAssetClick && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAssetClick(asset);
                                                        }}
                                                        title="Detayları Gör"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteAsset(asset.id, asset.name);
                                                    }}
                                                    disabled={deletingAssetId === asset.id}
                                                    title="Sil"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}

// Add CSS for responsive table (optional - can add to globals.css)
// @media (max-width: 640px) {
//   .assets-table-responsive {
//     overflow-x: auto;
//   }
// }
