"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GOLD_TYPES } from "@/lib/services/gold-price-service";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoldPrice {
  type: {
    id: string;
    name: string;
    grams: number;
  };
  price: number;
  priceFormatted: string;
  changePercent?: number;
  changeAmount?: number;
  previousPrice?: number;
}

interface GoldHolding {
  assetId: string;
  assetName: string;
  holdings: {
    netQuantity: number;
    currentValue: number | null;
    profitLoss?: number | null;
    profitLossPercent?: number | null;
  };
}

interface GoldPieChartProps {
  goldHoldings: GoldHolding[];
  currency?: "TRY" | "USD" | "EUR";
}

export function GoldPieChart({ goldHoldings, currency = "TRY" }: GoldPieChartProps) {
  const [goldPrices, setGoldPrices] = useState<{ [key: string]: GoldPrice }>({});
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) {
      return currency === "TRY" ? '₺0,00' : currency === "USD" ? '$0.00' : '€0.00';
    }
    
    // Kur çevrimi
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

  const fetchGoldPrices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gold/prices');
      const data = await response.json();

      if (data.success) {
        const prices: { [key: string]: GoldPrice } = {};
        data.data.forEach((gold: GoldPrice) => {
          prices[gold.type.id] = gold;
        });
        setGoldPrices(prices);
      }
    } catch (error) {
      console.error('Error fetching gold prices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoldPrices();
  }, [fetchGoldPrices]);

  // Validate goldHoldings structure
  if (!Array.isArray(goldHoldings)) {
    console.warn('Invalid goldHoldings data:', goldHoldings);
    return null;
  }

  // Process gold holdings with current prices (memoized)
  const processedHoldings = useMemo(() => {
    return goldHoldings.map(holding => {
      // Log the holding structure for debugging
      if (!holding.assetName) {
        console.warn('Gold holding without assetName:', holding);
        return null;
      }

      // Find matching gold type
      const goldType = GOLD_TYPES.find(type =>
        holding.assetName.toLowerCase().includes(type.name.toLowerCase()) ||
        holding.assetName.toLowerCase().includes(type.id.toLowerCase())
      );

      if (!goldType) {
        console.warn('No matching gold type found for:', holding.assetName);
        return null;
      }

      const currentPrice = goldPrices[goldType.id]?.price || 0;
      const previousPrice = goldPrices[goldType.id]?.previousPrice || currentPrice;
      const currentValue = currentPrice * holding.holdings.netQuantity;
      const previousValue = previousPrice * holding.holdings.netQuantity;
      const changeAmount = currentValue - previousValue;
      const changePercent = previousValue > 0 ? (changeAmount / previousValue) * 100 : 0;

      return {
        ...holding,
        goldType,
        currentValue,
        previousValue,
        changeAmount,
        changePercent,
        currentPrice
      };
    }).filter(Boolean);
  }, [goldHoldings, goldPrices]);

  // Calculate totals
  const totalValue = processedHoldings.reduce((sum, h) => sum + (h?.currentValue || 0), 0);
  const totalChange = processedHoldings.reduce((sum, h) => sum + (h?.changeAmount || 0), 0);
  const totalChangePercent = totalValue > 0 ? (totalChange / (totalValue - totalChange)) * 100 : 0;

  // Sort by value (descending)
  const sortedHoldings = processedHoldings.sort((a, b) => (b?.currentValue || 0) - (a?.currentValue || 0));

  // Prepare data for pie chart
  const pieData = sortedHoldings.map((holding, index) => {
    if (!holding) return null;
    const value = holding.currentValue || 0;
    const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
    
    return {
      ...holding,
      value,
      percentage,
      color: getGoldColor(index)
    };
  }).filter(Boolean);

  function getGoldColor(index: number) {
    const goldColors = [
      '#FFD700', // Gold
      '#FFA500', // Orange
      '#FF8C00', // Dark Orange
      '#FFB347', // Light Orange
      '#FFD700', // Gold (repeat if needed)
      '#DAA520', // Goldenrod
      '#B8860B', // Dark Goldenrod
      '#FFCC00', // Yellow Gold
    ];
    return goldColors[index % goldColors.length];
  }

  if (processedHoldings.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-semibold">Altın Varlık Dağılımı</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Sahip olunan altın çeşitlerinin dağılımı
            </p>
          </div>
          <Button
            onClick={fetchGoldPrices}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Pie Chart */}
          <div className="flex-shrink-0 w-full lg:w-1/2">
            <div className="relative aspect-square max-w-sm mx-auto">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="50"
                />
                
                {/* Pie slices */}
                {pieData.map((item, index) => {
                  if (!item || item.percentage === 0) return null;
                  const startAngle = index > 0 ? 
                    pieData.slice(0, index).reduce((sum, prev) => sum + (prev?.percentage || 0), 0) : 0;
                  const endAngle = startAngle + item.percentage;
                  
                  const startAngleRad = (startAngle * Math.PI) / 180;
                  const endAngleRad = (endAngle * Math.PI) / 180;
                  
                  const x1 = 100 + 55 * Math.cos(startAngleRad - Math.PI / 2);
                  const y1 = 100 + 55 * Math.sin(startAngleRad - Math.PI / 2);
                  const x2 = 100 + 55 * Math.cos(endAngleRad - Math.PI / 2);
                  const y2 = 100 + 55 * Math.sin(endAngleRad - Math.PI / 2);
                  
                  const largeArcFlag = item.percentage > 50 ? 1 : 0;
                  
                  return (
                    <g key={item.assetId}>
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 55 55 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={item.color}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </g>
                  );
                })}
                
                {/* Center text */}
                <text x="100" y="90" textAnchor="middle" className="text-sm font-medium fill-foreground">
                  Toplam Değer
                </text>
                <text x="100" y="110" textAnchor="middle" className="text-lg font-bold fill-foreground">
                  {formatCurrency(totalValue)}
                </text>
                <text 
                  x="100" 
                  y="130" 
                  textAnchor="middle" 
                  className={`text-sm ${totalChange >= 0 ? 'fill-green-600' : 'fill-red-600'}`}
                >
                  {totalChange >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%
                </text>
              </svg>
            </div>
          </div>

          {/* Legend and Details */}
          <div className="flex-1 space-y-3">
            {/* Total Summary */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Günlük Değişim</span>
                <div className={`flex items-center gap-1 ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="font-medium">
                    {formatCurrency(totalChange)}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Holdings */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sortedHoldings.map((holding, index) => {
                if (!holding) return null;
                
                return (
                  <div 
                    key={holding.assetId} 
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Color indicator */}
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getGoldColor(index) }}
                      />
                      
                      {/* Asset info */}
                      <div>
                        <div className="font-medium text-sm">
                          {holding.goldType.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {holding.holdings.netQuantity} adet • {formatCurrency(holding.currentPrice)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Value and change */}
                    <div className="text-right">
                      <div className="font-medium text-sm">
                        {formatCurrency(holding.currentValue)}
                      </div>
                      <div className={`text-xs flex items-center gap-1 justify-end ${
                        holding.changeAmount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {holding.changeAmount >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span>
                          {holding.changeAmount >= 0 ? '+' : ''}{holding.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {holding.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
