/**
 * BIST Service
 *
 * Handles all BIST (Borsa Istanbul) related operations:
 * - Fetch company tickers from KAP API
 * - Fetch real-time stock prices from Yahoo Finance
 * - Search and filter BIST companies
 */

import * as XLSX from 'xlsx';

/**
 * BIST Company Interface
 */
export interface BISTCompany {
    ticker_kodu: string;
    sirket_adi: string;
    sehir?: string;
}

/**
 * BIST Stock Price Interface
 */
export interface BISTStockPrice {
    symbol: string;
    yahooSymbol: string;
    currentPrice: number;
    previousClose: number;
    changeAmount: number;
    changePercent: number;
    currency: string;
    timestamp: string;
    source: string;
}

/**
 * BIST Service Class
 *
 * Centralized service for all BIST operations
 */
export class BISTService {
    private readonly KAP_EXCEL_URL = 'https://www.kap.org.tr/tr/api/company/generic/excel/IGS/A';
    private readonly YAHOO_FINANCE_API = 'https://query1.finance.yahoo.com/v8/finance/chart/';

    /**
     * Fetch all BIST companies from KAP Excel API
     *
     * @returns Promise<BISTCompany[]> Array of BIST companies
     * @throws Error if API call fails
     */
    async fetchCompanies(): Promise<BISTCompany[]> {
        try {
            console.log('[BIST Service] Fetching companies from KAP Excel API...');

            const response = await fetch(this.KAP_EXCEL_URL, {
                headers: {
                    'Accept': '*/*',
                    'Accept-Language': 'tr',
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'Referer': 'https://www.kap.org.tr/tr/bist-sirketler'
                }
            });

            if (!response.ok) {
                throw new Error(`KAP API returned ${response.status}: ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });

            // Get first sheet
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json<any>(firstSheet, { header: 1 });

            const companies: BISTCompany[] = [];

            // Skip header row (index 0)
            for (let i = 1; i < data.length; i++) {
                const row = data[i];

                if (!row || row.length < 3) continue;

                const tickerField = String(row[0] || '').trim();
                const name = String(row[1] || '').trim();
                const city = String(row[2] || '').trim();

                // Skip empty rows or header rows
                if (!tickerField || !name || tickerField === 'BIST KODU') {
                    continue;
                }

                // Handle multiple tickers (e.g., "GARAN, TGB")
                if (tickerField.includes(',')) {
                    const tickers = tickerField.split(',').map(t => t.trim());
                    for (const ticker of tickers) {
                        if (ticker) {
                            companies.push({
                                ticker_kodu: ticker,
                                sirket_adi: name,
                                sehir: city || undefined
                            });
                        }
                    }
                } else {
                    companies.push({
                        ticker_kodu: tickerField,
                        sirket_adi: name,
                        sehir: city || undefined
                    });
                }
            }

            console.log(`[BIST Service] Successfully fetched ${companies.length} companies`);
            return companies;

        } catch (error) {
            console.error('[BIST Service] Error fetching companies:', error);
            throw error;
        }
    }

    /**
     * Search companies by query (local filtering)
     *
     * @param companies Array of companies to search
     * @param query Search query
     * @returns Filtered companies
     */
    searchCompanies(companies: BISTCompany[], query: string): BISTCompany[] {
        if (!query || query.length < 2) {
            return companies;
        }

        const queryLower = query.toLowerCase();
        const queryNormalized = this.normalizeText(query);

        return companies.filter(company => {
            const tickerLower = company.ticker_kodu.toLowerCase();
            const nameLower = company.sirket_adi.toLowerCase();
            const nameNormalized = this.normalizeText(company.sirket_adi);

            return tickerLower.includes(queryLower) ||
                   nameLower.includes(queryLower) ||
                   nameNormalized.includes(queryNormalized);
        });
    }

    /**
     * Fetch real-time stock price from Yahoo Finance
     *
     * @param ticker BIST ticker symbol (e.g., "GARAN")
     * @returns Promise<BISTStockPrice> Stock price information
     * @throws Error if API call fails
     */
    async fetchStockPrice(ticker: string): Promise<BISTStockPrice> {
        try {
            // BIST symbols need .IS suffix for Yahoo Finance
            const yahooSymbol = `${ticker}.IS`;

            console.log(`[BIST Service] Fetching price for ${ticker} (${yahooSymbol})...`);

            const response = await fetch(`${this.YAHOO_FINANCE_API}${yahooSymbol}?interval=1d&range=1d`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Hisse senedi bulunamadı: ${ticker}. Bu sembol artık işlem görmüyor olabilir.`);
                } else if (response.status === 429) {
                    throw new Error(`API limiti aşıldı. Lütfen birkaç saniye bekleyip tekrar deneyin.`);
                } else {
                    throw new Error(`Yahoo Finance API Hatası (${response.status}): ${response.statusText}`);
                }
            }

            const data = await response.json();

            // Extract price data
            const result = data?.chart?.result?.[0];
            if (!result || !result.meta) {
                throw new Error('Invalid response format from Yahoo Finance');
            }

            const meta = result.meta;
            const currentPrice = meta.regularMarketPrice;
            const previousClose = meta.chartPreviousClose || meta.previousClose;
            const currency = meta.currency || 'TRY';

            if (!currentPrice) {
                throw new Error('Price data not available');
            }

            const changeAmount = currentPrice - (previousClose || currentPrice);
            const changePercent = previousClose
                ? ((currentPrice - previousClose) / previousClose) * 100
                : 0;

            console.log(`[BIST Service] Success: ${ticker} = ${currentPrice} ${currency}`);

            return {
                symbol: ticker,
                yahooSymbol,
                currentPrice,
                previousClose: previousClose || currentPrice,
                changeAmount,
                changePercent,
                currency,
                timestamp: new Date().toISOString(),
                source: 'yahoo-finance'
            };

        } catch (error) {
            console.error(`[BIST Service] Error fetching price for ${ticker}:`, error);
            throw error;
        }
    }

    /**
     * Fetch multiple stock prices
     *
     * @param tickers Array of BIST ticker symbols
     * @returns Promise<BISTStockPrice[]> Array of stock prices
     */
    async fetchMultipleStockPrices(tickers: string[]): Promise<BISTStockPrice[]> {
        const prices: BISTStockPrice[] = [];

        // Process in batches to avoid overwhelming Yahoo Finance
        const batchSize = 10;

        for (let i = 0; i < tickers.length; i += batchSize) {
            const batch = tickers.slice(i, i + batchSize);

            const batchPromises = batch.map(ticker =>
                this.fetchStockPrice(ticker).catch(error => {
                    console.warn(`[BIST Service] Failed to fetch price for ${ticker}:`, error.message);
                    return null;
                })
            );

            const batchResults = await Promise.all(batchPromises);
            prices.push(...batchResults.filter(price => price !== null));
        }

        return prices;
    }

    /**
     * Normalize Turkish text for better search
     */
    private normalizeText(text: string): string {
        const trMap: Record<string, string> = {
            'İ': 'i', 'ı': 'i', 'Ö': 'o', 'ö': 'o',
            'Ü': 'u', 'ü': 'u', 'Ş': 's', 'ş': 's',
            'Ç': 'c', 'ç': 'c', 'Ğ': 'g', 'ğ': 'g'
        };

        let normalized = text.toLowerCase();
        for (const [tr, en] of Object.entries(trMap)) {
            normalized = normalized.replace(new RegExp(tr, 'g'), en);
        }

        // Remove common suffixes
        normalized = normalized.replace(/\s+a\.s\.?|\s+anonim sirketi/g, '');
        normalized = normalized.replace(/[\.,'\s]+/g, '');

        return normalized;
    }
}

/**
 * Export singleton instance for convenience
 */
export const bistService = new BISTService();

/**
 * Legacy exports for backward compatibility
 * @deprecated Use BISTService class instead
 */
export async function fetchBISTCompaniesFromKAP(): Promise<BISTCompany[]> {
    return bistService.fetchCompanies();
}

export function searchCompanies(companies: BISTCompany[], query: string): BISTCompany[] {
    return bistService.searchCompanies(companies, query);
}