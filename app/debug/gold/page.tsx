"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function DebugGoldPage() {
    const [goldPrice, setGoldPrice] = useState<any>(null);
    const [goldAssets, setGoldAssets] = useState<any>(null);
    const [portfolioSummary, setPortfolioSummary] = useState<any>(null);
    const [assetsData, setAssetsData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Altın fiyatını çek
            const priceResponse = await fetch('/api/test/gold-price');
            const priceData = await priceResponse.json();
            setGoldPrice(priceData);

            // 2. Altın varlıklarını çek
            const assetsResponse = await fetch('/api/test/gold-assets');
            const assetsData = await assetsResponse.json();
            setGoldAssets(assetsData);

            // 3. Portfolio özetini çek
            const portfolioResponse = await fetch('/api/portfolio');
            const portfolioData = await portfolioResponse.json();
            setPortfolioSummary(portfolioData);

            // 4. Tüm varlıkları çek
            const allAssetsResponse = await fetch('/api/portfolio/assets');
            const allAssetsData = await allAssetsResponse.json();
            setAssetsData(allAssetsData);

        } catch (error) {
            console.error('Debug error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateGoldPrices = async () => {
        setUpdateLoading(true);
        try {
            const response = await fetch('/api/portfolio/update-prices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    updateAll: true // Tüm varlık türlerini güncelle
                })
            });
            
            const data = await response.json();
            console.log('Update prices response:', data);
            
            // Verileri yeniden çek
            await fetchData();
            
            alert(data.success ? 'Tüm varlık fiyatları güncellendi!' : 'Hata: ' + (data.error || 'Bilinmeyen hata'));
        } catch (error) {
            console.error('Update prices error:', error);
            alert('Fiyat güncellenirken hata oluştu');
        } finally {
            setUpdateLoading(false);
        }
    };
    
    const updateTefasPrices = async () => {
        setUpdateLoading(true);
        try {
            const response = await fetch('/api/test/tefas-assets');
            
            const data = await response.json();
            console.log('TEFAS update response:', data);
            
            // Verileri yeniden çek
            await fetchData();
            
            alert(data.success ? 'TEFAS fon fiyatları güncellendi!' : 'Hata: ' + (data.error || 'Bilinmeyen hata'));
        } catch (error) {
            console.error('TEFAS update error:', error);
            alert('TEFAS fiyatları güncellenirken hata oluştu');
        } finally {
            setUpdateLoading(false);
        }
    };
    
    const updateBistPrices = async () => {
        setUpdateLoading(true);
        try {
            const response = await fetch('/api/test/bist-assets');
            
            const data = await response.json();
            console.log('BIST update response:', data);
            
            // Verileri yeniden çek
            await fetchData();
            
            alert(data.success ? 'BIST hisse fiyatları güncellendi!' : 'Hata: ' + (data.error || 'Bilinmeyen hata'));
        } catch (error) {
            console.error('BIST update error:', error);
            alert('BIST fiyatları güncellenirken hata oluştu');
        } finally {
            setUpdateLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Varlıklar Debug</h1>
                <div className="flex gap-2 flex-wrap">
                    <Button onClick={updateBistPrices} disabled={updateLoading} variant="outline">
                        {updateLoading ? 'Güncelleniyor...' : 'BIST Fiyatlarını Güncelle'}
                    </Button>
                    <Button onClick={updateTefasPrices} disabled={updateLoading} variant="outline">
                        {updateLoading ? 'Güncelleniyor...' : 'TEFAS Fiyatlarını Güncelle'}
                    </Button>
                    <Button onClick={updateGoldPrices} disabled={updateLoading} variant="outline">
                        {updateLoading ? 'Güncelleniyor...' : 'Diğer Fiyatları Güncelle'}
                    </Button>
                </div>
            </div>

            {/* Altın Fiyatı */}
            <Card>
                <CardHeader>
                    <CardTitle>Altın Fiyatı (API)</CardTitle>
                </CardHeader>
                <CardContent>
                    {goldPrice ? (
                        <div className="space-y-2">
                            <p><strong>Başarılı:</strong> {goldPrice.success ? 'Evet' : 'Hayır'}</p>
                            {goldPrice.data && (
                                <>
                                    <p><strong>Mevcut Fiyat:</strong> {formatCurrency(goldPrice.data.data?.currentPrice || 0)}</p>
                                    <p><strong>Önceki Kapanış:</strong> {formatCurrency(goldPrice.data.data?.previousClose || 0)}</p>
                                    <p><strong>Değişim:</strong> {goldPrice.data.data?.changePercent?.toFixed(2)}%</p>
                                </>
                            )}
                            {goldPrice.error && <p className="text-red-600"><strong>Hata:</strong> {goldPrice.error}</p>}
                        </div>
                    ) : (
                        <p>Veri yok</p>
                    )}
                </CardContent>
            </Card>

            {/* BIST Hisse Test */}
            <Card>
                <CardHeader>
                    <CardTitle>BIST Hisse Test</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <p>BIST hisse fiyatı testi için:</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Hisse kodu (örn: GARAN)"
                                id="bist-symbol"
                                className="px-3 py-2 border rounded"
                            />
                            <Button
                                onClick={async () => {
                                    const symbol = (document.getElementById('bist-symbol') as HTMLInputElement)?.value || 'GARAN';
                                    try {
                                        const response = await fetch(`/api/test/bist-stock?symbol=${symbol}`);
                                        const data = await response.json();
                                        alert(JSON.stringify(data, null, 2));
                                    } catch (error) {
                                        alert('Hata: ' + error);
                                    }
                                }}
                            >
                                Fiyatını Çek
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* TEFAS Fon Test */}
            <Card>
                <CardHeader>
                    <CardTitle>TEFAS Fon Test</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <p>TEFAS fon fiyatı testi için:</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Fon kodu (örn: YKT)"
                                id="tefas-symbol"
                                className="px-3 py-2 border rounded"
                            />
                            <Button
                                onClick={async () => {
                                    const symbol = (document.getElementById('tefas-symbol') as HTMLInputElement)?.value || 'YKT';
                                    try {
                                        const response = await fetch(`/api/test/tefas-fund?symbol=${symbol}`);
                                        const data = await response.json();
                                        alert(JSON.stringify(data, null, 2));
                                    } catch (error) {
                                        alert('Hata: ' + error);
                                    }
                                }}
                            >
                                Fiyatını Çek
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tüm Varlıklar */}
            <Card>
                <CardHeader>
                    <CardTitle>Varlıklar (Veritabanı)</CardTitle>
                </CardHeader>
                <CardContent>
                    {goldAssets?.data ? (
                        <div className="space-y-4">
                            {goldAssets.data.map((asset: any) => (
                                <div key={asset.id} className="border rounded p-4">
                                    <h3 className="font-semibold">{asset.name}</h3>
                                    <p><strong>Current Price:</strong> {asset.currentPrice || 'Yok'}</p>
                                    <p><strong>Last Updated:</strong> {asset.lastUpdated ? new Date(asset.lastUpdated).toLocaleString('tr-TR') : 'Yok'}</p>
                                    <Separator className="my-2" />
                                    <h4 className="font-medium mb-2">İşlemler:</h4>
                                    {asset.transactions?.length > 0 ? (
                                        <div className="space-y-2">
                                            {asset.transactions.map((tx: any) => (
                                                <div key={tx.id} className="text-sm border rounded p-2">
                                                    <Badge variant={tx.transactionType === 'BUY' ? 'default' : 'destructive'}>
                                                        {tx.transactionType}
                                                    </Badge>
                                                    <p>Miktar: {tx.quantity} × {formatCurrency(tx.pricePerUnit)} = {formatCurrency(tx.totalAmount)}</p>
                                                    <p>Tarih: {new Date(tx.transactionDate).toLocaleDateString('tr-TR')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>İşlem yok</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Veri yok</p>
                    )}
                </CardContent>
            </Card>

            {/* Portfolio Özet */}
            <Card>
                <CardHeader>
                    <CardTitle>Portfolio Özet</CardTitle>
                </CardHeader>
                <CardContent>
                    {portfolioSummary?.data ? (
                        <div className="space-y-2">
                            <p><strong>Toplam Değer:</strong> {formatCurrency(portfolioSummary.data.totalValue || 0)}</p>
                            <p><strong>Toplam Maliyet:</strong> {formatCurrency(portfolioSummary.data.totalCost || 0)}</p>
                            <p><strong>Toplam K/Z:</strong> {formatCurrency(portfolioSummary.data.totalProfitLoss || 0)}</p>
                            <p><strong>K/Z Yüzdesi:</strong> {portfolioSummary.data.totalProfitLossPercent?.toFixed(2)}%</p>
                            <Separator className="my-2" />
                            <h4 className="font-medium mb-2">Varlıklar:</h4>
                            {portfolioSummary.data.assets?.map((asset: any) => (
                                <div key={asset.id} className="text-sm border rounded p-2 mb-2">
                                    <p><strong>{asset.name}</strong> ({asset.assetType})</p>
                                    <p>Miktar: {asset.holdings.netQuantity}</p>
                                    <p>Ort. Maliyet: {formatCurrency(asset.holdings.averagePrice)}</p>
                                    <p>Mevcut Değer: {formatCurrency(asset.holdings.currentValue)}</p>
                                    <p>K/Z: {formatCurrency(asset.holdings.profitLoss)} ({asset.holdings.profitLossPercent?.toFixed(2)}%)</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Veri yok</p>
                    )}
                </CardContent>
            </Card>

            {/* Assets API */}
            <Card>
                <CardHeader>
                    <CardTitle>Assets API</CardTitle>
                </CardHeader>
                <CardContent>
                    {assetsData?.data?.assets ? (
                        <div className="space-y-2">
                            {assetsData.data.assets.map((asset: any) => (
                                <div key={asset.id} className="text-sm border rounded p-2 mb-2">
                                    <p><strong>{asset.name}</strong> ({asset.assetType})</p>
                                    <p>Current Price (DB): {asset.currentPrice || 'Yok'}</p>
                                    <p>Miktar: {asset.holdings.netQuantity}</p>
                                    <p>Ort. Maliyet: {formatCurrency(asset.holdings.averagePrice)}</p>
                                    <p>Mevcut Değer: {formatCurrency(asset.holdings.currentValue)}</p>
                                    <p>K/Z: {formatCurrency(asset.holdings.profitLoss)} ({asset.holdings.profitLossPercent?.toFixed(2)}%)</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Veri yok</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}