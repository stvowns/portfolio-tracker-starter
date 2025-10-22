"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PriceData {
    symbol: string;
    price: number | null;
    currency: string;
    success: boolean;
}

// Map test API symbols to display names (only show most important)
const SYMBOL_MAP: Record<string, string> = {
    "USD/TRY": "USD/TRY",
    "EUR/TRY": "EUR/TRY",
    "GC=F": "Altın (Gr)",
    "SI=F": "Gümüş (Gr)",
    "BTC-USD": "Bitcoin"
};

export function MiniPriceMonitor() {
    const [prices, setPrices] = useState<PriceData[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPrices = async () => {
        setLoading(true);

        try {
            const response = await fetch('/api/test/all-prices');

            // Check if response is OK and content type is JSON
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Response is not JSON');
            }

            const data = await response.json();
            
            if (data.success && data.results) {
                const results: PriceData[] = [];
                
                // Extract key prices from test results
                data.results.forEach((result: any) => {
                    // Skip if not in our watchlist
                    if (!SYMBOL_MAP[result.symbol]) return;
                    
                    const displayName = SYMBOL_MAP[result.symbol];
                    let price = null;
                    let currency = "TRY";
                    
                    // Handle different price formats
                    if (result.symbol === "GC=F" || result.symbol === "SI=F") {
                        // Gold/Silver: use gram TRY price
                        price = result.data?.gramTRY;
                        currency = "TRY";
                    } else if (result.symbol === "BTC-USD") {
                        // Bitcoin: use TRY price
                        price = result.data?.priceTRY;
                        currency = "TRY";
                    } else {
                        // Currency pairs: use currentPrice
                        price = result.data?.currentPrice;
                        currency = result.data?.currency || "TRY";
                    }
                    
                    results.push({
                        symbol: displayName,
                        price: price,
                        currency: currency,
                        success: result.success
                    });
                });
                
                setPrices(results);
            }
        } catch (error) {
            console.error('Failed to fetch prices:', error);
            setPrices([]);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchPrices();
        // Auto-refresh every 5 minutes
        const interval = setInterval(fetchPrices, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const formatPrice = (price: number | null, currency: string, symbol?: string) => {
        if (price === null) return "—";
        
        // Format Bitcoin with K suffix for readability (e.g., "2,405K")
        if (symbol === "Bitcoin" && price >= 1000) {
            const priceK = price / 1000;
            return `₺${priceK.toFixed(0)}K`;
        }
        
        if (currency === "TRY") {
            return `₺${price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="px-2 py-2">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-muted-foreground">Piyasa Fiyatları</h4>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={fetchPrices}
                    disabled={loading}
                    className="h-6 w-6 p-0"
                >
                    {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <RefreshCw className="h-3 w-3" />
                    )}
                </Button>
            </div>
            
            <div className="max-h-[180px] overflow-y-auto">
                <div className="space-y-1.5 pr-2">
                    {prices.length === 0 && loading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        prices.map((item) => (
                            <div
                                key={item.symbol}
                                className="flex items-center justify-between p-1.5 rounded-md hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <div
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                            item.success ? "bg-green-500" : "bg-red-500"
                                        }`}
                                    />
                                    <span className="text-xs font-medium truncate">
                                        {item.symbol}
                                    </span>
                                </div>
                                <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                                    {formatPrice(item.price, item.currency, item.symbol)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
