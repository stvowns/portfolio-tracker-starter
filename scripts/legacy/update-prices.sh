#!/bin/bash

# Altın ve Gümüş fiyatlarını güncelleme script'i
echo "🔄 Fiyat güncellemesi başlatılıyor..."

# Altın fiyatını al ve güncelle
GOLD_PRICE=$(curl -s "http://localhost:3001/api/prices/latest?symbol=GOLD&type=COMMODITY" | grep -o '"currentPrice":[^,]*' | cut -d':' -f2 | tr -d '"')
if [ ! -z "$GOLD_PRICE" ]; then
    sqlite3 portfolio.db "UPDATE assets SET current_price = '$GOLD_PRICE', last_updated = $(date +%s)000 WHERE asset_type = 'GOLD';"
    echo "✅ Altın fiyatı güncellendi: ₺$GOLD_PRICE"
else
    echo "❌ Altın fiyatı alınamadı"
fi

# Gümüş fiyatını al ve güncelle
SILVER_PRICE=$(curl -s "http://localhost:3001/api/prices/latest?symbol=SILVER&type=COMMODITY" | grep -o '"currentPrice":[^,]*' | cut -d':' -f2 | tr -d '"')
if [ ! -z "$SILVER_PRICE" ]; then
    sqlite3 portfolio.db "UPDATE assets SET current_price = '$SILVER_PRICE', last_updated = $(date +%s)000 WHERE asset_type = 'SILVER';"
    echo "✅ Gümüş fiyatı güncellendi: ₺$SILVER_PRICE"
else
    echo "❌ Gümüş fiyatı alınamadı"
fi

echo "🎉 Fiyat güncellemesi tamamlandı!"

# Portfolio'yu kontrol et
curl -s "http://localhost:3001/api/portfolio" | grep -o '"totalProfitLossPercent":[^,]*'