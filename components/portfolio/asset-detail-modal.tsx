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
    ArrowRight
} from "lucide-react";
import { AddTransactionDialog } from "./add-transaction-dialog";

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
}

export function AssetDetailModal({ asset, isOpen, onClose, onTransactionAdded }: AssetDetailModalProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
    const [currency, setCurrency] = useState<"TRY" | "USD">("TRY");
    const [transactionDialogDefaults, setTransactionDialogDefaults] = useState<{
        assetType: string;
        assetName: string;
        transactionType: "BUY" | "SELL";
        pricePerUnit?: number;
        quantity?: number;
    } | null>(null);

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) {
            return currency === "TRY" ? '₺0,00' : '$0.00';
        }
        
        const displayAmount = currency === "TRY" ? amount : amount / 34; // Basit kur çevrimi (daha sonra API'den alınabilir)
        
        return new Intl.NumberFormat(currency === "TRY" ? 'tr-TR' : 'en-US', {
            style: 'currency',
            currency: currency
        }).format(displayAmount);
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
            "GOLD": "Altın",
            "SILVER": "Gümüş", 
            "STOCK": "Hisse Senedi",
            "FUND": "Yatırım Fonu",
            "CRYPTO": "Kripto Para",
            "EUROBOND": "Eurobond"
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

    // Function to add new transaction to the list
    const addTransactionToList = (transactionData: { transactionType: "BUY" | "SELL"; quantity: number; pricePerUnit: number; notes?: string }) => {
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
        }
    }, [isOpen, asset?.id, fetchTransactions]);

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
    
    // currentValue varsa kullan, yoksa currentPrice ile hesapla, o da yoksa netAmount kullan
    let currentValue = holdings.currentValue;
    if (currentValue === null || currentValue === undefined) {
        currentValue = currentPrice > 0 ? currentPrice * netQuantity : netAmount;
    }
    
    const profitLoss = currentValue - netAmount;
    const profitLossPercent = netAmount > 0 ? (profitLoss / netAmount) * 100 : 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto overflow-x-hidden">
                <DialogHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xl font-bold truncate">{asset.name}</span>
                            <Badge variant="secondary" className="shrink-0">
                                {getAssetTypeLabel(asset.assetType)}
                            </Badge>
                        </div>
                        <Select value={currency} onValueChange={(v) => setCurrency(v as "TRY" | "USD")}>
                            <SelectTrigger className="w-24 shrink-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TRY">₺ TRY</SelectItem>
                                <SelectItem value="USD">$ USD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogDescription>
                        Varlık detayları ve işlem geçmişi
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    {/* Summary Cards */}
                    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                                <CardTitle className="text-xs font-medium text-muted-foreground">Miktar</CardTitle>
                                <Wallet className="h-3 w-3 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="pb-2 pt-0">
                                <div className="flex flex-col items-center justify-center min-h-[2.5rem] text-center">
                                    <div className="text-sm font-bold leading-tight">
                                        {netQuantity.toFixed(2)}
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

                    <Separator className="my-2" />

                    {/* Transactions Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">İşlem Geçmişi</h3>
                                <p className="text-sm text-muted-foreground">
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
                                <CardContent className="p-0">
                                    <div className="space-y-0">
                                        {transactions.map((transaction, index) => (
                                            <div 
                                                key={transaction.id}
                                                className={`p-3 hover:bg-muted/50 transition-colors ${
                                                    index !== transactions.length - 1 ? 'border-b' : ''
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 w-full">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <div className={`p-2 rounded-full ${
                                                            transaction.transactionType === "BUY" 
                                                                ? 'bg-green-100 text-green-600' 
                                                                : 'bg-red-100 text-red-600'
                                                        }`}>
                                                            {transaction.transactionType === "BUY" ? 
                                                                <Plus className="h-4 w-4" /> : 
                                                                <Minus className="h-4 w-4" />
                                                            }
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge 
                                                                    variant="secondary" 
                                                                    className={getTransactionTypeColor(transaction.transactionType)}
                                                                >
                                                                    {transaction.transactionType === "BUY" ? 'Alış' : 'Satış'}
                                                                </Badge>
                                                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {formatDate(transaction.transactionDate)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-base">
                                                                    {transaction.quantity.toFixed(4)} adet
                                                                </span>
                                                                <span className="text-muted-foreground">×</span>
                                                                <span className="font-mono text-sm">
                                                                    {formatCurrency(transaction.pricePerUnit)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <div className="text-right min-w-[120px]">
                                                            <div className={`text-lg font-bold ${
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
                                                        <div className="flex gap-1 shrink-0">
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
                    open={isAddTransactionOpen}
                    onOpenChange={(open) => {
                        setIsAddTransactionOpen(open);
                        if (!open) setTransactionDialogDefaults(null);
                    }}
                    defaultValues={transactionDialogDefaults || {
                        assetType: asset.assetType,
                        assetName: asset.name,
                        transactionType: "BUY"
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
