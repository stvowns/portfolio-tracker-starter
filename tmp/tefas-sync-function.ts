/**
 * Sync TEFAS fund tickers from TEFAS API
 */
export async function syncTEFASTickers(
    config: Omit<TickerSyncConfig, 'syncType'>
): Promise<TickerSyncResult> {
    const logId = randomUUID();
    const startTime = Date.now();
    const syncType = 'TEFAS';

    try {
        // Create sync log
        await db.insert(tickerSyncLogs).values({
            id: logId,
            syncType,
            triggeredBy: config.triggeredBy,
            startedAt: new Date(startTime),
            status: 'running',
            createdAt: new Date()
        });

        // Fetch TEFAS funds
        console.log('[Ticker Sync] Fetching TEFAS funds...');
        const funds: TEFASFund[] = await tefasService.fetchFunds();

        console.log('[Ticker Sync] Found TEFAS funds:', funds.length);

        // Clear existing TEFAS tickers
        console.log('[Ticker Sync] Clearing existing TEFAS tickers...');
        await db.delete(tickerCache).where(eq(tickerCache.assetType, 'FUND'));

        // Insert new tickers
        console.log('[Ticker Sync] Inserting TEFAS tickers...');
        let successful = 0;
        let failed = 0;

        for (const fund of funds) {
            try {
                const now = new Date();
                await db.insert(tickerCache).values({
                    id: randomUUID(),
                    assetType: 'FUND',
                    symbol: fund.fon_kodu,
                    name: fund.fon_adi,
                    city: null,
                    category: fund.fon_turu || 'Yatırım Fonu',
                    extraData: null,
                    lastUpdated: now,
                    dataSource: 'tefas',
                    createdAt: now,
                    updatedAt: now
                });
                successful++;

                if (successful % 100 === 0) {
                    console.log(`  ✓ Inserted ${successful}/${funds.length}`);
                }
            } catch (error) {
                console.error(`  ✗ Failed: ${fund.fon_kodu}`, error);
                failed++;
            }
        }

        const duration = Date.now() - startTime;

        await db.update(tickerSyncLogs)
            .set({
                totalRecords: funds.length,
                successfulInserts: successful,
                failedInserts: failed,
                completedAt: new Date(),
                durationMs: duration,
                status: failed === 0 ? 'completed' : 'partial'
            })
            .where(eq(tickerSyncLogs.id, logId));

        console.log(`[Ticker Sync] TEFAS sync completed! Total: ${funds.length}, Success: ${successful}, Failed: ${failed}`);

        return {
            logId,
            syncType,
            totalRecords: funds.length,
            successfulInserts: successful,
            failedInserts: failed,
            duration,
            status: failed === 0 ? 'completed' : 'partial'
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
            logId,
            syncType,
            totalRecords: 0,
            successfulInserts: 0,
            failedInserts: 0,
            duration,
            status: 'failed',
            error: errorMessage
        };
    }
}