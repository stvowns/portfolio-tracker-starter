/**
 * TEFAS Crawler
 *
 * Modern TypeScript implementation of TEFAS fund crawler
 * Based on the Python crawler structure provided
 *
 * Crawls public investment fund information from Turkey Electronic Fund Trading Platform
 */

import { randomUUID } from 'crypto';

/**
 * TEFAS Fund Info Interface
 */
export interface TEFASFundInfo {
    date: string;
    code: string;
    name: string;
    price: number;
    numberOfShares: number;
    personCount: number;
    portfolioSize: number;
    stockMarketBulletinPrice: string | null;
}

/**
 * Cache entry interface
 */
interface CacheEntry {
    data: TEFASFundInfo[];
    timestamp: number;
    key: string;
}

/**
 * TEFAS Crawler Class
 *
 * Fetch public fund information from https://www.tefas.gov.tr
 *
 * Features:
 * - Built-in caching (5 minutes)
 * - Request timeout (30 seconds)
 * - Connection optimization
 * - Column filtering
 *
 * Examples:
 *
 * const crawler = new TEFASCrawler();
 * const data = await crawler.fetch(new Date());
 * console.log(data[0]);
 * // Output: { date: '2025-10-22', code: 'AAK', name: 'ATA PORTFÖY...', price: 29.943262, ... }
 *
 * const specificFund = await crawler.fetch(new Date(), undefined, 'AKF');
 *
 * const dateRange = await crawler.fetch(
 *   new Date('2025-10-20'),
 *   new Date('2025-10-22'),
 *   undefined,
 *   ['date', 'code', 'price']
 * );
 */
export class TEFASCrawler {
    private readonly rootUrl = 'https://www.tefas.gov.tr';
    private readonly historyInfoEndpoint = '/api/DB/BindHistoryInfo';
    private readonly headers = {
        'Connection': 'keep-alive',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Origin': 'https://www.tefas.gov.tr',
        'Referer': 'https://www.tefas.gov.tr/TarihselVeriler.aspx',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
    };

    // Cache configuration
    private readonly cache = new Map<string, CacheEntry>();
    private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Main entry point of the public API. Get fund information.
     *
     * @param start - The start date for fund information
     * @param end - The end date for fund information (optional)
     * @param fundCode - Fund code to filter specific fund (optional)
     * @param columns - List of columns to be returned (optional)
     * @returns Array of fund information
     * @throws Error if API call fails
     */
    async fetch(
        start: Date,
        end?: Date,
        fundCode?: string,
        columns?: (keyof TEFASFundInfo)[]
    ): Promise<TEFASFundInfo[]> {
        const startDate = this._formatDate(start);
        const endDate = this._formatDate(end || start);
        const cacheKey = `${startDate}-${endDate}-${fundCode || 'all'}`;

        // Check cache first
        const cachedData = this._getFromCache(cacheKey);
        if (cachedData) {
            console.log(`[TEFAS Crawler] 📦 Cache hit for ${startDate} to ${endDate}`);
            return this._applyColumnFilter(cachedData, columns);
        }

        console.log(`[TEFAS Crawler] Fetching funds from ${startDate} to ${endDate}...`);

        const data = {
            'fontip': 'YAT',
            'sfontur': '',
            'kurucukod': '',
            'fonkod': fundCode?.toUpperCase() || '',
            'bastarih': startDate,
            'bittarih': endDate,
            'fonturkod': ''
        };

        const response = await this._doPost(this.historyInfoEndpoint, data);

        // Parse and transform the response
        const funds = this._parseResponse(response);

        // Cache the results
        this._setCache(cacheKey, funds);

        const filteredFunds = this._applyColumnFilter(funds, columns);
        console.log(`[TEFAS Crawler] ✅ Successfully fetched ${filteredFunds.length} funds`);
        return filteredFunds;
    }

    /**
     * Fetch all available funds for the latest date
     */
    async fetchLatestFunds(): Promise<TEFASFundInfo[]> {
        return this.fetch(new Date());
    }

    /**
     * Fetch specific fund information
     */
    async fetchFund(fundCode: string, startDate?: Date, endDate?: Date): Promise<TEFASFundInfo[]> {
        return this.fetch(startDate || new Date(), endDate, fundCode);
    }

    /**
     * Perform HTTP POST request to TEFAS API with optimized settings and retry logic
     */
    private async _doPost(endpoint: string, data: Record<string, string>, retryCount: number = 0): Promise<any> {
        const maxRetries = 3;
        const retryDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(`${this.rootUrl}${endpoint}`, {
                method: 'POST',
                headers: this.headers,
                body: new URLSearchParams(data).toString(),
                signal: controller.signal,
                keepalive: true, // Keep connection alive for better performance
                compress: true    // Enable compression
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`TEFAS API returned ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();

            // Check if response is HTML (error page)
            if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
                throw new Error('TEFAS API returned HTML instead of JSON - access blocked');
            }

            const jsonResponse = JSON.parse(responseText);

            if (!jsonResponse.data || !Array.isArray(jsonResponse.data)) {
                throw new Error('Invalid response format from TEFAS API');
            }

            return jsonResponse;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[TEFAS Crawler] API request failed (attempt ${retryCount + 1}/${maxRetries}):`, errorMessage);

            // Retry logic for specific error types
            if (retryCount < maxRetries && this._shouldRetry(error)) {
                const delay = retryDelay(retryCount);
                console.log(`[TEFAS Crawler] Retrying in ${delay}ms...`);
                await this._sleep(delay);
                return this._doPost(endpoint, data, retryCount + 1);
            }

            // Handle final error
            throw this._handleFinalError(error);
        }
    }

    /**
     * Determine if request should be retried
     */
    private _shouldRetry(error: any): boolean {
        if (error instanceof Error) {
            // Retry on network errors, timeouts, and server errors
            return (
                error.name === 'AbortError' ||
                error.message.includes('timeout') ||
                error.message.includes('ENOTFOUND') ||
                error.message.includes('ECONNRESET') ||
                error.message.includes('fetch') ||
                (error.message.includes('TEFAS API returned') &&
                 (error.message.includes('429') || error.message.includes('500') || error.message.includes('502') || error.message.includes('503') || error.message.includes('504')))
            );
        }
        return false;
    }

    /**
     * Handle final error after all retries exhausted
     */
    private _handleFinalError(error: any): Error {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return new Error('TEFAS API request timeout after multiple retries (30 seconds)');
            }

            if (error.message.includes('HTML instead of JSON')) {
                return new Error('TEFAS API access is currently blocked - the service may be temporarily unavailable');
            }

            if (error.message.includes('Invalid response format')) {
                return new Error('TEFAS API response format has changed - code update required');
            }

            return new Error(`TEFAS API error: ${error.message}`);
        }

        return new Error('Unknown error occurred while fetching TEFAS data');
    }

    /**
     * Sleep utility for retry delays
     */
    private _sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Parse API response and transform to our interface with validation
     */
    private _parseResponse(response: any): TEFASFundInfo[] {
        if (!Array.isArray(response.data)) {
            throw new Error('Invalid response data: expected array');
        }

        const funds: TEFASFundInfo[] = [];
        let parsingErrors = 0;

        response.data.forEach((item: any, index: number) => {
            try {
                const fund = this._validateAndParseFund(item, index);
                if (fund) {
                    funds.push(fund);
                }
            } catch (error) {
                parsingErrors++;
                if (parsingErrors <= 5) { // Only log first 5 errors to avoid spam
                    console.error(`[TEFAS Crawler] Error parsing fund item at index ${index}:`, error, item);
                }
            }
        });

        if (parsingErrors > 0) {
            console.warn(`[TEFAS Crawler] Completed parsing with ${parsingErrors} errors out of ${response.data.length} items`);
        }

        if (funds.length === 0 && response.data.length > 0) {
            throw new Error('No valid funds could be parsed from the response');
        }

        return funds;
    }

    /**
     * Validate and parse individual fund item
     */
    private _validateAndParseFund(item: any, index: number): TEFASFundInfo | null {
        // Required field validation
        const code = item.FONKODU?.trim();
        const name = item.FONUNVAN?.trim();

        if (!code || !name) {
            throw new Error(`Missing required fields: code=${code}, name=${name}`);
        }

        // Validate code format (should be uppercase letters/numbers, typically 2-4 chars)
        if (!/^[A-Z0-9]{2,6}$/.test(code)) {
            console.warn(`[TEFAS Crawler] Unusual fund code format: ${code} at index ${index}`);
        }

        // Parse and validate numeric fields
        const timestamp = parseInt(item.TARIH);
        if (isNaN(timestamp)) {
            throw new Error(`Invalid timestamp: ${item.TARIH}`);
        }

        const date = new Date(timestamp);
        const dateStr = date.toISOString().split('T')[0];

        // Validate price
        const price = parseFloat(item.FIYAT);
        if (isNaN(price) || price < 0) {
            throw new Error(`Invalid price: ${item.FIYAT}`);
        }

        // Parse optional numeric fields
        const numberOfShares = this._parseOptionalNumber(item.TEDPAYSAYISI, 'TEDPAYSAYISI');
        const personCount = this._parseOptionalNumber(item.KISISAYISI, 'KISISAYISI');
        const portfolioSize = this._parseOptionalNumber(item.PORTFOYBUYUKLUK, 'PORTFOYBUYUKLUK');

        return {
            date: dateStr,
            code,
            name,
            price,
            numberOfShares,
            personCount,
            portfolioSize,
            stockMarketBulletinPrice: item.BORSABULTENFIYAT || null
        };
    }

    /**
     * Parse optional numeric fields with validation
     */
    private _parseOptionalNumber(value: any, fieldName: string): number {
        if (value === null || value === undefined || value === '') {
            return 0;
        }

        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
            console.warn(`[TEFAS Crawler] Invalid ${fieldName} value: ${value}, using 0`);
            return 0;
        }

        return parsed;
    }

    /**
     * Format date to TEFAS API expected format (dd.MM.yyyy)
     */
    private _formatDate(date: Date): string {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    /**
     * Get data from cache if still valid
     */
    private _getFromCache(key: string): TEFASFundInfo[] | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const isExpired = Date.now() - entry.timestamp > this.cacheTTL;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Set data in cache
     */
    private _setCache(key: string, data: TEFASFundInfo[]): void {
        // Clean old entries to prevent memory leaks
        if (this.cache.size > 50) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            key
        });
    }

    /**
     * Apply column filtering to fund data
     */
    private _applyColumnFilter(funds: TEFASFundInfo[], columns?: (keyof TEFASFundInfo)[]): TEFASFundInfo[] {
        if (!columns || columns.length === 0) {
            return funds;
        }

        return funds.map(fund => {
            const filteredFund: Partial<TEFASFundInfo> = {};
            columns.forEach(col => {
                filteredFund[col] = fund[col];
            });
            return filteredFund as TEFASFundInfo;
        });
    }

    /**
     * Clear cache manually if needed
     */
    clearCache(): void {
        this.cache.clear();
        console.log('[TEFAS Crawler] Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

/**
 * Create and export a singleton instance for convenience
 */
export const tefasCrawler = new TEFASCrawler();

/**
 * Legacy export for backward compatibility
 * @deprecated Use TEFASCrawler class instead
 */
export async function fetchTEFASFundsFromTEFAS(): Promise<{ fon_kodu: string; fon_adi: string; fon_turu?: string }[]> {
    try {
        const funds = await tefasCrawler.fetchLatestFunds();
        return funds.map(fund => ({
            fon_kodu: fund.code,
            fon_adi: fund.name,
            fon_turu: null
        }));
    } catch (error) {
        console.error('[Legacy] Error fetching TEFAS funds:', error);
        return [];
    }
}