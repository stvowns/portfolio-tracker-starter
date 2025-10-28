"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GoldPriceData {
    ounce: {
        currentPrice: number;
        previousClose: number;
        changeAmount: number;
        changePercent: number;
        currency: string;
        market: string;
    };
    gram: {
        currentPrice: number;
        previousClose: number;
        changeAmount: number;
        changePercent: number;
        currency: string;
        usdTryRate: number;
        gramsPerOunce: number;
    };
    timestamp: string;
    duration: number;
}

export function GoldPriceTest() {
    const [loading, setLoading] = useState(false);
    const [priceData, setPriceData] = useState<GoldPriceData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const formatCurrency = (amount: number, currency: string = 'TRY') => {
        if (currency === 'TRY') {
            return new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatPercent = (percent: number) => {
        return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
    };

    const fetchGoldPrice = async () => {
        setLoading(true);
        setError(null);
        setPriceData(null);
        setLogs([]);
        
        console.log('🚀 Starting gold price fetch...');
        
        try {
            const response = await fetch('/api/test/gold-price');
            const result = await response.json();
            
            // Log all details to console
            console.group('📊 Gold Price Fetch Results');
            console.log('Success:', result.success);
            console.log('Duration:', result.duration + 'ms');
            
            if (result.logs) {
                console.group('📋 Detailed Logs');
                result.logs.forEach((log: string) => {
                    console.log(log);
                });
                console.groupEnd();
                setLogs(result.logs);
            }
            
            if (result.success && result.data) {
                console.group('💰 Price Data');
                console.log('Ounce (USD):', result.data.ounce);
                console.log('Gram (TRY):', result.data.gram);
                console.log('Timestamp:', result.data.timestamp);
                console.groupEnd();
                
                setPriceData(result.data);
            } else {
                console.error('❌ Error:', result.error);
                setError(result.error || 'Unknown error');
            }
            
            console.groupEnd();
            
        } catch (err) {
            console.error('❌ Fetch error:', err);
            setError(err instanceof Error ? err.message : 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const isPositive = (value: number) => value >= 0;

    return (
        <Card className="border-2 border-yellow-500/20 bg-gradient-to-br from-yellow-50/50 to-white">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-2xl">🏆</span>
                            <span>Altın Fiyat Test</span>
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                            Yahoo Finance API'den canlı altın fiyatını çek (detaylı log'lu)
                        </CardDescription>
                    </div>
                    <Button 
                        onClick={fetchGoldPrice} 
                        disabled={loading}
                        className="bg-yellow-600 hover:bg-yellow-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Çekiliyor...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-4 w-4" />
                                Altın Fiyatını Çek
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription className="text-sm">
                            ❌ <strong>Hata:</strong> {error}
                        </AlertDescription>
                    </Alert>
                )}
                
                {/* Price Display */}
                {priceData && (
                    <div className="space-y-3">
                        {/* Duration Badge */}
                        <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                                ⚡ {priceData.duration}ms
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {new Date(priceData.timestamp).toLocaleString('tr-TR')}
                            </span>
                        </div>
                        
                        {/* Price Cards */}
                        <div className="grid gap-3 md:grid-cols-2">
                            {/* Gram TRY (Primary) */}
                            <div className="p-4 border-2 border-yellow-500 rounded-lg bg-yellow-50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">💎 Altın (TRY)</span>
                                    <Badge variant="outline" className="text-xs">
                                        {priceData.gram.currency}
                                    </Badge>
                                </div>
                                <div className="text-2xl font-bold mb-1">
                                    {formatCurrency(priceData.gram.currentPrice, 'TRY')}
                                </div>
                                <div className={`flex items-center gap-2 text-sm font-medium ${
                                    isPositive(priceData.gram.changePercent) 
                                        ? 'text-green-600' 
                                        : 'text-red-600'
                                }`}>
                                    {isPositive(priceData.gram.changePercent) ? (
                                        <TrendingUp className="h-4 w-4" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4" />
                                    )}
                                    <span>
                                        {formatCurrency(priceData.gram.changeAmount, 'TRY')}
                                    </span>
                                    <span>
                                        ({formatPercent(priceData.gram.changePercent)})
                                    </span>
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                                    <div>Önceki: {formatCurrency(priceData.gram.previousClose, 'TRY')}</div>
                                    <div className="font-semibold text-blue-600">
                                        USD/TRY: {priceData.gram.usdTryRate.toFixed(4)} ⚡
                                    </div>
                                </div>
                            </div>
                            
                            {/* Ounce USD (Secondary) */}
                            <div className="p-4 border rounded-lg bg-slate-50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">🌎 Ons Altın (USD)</span>
                                    <Badge variant="outline" className="text-xs">
                                        {priceData.ounce.currency}
                                    </Badge>
                                </div>
                                <div className="text-2xl font-bold mb-1">
                                    {formatCurrency(priceData.ounce.currentPrice, 'USD')}
                                </div>
                                <div className={`flex items-center gap-2 text-sm font-medium ${
                                    isPositive(priceData.ounce.changePercent) 
                                        ? 'text-green-600' 
                                        : 'text-red-600'
                                }`}>
                                    {isPositive(priceData.ounce.changePercent) ? (
                                        <TrendingUp className="h-4 w-4" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4" />
                                    )}
                                    <span>
                                        {formatCurrency(priceData.ounce.changeAmount, 'USD')}
                                    </span>
                                    <span>
                                        ({formatPercent(priceData.ounce.changePercent)})
                                    </span>
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                                    <div>Önceki: {formatCurrency(priceData.ounce.previousClose, 'USD')}</div>
                                    <div>{priceData.ounce.market}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Info Message */}
                        <Alert>
                            <AlertDescription className="text-xs">
                                ✅ <strong>Başarılı!</strong> Tüm detaylar browser console'da (F12 → Console)
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                
                {/* Log Summary */}
                {logs.length > 0 && (
                    <div className="mt-3 p-3 bg-slate-50 rounded text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
                        {logs.map((log, index) => (
                            <div key={index} className={
                                log.includes('❌') ? 'text-red-600' :
                                log.includes('✅') ? 'text-green-600' :
                                log.includes('🚀') || log.includes('⏰') ? 'text-blue-600' :
                                'text-slate-600'
                            }>
                                {log}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Instructions */}
                {!priceData && !loading && !error && (
                    <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm mb-2">👆 Butona basarak canlı altın fiyatını çekin</p>
                        <p className="text-xs">Detaylı log'lar browser console'da görünecek (F12)</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
