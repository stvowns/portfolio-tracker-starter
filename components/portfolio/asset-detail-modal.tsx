"use client";

import { useState, useEffect } from "react";
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
    TrendingUp, 
    TrendingDown, 
    Wallet, 
    Calendar,
    Plus,
    Minus,
    ArrowRight
} from "lucide-react";
import { AddTransactionDialog } from "./add-transaction-dialog";

interface AssetDetailModalProps {
    asset: any;
    isOpen: boolean;
    onClose: () => void;
    onTransactionAdded?: () => void;
}

export function AssetDetailModal({ asset, isOpen, onClose, onTransactionAdded }: AssetDetailModalProps) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
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

    const fetchTransactions = async () => {
        if (!asset?.id) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/portfolio/transactions?assetId=${asset.id}`);
            if (response.ok) {
                const result = await response.json();
                setTransactions(result.success ? result.data.transactions : []);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && asset?.id) {
            fetchTransactions();
        }
    }, [isOpen, asset?.id]);

    const handleTransactionAdded = () => {
        fetchTransactions();
        if (onTransactionAdded) {
            onTransactionAdded();
        }
    };

    if (!asset) return null;

    const holdings = asset.holdings || {};
    const currentPrice = parseFloat(asset.currentPrice || 0);
    const netQuantity = holdings.netQuantity || 0;
    const averagePrice = holdings.averagePrice || 0;
    const currentValue = holdings.currentValue || (currentPrice * netQuantity);
    const netAmount = holdings.netAmount || (averagePrice * netQuantity);
    const profitLoss = currentValue - netAmount;
    const profitLossPercent = netAmount > 0 ? (profitLoss / netAmount) * 100 : 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-2xl">{asset.name}</span>
                        <Badge variant="secondary">
                            {getAssetTypeLabel(asset.assetType)}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Varlık detayları ve işlem geçmişi
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Miktar</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {netQuantity.toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {asset.symbol || asset.name}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ortalama Maliyet</CardTitle>
                                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(averagePrice)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Birim başına
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Mevcut Değer</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(currentValue)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Toplam portföy değeri
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Kar/Zarar</CardTitle>
                                {profitLoss >= 0 ? 
                                    <TrendingUp className="h-4 w-4 text-green-600" /> : 
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                }
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${
                                    profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {formatCurrency(profitLoss)}
                                </div>
                                <p className={`text-xs ${
                                    profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Separator />

                    {/* Transactions Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">İşlem Geçmişi</h3>
                                <p className="text-sm text-muted-foreground">
                                    Bu varlık için yapılan alım/satım işlemleri
                                </p>
                            </div>
                            <Button 
                                onClick={() => setIsAddTransactionOpen(true)}
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
                                                className={`p-4 hover:bg-muted/50 transition-colors ${
                                                    index !== transactions.length - 1 ? 'border-b' : ''
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
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
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge 
                                                                    variant="secondary" 
                                                                    className={getTransactionTypeColor(transaction.transactionType)}
                                                                >
                                                                    {transaction.transactionType === "BUY" ? 'Alış' : 'Satış'}
                                                                </Badge>
                                                                <span className="font-medium">
                                                                    {transaction.quantity} {asset.symbol || asset.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>{formatDate(transaction.transactionDate)}</span>
                                                                <ArrowRight className="h-3 w-3" />
                                                                <span>{formatCurrency(transaction.pricePerUnit)}/adet</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-medium">
                                                            {formatCurrency(transaction.totalAmount)}
                                                        </div>
                                                        {transaction.notes && (
                                                            <div className="text-xs text-muted-foreground max-w-xs truncate">
                                                                {transaction.notes}
                                                            </div>
                                                        )}
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
                                    <CardDescription className="text-center mb-4">
                                        Bu varlık için henüz alım veya satım işlemi yapılmamış
                                    </CardDescription>
                                    <Button 
                                        onClick={() => setIsAddTransactionOpen(true)}
                                        variant="outline"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        İlk İşlemi Ekle
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Add Transaction Dialog */}
                <AddTransactionDialog
                    trigger={null}
                    onSuccess={handleTransactionAdded}
                    open={isAddTransactionOpen}
                    onOpenChange={setIsAddTransactionOpen}
                    defaultValues={{
                        assetType: asset.assetType,
                        assetName: asset.name,
                        transactionType: "BUY"
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
