/**
 * TEFAS Service
 *
 * Handles all TEFAS (Turkey Electronic Fund Trading Platform) related operations:
 * - Fetch fund information from official TEFAS API
 * - Fetch real-time fund prices
 * - Search and filter TEFAS funds
 */


/**
 * TEFAS Fund Information Interface
 */
export interface TEFASFund {
    fon_kodu: string;
    fon_adi: string;
    fon_turu?: string;
}

/**
 * TEFAS Fund Price Interface
 */
export interface TEFASFundPrice {
    symbol: string;
    name: string;
    currentPrice: number;
    previousClose: number;
    changeAmount: number;
    changePercent: number;
    currency: string;
    timestamp: string;
    source: string;
    note?: string;
}

/**
 * TEFAS Service Class
 *
 * Centralized service for all TEFAS operations
 */
export class TEFASService {
    private readonly TEFAS_API_URL = 'https://www.tefas.gov.tr/api/DB/BindHistoryInfo';
    private readonly headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Origin': 'https://www.tefas.gov.tr',
        'Referer': 'https://www.tefas.gov.tr/TarihselVeriler.aspx',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
    };

    /**
     * Fetch all TEFAS funds from official TEFAS API
     *
     * @returns Promise<TEFASFund[]> Array of TEFAS funds
     * @throws Error if API fails
     */
    async fetchFunds(): Promise<TEFASFund[]> {
        try {
            console.log('[TEFAS Service] Fetching funds from official TEFAS API...');

            const response = await fetch(this.TEFAS_API_URL, {
                method: 'POST',
                headers: this.headers,
                body: new URLSearchParams({
                    'fontip': 'YAT',
                    'sfontur': '',
                    'kurucukod': '',
                    'fonkod': '',
                    'bastarih': this.formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 gün önce
                    'bittarih': this.formatDate(new Date()),
                    'fonturkod': ''
                }).toString()
            });

            if (!response.ok) {
                throw new Error(`TEFAS API returned ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();

            console.log('[TEFAS Service] Response status:', response.status);
            console.log('[TEFAS Service] Response headers:', Object.fromEntries(response.headers.entries()));
            console.log('[TEFAS Service] Response preview:', responseText.substring(0, 200));

            // Check if response is HTML (error page)
            if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
                console.error('[TEFAS Service] TEFAS API returned HTML error page');
                console.error('[TEFAS Service] Full response:', responseText);
                throw new Error('TEFAS API returned HTML instead of JSON - access blocked');
            }

            const data = JSON.parse(responseText);

            if (!data.data || !Array.isArray(data.data)) {
                throw new Error('Invalid response format from TEFAS API');
            }

            // Extract unique funds from the data
            const fundMap = new Map<string, TEFASFund>();

            data.data.forEach((item: any) => {
                const code = item.FONKODU?.trim();
                const name = item.FONUNVAN?.trim();

                if (code && name && !fundMap.has(code)) {
                    fundMap.set(code, {
                        fon_kodu: code,
                        fon_adi: name,
                        fon_turu: undefined // Type info not available in this endpoint
                    });
                }
            });

            const tefasFunds = Array.from(fundMap.values());
            console.log(`[TEFAS Service] Fetched ${tefasFunds.length} unique funds from TEFAS`);
            return tefasFunds;

        } catch (error) {
            console.error('[TEFAS Service] Official API failed:', error);
            throw new Error(`TEFAS API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Fetch real-time fund price from TEFAS API
     *
     * @param fundCode TEFAS fund code (e.g., "YKT")
     * @returns Promise<TEFASFundPrice> Fund price information
     * @throws Error if API call fails
     */
    async fetchFundPrice(fundCode: string): Promise<TEFASFundPrice> {
        try {
            console.log(`[TEFAS Service] Fetching price for ${fundCode}...`);

            // Use official TEFAS API
            const response = await fetch(this.TEFAS_API_URL, {
                method: 'POST',
                headers: this.headers,
                body: new URLSearchParams({
                    'fontip': 'YAT',
                    'sfontur': '',
                    'kurucukod': '',
                    'fonkod': fundCode.toUpperCase(),
                    'bastarih': this.formatDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 gün önce
                    'bittarih': this.formatDate(new Date()),
                    'fonturkod': ''
                }).toString()
            });

            if (!response.ok) {
                throw new Error(`TEFAS API returned ${response.status}: ${response.statusText}`);
            }

            const responseText = await response.text();

            console.log('[TEFAS Service] Response status:', response.status);
            console.log('[TEFAS Service] Response headers:', Object.fromEntries(response.headers.entries()));
            console.log('[TEFAS Service] Response preview:', responseText.substring(0, 200));

            // Check if response is HTML (error page)
            if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
                console.error('[TEFAS Service] TEFAS API returned HTML error page');
                console.error('[TEFAS Service] Full response:', responseText);
                throw new Error('TEFAS API returned HTML instead of JSON - access blocked');
            }

            const data = JSON.parse(responseText);

            if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
                throw new Error(`Fund ${fundCode} not found or no price data available`);
            }

            // Get the latest price data (last item in array)
            const latestData = data.data[data.data.length - 1];
            const currentPrice = parseFloat(latestData.FIYAT) || 0;

            // Get previous day if available
            let previousClose = currentPrice;
            let changePercent = 0;

            if (data.data.length > 1) {
                const previousData = data.data[data.data.length - 2];
                previousClose = parseFloat(previousData.FIYAT) || currentPrice;
                changePercent = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
            }

            const changeAmount = currentPrice - previousClose;
            const fundName = latestData.FONUNVAN || fundCode;

            console.log(`[TEFAS Service] Success: ${fundCode} = ${currentPrice} TRY`);

            return {
                symbol: fundCode,
                name: fundName,
                currentPrice,
                previousClose,
                changeAmount,
                changePercent,
                currency: 'TRY',
                timestamp: new Date().toISOString(),
                source: 'tefas-official'
            };

        } catch (error) {
            console.error(`[TEFAS Service] Error fetching price for ${fundCode}:`, error);
            throw new Error(`Failed to fetch price for ${fundCode}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Fetch multiple fund prices
     *
     * @param fundCodes Array of TEFAS fund codes
     * @returns Promise<TEFASFundPrice[]> Array of fund prices
     */
    async fetchMultipleFundPrices(fundCodes: string[]): Promise<TEFASFundPrice[]> {
        const prices: TEFASFundPrice[] = [];

        // Process in batches to avoid overwhelming APIs
        const batchSize = 5;

        for (let i = 0; i < fundCodes.length; i += batchSize) {
            const batch = fundCodes.slice(i, i + batchSize);

            const batchPromises = batch.map(fundCode =>
                this.fetchFundPrice(fundCode).catch(error => {
                    console.warn(`[TEFAS Service] Failed to fetch price for ${fundCode}:`, error.message);
                    return null;
                })
            );

            const batchResults = await Promise.all(batchPromises);
            prices.push(...batchResults.filter(price => price !== null));
        }

        return prices;
    }

    /**
     * Search funds by query (local filtering)
     *
     * @param funds Array of funds to search
     * @param query Search query
     * @returns Filtered funds
     */
    searchFunds(funds: TEFASFund[], query: string): TEFASFund[] {
        if (!query || query.length < 2) {
            return funds;
        }

        const queryLower = query.toLowerCase();
        const queryNormalized = this.normalizeText(query);

        return funds.filter(fund => {
            const codeLower = fund.fon_kodu.toLowerCase();
            const nameLower = fund.fon_adi.toLowerCase();
            const nameNormalized = this.normalizeText(fund.fon_adi);

            return codeLower.includes(queryLower) ||
                   nameLower.includes(queryLower) ||
                   nameNormalized.includes(queryNormalized);
        });
    }

    /**
     * Format date for TEFAS API (DD.MM.YYYY)
     */
    private formatDate(date: Date): string {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
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
        normalized = normalized.replace(/\s+fonu\s+$/i, '');
        normalized = normalized.replace(/[\.,'\s]+/g, '');

        return normalized;
    }
}

/**
 * Export singleton instance for convenience
 */
export const tefasService = new TEFASService();

/**
 * Legacy exports for backward compatibility
 * @deprecated Use TEFASService class instead
 */
export async function fetchTEFASFundsFromTEFAS(): Promise<TEFASFund[]> {
    return tefasService.fetchFunds();
}