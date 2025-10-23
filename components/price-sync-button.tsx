"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PriceSyncButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSyncAll = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/prices/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: true }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Fiyatlar güncellendi!", {
          description: `${data.data.successful} başarılı, ${data.data.failed} başarısız`,
          duration: 3000,
        });

        // Sayfayı yenile
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error("Fiyat güncelleme başarısız", {
          description: data.error || "Bilinmeyen hata",
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error("Fiyat güncelleme hatası", {
        description: "Lütfen tekrar deneyin",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSyncAll}
      disabled={isLoading}
      variant="default"
      size="sm"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Güncelleniyor...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Tümünü Güncelle
        </>
      )}
    </Button>
  );
}