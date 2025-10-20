# Troubleshooting Guide

## Problem: npm run dev ENOENT hatası

### Hata Mesajı
```
ENOENT: no such file or directory, open '.next/static/development/_buildManifest.js.tmp.xxxxx'
```

### Sebep
Next.js Turbopack'in development cache'inde geçici dosya oluşturma sırasında race condition.

---

## Çözümler (Sırayla Dene)

### ✅ Çözüm 1: .next Klasörünü Temizle (En Hızlı)
```bash
rm -rf .next
npm run dev
```

### ✅ Çözüm 2: Tam Cache Temizliği
```bash
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

### ✅ Çözüm 3: Turbopack'i Geçici Devre Dışı Bırak
```bash
# package.json'da değişiklik:
# "dev": "next dev --turbopack"  → "dev": "next dev"

npm run dev
```

### ✅ Çözüm 4: Node Modules Temizliği (Kapsamlı)
```bash
rm -rf node_modules
rm -rf .next
rm package-lock.json
npm install
npm run dev
```

---

## Kalıcı Çözüm: package.json Script Ekle

### 1. Temizlik scripti ekle:
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "dev:clean": "rm -rf .next && next dev --turbopack",
    "clean": "rm -rf .next node_modules/.cache"
  }
}
```

### 2. Kullanım:
```bash
# Problem olduğunda:
npm run dev:clean

# Veya önce temizle, sonra çalıştır:
npm run clean
npm run dev
```

---

## Hata Tekrar Ederse

### Port Çakışması Kontrolü:
```bash
# Port 3000 kullanımda mı?
lsof -i :3000

# Eğer başka bir process varsa:
kill -9 <PID>
```

### Dosya Sistemi İzinleri:
```bash
# .next klasörü izinlerini kontrol et:
ls -la .next

# Eğer problem varsa:
sudo chown -R $USER:$USER .next
chmod -R 755 .next
```

---

## Önleme

1. **Graceful Shutdown**: Ctrl+C ile dev server'ı durdur (SIGTERM)
2. **Tek Instance**: Aynı anda sadece bir `npm run dev` çalıştır
3. **Disk Alanı**: `df -h` ile disk alanını kontrol et
4. **Git Clean**: `git clean -fdx .next` ile temiz başla

---

## Alternatif: Turbopack Olmadan Çalıştır

Turbopack bazen kararsız olabiliyor. Klasik mod daha stabil:

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:turbo": "next dev --turbopack"
  }
}
```

Turbopack olmadan çalıştırmak için:
```bash
npm run dev
```
