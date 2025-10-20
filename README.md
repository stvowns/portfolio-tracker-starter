# Portföy Takip Sistemi

Modern bir yatırım portföyü takip uygulaması. Altın, gümüş, hisse senetleri, yatırım fonları, kripto paralar ve eurobondlar gibi çeşitli varlıkları detaylı bir şekilde takip edebilirsiniz.

## 🎯 Temel Özellikler

- **🏆 Çoklu Varlık Desteği**: Altın (12 farklı çeşit), gümüş, hisse senetleri, yatırım fonları, kripto paralar, eurobondlar
- **📊 Detaylı Dashboard**: Toplam portföy değeri, kar/zarar, performans metrikleri
- **🔍 Varlık Detay Modalı**: Varlığa tıklayarak holding detaylarını, işlem geçmişini görüntüleme
- **➕ Kolay İşlem Yönetimi**: Alış/satış işlemlerini hızlıca ekleme
- **💰 Kar/Zarar Takibi**: Otomatik ortalama maliyet ve kâr/zarar hesaplama
- **🏦 Canlı Piyasa Fiyatları**: BIST, TEFAS, Yahoo Finance entegrasyonu
- **🔥 Otomatik Fiyat Doldurma**: Gram altın/gümüş seçiminde güncel fiyatları otomatik getirme
- **🎨 Modern Arayüz**: Shadcn/ui ile responsive, karanlık mod destekli tasarım

## 📸 Ekran Görüntüleri

### Dashboard
- Portföy değeri grafiği ve pasta grafiği
- Varlık dağılımı badges
- Detaylı varlık listesi

### İşlem Modalı
- Otomatik fiyat doldurma (Gram Altın/Gümüş)
- Hızlı ticker seçimi (BIST, TEFAS)
- Validation ve hata yönetimi

## 🏗️ Teknoloji Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router with Turbopack)
- **Language:** TypeScript
- **Authentication:** Better Auth
- **Database:** SQLite (development) / PostgreSQL (production) with Drizzle ORM
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Price APIs:** Yahoo Finance, Borsa İstanbul, TEFAS

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- npm, yarn veya pnpm

### Kurulum

1. **Projeyi klonla**
   ```bash
   git clone https://github.com/stvowns/portfolio-tracker-starter.git
   cd portfolio-tracker-starter
   ```

2. **Bağımlılıkları yükle**
   ```bash
   npm install
   ```

3. **Geliştirme sunucusunu başlat**
   ```bash
   npm run dev
   ```

4. **Tarayıcıda aç** [http://localhost:3000](http://localhost:3000)

## 📋 Kullanım

### Varlık Ekleme

1. **Yeni İşlem** butonuna tıkla
2. **Varlık Türü** seç:
   - **Altın/Gümüş**: Gram Altın veya Gram Gümüş seçildiğinde güncel fiyat otomatik dolar
   - **BIST**: Hisse kodu yaz (örn: GARAN)
   - **Yatırım Fonu**: Fon kodu veya adıyla ara
   - **Kripto**: Bitcoin, Ethereum gibi popüler kriptoları hızlı seç
3. **İşlem Bilgileri**:
   - Alış/Satış türü
   - Miktar ve fiyat (fiyat otomatik doldurulabilir)
   - Tarih ve notlar

### Özellikler

- **Otomatik Fiyat Çekme**: Gram Altın/Gümüş için güncel piyasa fiyatları
- **Portföy Analizi**: Anlık değer, kar/zarar, yüzdesel dağılım
- **İşlem Geçmişi**: Detaylı işlem geçmişi ve ortalama maliyet hesaplama
- **Çoklu Para Birimi**: TRY, USD, EUR desteği

## 🗂️ Proje Yapısı

```
portfolio-tracker-starter/
├── app/                        # Next.js sayfaları
│   ├── dashboard/             # Ana dashboard sayfası
│   ├── api/                   # API route'ları
│   └── layout.tsx             # Ana layout
├── components/                # React bileşenleri
│   ├── portfolio/             # Portföy bileşenleri
│   │   ├── add-transaction-dialog.tsx
│   │   ├── asset-detail-modal.tsx
│   │   └── portfolio-pie-chart.tsx
│   └── ui/                    # shadcn/ui bileşenleri
├── lib/                       # Servis ve yardımcı dosyalar
│   ├── services/              # Veri servisleri
│   └── utils.ts               # Yardımcı fonksiyonlar
├── documentation/             # Proje dokümantasyonu
│   ├── api/                   # API dokümantasyonu
│   ├── architecture/          # Mimari dokümanlar
│   └── guides/                # Kullanım rehberleri
└── archive/                   # Eski dokümanlar
```

## 🔧 Geliştirme

### Komutlar

```bash
# Geliştirme
npm run dev              # Geliştirme sunucusu
npm run build            # Production build
npm run start            # Production sunucusu

# Veritabanı
npm run db:up            # PostgreSQL'i Docker'da başlat
npm run db:down          # PostgreSQL'i durdur
npm run db:push          # Schema değişikliklerini push et
npm run db:studio        # Drizzle Studio (veritabanı GUI)
npm run db:reset         # Veritabanını sıfırla

# Diğer
npm run lint             # ESLint çalıştır
npm run docker:up        # Tüm stack'i Docker'da başlat
```

### Price API Entegrasyonu

Farklı kaynaklardan fiyat bilgisi çekme:

- **BIST**: `/api/prices/latest?symbol=GARAN&type=STOCK`
- **TEFAS**: Otomatik senkronizasyon (3285+ fon)
- **Yahoo Finance**: Kripto ve uluslararası varlıklar
- **Piyasa Fiyatları**: `/api/test/all-prices` (Altın/Gümüş gram)

## 📊 API Endpoints

### Fiyat Bilgisi
```typescript
GET /api/prices/latest?symbol={symbol}&type={type}
{
  success: true,
  data: {
    currentPrice: number,
    currency: string,
    timestamp: string
  }
}
```

### Portföy İşlemleri
```typescript
GET /api/portfolio/assets          # Varlıkları listele
POST /api/portfolio/transactions   # İşlem ekle
GET /api/portfolio/summary         # Portföy özeti
```

## 🤝 Katkı

Katkılarınızı bekliyoruz! Lütfen Pull Request göndermeden önce:

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inize push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı ile lisanslanmıştır.

## 🔗 Bağlantılar

- [Live Demo](https://your-demo-url.com)
- [API Dokümantasyonu](./documentation/api/)
- [Mimari Dokümanı](./documentation/architecture/ARCHITECTURE_EXPLAINED.md)
- [Kullanım Kılavuzu](./KULLANIM_KLAVUZU.md)

## 📞 İletişim

Sorularınız ve önerileriniz için:
- GitHub Issues üzerinden issue açın
- [stvowns@gmail.com](mailto:stvowns@gmail.com)

---

**⭐ Eğer projeyi beğendiyseniz lütfen star vermeyi unutmayın!**