"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, DollarSign, Coins, Moon, Sun, Database } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { AddTransactionDialog } from "@/components/portfolio/add-transaction-dialog";
import { PortfolioDashboard } from "./portfolio-dashboard";
import { useToast } from "@/hooks/use-toast";

// Suppress hydration warnings for Dark Reader and other browser extensions
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string') {
      // Ignore hydration errors from browser extensions
      if (
        args[0].includes('data-darkreader') ||
        args[0].includes('Hydration') ||
        args[0].includes('did not match') ||
        args[0].includes('suppressHydrationWarning')
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
  const [syncing, setSyncing] = useState(false);
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

  const handleTickerSync = async () => {
    console.log('[BIST Sync] Button clicked, starting sync...');
    setSyncing(true);
    
    try {
      console.log('[BIST Sync] Fetching /api/tickers/sync...');
      const response = await fetch('/api/tickers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sync_type: 'BIST', 
          force: true,
          triggered_by: 'manual'
        })
      });
      
      console.log('[BIST Sync] Response status:', response.status);
      const data = await response.json();
      console.log('[BIST Sync] Response data:', data);
      
      if (data.success) {
        const result = data.data.results[0];
        console.log('[BIST Sync] Success:', result);
        toast({
          title: "✅ BIST Ticker Senkronizasyonu Tamamlandı",
          description: `${result.successful} ticker başarıyla eklendi. Süre: ${(result.duration_ms / 1000).toFixed(2)}s`,
        });
      } else {
        console.error('[BIST Sync] Failed:', data.error);
        toast({
          title: "❌ Senkronizasyon Hatası",
          description: data.error || "Bilinmeyen bir hata oluştu",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[BIST Sync] Exception:', error);
      toast({
        title: "❌ Bağlantı Hatası",
        description: error instanceof Error ? error.message : "API'ye bağlanırken hata oluştu",
        variant: "destructive"
      });
    } finally {
      console.log('[BIST Sync] Finished, setting syncing to false');
      setSyncing(false);
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

            {/* Ticker Sync Test Button (Development Only) */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleTickerSync}
              disabled={syncing}
              className="gap-2"
              title="BIST Ticker'larını Senkronize Et"
            >
              <Database className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? '⏳ Syncing...' : '📊 BIST Sync'}
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
