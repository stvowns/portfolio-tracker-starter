"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

interface GoldPrice {
  type: {
    id: string;
    name: string;
    grams: number;
  };
  price: number;
  priceFormatted: string;
}

export default function GoldPricesPage() {
  const [prices, setPrices] = useState<GoldPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/gold/prices");
      const data = await response.json();

      if (data.success) {
        setPrices(data.data);
        setLastUpdated(new Date().toLocaleString('tr-TR'));
      } else {
        console.error("Failed to fetch prices:", data.error);
      }
    } catch (error) {
      console.error("Error fetching gold prices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Altın Fiyatları</h1>
          <p className="text-muted-foreground mt-2">
            Gram altın fiyatına göre hesaplanan altın çeşitleri
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Son güncelleme: {lastUpdated}
            </p>
          )}
        </div>
        <button
          onClick={fetchPrices}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prices.map((gold) => (
            <Card key={gold.type.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{gold.type.name}</CardTitle>
                <CardDescription>
                  {gold.type.grams} gram
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {gold.priceFormatted}
                </div>
                <div className="mt-2">
                  <Badge variant="secondary">
                    Anlık Fiyat
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hesaplama Detayları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Tüm fiyatlar gram altın fiyatından hesaplanmaktadır</p>
          <p>• Çeyrek altın: 1.75 gram</p>
          <p>• Yarım altın: 3.5 gram</p>
          <p>• Tam altın (Cumhuriyet): 7.216 gram</p>
          <p>• 2.5'lik (Beşliye): 17.5 gram (5 adet çeyrek)</p>
          <p>• Gremse: 3.5 gram (2 adet yarım)</p>
        </CardContent>
      </Card>
    </div>
  );
}