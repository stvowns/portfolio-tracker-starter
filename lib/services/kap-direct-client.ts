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
 */
export async function fetchTEFASFundsFromTEFAS(): Promise<TEFASFund[]> {
    // TEFAS has multiple endpoints, let's try the main one
    const TEFAS_API_URL = 'https://www.tefas.gov.tr/api/DB/BindComparisonFundList';
    
    try {
        console.log('[TEFAS Direct] Fetching funds from TEFAS API...');
        
        // First, try to get the data
        const response = await fetch(TEFAS_API_URL, {
            method: 'POST', // TEFAS API uses POST
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Origin': 'https://www.tefas.gov.tr',
                'Referer': 'https://www.tefas.gov.tr/FonKarsilastirma.aspx'
            },
            body: 'fontip=YAT' // YAT = Yatırım Fonları (all investment funds)
        });
        
        if (!response.ok) {
            throw new Error(`TEFAS API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        const funds: TEFASFund[] = [];
        
        // TEFAS API returns data with specific structure
        if (data && Array.isArray(data.data)) {
            for (const item of data.data) {
                const fundCode = item.FONKODU;
                const fundName = item.FONUNVAN;
                const fundType = item.FONTIPI;
                
                if (fundCode && fundName) {
                    funds.push({
                        fon_kodu: fundCode.trim(),
                        fon_adi: fundName.trim(),
                        fon_turu: fundType ? fundType.trim() : undefined
                    });
                }
            }
        } else if (Array.isArray(data)) {
            // Fallback: direct array
            for (const item of data) {
                const fundCode = item.FONKODU || item.fonKodu;
                const fundName = item.FONUNVAN || item.fonUnvan;
                const fundType = item.FONTIPI || item.fonTipi;
                
                if (fundCode && fundName) {
                    funds.push({
                        fon_kodu: fundCode.trim(),
                        fon_adi: fundName.trim(),
                        fon_turu: fundType ? fundType.trim() : undefined
                    });
                }
            }
        }
        
        console.log(`[TEFAS Direct] Successfully fetched ${funds.length} funds`);
        
        return funds;
        
    } catch (error) {
        console.error('[TEFAS Direct] Error fetching funds:', error);
        throw error;
    }
}
