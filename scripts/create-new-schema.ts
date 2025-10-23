#!/usr/bin/env npx tsx

/**
 * Create New Database Schema Script
 * Yeni veritabanı tablolarını oluşturur
 *
 * Kullanım: npx tsx scripts/create-new-schema.ts
 */

import { db, marketInstruments, priceHistory, dividends, userHoldings, syncPerformanceLog } from '../db';

async function createNewSchema() {
    console.log('🗄️  Creating new database schema...');

    try {
        // Tabloları oluştur (Drizzle migration yerine manuel)
        console.log('📋 Creating market_instruments table...');
        await db.run(`
            CREATE TABLE IF NOT EXISTS market_instruments (
                id TEXT PRIMARY KEY NOT NULL,
                type TEXT NOT NULL,
                symbol TEXT NOT NULL,
                name TEXT NOT NULL,
                exchange TEXT NOT NULL,
                sector TEXT,
                industry TEXT,
                city TEXT,
                currency TEXT DEFAULT 'TRY',
                current_price REAL,
                previous_close REAL,
                change_amount REAL,
                change_percent REAL,
                last_updated INTEGER,
                is_active INTEGER DEFAULT 1,
                extra_data TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
        `);

        console.log('📋 Creating price_history table...');
        await db.run(`
            CREATE TABLE IF NOT EXISTS price_history (
                id TEXT PRIMARY KEY NOT NULL,
                instrument_id TEXT NOT NULL,
                price REAL NOT NULL,
                volume INTEGER,
                high_price REAL,
                low_price REAL,
                open_price REAL,
                change_amount REAL,
                change_percent REAL,
                currency TEXT NOT NULL,
                data_source TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (instrument_id) REFERENCES market_instruments(id) ON DELETE CASCADE
            )
        `);

        console.log('📋 Creating dividends table...');
        await db.run(`
            CREATE TABLE IF NOT EXISTS dividends (
                id TEXT PRIMARY KEY NOT NULL,
                instrument_id TEXT NOT NULL,
                amount REAL NOT NULL,
                dividend_type TEXT NOT NULL,
                ex_date INTEGER NOT NULL,
                payment_date INTEGER,
                currency TEXT NOT NULL,
                description TEXT,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (instrument_id) REFERENCES market_instruments(id) ON DELETE CASCADE
            )
        `);

        console.log('📋 Creating user_holdings table...');
        await db.run(`
            CREATE TABLE IF NOT EXISTS user_holdings (
                id TEXT PRIMARY KEY NOT NULL,
                user_id TEXT NOT NULL,
                portfolio_id TEXT NOT NULL,
                instrument_id TEXT NOT NULL,
                quantity REAL NOT NULL,
                avg_cost REAL NOT NULL,
                total_cost REAL NOT NULL,
                current_value REAL,
                profit_loss REAL,
                profit_loss_percent REAL,
                first_purchase_date INTEGER,
                last_updated INTEGER NOT NULL,
                UNIQUE(user_id, instrument_id, portfolio_id),
                FOREIGN KEY (instrument_id) REFERENCES market_instruments(id) ON DELETE CASCADE
            )
        `);

        console.log('📋 Creating sync_performance_log table...');
        await db.run(`
            CREATE TABLE IF NOT EXISTS sync_performance_log (
                id TEXT PRIMARY KEY NOT NULL,
                sync_type TEXT NOT NULL,
                batch_count INTEGER NOT NULL,
                total_records INTEGER NOT NULL,
                processed_records INTEGER NOT NULL,
                failed_records INTEGER NOT NULL,
                duration_ms INTEGER NOT NULL,
                memory_usage_mb INTEGER,
                status TEXT NOT NULL,
                error_message TEXT,
                error_details TEXT,
                sync_config TEXT,
                created_at INTEGER NOT NULL
            )
        `);

        // Index'leri oluştur
        console.log('📊 Creating indexes...');

        // market_instruments indexes
        await db.run(`CREATE INDEX IF NOT EXISTS idx_market_instruments_type_symbol ON market_instruments(type, symbol)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_market_instruments_active ON market_instruments(is_active)`);
        await db.run(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_market_instruments_type_symbol ON market_instruments(type, symbol)`);

        // price_history indexes
        await db.run(`CREATE INDEX IF NOT EXISTS idx_price_history_instrument_timestamp ON price_history(instrument_id, timestamp DESC)`);

        // user_holdings indexes
        await db.run(`CREATE INDEX IF NOT EXISTS idx_user_holdings_user_portfolio ON user_holdings(user_id, portfolio_id)`);

        // sync_performance_log indexes
        await db.run(`CREATE INDEX IF NOT EXISTS idx_sync_performance_log_status ON sync_performance_log(status)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_sync_performance_log_created_at ON sync_performance_log(created_at)`);
        await db.run(`CREATE INDEX IF NOT EXISTS idx_sync_performance_log_sync_type ON sync_performance_log(sync_type)`);

        console.log('✅ Schema created successfully!');

        // Test data ekle
        await insertTestData();

        console.log('🎉 New database schema is ready!');

    } catch (error) {
        console.error('❌ Error creating schema:', error);
        throw error;
    }
}

async function insertTestData() {
    console.log('🌱 Inserting test data...');

    try {
        // Test market instruments
        console.log('📈 Adding sample market instruments...');

        await db.insert(marketInstruments).values([
            {
                id: 'inst_001',
                type: 'STOCK',
                symbol: 'GARAN',
                name: 'Garanti Bankası A.Ş.',
                exchange: 'BIST',
                sector: 'Bankacılık',
                industry: 'Mali Bankacılık',
                city: 'İstanbul',
                currency: 'TRY',
                currentPrice: 45.50,
                previousClose: 45.20,
                changeAmount: 0.30,
                changePercent: 0.66,
                lastUpdated: Date.now(),
                isActive: true,
                extraData: JSON.stringify({
                    isin: 'TRGGRB41015',
                    marketCap: 123456789012,
                    beta: 1.2
                }),
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            {
                id: 'inst_002',
                type: 'FUND',
                symbol: 'ADP',
                name: 'AK Portföy BIST Banka Endeksi...',
                exchange: 'TEFAS',
                sector: 'Fon',
                industry: 'Hisse Senedi Yoğun',
                currency: 'TRY',
                currentPrice: 1.0638,
                previousClose: 1.0638,
                changeAmount: 0,
                changePercent: 0,
                lastUpdated: Date.now(),
                isActive: true,
                extraData: JSON.stringify({
                    tefasCode: 'ADP',
                    fundType: 'HİSSE SENEDİ YOĞUN',
                    riskLevel: 'ORTA'
                }),
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            {
                id: 'inst_003',
                type: 'COMMODITY',
                symbol: 'GOLD',
                name: 'Gram Altın',
                exchange: 'FREE_MARKET',
                sector: 'Değerli Metaller',
                currency: 'TRY',
                currentPrice: 2450.75,
                previousClose: 2445.20,
                changeAmount: 5.55,
                changePercent: 0.23,
                lastUpdated: Date.now(),
                isActive: true,
                extraData: JSON.stringify({
                    unit: 'GRAM',
                    purity: 999.9,
                    marketSource: 'kapalicarsi'
                }),
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            {
                id: 'inst_004',
                type: 'CRYPTO',
                symbol: 'BTC',
                name: 'Bitcoin',
                exchange: 'MULTIPLE',
                sector: 'Kripto Para',
                currency: 'USD',
                currentPrice: 67250.00,
                previousClose: 66500.00,
                changeAmount: 750.00,
                changePercent: 1.13,
                lastUpdated: Date.now(),
                isActive: true,
                extraData: JSON.stringify({
                    coinmarketcapId: 1,
                    consensus: 'PoW',
                    exchanges: ['binance', 'coinbase']
                }),
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            {
                id: 'inst_005',
                type: 'CASH',
                symbol: 'TRY',
                name: 'Türk Lirası',
                exchange: 'CBRT',
                sector: 'Nakit',
                currency: 'TRY',
                currentPrice: 1.00,
                previousClose: 1.00,
                changeAmount: 0,
                changePercent: 0,
                lastUpdated: Date.now(),
                isActive: true,
                extraData: JSON.stringify({
                    currencyCode: 'TRY',
                    centralBank: 'TCMB',
                    interestRate: 0.50
                }),
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        ]);

        console.log('✅ Test data inserted successfully!');

    } catch (error) {
        console.error('❌ Error inserting test data:', error);
        throw error;
    }
}

// Script'i çalıştır
if (require.main === module) {
    createNewSchema()
        .then(() => {
            console.log('\n🎊 SUCCESS: New database schema is ready!');
            console.log('📊 Tables created:');
            console.log('   ✓ market_instruments');
            console.log('   ✓ price_history');
            console.log('   ✓ dividends');
            console.log('   ✓ user_holdings');
            console.log('   ✓ sync_performance_log');
            console.log('\n🌱 Test data inserted: 5 sample instruments');
            console.log('\n🚀 Ready for Phase 2: Seed Data & Master Data!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 FAILED:', error);
            process.exit(1);
        });
}

export { createNewSchema };