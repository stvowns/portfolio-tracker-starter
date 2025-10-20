# Portföy Takip Sistemi - Proje Dokümantasyonu

## Proje Hakkında

Bu proje, kullanıcıların yatırım varlıklarını takip etmelerini sağlayan modern bir portföy yönetim uygulamasıdır. Altın, gümüş, hisse senetleri, yatırım fonları, kripto paralar ve eurobondlar gibi çeşitli varlık türlerini destekler.

## 🎯 Temel Özellikler

- **Çoklu Varlık Desteği**: Altın (çeyrek, yarım, tam, cumhuriyet, has altın, bilezik çeşitleri), gümüş, hisse senetleri, fonlar, kriptolar
- **Detaylı Varlık Analizi**: Tıklanabilir varlık kartları ile holding detayları, ortalama maliyet, kar/zarar
- **İşlem Yönetimi**: Alım/satım işlemleri ve işlem geçmişi takibi
- **Anlık Dashboard**: Toplam portföy değeri, kar/zarar, performans metrikleri
- **Modern Arayüz**: Shadcn/ui bileşenleri ile responsive tasarım
- **SQLite Veritabanı**: Hızlı ve lokal veri saklama

## 🏗️ Teknoloji Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui
- **Veritabanı**: SQLite with Drizzle ORM
- **Authentication**: Better Auth
- **Development**: Turbopack, ESLint

## 📊 Dashboard Özellikleri

### Özet Kartları
- **Toplam Değer**: Portföyün mevcut toplam değeri
- **Toplam Maliyet**: Yapılan toplam yatırım miktarı
- **Kar/Zarar**: Anlık kar/zarar durumu
- **Performans**: Yüzüsel getiri oranı

### Varlıklarım Tablosu
- Tıklanabilir varlık satırları
- Miktar, ortalama maliyet, mevcut değer bilgileri
- Kar/zarar göstergeleri
- Asset type ve kategori badge'leri

### Varlık Detay Modalı
- Varlığa tıklandığında açılan detaylı Modal
- Miktar, ortalama maliyet, mevcut değer, kar/zarar
- Tüm işlem geçmişi (alış/satış)
- Yeni işlem ekleme butonu

## 📝 Varlık Türleri ve Seçenekleri

### Altın Çeşitleri
- Çeyrek Altın
- Yarım Altın  
- Tam Altın
- Cumhuriyet Altını
- Ata Altın
- Has Altın (24 Ayar)
- 14 Ayar Bilezik
- 18 Ayar Bilezik
- 22 Ayar Bilezik
- Gram Altın
- Reşat Altını
- Hamit Altını

### Diğer Varlıklar
- **Gümüş**: Gram Gümüş, Gümüş Külçe, Gümüş Bilezik, Gümüş Para
- **Hisse Senetleri**: Manuel giriş (ör: AAPL, THYAO)
- **Yatırım Fonları**: Manuel giriş (ör: BIST 100)
- **Kripto Paralar**: Manuel giriş (ör: Bitcoin, Ethereum)
- **Eurobond*: Manuel giriş

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18+ 
- npm

### Kurulum
```bash
# Proje klonlama
git clone <repository-url>
cd portfolio-tracker-starter

# Bağımlılıkları yükle
npm install

# Veritabanını başlat
npm run db:push

# Geliştirme sunucusunu başlat
npm run dev
```

### Uygulama Erişimi
- Dashboard: http://localhost:3001 (veya 3000)
- Authentication: Giriş kaydı gerekmez (demo mode)

## 📂 Proje Yapısı

```
portfolio-tracker-starter/
├── app/                    # Next.js Application Router
│   ├── api/portfolio/      # Portfolio API endpoints
│   ├── dashboard/          # Dashboard sayfası
│   └── (auth pages)/       # Authentication sayfaları
├── components/
│   ├── portfolio/          # Portfolio UI bileşenleri
│   │   ├── add-transaction-dialog.tsx
│   │   ├── asset-detail-modal.tsx
│   │   ├── assets-table.tsx
│   │   └── portfolio-summary-cards.tsx
│   └── ui/                 # Shadcn/ui temel bileşenler
├── db/
│   └── schema/             # Drizzle database şemaları
├── lib/
│   ├── auth-utils.ts       # Authentication utils
│   ├── validations/        # Zod validation şemaları
│   └── utils.ts            # Genel utility fonksiyonları
└── documentation/          # Proje dokümantasyonu
```

## 🔧 Development Commands

```bash
# Geliştirme sunucusu
npm run dev

# Veritabanı işlemleri
npm run db:push        # Schema'yı uygula
npm run db:reset       # Veritabanını sıfırla
npm run db:studio      # Drizzle Studio (DB GUI)

# Build ve Test
npm run build
npm run start
npm run lint
```

## 📋 Görev Yönetimi

### 1. View Your Tasks
The first thing you should do is look at the tasks that have been generated for your project:

```bash
codeguide task list
```

This will show you all the available tasks, organized by status (pending, in_progress, completed).

### 2. Start with Your First Task
Choose a task from the list and begin working on it:

```bash
codeguide task update <task_id> --status in_progress
```

Replace `<task_id>` with the actual ID of the task you want to work on.

### 3. Track Your Progress
As you work on tasks, update your progress:

```bash
codeguide task update <task_id> "your progress notes"
```

When you complete a task, mark it as completed:

```bash
codeguide task update <task_id> --status completed
```

### 4. Continue the Workflow
**Important**: After completing a task, immediately continue to the next available task. Keep this cycle going until all tasks are completed:

1. **Complete current task** → Mark as completed
2. **Choose next task** → Pick from remaining pending tasks
3. **Start next task** → Set status to in_progress
4. **Repeat** → Continue until no tasks remain

This continuous workflow ensures steady progress and prevents stagnation between tasks.

## Project Information

- **Project ID**: 9996f6d0-22b9-4cb2-a2e4-6f42e720cff0
- **Created with**: CodeGuide CLI
- **Documentation**: Check the `documentation/` folder for generated project documentation
- **AI Guidelines**: See `AGENTS.md` for AI development agent guidelines
- **Tasks Data**: See `tasks.json` for project task structure and information

## Recommended Workflow

1. **Review Tasks**: Always start by reviewing available tasks
2. **Plan Your Work**: Choose tasks that make sense to work on next
3. **Start Tasks**: Use `codeguide task update <task_id> --status in_progress` to begin work on a task
4. **Update Progress**: Keep your task progress updated as you work
5. **Complete Tasks**: Mark tasks as completed when finished
6. **Continue to Next Task**: After completing a task, immediately start the next available task until all tasks are done
7. **Generate Documentation**: Use `codeguide generate` for new features

## 🧹 Cleanup Instructions

### When You're Done with Setup

Once you've reviewed all the documentation and are ready to start development, you should clean up the project structure:

#### If this project was created in a subdirectory (not current directory):

1. **Move essential files to the project root:**
   ```bash
   # Move documentation folder to project root
   mv documentation/ ../

   # Move AGENTS.md to project root
   mv AGENTS.md ../

   # Move codeguide.json to project root
   mv codeguide.json ../

   # Move tasks.json to project root
   mv tasks.json ../

   # Navigate to the parent directory
   cd ..
   ```

2. **Remove the now-empty subdirectory:**
   ```bash
   # Remove the subdirectory (replace with actual directory name)
   rmdir <project-subdirectory-name>
   ```

3. **Delete this instructions.md file:**
   ```bash
   rm instructions.md
   ```

#### Your final project structure should be:
```
project-root/
├── documentation/          # Project documentation
├── AGENTS.md               # AI development guidelines
├── codeguide.json          # CodeGuide project configuration
├── tasks.json              # Project tasks data
└── (your source code files)
```

### Benefits of Cleanup:
- **Cleaner project structure** - No unnecessary nested directories
- **Better navigation** - All files are at the project root
- **Professional setup** - Matches standard project layouts
- **Removes setup artifacts** - No temporary instruction files

## Getting Help

- Use `codeguide --help` for general help
- Use `codeguide <command> --help` for command-specific help
- Use `codeguide task list --help` for task management help

---

*This file was generated by CodeGuide CLI on 2025-10-12T15:39:26.909Z*
