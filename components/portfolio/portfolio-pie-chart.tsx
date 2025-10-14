"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AssetDistribution {
    type: string;
    value: number;
    percentage: number;
    emoji: string;
    label: string;
}

interface PortfolioPieChartProps {
    distribution: AssetDistribution[];
    totalValue: number;
    currency: string;
    onCurrencyChange?: () => void;
    profitLoss: number;
    profitLossPercent: number;
    realizedPL?: number;
    formatCurrency: (amount: number | null | undefined) => string;
}

const COLORS = {
    cash: "#10b981",           // Yeşil (TL ve dövizler aynı ton)
    gold: "#f59e0b",            // Amber/Altın sarısı
    silver: "#94a3b8",          // Gümüş grisi
    stock: "#ef4444",           // Kırmızı (BIST)
    international_stock: "#ec4899", // Pembe (Yabancı Hisse)
    fund: "#8b5cf6",            // Mor (Fonlar)
    crypto: "#f97316",          // Turuncu (Kripto)
    bond: "#06b6d4",            // Cyan (Tahvil)
    eurobond: "#3b82f6",        // Mavi (Eurobond)
    etf: "#84cc16",             // Lime (ETF)
    default: "#64748b"
};

export function PortfolioPieChart({
    distribution,
    totalValue,
    currency,
    onCurrencyChange,
    profitLoss,
    profitLossPercent,
    realizedPL = 0,
    formatCurrency
}: PortfolioPieChartProps) {

    const formatPercent = (percent: number) => {
        return `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;
    };

    const profitColor = profitLoss >= 0 ? "text-green-600" : "text-red-600";

    const chartData = distribution.map(item => ({
        name: item.label,
        value: item.value,
        percentage: item.percentage,
        emoji: item.emoji,
        type: item.type
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                    <p className="font-semibold flex items-center gap-2">
                        <span>{data.emoji}</span>
                        {data.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {formatCurrency(data.value)}
                    </p>
                    <p className="text-sm font-medium">
                        {data.percentage.toFixed(2)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
        if (percentage < 5) return null; // Don't show labels for small slices
        
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text 
                x={x} 
                y={y} 
                fill="white" 
                textAnchor="middle" 
                dominantBaseline="central"
                className="text-xs font-bold"
            >
                {`${percentage.toFixed(0)}%`}
            </text>
        );
    };

    return (
        <Card className="w-full">
            <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                    {/* Pie Chart */}
                    <div className="relative w-full" style={{ height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={CustomLabel}
                                    labelLine={false}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={COLORS[entry.type as keyof typeof COLORS] || COLORS.default}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-xs text-muted-foreground mb-1">Toplam Değer</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-500">{formatCurrency(totalValue)}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">{currency}</span>
                                {onCurrencyChange && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={onCurrencyChange}
                                        className="h-5 w-5 p-0 pointer-events-auto"
                                    >
                                        🔄
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profit/Loss Summary */}
                    <div className="grid grid-cols-2 gap-6 mt-8 w-full max-w-md">
                        <div className="text-center p-4 rounded-lg bg-muted/30">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <p className="text-xs text-muted-foreground">Toplam K/Z</p>
                                <div className="group relative">
                                    <span className="text-xs cursor-help">ℹ️</span>
                                    <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg z-10">
                                        Gerçekleşen + Gerçekleşmemiş kar/zarar toplamı
                                    </div>
                                </div>
                            </div>
                            <p className={`text-2xl font-bold ${profitColor}`}>
                                {formatCurrency(profitLoss)}
                            </p>
                            <p className={`text-sm ${profitColor}`}>
                                {formatPercent(profitLossPercent)}
                            </p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/30">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <p className="text-xs text-muted-foreground">Gerçekleşen K/Z</p>
                                <div className="group relative">
                                    <span className="text-xs cursor-help">ℹ️</span>
                                    <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg z-10">
                                        Satışlardan elde edilen gerçek kar/zarar
                                    </div>
                                </div>
                            </div>
                            <p className={`text-2xl font-bold ${realizedPL >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatCurrency(realizedPL)}
                            </p>
                            <p className="text-xs text-muted-foreground">💰 Cebinizdeki</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
