import { subDays, subWeeks, subMonths, subYears } from "date-fns";

// Tip tanımları
export interface Transaction {
    id: string;
    assetId: string;
    transactionType: "BUY" | "SELL";
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
    transactionDate: Date;
    notes?: string;
}

export interface Asset {
    id: string;
    name: string;
    assetType: "GOLD" | "SILVER" | "STOCK" | "FUND" | "CRYPTO" | "EUROBOND";
    currentPrice?: number;
}

export interface PortfolioHolding {
    assetId: string;
    assetName: string;
    assetType: string;
    netQuantity: number;
    totalCost: number;
    averagePrice: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
    lots: AssetLot[];
}

export interface AssetLot {
    transactionId: string;
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
    transactionDate: Date;
    remainingQuantity: number; // FIFO hesaplaması için
}

export interface PortfolioSummary {
    totalValue: number;
    totalCost: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    holdings: PortfolioHolding[];
}

export interface PerformanceMetrics {
    dailyReturn: number;
    weeklyReturn: number;
    monthlyReturn: number;
    yearlyReturn: number;
    totalReturn: number;
    annualizedReturn: number;
    maxDrawdown: number;
}

/**
 * Portfolyonun toplam değerini hesaplar
 */
export function calculatePortfolioValue(
    holdings: PortfolioHolding[]
): number {
    return holdings.reduce((total, holding) => total + holding.currentValue, 0);
}

/**
 * Belirli bir asset için holding bilgilerini hesaplar
 */
export function calculateAssetHolding(
    asset: Asset,
    transactions: Transaction[]
): PortfolioHolding {
    const assetTransactions = transactions
        .filter(t => t.assetId === asset.id)
        .sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime());

    if (assetTransactions.length === 0) {
        return {
            assetId: asset.id,
            assetName: asset.name,
            assetType: asset.assetType,
            netQuantity: 0,
            totalCost: 0,
            averagePrice: 0,
            currentValue: 0,
            profitLoss: 0,
            profitLossPercent: 0,
            lots: []
        };
    }

    let lots: AssetLot[] = [];
    let netQuantity = 0;
    let totalCost = 0;

    // İşlemleri kronolojik sırayla işle
    for (const transaction of assetTransactions) {
        if (transaction.transactionType === "BUY") {
            // Alış işlemi - yeni lot oluştur
            const lot: AssetLot = {
                transactionId: transaction.id,
                quantity: transaction.quantity,
                pricePerUnit: transaction.pricePerUnit,
                totalAmount: transaction.totalAmount,
                transactionDate: transaction.transactionDate,
                remainingQuantity: transaction.quantity
            };
            lots.push(lot);
            netQuantity += transaction.quantity;
            totalCost += transaction.totalAmount;
        } else {
            // Satış işlemi - FIFO veya özel lot seçimi
            const sellResult = processSale(
                asset.assetType,
                lots,
                transaction.quantity,
                transaction.pricePerUnit
            );
            
            lots = sellResult.updatedLots;
            netQuantity -= transaction.quantity;
            totalCost -= sellResult.soldCost;
        }
    }

    // Kalan lotları filtrele (quantity > 0)
    lots = lots.filter(lot => lot.remainingQuantity > 0);

    const averagePrice = netQuantity > 0 ? totalCost / netQuantity : 0;
    const currentPrice = asset.currentPrice || averagePrice;
    const currentValue = netQuantity * currentPrice;
    const profitLoss = currentValue - totalCost;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    return {
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.assetType,
        netQuantity,
        totalCost,
        averagePrice,
        currentValue,
        profitLoss,
        profitLossPercent,
        lots
    };
}

/**
 * Satış işlemini FIFO veya özel lot seçimine göre işler
 */
export function processSale(
    assetType: string,
    lots: AssetLot[],
    sellQuantity: number,
    sellPrice: number
): { updatedLots: AssetLot[]; soldCost: number; realizedPnL: number } {
    if (assetType === "FUND") {
        return processFIFOSale(lots, sellQuantity, sellPrice);
    } else {
        // Diğer asset türleri için FIFO (varsayılan olarak)
        // Gelecekte özel lot seçimi eklenebilir
        return processFIFOSale(lots, sellQuantity, sellPrice);
    }
}

/**
 * FIFO (First In, First Out) yöntemine göre satış işlemi
 */
export function processFIFOSale(
    lots: AssetLot[],
    sellQuantity: number,
    sellPrice: number
): { updatedLots: AssetLot[]; soldCost: number; realizedPnL: number } {
    const updatedLots = [...lots];
    let remainingSellQuantity = sellQuantity;
    let soldCost = 0;
    let soldRevenue = 0;

    // Lotları tarih sırasına göre sırala (FIFO için)
    updatedLots.sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime());

    for (let i = 0; i < updatedLots.length && remainingSellQuantity > 0; i++) {
        const lot = updatedLots[i];
        
        if (lot.remainingQuantity > 0) {
            const quantityToSell = Math.min(lot.remainingQuantity, remainingSellQuantity);
            const costBasis = (quantityToSell / lot.quantity) * lot.totalAmount;
            const revenue = quantityToSell * sellPrice;
            
            lot.remainingQuantity -= quantityToSell;
            remainingSellQuantity -= quantityToSell;
            soldCost += costBasis;
            soldRevenue += revenue;
        }
    }

    const realizedPnL = soldRevenue - soldCost;

    // Eğer satılacak miktar, mevcut holdingden fazla ise hata
    if (remainingSellQuantity > 0) {
        throw new Error(`Yetersiz holding: ${remainingSellQuantity} adet eksik`);
    }

    return { updatedLots, soldCost, realizedPnL };
}

/**
 * Özel lot seçimi ile satış işlemi (kıymetli madenler için)
 */
export function processSpecificLotSale(
    lots: AssetLot[],
    selectedLots: { lotId: string; quantity: number }[],
    sellPrice: number
): { updatedLots: AssetLot[]; soldCost: number; realizedPnL: number } {
    const updatedLots = [...lots];
    let soldCost = 0;
    let soldRevenue = 0;
    let totalSoldQuantity = 0;

    for (const selection of selectedLots) {
        const lotIndex = updatedLots.findIndex(l => l.transactionId === selection.lotId);
        
        if (lotIndex === -1) {
            throw new Error(`Lot bulunamadı: ${selection.lotId}`);
        }

        const lot = updatedLots[lotIndex];
        
        if (lot.remainingQuantity < selection.quantity) {
            throw new Error(`Lot ${selection.lotId} için yetersiz miktar`);
        }

        const costBasis = (selection.quantity / lot.quantity) * lot.totalAmount;
        const revenue = selection.quantity * sellPrice;
        
        lot.remainingQuantity -= selection.quantity;
        soldCost += costBasis;
        soldRevenue += revenue;
        totalSoldQuantity += selection.quantity;
    }

    const realizedPnL = soldRevenue - soldCost;

    return { updatedLots, soldCost, realizedPnL };
}

/**
 * Portfolio performans metriklerini hesaplar
 */
export function calculatePerformanceMetrics(
    transactions: Transaction[],
    currentHoldings: PortfolioHolding[]
): PerformanceMetrics {
    if (transactions.length === 0) {
        return {
            dailyReturn: 0,
            weeklyReturn: 0,
            monthlyReturn: 0,
            yearlyReturn: 0,
            totalReturn: 0,
            annualizedReturn: 0,
            maxDrawdown: 0
        };
    }

    const now = new Date();
    const oneDayAgo = subDays(now, 1);
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);
    const oneYearAgo = subYears(now, 1);

    const currentValue = calculatePortfolioValue(currentHoldings);
    const totalCost = currentHoldings.reduce((sum, h) => sum + h.totalCost, 0);
    
    // Toplam getiri
    const totalReturn = totalCost > 0 ? ((currentValue - totalCost) / totalCost) * 100 : 0;

    // Dönemsel getirileri hesaplamak için geçmiş değerleri simüle et
    // Gerçek uygulamada bu veriler historical price data'dan gelecek
    const dailyReturn = calculatePeriodReturn(transactions, oneDayAgo, currentValue);
    const weeklyReturn = calculatePeriodReturn(transactions, oneWeekAgo, currentValue);
    const monthlyReturn = calculatePeriodReturn(transactions, oneMonthAgo, currentValue);
    const yearlyReturn = calculatePeriodReturn(transactions, oneYearAgo, currentValue);

    // Yıllıklaştırılmış getiri (basit hesaplama)
    const daysSinceStart = Math.max(1, 
        (now.getTime() - Math.min(...transactions.map(t => t.transactionDate.getTime()))) / (1000 * 60 * 60 * 24)
    );
    const annualizedReturn = totalReturn * (365 / daysSinceStart);

    // Max drawdown hesaplama (basitleştirilmiş)
    const maxDrawdown = Math.min(0, totalReturn); // Gerçek uygulamada daha karmaşık

    return {
        dailyReturn,
        weeklyReturn,
        monthlyReturn,
        yearlyReturn,
        totalReturn,
        annualizedReturn,
        maxDrawdown
    };
}

/**
 * Belirli bir dönem için getiri hesaplar
 */
function calculatePeriodReturn(
    transactions: Transaction[],
    periodStart: Date,
    currentValue: number
): number {
    // Bu basitleştirilmiş bir hesaplama
    // Gerçek uygulamada historical prices ve portfolio values kullanılacak
    const periodTransactions = transactions.filter(t => 
        t.transactionDate >= periodStart
    );
    
    if (periodTransactions.length === 0) return 0;
    
    const periodInvestment = periodTransactions
        .filter(t => t.transactionType === "BUY")
        .reduce((sum, t) => sum + t.totalAmount, 0);
    
    const periodDivestment = periodTransactions
        .filter(t => t.transactionType === "SELL")
        .reduce((sum, t) => sum + t.totalAmount, 0);
    
    const netInvestment = periodInvestment - periodDivestment;
    
    if (netInvestment <= 0) return 0;
    
    // Basit getiri hesaplama
    return ((currentValue - netInvestment) / netInvestment) * 100;
}

/**
 * Para birimi dönüştürme
 */
export function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRate?: number
): number {
    if (fromCurrency === toCurrency) return amount;
    
    // Basit dönüştürme - gerçek uygulamada API'den güncel kurlar alınacak
    const rates: Record<string, number> = {
        "TRY_USD": 0.034, // 1 TRY = 0.034 USD
        "USD_TRY": 29.4,  // 1 USD = 29.4 TRY
    };
    
    const rateKey = `${fromCurrency}_${toCurrency}`;
    const rate = exchangeRate || rates[rateKey] || 1;
    
    return amount * rate;
}

/**
 * Portfolio özeti hesaplar
 */
export function calculatePortfolioSummary(
    assets: Asset[],
    transactions: Transaction[]
): PortfolioSummary {
    const holdings = assets.map(asset => 
        calculateAssetHolding(asset, transactions)
    ).filter(holding => holding.netQuantity > 0);

    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
    const totalProfitLoss = totalValue - totalCost;
    const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

    return {
        totalValue,
        totalCost,
        totalProfitLoss,
        totalProfitLossPercent,
        holdings
    };
}

/**
 * Hata yakalama wrapper fonksiyonu
 */
export function safeCalculate<T>(
    calculation: () => T,
    fallback: T,
    errorHandler?: (error: Error) => void
): T {
    try {
        return calculation();
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        if (errorHandler) {
            errorHandler(err);
        } else {
            console.error("Calculation error:", err);
        }
        return fallback;
    }
}