"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, TrendingUp, TrendingDown, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TestResult {
    category: string;
    symbol: string;
    description: string;
    success: boolean;
    data?: any;
    error?: string;
    logs: string[];
    duration: number;
}

interface TestSummary {
    total: number;
    successful: number;
    failed: number;
    duration: number;
}

const categoryIcons: Record<string, string> = {
    'Currency': '💱',
    'Commodity': '🏆',
    'Crypto': '₿',
    'Stock': '📈'
};

const categoryColors: Record<string, string> = {
    'Currency': 'border-blue-500',
    'Commodity': 'border-yellow-500',
    'Crypto': 'border-orange-500',
    'Stock': 'border-green-500'
};

export function AllPricesTest() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<TestResult[]>([]);
    const [summary, setSummary] = useState<TestSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showLogs, setShowLogs] = useState<Record<string, boolean>>({});

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

    const toggleLogs = (symbol: string) => {
        setShowLogs(prev => ({
            ...prev,
            [symbol]: !prev[symbol]
        }));
    };

    const runAllTests = async () => {
        setLoading(true);
        setError(null);
        setResults([]);
        setSummary(null);
        setShowLogs({});
        
        console.log('🚀 Running all asset price tests...');
        
        try {
            const response = await fetch('/api/test/all-prices');
            const result = await response.json();
            
            console.group('📊 All Prices Test Results');
            console.log('Summary:', result.summary);
            
            if (result.success && result.results) {
                result.results.forEach((testResult: TestResult) => {
                    console.group(`${categoryIcons[testResult.category]} ${testResult.symbol}`);
                    console.log('Success:', testResult.success);
                    console.log('Duration:', testResult.duration + 'ms');
                    
                    if (testResult.logs) {
                        console.group('📋 Logs');
                        testResult.logs.forEach(log => console.log(log));
                        console.groupEnd();
                    }
                    
                    if (testResult.data) {
                        console.log('Data:', testResult.data);
                    }
                    
                    console.groupEnd();
                });
                
                setResults(result.results);
                setSummary(result.summary);
            } else {
                console.error('❌ Test failed:', result.error);
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

    const renderResultCard = (result: TestResult) => {
        const icon = categoryIcons[result.category] || '📊';
        const borderColor = categoryColors[result.category] || 'border-gray-500';
        const isPositive = result.data?.changePercent ? result.data.changePercent >= 0 : false;
        const changeColor = isPositive ? 'text-green-600' : 'text-red-600';

        return (
            <Card key={result.symbol} className={`${borderColor} border-2`}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                                <span className="text-xl">{icon}</span>
                                <span>{result.symbol}</span>
                                {result.success ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                                {result.description}
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">
                            {result.duration}ms
                        </Badge>
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                    {result.success && result.data && (
                        <div className="space-y-2">
                            {/* Gold/Silver specific display */}
                            {(result.symbol === 'GC=F' || result.symbol === 'SI=F') && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Ounce (USD):</span>
                                        <span className="font-semibold">
                                            {formatCurrency(result.data.ounceUSD, 'USD')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Gram (TRY):</span>
                                        <span className="font-bold text-lg">
                                            {formatCurrency(result.data.gramTRY, 'TRY')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-blue-600 font-semibold">
                                        <span>USD/TRY Rate:</span>
                                        <span>{result.data.usdTryRate?.toFixed(4)}</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Bitcoin specific display */}
                            {result.symbol === 'BTC-USD' && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Price (USD):</span>
                                        <span className="font-semibold">
                                            {formatCurrency(result.data.priceUSD, 'USD')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Price (TRY):</span>
                                        <span className="font-bold text-lg">
                                            {formatCurrency(result.data.priceTRY, 'TRY')}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Currency/Stock specific display */}
                            {(result.category === 'Currency' || result.category === 'Stock') && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Current:</span>
                                        <span className="font-bold text-lg">
                                            {result.category === 'Currency' 
                                                ? `${result.data.currentPrice.toFixed(4)} TRY`
                                                : formatCurrency(result.data.price, 'TRY')
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Previous:</span>
                                        <span>
                                            {result.category === 'Currency'
                                                ? result.data.previousClose.toFixed(4)
                                                : formatCurrency(result.data.previousClose, 'TRY')
                                            }
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Change percentage (all) */}
                            {result.data.changePercent !== undefined && (
                                <div className={`flex items-center gap-2 text-sm font-medium ${changeColor}`}>
                                    {isPositive ? (
                                        <TrendingUp className="h-4 w-4" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4" />
                                    )}
                                    <span>{formatPercent(result.data.changePercent)}</span>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Error display */}
                    {!result.success && (
                        <Alert variant="destructive">
                            <AlertDescription className="text-xs">
                                ❌ {result.error}
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    {/* Toggle logs button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => toggleLogs(result.symbol)}
                    >
                        {showLogs[result.symbol] ? 'Hide' : 'Show'} Logs ({result.logs.length})
                    </Button>
                    
                    {/* Logs display */}
                    {showLogs[result.symbol] && (
                        <div className="p-2 bg-slate-50 rounded text-xs font-mono space-y-1 max-h-40 overflow-y-auto">
                            {result.logs.map((log, index) => (
                                <div key={index} className={
                                    log.includes('❌') ? 'text-red-600' :
                                    log.includes('✅') ? 'text-green-600' :
                                    log.includes('🚀') || log.includes('📡') ? 'text-blue-600' :
                                    'text-slate-600'
                                }>
                                    {log}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-white">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-2xl">🧪</span>
                            <span>Tüm Varlık Kategorileri Test Sistemi</span>
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                            6 farklı kategori için Yahoo Finance API testi (detaylı log'lu)
                        </CardDescription>
                    </div>
                    <Button 
                        onClick={runAllTests} 
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Test Ediliyor...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-4 w-4" />
                                Tüm Fiyatları Test Et
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {/* Summary */}
                {summary && (
                    <div className="grid grid-cols-4 gap-2 p-3 bg-purple-50 rounded-lg">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{summary.total}</div>
                            <div className="text-xs text-muted-foreground">Toplam</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
                            <div className="text-xs text-muted-foreground">Başarılı</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                            <div className="text-xs text-muted-foreground">Başarısız</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{summary.duration}ms</div>
                            <div className="text-xs text-muted-foreground">Süre</div>
                        </div>
                    </div>
                )}
                
                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription className="text-sm">
                            ❌ <strong>Hata:</strong> {error}
                        </AlertDescription>
                    </Alert>
                )}
                
                {/* Results Grid */}
                {results.length > 0 && (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {results.map(renderResultCard)}
                    </div>
                )}
                
                {/* Instructions */}
                {results.length === 0 && !loading && !error && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm mb-2">👆 Butona basarak tüm kategorileri test edin</p>
                        <div className="text-xs space-y-1">
                            <p>✅ USD/TRY & EUR/TRY Döviz Kurları</p>
                            <p>✅ Altın & Gümüş (Ons → Gram TRY)</p>
                            <p>✅ Bitcoin (USD → TRY)</p>
                            <p>✅ BIST Hisse Senedi</p>
                        </div>
                        <p className="text-xs mt-3">Detaylı log'lar browser console'da (F12)</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
