"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PriceData {
    name: string;
    symbol: string;
    currentPrice: number;
    previousClose?: number;
    changeAmount?: number;
    changePercent?: number;
    currency: string;
    lastUpdated: string;
    market: string;
}

const getMarketName = (assetType: string): string => {
    const markets: Record<string, string> = {
        'GOLD': 'Dovizcom',
        'SILVER': 'Dovizcom',
        'STOCK': 'BIST',
        'FUND': 'TEFAS',
        'CRYPTO': 'BtcTurk',
        'EUROBOND': 'Dovizcom'
    };
    return markets[assetType] || 'Unknown';
};

export function DemoPriceFetcher() {
    const [loading, setLoading] = useState(false);
    const [prices, setPrices] = useState<PriceData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [syncInfo, setSyncInfo] = useState<any>(null);

    const formatCurrency = (amount: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatPercent = (percent: number) => {
        return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
    };

    const fetchPrices = async () => {
        setLoading(true);
        setError(null);
        setSyncInfo(null);
        
        try {
            // Portfolio API'den mevcut verileri göster (sync yapmadan)
            console.log('📊 Loading portfolio assets...');
            const assetsResponse = await fetch('/api/portfolio/assets');
            const assetsData = await assetsResponse.json();
            
            if (assetsData.success && assetsData.data.assets.length > 0) {
                // İlk 4 varlığı al ve price data formatına çevir
                const fetchedPrices: PriceData[] = assetsData.data.assets
                    .filter((a: any) => a.currentPrice !== null && a.currentPrice > 0)
                    .slice(0, 4)
                    .map((asset: any) => ({
                        name: asset.name,
                        symbol: asset.symbol || 'N/A',
                        currentPrice: asset.currentPrice || 0,
                        previousClose: asset.holdings.averagePrice,
                        changeAmount: asset.holdings.profitLoss,
                        changePercent: asset.holdings.profitLossPercent,
                        currency: 'TRY',
                        lastUpdated: asset.lastUpdated || new Date().toISOString(),
                        market: getMarketName(asset.assetType)
                    }));
                
                setPrices(fetchedPrices);
                setSyncInfo({
                    successful: fetchedPrices.length,
                    failed: 0,
                    skipped: 0,
                    duration_ms: 0
                });
            } else {
                // Eğer varlık yoksa demo mesajı göster
                setError('Henüz fiyatı olan varlık yok. Portföyünüze varlık ekleyin.');
            }
            
        } catch (err) {
            console.error('❌ Error:', err);
            setError(err instanceof Error ? err.message : 'Fiyatlar alınırken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">💰 Portföy Özeti</CardTitle>
                            <CardDescription className="text-xs">
                                Portföyünüzdeki varlıkların mevcut durumu
                            </CardDescription>
                        </div>
                        <Button 
                            onClick={fetchPrices} 
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Yükleniyor...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Yükle
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                
                <CardContent className="pb-3">
                    {/* Sync Info - Compact */}
                    {syncInfo && (
                        <div className="mb-2 p-2 bg-green-50 rounded text-xs text-green-700">
                            ✅ {syncInfo.successful} başarılı, {syncInfo.failed} hata ({(syncInfo.duration_ms/1000).toFixed(1)}s)
                        </div>
                    )}
                    
                    {/* Error */}
                    {error && (
                        <Alert variant="destructive" className="mb-2">
                            <AlertDescription className="text-xs">❌ {error}</AlertDescription>
                        </Alert>
                    )}
                    
                    {/* Price Cards - Compact Grid */}
                    {prices.length > 0 && (
                        <div className="grid gap-2 grid-cols-2">
                            {prices.slice(0, 4).map((price, index) => {
                                const isPositive = (price.changePercent || 0) >= 0;
                                const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
                                
                                return (
                                    <div key={index} className="p-3 border rounded-lg hover:shadow-sm transition-shadow">
                                        <div className="flex items-start justify-between mb-1">
                                            <span className="text-xs font-medium truncate">{price.name}</span>
                                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                                                {price.market}
                                            </Badge>
                                        </div>
                                        <div className="text-lg font-bold mb-1">
                                            {formatCurrency(price.currentPrice, price.currency)}
                                        </div>
                                        {price.changePercent !== undefined && (
                                            <div className={`flex items-center gap-1 text-xs font-medium ${changeColor}`}>
                                                {isPositive ? '↗' : '↘'}
                                                <span>{formatPercent(price.changePercent)}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {/* Instructions - Compact */}
                    {prices.length === 0 && !loading && (
                        <div className="text-center py-6 text-muted-foreground">
                            <p className="text-sm">👆 Portföyünüzdeki varlıkların fiyatlarını güncelleyin</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
