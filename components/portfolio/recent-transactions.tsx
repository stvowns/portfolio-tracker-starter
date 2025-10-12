"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, Calendar, MoreHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Transaction {
    id: string;
    assetId: string;
    assetName: string;
    assetSymbol?: string;
    assetType: string;
    transactionType: "BUY" | "SELL";
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
    transactionDate: string;
    notes?: string;
}

interface RecentTransactionsProps {
    transactions: Transaction[];
    isLoading?: boolean;
    currency?: string;
    onViewAll?: () => void;
    maxItems?: number;
}

export function RecentTransactions({ 
    transactions, 
    isLoading = false, 
    currency = "TRY",
    onViewAll,
    maxItems = 10
}: RecentTransactionsProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const formatCurrency = (amount: number) => {
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

    const getAssetTypeLabel = (assetType: string) => {
        const labels: Record<string, string> = {
            "GOLD": "Altın",
            "SILVER": "Gümüş",
            "STOCK": "Hisse",
            "FUND": "Fon",
            "CRYPTO": "Kripto",
            "EUROBOND": "Eurobond"
        };
        return labels[assetType] || assetType;
    };

    const formatRelativeDate = (dateString: string) => {
        if (!isClient) return new Date(dateString).toLocaleDateString("tr-TR");
        
        try {
            return formatDistanceToNow(new Date(dateString), { 
                addSuffix: true, 
                locale: tr 
            });
        } catch {
            return new Date(dateString).toLocaleDateString("tr-TR");
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
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                                <div className="flex-1 space-y-1">
                                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                                </div>
                                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const displayedTransactions = transactions.slice(0, maxItems);

    if (transactions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Son İşlemler</CardTitle>
                    <CardDescription>Son gerçekleştirdiğiniz işlemler burada görünecek</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                            Henüz hiç işlem gerçekleştirmediniz.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle>Son İşlemler</CardTitle>
                    <CardDescription>
                        Son {displayedTransactions.length} işlem
                        {transactions.length > maxItems && ` (toplam ${transactions.length})`}
                    </CardDescription>
                </div>
                {onViewAll && transactions.length > maxItems && (
                    <Button variant="outline" size="sm" onClick={onViewAll}>
                        Tümünü Gör
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {displayedTransactions.map((transaction) => {
                        const isBuy = transaction.transactionType === "BUY";
                        const Icon = isBuy ? ArrowUpCircle : ArrowDownCircle;
                        const iconColor = isBuy 
                            ? "text-green-600 dark:text-green-400" 
                            : "text-red-600 dark:text-red-400";
                        
                        return (
                            <div key={transaction.id} className="flex items-start space-x-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                <Icon className={`h-8 w-8 ${iconColor} mt-0.5`} />
                                
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {transaction.assetName}
                                        </span>
                                        {transaction.assetSymbol && (
                                            <Badge variant="outline" className="text-xs">
                                                {transaction.assetSymbol}
                                            </Badge>
                                        )}
                                        <Badge 
                                            variant={isBuy ? "default" : "destructive"} 
                                            className="text-xs"
                                        >
                                            {isBuy ? "ALIŞ" : "SATIŞ"}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>
                                            {formatNumber(transaction.quantity, 4)} adet
                                        </span>
                                        <span>
                                            @ {formatCurrency(transaction.pricePerUnit)}
                                        </span>
                                        <span>
                                            {formatRelativeDate(transaction.transactionDate)}
                                        </span>
                                    </div>
                                    
                                    {transaction.notes && (
                                        <p className="text-sm text-muted-foreground italic">
                                            "{transaction.notes}"
                                        </p>
                                    )}
                                </div>
                                
                                <div className="text-right">
                                    <div className={`font-mono font-medium ${iconColor}`}>
                                        {formatCurrency(transaction.totalAmount)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {getAssetTypeLabel(transaction.assetType)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {onViewAll && transactions.length > maxItems && (
                    <div className="mt-4 text-center">
                        <Button variant="outline" onClick={onViewAll} className="gap-2">
                            <MoreHorizontal className="h-4 w-4" />
                            {transactions.length - maxItems} işlem daha göster
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}