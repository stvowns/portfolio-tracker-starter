"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Calendar,
    Plus,
    Minus,
    ArrowRight,
    AlertTriangle
} from "lucide-react";
import { AddTransactionDialog } from "./add-transaction-dialog";
import { GoldPieChart } from "./gold-pie-chart";
import { GOLD_TYPES, SILVER_TYPES } from "@/lib/services/gold-price-service";

interface Transaction {
    id: string;
    assetId: string;
    assetName: string;
    assetSymbol: string;
    assetType: string;
    transactionType: "BUY" | "SELL";
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
    transactionDate: string;
    notes?: string;
}

interface Asset {
    id: string;
    name: string;
    symbol?: string;
    assetType: string;
    holdings: {
        netQuantity: number;
        averagePrice: number;
        currentValue: number | null;
        netAmount: number;
        profitLoss?: number | null;
        profitLossPercent?: number | null;
    };
    currentPrice?: string;
}

interface AssetDetailModalProps {
    asset: Asset | null;
    isOpen: boolean;
    onClose: () => void;
    onTransactionAdded?: () => void;
    availableCash?: number;
}

export function AssetDetailModal({ 
    asset, 
    isOpen, 
    onClose, 
    onTransactionAdded,
    availableCash = 0 
}: AssetDetailModalProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
    const [currency, setCurrency] = useState<"TRY" | "USD" | "EUR">("TRY");
    const [transactionDialogDefaults, setTransactionDialogDefaults] = useState<{
        assetType: string;
        assetName: string;
        transactionType: "BUY" | "SELL";
        pricePerUnit?: number;
        quantity?: number;
    } | null>(null);
    const [goldPrices, setGoldPrices] = useState<{ [key: string]: number }>({});
    const [goldPricesLoading, setGoldPricesLoading] = useState(false);
    const [silverPrices, setSilverPrices] = useState<{ [key: string]: number }>({});
    const [silverPricesLoading, setSilverPricesLoading] = useState(false);
    const [allGoldHoldings, setAllGoldHoldings] = useState<any[]>([]);

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) {
            return currency === "TRY" ? '₺0,00' : currency === "USD" ? '$0.00' : '€0.00';
        }
        
        // Kur çevrimi (basit - daha sonra API'den alınabilir)
        let displayAmount = amount;
        if (currency === "USD") {
            displayAmount = amount / 34; // 1 USD = 34 TRY
        } else if (currency === "EUR") {
            displayAmount = amount / 37; // 1 EUR = 37 TRY
        }
        
        const locale = currency === "TRY" ? 'tr-TR' : currency === "USD" ? 'en-US' : 'de-DE';
        
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(displayAmount);
    };

    // Miktar formatlaması - akıllıca
    const formatQuantity = (quantity: number) => {
        // Tam sayı ise, ondalık gösterme
        if (Number.isInteger(quantity)) {
            return quantity.toString();
        }
        
        // Ondalık varsa, maksimum 8 basamak göster ama trailing zeros'ları kaldır
        // 0.00042 -> "0.00042", 1.5 -> "1.5", 1.50000 -> "1.5"
        return parseFloat(quantity.toFixed(8)).toString();
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getAssetTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            "CASH": "Nakit",
            "GOLD": "Altın",
            "SILVER": "Gümüş", 
            "STOCK": "Hisse Senedi",
            "FUND": "Yatırım Fonu",
            "CRYPTO": "Kripto Para",
            "EUROBOND": "Eurobond",
            "ETF": "ETF"
        };
        return labels[type] || type;
    };

    const getTransactionTypeColor = (type: string) => {
        return type === "BUY" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";
    };

    const fetchTransactions = useCallback(async () => {
        if (!asset?.id) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/portfolio/transactions?assetId=${asset.id}`);
            if (response.ok) {
                const result = await response.json();
                setTransactions(result.success ? result.data.transactions : []);
            } else {
                console.error("Failed to fetch transactions");
                setTransactions([]);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, [asset?.id]);

    const fetchGoldPrices = useCallback(async () => {
        setGoldPricesLoading(true);
        try {
            const response = await fetch('/api/gold/prices');
            const data = await response.json();

            if (data.success) {
                const prices: { [key: string]: number } = {};
                data.data.forEach((gold: any) => {
                    prices[gold.type.id] = gold.price;
                });
                setGoldPrices(prices);
            }
        } catch (error) {
            console.error('Error fetching gold prices:', error);
        } finally {
            setGoldPricesLoading(false);
        }
    }, []);

    const fetchSilverPrices = useCallback(async () => {
        setSilverPricesLoading(true);
        try {
            const response = await fetch('/api/silver/prices');
            const data = await response.json();

            if (data.success) {
                const prices: { [key: string]: number } = {};
                data.data.forEach((silver: any) => {
                    prices[silver.type.id] = silver.price;
                });
                setSilverPrices(prices);
            }
        } catch (error) {
            console.error('Error fetching silver prices:', error);
        } finally {
            setSilverPricesLoading(false);
        }
    }, []);

    const fetchAllGoldHoldings = useCallback(async () => {
        try {
            const response = await fetch('/api/portfolio/assets?assetType=GOLD');
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && Array.isArray(result.data.assets)) {
                    const validAssets = result.data.assets.filter((asset: any) => 
                        asset && 
                        asset.holdings && 
                        asset.holdings.netQuantity > 0 &&
                        asset.assetName
                    );
                    console.log('Filtered gold assets:', validAssets);
                    setAllGoldHoldings(validAssets);
                } else {
                    console.warn('Invalid response structure:', result);
                    setAllGoldHoldings([]);
                }
            }
        } catch (error) {
            console.error('Error fetching gold holdings:', error);
            setAllGoldHoldings([]);
        }
    }, []);

    // Function to add new transaction to the list
    const addTransactionToList = (transactionData: { transactionType: "BUY" | "SELL"; quantity: number; pricePerUnit: number; notes?: string }) => {
        if (!asset) return;
        
        const newTransaction = {
            id: `tx_new_${Date.now()}`,
            assetId: asset.id,
            assetName: asset.name,
            assetSymbol: "",
            assetType: asset.assetType,
            transactionType: transactionData.transactionType,
            quantity: transactionData.quantity,
            pricePerUnit: transactionData.pricePerUnit,
            totalAmount: transactionData.quantity * transactionData.pricePerUnit,
            transactionDate: new Date().toISOString(),
            notes: transactionData.notes || "Modal'dan eklendi"
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
    };

    useEffect(() => {
        if (isOpen && asset?.id) {
            fetchTransactions();
            // Asset'in currency'sine göre default currency'yi set et
            // For now, default to TRY since currency field is not in the Asset interface
            setCurrency("TRY");

            // Altın varlığı ise altın fiyatlarını ve tüm altın varlıklarını çek
            if (asset.assetType.toLowerCase() === 'gold') {
                fetchGoldPrices();
                fetchAllGoldHoldings();
            }
            // Gümüş varlığı ise gümüş fiyatlarını da çek
            if (asset.assetType.toLowerCase() === 'silver') {
                fetchSilverPrices();
            }
        }
    }, [isOpen, asset?.id, fetchTransactions, fetchGoldPrices, fetchAllGoldHoldings, asset?.assetType]);

    const handleTransactionAdded = async (transactionData?: { transactionType: "BUY" | "SELL"; quantity: number; pricePerUnit: number; notes?: string }) => {
        // Transaction listesini backend'den yeniden çek (gerçek veriyi almak için)
        await fetchTransactions();
        
        // Dashboard'ı güncelle
        if (onTransactionAdded) {
            onTransactionAdded();
        }
    };

    if (!asset) return null;

    const holdings = asset.holdings || {};
    const currentPrice = parseFloat(asset.currentPrice || "0");
    const netQuantity = holdings.netQuantity || 0;
    const averagePrice = holdings.averagePrice || 0;
    const netAmount = holdings.netAmount || (averagePrice * netQuantity);
    
    // Use API calculated values
    const currentValue = holdings.currentValue;
    const profitLoss = holdings.profitLoss ?? 0;
    const profitLossPercent = holdings.profitLossPercent ?? 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] overflow-y-auto overflow-x-hidden p-3 sm:p-6">
                <DialogHeader className="space-y-2 pb-2">
                    <DialogTitle className="sr-only">Varlık Detayları</DialogTitle>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                            <div className="text-base sm:text-lg font-bold break-words leading-tight flex-1" title={asset.name} style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3em'}}>
                                {asset.name}
                            </div>
                            <Badge variant="secondary" className="shrink-0 text-xs mt-1">
                                {getAssetTypeLabel(asset.assetType)}
                            </Badge>
                        </div>
                        <Select value={currency} onValueChange={(v) => setCurrency(v as "TRY" | "USD" | "EUR")}>
                            <SelectTrigger className="w-28 shrink-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TRY">₺ TRY</SelectItem>
                                <SelectItem value="USD">$ USD</SelectItem>
                                <SelectItem value="EUR">€ EUR</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogDescription className="text-xs sm:text-sm">
                        Varlık detayları ve işlem geçmişi
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:gap-4">
                    {/* Summary Cards */}
                    {asset.assetType.toLowerCase() === 'cash' ? (
                        // Nakit için basit görünüm
                        <div className="grid gap-2 sm:gap-3 grid-cols-1">
                            <Card>
                                <CardContent className="py-6">
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <p className="text-sm text-muted-foreground mb-2">Bakiye</p>
                                        <div className="text-3xl font-bold">
                                            {formatCurrency(currentValue)}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {formatQuantity(netQuantity)} {asset.symbol || "birim"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        // Diğer varlıklar için detaylı görünüm
                        <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                    <CardTitle className="text-xs font-medium text-muted-foreground">Miktar</CardTitle>
                                    <Wallet className="h-3 w-3 text-muted-foreground" />
                                </CardHeader>
                                <CardContent className="pb-2 pt-0">
                                    <div className="flex flex-col items-center justify-center min-h-[2.5rem] text-center">
                                        <div className="text-sm font-bold leading-tight">
                                            {formatQuantity(netQuantity)}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            {asset.symbol || "adet"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                    <CardTitle className="text-xs font-medium text-muted-foreground">Ort. Maliyet</CardTitle>
                                    <TrendingDown className="h-3 w-3 text-muted-foreground" />
                                </CardHeader>
                                <CardContent className="pb-2 pt-0">
                                    <div className="flex flex-col items-center justify-center min-h-[2.5rem] text-center">
                                        <div className="text-sm font-bold leading-tight break-all">
                                            {formatCurrency(averagePrice)}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            Birim başı
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                    <CardTitle className="text-xs font-medium text-muted-foreground">Mevcut Değer</CardTitle>
                                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                </CardHeader>
                                <CardContent className="pb-2 pt-0">
                                    <div className="flex flex-col items-center justify-center min-h-[2.5rem] text-center">
                                        <div className="text-sm font-bold leading-tight break-all">
                                            {formatCurrency(currentValue)}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">
                                            Toplam
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                    <CardTitle className="text-xs font-medium text-muted-foreground">Kar/Zarar</CardTitle>
                                    {profitLoss >= 0 ?
                                        <TrendingUp className="h-3 w-3 text-green-600" /> :
                                        <TrendingDown className="h-3 w-3 text-red-600" />
                                    }
                                </CardHeader>
                                <CardContent className="pb-2 pt-0">
                                    <div className="flex flex-col items-center justify-center min-h-[2.5rem] text-center">
                                        <div className={`text-sm font-bold leading-tight break-all ${
                                            profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {formatCurrency(profitLoss)}
                                        </div>
                                        <p className={`text-[10px] ${
                                            profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Gold Pie Chart - Sadece altın varlıkları için */}
                    {asset.assetType.toLowerCase() === 'gold' && allGoldHoldings.length > 1 && (
                        <GoldPieChart 
                            goldHoldings={allGoldHoldings}
                            currency={currency}
                        />
                    )}

                    {/* Altın Fiyatları - Sadece altın varlıkları için */}
                    {asset.assetType.toLowerCase() === 'gold' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold">Diğer Altın Fiyatları</h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        Anlık altın çeşitleri fiyatları
                                    </p>
                                </div>
                                <Button
                                    onClick={fetchGoldPrices}
                                    disabled={goldPricesLoading}
                                    variant="outline"
                                    size="sm"
                                >
                                    {goldPricesLoading ? 'Yükleniyor...' : 'Yenile'}
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                {GOLD_TYPES.map((goldType) => {
                                    const price = goldPrices[goldType.id];
                                    const isCurrentAsset = asset.name.toLowerCase().includes(goldType.name.toLowerCase()) ||
                                                           asset.name.toLowerCase().includes(goldType.id);

                                    return (
                                        <Card
                                            key={goldType.id}
                                            className={`${isCurrentAsset ? 'ring-2 ring-primary' : ''} ${!price ? 'opacity-50' : ''}`}
                                        >
                                            <CardContent className="p-3">
                                                <div className="text-center">
                                                    <div className="text-xs text-muted-foreground mb-1">
                                                        {goldType.name}
                                                    </div>
                                                    <div className="text-sm font-bold">
                                                        {price
                                                            ? new Intl.NumberFormat('tr-TR', {
                                                                style: 'currency',
                                                                currency: 'TRY',
                                                                minimumFractionDigits: 2
                                                            }).format(price)
                                                            : 'Yükleniyor...'
                                                        }
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground mt-1">
                                                        {goldType.grams} gram
                                                    </div>
                                                    {isCurrentAsset && (
                                                        <Badge variant="default" className="text-[10px] mt-1 h-4">
                                                            Bu varlık
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Gümüş Fiyatları - Sadece gümüş varlıkları için */}
                    {asset.assetType.toLowerCase() === 'silver' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold">Diğer Gümüş Fiyatları</h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        Anlık gümüş çeşitleri fiyatları
                                    </p>
                                </div>
                                <Button
                                    onClick={fetchSilverPrices}
                                    disabled={silverPricesLoading}
                                    variant="outline"
                                    size="sm"
                                >
                                    {silverPricesLoading ? 'Yükleniyor...' : 'Yenile'}
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                {SILVER_TYPES.map((silverType) => {
                                    const price = silverPrices[silverType.id];
                                    const isCurrentAsset = asset.name.toLowerCase().includes(silverType.name.toLowerCase()) ||
                                                           asset.name.toLowerCase().includes(silverType.id);

                                    return (
                                        <Card
                                            key={silverType.id}
                                            className={`${isCurrentAsset ? 'ring-2 ring-primary' : ''} ${!price ? 'opacity-50' : ''}`}
                                        >
                                            <CardContent className="p-3">
                                                <div className="text-center">
                                                    <div className="text-xs text-muted-foreground mb-1">
                                                        {silverType.name}
                                                    </div>
                                                    <div className="text-sm font-bold">
                                                        {price
                                                            ? new Intl.NumberFormat('tr-TR', {
                                                                style: 'currency',
                                                                currency: 'TRY',
                                                                minimumFractionDigits: 2
                                                            }).format(price)
                                                            : 'Yükleniyor...'
                                                        }
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground mt-1">
                                                        {silverType.grams} gram
                                                    </div>
                                                    {isCurrentAsset && (
                                                        <Badge variant="default" className="text-[10px] mt-1 h-4">
                                                            Bu varlık
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <Separator className="my-2" />

                    {/* Transactions Section */}
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold">İşlem Geçmişi</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Bu varlık için yapılan alım/satım işlemleri
                                </p>
                            </div>
                            <Button 
                                onClick={() => {
                                    setTransactionDialogDefaults({
                                        assetType: asset.assetType,
                                        assetName: asset.name,
                                        transactionType: "BUY"
                                    });
                                    setIsAddTransactionOpen(true);
                                }}
                                size="sm"
                                className="w-full sm:w-auto"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Yeni İşlem
                            </Button>
                        </div>

                        {loading ? (
                            <Card>
                                <CardContent className="py-8">
                                    <div className="animate-pulse space-y-4">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="h-16 bg-muted rounded-lg" />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : transactions.length > 0 ? (
                            <Card>
                                <CardContent className="p-1 sm:p-2">
                                    <div className="space-y-0">
                                        {transactions.map((transaction, index) => (
                                            <div 
                                                key={transaction.id}
                                                className={`p-2 sm:p-3 hover:bg-muted/50 transition-colors ${
                                                    index !== transactions.length - 1 ? 'border-b' : ''
                                                }`}
                                            >
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1 w-full sm:w-auto">
                                                        <div className={`p-1.5 sm:p-2 rounded-full shrink-0 ${
                                                            transaction.transactionType === "BUY" 
                                                                ? 'bg-green-100 text-green-600' 
                                                                : 'bg-red-100 text-red-600'
                                                        }`}>
                                                            {transaction.transactionType === "BUY" ? 
                                                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" /> : 
                                                                <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                                            }
                                                        </div>
                                                        <div className="space-y-1 min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <Badge 
                                                                    variant="secondary" 
                                                                    className={`${getTransactionTypeColor(transaction.transactionType)} text-xs shrink-0`}
                                                                >
                                                                    {transaction.transactionType === "BUY" ? 'Alış' : 'Satış'}
                                                                </Badge>
                                                                <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 shrink-0">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {formatDate(transaction.transactionDate)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                                                                    {formatQuantity(transaction.quantity)} adet
                                                                </span>
                                                                <span className="text-muted-foreground">×</span>
                                                                <span className="font-mono text-xs sm:text-sm break-all">
                                                                    {formatCurrency(transaction.pricePerUnit)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                                                        <div className="text-left sm:text-right min-w-0 sm:min-w-[120px] flex-1 sm:flex-none">
                                                            <div className={`text-base sm:text-lg font-bold break-all ${
                                                                transaction.transactionType === "BUY" 
                                                                    ? 'text-green-600' 
                                                                    : 'text-red-600'
                                                            }`}>
                                                                {transaction.transactionType === "BUY" ? '+' : '-'}
                                                                {formatCurrency(transaction.totalAmount)}
                                                            </div>
                                                            {transaction.notes && (
                                                                <div className="text-xs text-muted-foreground max-w-xs truncate">
                                                                    {transaction.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1 shrink-0 flex-wrap">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setTransactionDialogDefaults({
                                                                        assetType: asset.assetType,
                                                                        assetName: asset.name,
                                                                        transactionType: "BUY",
                                                                        pricePerUnit: transaction.pricePerUnit
                                                                    });
                                                                    setIsAddTransactionOpen(true);
                                                                }}
                                                                className="h-7 px-2 text-xs"
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" />
                                                                Ek
                                                            </Button>
                                                            {transaction.transactionType === "BUY" && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setTransactionDialogDefaults({
                                                                            assetType: asset.assetType,
                                                                            assetName: asset.name,
                                                                            transactionType: "SELL",
                                                                            pricePerUnit: transaction.pricePerUnit,
                                                                            quantity: transaction.quantity
                                                                        });
                                                                        setIsAddTransactionOpen(true);
                                                                    }}
                                                                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Minus className="h-3 w-3 mr-1" />
                                                                    Sat
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                                    <CardTitle className="text-xl mb-2">Henüz işlem yok</CardTitle>
                                    <CardDescription className="text-center">
                                        Bu varlık için henüz alım veya satım işlemi yapılmamış
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Add Transaction Dialog */}
                <AddTransactionDialog
                    trigger={null}
                    onSuccess={(data) => handleTransactionAdded(data)}
                    showSuccessNotifications={false}
                    open={isAddTransactionOpen}
                    onOpenChange={(open) => {
                        setIsAddTransactionOpen(open);
                        if (!open) setTransactionDialogDefaults(null);
                    }}
                    defaultValues={{
                        assetType: asset.assetType,
                        assetName: asset.name,
                        transactionType: transactionDialogDefaults?.transactionType || "BUY",
                        pricePerUnit: transactionDialogDefaults?.pricePerUnit,
                        availableQuantity: asset.holdings.netQuantity,
                        availableCash: availableCash
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
