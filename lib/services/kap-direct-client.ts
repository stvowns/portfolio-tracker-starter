/**
 * KAP Direct Client
 * 
 * Direct access to KAP (Public Disclosure Platform) Excel API
 * Bypasses Borsa MCP for faster ticker fetching
 * 
 * @see https://www.kap.org.tr/tr/bist-sirketler
 */

import * as XLSX from 'xlsx';

interface KAPCompany {
    ticker_kodu: string;
    sirket_adi: string;
    sehir?: string;
}

/**
 * Fetch BIST companies directly from KAP Excel API
 */
export async function fetchBISTCompaniesFromKAP(): Promise<KAPCompany[]> {
    const KAP_EXCEL_URL = 'https://www.kap.org.tr/tr/api/company/generic/excel/IGS/A';
    
    try {
        console.log('[KAP Direct] Fetching companies from KAP Excel API...');
        
        const response = await fetch(KAP_EXCEL_URL, {
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
        
        const companies: KAPCompany[] = [];
        
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
        
        console.log(`[KAP Direct] Successfully fetched ${companies.length} companies`);
        
        return companies;
        
    } catch (error) {
        console.error('[KAP Direct] Error fetching companies:', error);
        throw error;
    }
}

/**
 * Search companies by query (local filtering)
 */
export function searchCompanies(companies: KAPCompany[], query: string): KAPCompany[] {
    if (!query || query.length < 2) {
        return companies;
    }
    
    const queryLower = query.toLowerCase();
    const queryNormalized = normalizeText(query);
    
    return companies.filter(company => {
        const tickerLower = company.ticker_kodu.toLowerCase();
        const nameLower = company.sirket_adi.toLowerCase();
        const nameNormalized = normalizeText(company.sirket_adi);
        
        return tickerLower.includes(queryLower) ||
               nameLower.includes(queryLower) ||
               nameNormalized.includes(queryNormalized);
    });
}

/**
 * Normalize Turkish text for better search
 */
function normalizeText(text: string): string {
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

/**
 * TEFAS Fund Interface
 */
interface TEFASFund {
    fon_kodu: string;
    fon_adi: string;
    fon_turu?: string;
}

/**
 * Fetch TEFAS funds from TEFAS official API
 * @deprecated Use TEFASCrawler class instead for better performance and features
 */
export async function fetchTEFASFundsFromTEFAS(): Promise<TEFASFund[]> {
    console.log('[TEFAS API] Fetching funds from official TEFAS API using new crawler...');

    try {
        // Import the new crawler
        const { tefasCrawler } = await import('./tefas-crawler');

        const funds = await tefasCrawler.fetchLatestFunds();

        // Extract unique funds and convert to legacy format
        const fundMap = new Map<string, TEFASFund>();

        funds.forEach(fund => {
            if (!fundMap.has(fund.code)) {
                fundMap.set(fund.code, {
                    fon_kodu: fund.code,
                    fon_adi: fund.name,
                    fon_turu: undefined // Type info not available in this endpoint
                });
            }
        });

        const tefasFunds = Array.from(fundMap.values());
        console.log(`[TEFAS API] Fetched ${tefasFunds.length} unique funds from TEFAS`);
        return tefasFunds;

    } catch (error) {
        console.error('[TEFAS API] Error:', error);

        // Fallback to GitHub API if TEFAS fails
        console.log('[TEFAS Fallback] Using GitHub intermittent API as backup...');
        try {
            const response = await fetch('https://raw.githubusercontent.com/emirhalici/tefas_intermittent_api/data/fund_data.json', {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }

            const funds = await response.json();

            const tefasFunds: TEFASFund[] = funds.map((fund: any) => ({
                fon_kodu: fund.code,
                fon_adi: fund.description,
                fon_turu: undefined
            }));

            console.log(`[TEFAS Fallback] Fetched ${tefasFunds.length} funds from GitHub`);
            return tefasFunds;

        } catch (fallbackError) {
            console.error('[TEFAS Fallback] Error:', fallbackError);
            return []; // Return empty array to prevent crashes
        }
    }
}
