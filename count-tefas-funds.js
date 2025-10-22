// Count unique TEFAS funds
const URLSearchParams = require('url').URLSearchParams;

async function countUniqueFunds() {
    try {
        console.log('[TEFAS Count] Counting unique funds...');
        
        const response = await fetch('https://www.tefas.gov.tr/api/DB/BindHistoryInfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Origin': 'https://www.tefas.gov.tr',
                'Referer': 'https://www.tefas.gov.tr/FonKarsilastirma.aspx',
                'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
            },
            body: new URLSearchParams({
                'fontip': 'YAT',
                'sfontur': '',
                'kurucukod': '',
                'fonkod': '',
                'bastarih': '2025-06-01', // June 2025
                'bittarih': '2025-06-30',
                'fonturkod': ''
            }).toString()
        });
        
        if (!response.ok) {
            throw new Error(`TEFAS API returned ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        
        if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
            throw new Error('TEFAS API returned HTML instead of JSON - access blocked');
        }
        
        const data = JSON.parse(responseText);
        
        if (!data.data || !Array.isArray(data.data)) {
            throw new Error('Invalid response format from TEFAS API');
        }
        
        // Extract unique fund codes
        const uniqueFunds = new Set();
        const fundDetails = new Map();
        
        data.data.forEach((item) => {
            const code = item.FONKODU?.trim();
            const name = item.FONUNVAN?.trim();
            
            if (code && name) {
                uniqueFunds.add(code);
                if (!fundDetails.has(code)) {
                    fundDetails.set(code, {
                        code: code,
                        name: name,
                        latestPrice: parseFloat(item.FIYAT) || 0,
                        latestDate: item.TARIH
                    });
                }
            }
        });
        
        console.log('\n=== TEFAS Fund Statistics ===');
        console.log('Total Records:', data.recordsTotal);
        console.log('Unique Fund Count:', uniqueFunds.size);
        console.log('Records Processed:', data.data.length);
        console.log('Date Range: September 2025');
        
        // Show some examples
        const fundExamples = Array.from(fundDetails.values()).slice(0, 5);
        console.log('\nSample Funds:');
        fundExamples.forEach((fund, index) => {
            console.log(`${index + 1}. ${fund.code}: ${fund.name.substring(0, 60)}... (${fund.latestPrice} TRY)`);
        });
        
        return uniqueFunds.size;
        
    } catch (error) {
        console.error('[TEFAS Count] Error:', error.message);
        return 0;
    }
}

countUniqueFunds().then(count => {
    console.log(`\nTotal unique TEFAS funds: ${count}`);
}).catch(error => {
    console.error('Script failed:', error);
});
