"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, DollarSign, Coins, Moon, Sun, Database, RefreshCw } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { AddTransactionDialog } from "@/components/portfolio/add-transaction-dialog";
import { useToast } from "@/hooks/use-toast";

// Dynamic import to avoid hydration issues with browser extensions
const PortfolioDashboard = dynamic(() => import("./portfolio-dashboard").then(mod => ({ default: mod.PortfolioDashboard })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Dashboard yükleniyor...</p>
      </div>
    </div>
  )
});

// Suppress hydration warnings for Dark Reader and other browser extensions
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string') {
      // Ignore hydration errors from browser extensions
      if (
        args[0].includes('data-darkreader') ||
        args[0].includes('data-darkreader-inline') ||
        args[0].includes('Hydration') ||
        args[0].includes('did not match') ||
        args[0].includes('suppressHydrationWarning') ||
        args[0].includes('A tree hydrated but some attributes') ||
        args[0].includes('server rendered HTML') ||
        args[0].includes("didn't match the client properties")
      ) {
        return;
      }
    }
    originalError.apply(console, args);
  };
}

export default function Page() {
  const [currency, setCurrency] = useState<"TRY" | "USD">("TRY");
  const [mounted, setMounted] = useState(false);
  const [syncingBist, setSyncingBist] = useState(false);
  const [syncingTefas, setSyncingTefas] = useState(false);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleCurrency = () => {
    setCurrency(prev => prev === "TRY" ? "USD" : "TRY");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleTickerSync = async (syncType: 'BIST' | 'TEFAS') => {
    const isBist = syncType === 'BIST';
    console.log(`[${syncType} Sync] Button clicked, starting sync...`);
    
    if (isBist) setSyncingBist(true);
    else setSyncingTefas(true);
    
    try {
      console.log(`[${syncType} Sync] Fetching /api/tickers/sync...`);
      const response = await fetch('/api/tickers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sync_type: syncType, 
          force: true,
          triggered_by: 'manual'
        })
      });
      
      console.log(`[${syncType} Sync] Response status:`, response.status);
      const data = await response.json();
      console.log(`[${syncType} Sync] Response data:`, data);
      
      if (data.success) {
        const result = data.data.results[0];
        console.log(`[${syncType} Sync] Success:`, result);
        toast({
          title: `✅ ${syncType} Senkronizasyonu Tamamlandı`,
          description: `${result.successful} ${isBist ? 'ticker' : 'fon'} başarıyla eklendi. Süre: ${(result.duration_ms / 1000).toFixed(2)}s`,
        });
      } else {
        console.error(`[${syncType} Sync] Failed:`, data.error);
        toast({
          title: "❌ Senkronizasyon Hatası",
          description: data.error || "Bilinmeyen bir hata oluştu",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`[${syncType} Sync] Exception:`, error);
      toast({
        title: "❌ Bağlantı Hatası",
        description: error instanceof Error ? error.message : "API'ye bağlanırken hata oluştu",
        variant: "destructive"
      });
    } finally {
      console.log(`[${syncType} Sync] Finished`);
      if (isBist) setSyncingBist(false);
      else setSyncingTefas(false);
    }
  };

  const fetchAndUpdateCommodityPrices = async () => {
    try {
      console.log('[Commodity Sync] Starting commodity price updates...');

      // Altın fiyatını güncelle
      const goldResponse = await fetch('/api/prices/latest?symbol=GOLD&type=COMMODITY');
      if (goldResponse.ok) {
        const goldData = await goldResponse.json();
        if (goldData.success && goldData.data?.currentPrice) {
          const goldPrice = goldData.data.currentPrice;
          console.log(`[Commodity Sync] Gold price fetched: ${goldPrice}`);

          // Doğrudan price sync service kullanarak güncelle
          const priceUpdateResponse = await fetch('/api/prices/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              asset_types: ['gold'],
              force: true
            })
          });

          if (priceUpdateResponse.ok) {
            console.log('[Commodity Sync] Gold price updated successfully');
          } else {
            console.error('[Commodity Sync] Gold price update failed');
          }
        }
      }

      // Gümüş fiyatını güncelle
      const silverResponse = await fetch('/api/prices/latest?symbol=SILVER&type=COMMODITY');
      if (silverResponse.ok) {
        const silverData = await silverResponse.json();
        if (silverData.success && silverData.data?.currentPrice) {
          const silverPrice = silverData.data.currentPrice;
          console.log(`[Commodity Sync] Silver price fetched: ${silverPrice}`);

          // Doğrudan price sync service kullanarak güncelle
          const priceUpdateResponse = await fetch('/api/prices/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              asset_types: ['silver'],
              force: true
            })
          });

          if (priceUpdateResponse.ok) {
            console.log('[Commodity Sync] Silver price updated successfully');
          } else {
            console.error('[Commodity Sync] Silver price update failed');
          }
        }
      }

      console.log('[Commodity Sync] Commodity price updates completed');
    } catch (error) {
      console.error('[Commodity Sync] Commodity prices sync error:', error);
    }
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portföy Dashboard</h1>
            <p className="text-muted-foreground">
              Yatırım portföyünüzü takip edin ve analiz edin
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Currency Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCurrency}
              className="gap-2"
            >
              {currency === "TRY" ? (
                <>
                  <Coins className="h-4 w-4" />
                  TRY
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  USD
                </>
              )}
            </Button>

            {/* Dark Mode Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
            >
              {!mounted ? (
                <div className="h-4 w-4" />
              ) : theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Ticker Sync Buttons (Development Only) */}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                // Sequential sync: BIST → TEFAS → Altın/Gümüş
                setSyncingBist(true);
                try {
                  await handleTickerSync('BIST');
                } finally {
                  setSyncingBist(false);

                  setSyncingTefas(true);
                  try {
                    await handleTickerSync('TEFAS');
                  } finally {
                    setSyncingTefas(false);

                    // Altın ve Gümüş fiyatlarını güncelle
                    await fetchAndUpdateCommodityPrices();

                    toast.success("Tüm varlıklar güncellendi!", {
                      description: "BIST, TEFAS, Altın ve Gümüş fiyatları senkronize edildi",
                    });
                  }
                }
              }}
              disabled={syncingBist || syncingTefas}
              className="gap-2 bg-orange-50 hover:bg-orange-100 border-orange-200"
              title="Tüm Varlıkları Senkronize Et (BIST + TEFAS + Altın/Gümüş)"
            >
              <RefreshCw className={`h-4 w-4 ${(syncingBist || syncingTefas) ? 'animate-spin' : ''}`} />
              {(syncingBist || syncingTefas) ? '⏳' : '🔄'} Tümünü Güncelle
            </Button>

            <AddTransactionDialogDialogWithData />
            
            <Link href="/performance">
              <Button variant="outline" size="sm" className="gap-2">
                📊 Performans
              </Button>
            </Link>
            
            <Link href="/chat">
              <Button variant="outline" size="lg" className="gap-2">
                <Bot className="h-5 w-5" />
                <MessageSquare className="h-5 w-5" />
                AI Assistant
              </Button>
            </Link>
          </div>
        </div>
        
        <PortfolioDashboard currency={currency} onCurrencyChange={toggleCurrency} />
      </div>
    </div>
  )
}

function AddTransactionDialogDialogWithData() {
  const handleSuccess = () => {
    window.location.reload();
  };

  return <AddTransactionDialog onSuccess={handleSuccess} />;
}
