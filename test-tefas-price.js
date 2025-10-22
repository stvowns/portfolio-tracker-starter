// Test script for TEFAS price API

async function testTEFASPrice() {
    try {
        console.log('[TEFAS Price] Fetching from official TEFAS API for AAK...');
        
        let data = null;
        let responseText = '';
        
        // Try today first
        try {
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
                    'fonkod': 'AAK',
                    'bastarih': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
                    'bittarih': new Date().toISOString().split('T')[0], // Today
                    'fonturkod': ''
                }).toString()
            });
            
            if (!response.ok) {
                throw new Error(`TEFAS API returned ${response.status}: ${response.statusText}`);
            }
            
            responseText = await response.text();
            
            // Check if response is HTML (error page)
            if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
                throw new Error('TEFAS API returned HTML instead of JSON - access blocked');
            }
            
            const parsedData = JSON.parse(responseText);
            if (parsedData.data && Array.isArray(parsedData.data) && parsedData.data.length > 0) {
                data = parsedData;
                console.log('[TEFAS Price] Today\'s data available!');
            }
        } catch (error) {
            console.log(`[TEFAS Price] Today's data not available, trying yesterday...`);
        }
        
        // If today's data not available, try yesterday
        if (!data) {
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
                    'fonkod': 'AAK',
                    'bastarih': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
                    'bittarih': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
                    'fonturkod': ''
                }).toString()
            });
            
            if (!response.ok) {
                throw new Error(`TEFAS API returned ${response.status}: ${response.statusText}`);
            }
            
            responseText = await response.text();
            
            // Check if response is HTML (error page)
            if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
                throw new Error('TEFAS API returned HTML instead of JSON - access blocked');
            }
            
            const parsedData = JSON.parse(responseText);
            if (!parsedData.data || !Array.isArray(parsedData.data) || parsedData.data.length === 0) {
                throw new Error(`Fund AAK not found or no price data available`);
            }
            
            data = parsedData;
            console.log('[TEFAS Price] Yesterday\'s data used');
        }
        
        // Process the data
        const latestData = data.data[data.data.length - 1];
        const currentPrice = parseFloat(latestData.FIYAT) || 0;
        
        console.log('Debug: Total data points:', data.data.length);
        console.log('Debug: Latest item timestamp:', latestData.TARIH);
        console.log('Debug: Latest item parsed date:', new Date(parseInt(latestData.TARIH)).toISOString());
        
        // Get previous day if available
        let previousClose = currentPrice;
        let changePercent = 0;
        
        if (data.data.length > 1) {
            const previousData = data.data[data.data.length - 2];
            console.log('Debug: Previous item timestamp:', previousData.TARIH);
            console.log('Debug: Previous item parsed date:', new Date(parseInt(previousData.TARIH)).toISOString());
            previousClose = parseFloat(previousData.FIYAT) || currentPrice;
            changePercent = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
        }
        
        const changeAmount = currentPrice - previousClose;
        
        // Get fund name
        const fundName = latestData.FONUNVAN || 'AAK';
        
        console.log('\n=== TEFAS Price Data ===');
        console.log('Fund:', fundName);
        console.log('Current Price:', currentPrice.toFixed(6), 'TRY');
        console.log('Previous Close:', previousClose.toFixed(6), 'TRY');
        console.log('Change Amount:', changeAmount.toFixed(6), 'TRY');
        console.log('Change Percent:', changePercent.toFixed(2), '%');
        console.log('Latest Data Date:', new Date(parseInt(latestData.TARIH)).toISOString().split('T')[0]);
        if (data.data.length > 1) {
            const previousData = data.data[data.data.length - 2];
            console.log('Previous Data Date:', new Date(parseInt(previousData.TARIH)).toISOString().split('T')[0]);
        }
        console.log('Source: tefas-official');
        
    } catch (error) {
        console.error('[TEFAS Price API] Error:', error.message);
    }
}

testTEFASPrice();
