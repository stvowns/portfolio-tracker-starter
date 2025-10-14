"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function PerformancePage() {
    const [activeTab, setActiveTab] = useState("monthly");

    // Mock data - gerçek veriler API'den gelecek
    const performanceData = {
        monthly: {
            period: "Son 30 Gün",
            totalReturn: 15420,
            totalReturnPercent: 3.2,
            bestDay: { date: "14 Ekim", return: 3500, percent: 0.8 },
            worstDay: { date: "8 Ekim", return: -1200, percent: -0.3 },
            trades: 12,
            wins: 8,
            losses: 4
        },
        quarterly: {
            period: "Son 3 Ay",
            totalReturn: 42850,
            totalReturnPercent: 9.5,
            bestDay: { date: "12 Eylül", return: 8500, percent: 2.1 },
            worstDay: { date: "3 Ağustos", return: -3200, percent: -0.8 },
            trades: 35,
            wins: 23,
            losses: 12
        },
        semiannual: {
            period: "Son 6 Ay",
            totalReturn: 78500,
            totalReturnPercent: 18.2,
            bestDay: { date: "24 Temmuz", return: 12000, percent: 3.2 },
            worstDay: { date: "15 Mayıs", return: -5500, percent: -1.5 },
            trades: 68,
            wins: 45,
            losses: 23
        },
        yearly: {
            period: "Son 1 Yıl",
            totalReturn: 125000,
            totalReturnPercent: 32.5,
            bestDay: { date: "18 Mart", return: 15000, percent: 4.5 },
            worstDay: { date: "7 Ocak", return: -8200, percent: -2.3 },
            trades: 142,
            wins: 95,
            losses: 47
        }
    };

    const currentData = performanceData[activeTab as keyof typeof performanceData];
    const isPositive = currentData.totalReturn >= 0;
    const profitColor = isPositive ? "text-green-600" : "text-red-600";
    const winRate = (currentData.wins / currentData.trades * 100).toFixed(1);

    return (
        <div className="@container/main flex flex-1 flex-col gap-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Performans Analizi</h1>
                <p className="text-muted-foreground">
                    Portföyünüzün farklı zaman dilimlerindeki performansını inceleyin
                </p>
            </div>

            <Tabs defaultValue="monthly" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="monthly">Aylık</TabsTrigger>
                    <TabsTrigger value="quarterly">3 Aylık</TabsTrigger>
                    <TabsTrigger value="semiannual">6 Aylık</TabsTrigger>
                    <TabsTrigger value="yearly">Yıllık</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-6 mt-6">
                    {/* Özet Kartlar */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Toplam Getiri</CardDescription>
                                <CardTitle className={`text-3xl ${profitColor}`}>
                                    {currentData.totalReturn >= 0 ? '+' : ''}
                                    ₺{currentData.totalReturn.toLocaleString('tr-TR')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`flex items-center gap-2 ${profitColor}`}>
                                    {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                    <span className="text-xl font-semibold">
                                        {currentData.totalReturnPercent >= 0 ? '+' : ''}
                                        {currentData.totalReturnPercent}%
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Toplam İşlem</CardDescription>
                                <CardTitle className="text-3xl">{currentData.trades}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-green-600">✓ {currentData.wins} Kazanan</span>
                                    <span className="text-red-600">✗ {currentData.losses} Kaybeden</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Başarı Oranı</CardDescription>
                                <CardTitle className="text-3xl text-primary">%{winRate}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary"
                                        style={{ width: `${winRate}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* En İyi/En Kötü Gün */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    🏆 En İyi Gün
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">{currentData.bestDay.date}</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        +₺{currentData.bestDay.return.toLocaleString('tr-TR')}
                                    </p>
                                    <p className="text-sm text-green-600">
                                        +{currentData.bestDay.percent}% günlük getiri
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    ⚠️ En Kötü Gün
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">{currentData.worstDay.date}</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        ₺{currentData.worstDay.return.toLocaleString('tr-TR')}
                                    </p>
                                    <p className="text-sm text-red-600">
                                        {currentData.worstDay.percent}% günlük kayıp
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performans Grafiği Placeholder */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Performans Grafiği</CardTitle>
                            <CardDescription>
                                {currentData.period} içerisindeki getiri trendi
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">
                                    📊 Grafik yakında eklenecek
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
