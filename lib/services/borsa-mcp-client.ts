/**
 * Borsa MCP Client Wrapper
 * 
 * Node.js wrapper for Borsa MCP Python CLI
 * Executes Borsa MCP commands via subprocess and returns parsed JSON
 * 
 * @see https://github.com/saidsurucu/borsa-mcp
 */

import { spawn } from 'child_process';

// Error types
export class BorsaMCPError extends Error {
    constructor(
        message: string,
        public command: string,
        public exitCode?: number,
        public stderr?: string
    ) {
        super(message);
        this.name = 'BorsaMCPError';
    }
}

export class BorsaMCPTimeoutError extends BorsaMCPError {
    constructor(command: string, timeoutMs: number) {
        super(
            `Borsa MCP command timed out after ${timeoutMs}ms`,
            command
        );
        this.name = 'BorsaMCPTimeoutError';
    }
}

// Command result interface
export interface BorsaMCPResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    command: string;
    duration: number;
}

// MCP CLI configuration
interface MCPConfig {
    timeout: number;          // Command timeout in ms
    maxRetries: number;       // Max retry attempts
    retryDelay: number;       // Delay between retries in ms
    pythonPath?: string;      // Custom Python path (optional)
    verbose: boolean;         // Enable verbose logging
}

const DEFAULT_CONFIG: MCPConfig = {
    timeout: 120000,          // 120 seconds (first run can take 60s+ for dependencies)
    maxRetries: 3,
    retryDelay: 1000,         // 1 second
    verbose: process.env.NODE_ENV === 'development'
};

/**
 * Execute Borsa MCP command via subprocess
 */
async function executeMCPCommand(
    args: string[],
    config: Partial<MCPConfig> = {}
): Promise<BorsaMCPResult> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const startTime = Date.now();
    const command = args.join(' ');
    
    if (finalConfig.verbose) {
        console.log(`[Borsa MCP] Executing: ${command}`);
    }
    
    return new Promise((resolve, reject) => {
        // Spawn Borsa MCP via uvx
        const childProcess = spawn('uvx', [
            '--from', 'git+https://github.com/saidsurucu/borsa-mcp',
            'borsa-mcp',
            ...args
        ], {
            timeout: finalConfig.timeout,
            killSignal: 'SIGTERM',
            env: {
                ...process.env,
                PYTHONUNBUFFERED: '1',
                PYTHONIOENCODING: 'utf-8'
            }
        });
        
        let stdout = '';
        let stderr = '';
        let timedOut = false;
        
        // Timeout handler
        const timeoutHandle = setTimeout(() => {
            timedOut = true;
            childProcess.kill('SIGTERM');
            reject(new BorsaMCPTimeoutError(command, finalConfig.timeout));
        }, finalConfig.timeout);
        
        // Collect stdout
        childProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        // Collect stderr
        childProcess.stderr.on('data', (data) => {
            stderr += data.toString();
            if (finalConfig.verbose) {
                console.error(`[Borsa MCP] stderr: ${data}`);
            }
        });
        
        // Handle process completion
        childProcess.on('close', (code) => {
            clearTimeout(timeoutHandle);
            
            if (timedOut) {
                return; // Timeout already handled
            }
            
            const duration = Date.now() - startTime;
            
            if (code === 0) {
                try {
                    // Parse JSON response
                    const data = stdout.trim() ? JSON.parse(stdout) : {};
                    
                    if (finalConfig.verbose) {
                        console.log(`[Borsa MCP] Success in ${duration}ms`);
                    }
                    
                    resolve({
                        success: true,
                        data,
                        command,
                        duration
                    });
                } catch (parseError) {
                    reject(new BorsaMCPError(
                        `Failed to parse Borsa MCP response: ${parseError.message}`,
                        command,
                        code,
                        stdout
                    ));
                }
            } else {
                reject(new BorsaMCPError(
                    stderr || `Command failed with exit code ${code}`,
                    command,
                    code,
                    stderr
                ));
            }
        });
        
        // Handle process errors
        childProcess.on('error', (error) => {
            clearTimeout(timeoutHandle);
            reject(new BorsaMCPError(
                `Failed to spawn Borsa MCP process: ${error.message}`,
                command
            ));
        });
    });
}

/**
 * Execute command with retry logic
 */
async function executeWithRetry(
    args: string[],
    config: Partial<MCPConfig> = {}
): Promise<BorsaMCPResult> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    let lastError: Error;
    
    for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
        try {
            return await executeMCPCommand(args, config);
        } catch (error) {
            lastError = error as Error;
            
            if (finalConfig.verbose) {
                console.warn(
                    `[Borsa MCP] Attempt ${attempt}/${finalConfig.maxRetries} failed:`,
                    error.message
                );
            }
            
            // Don't retry on timeout errors
            if (error instanceof BorsaMCPTimeoutError) {
                throw error;
            }
            
            // Wait before retry (except on last attempt)
            if (attempt < finalConfig.maxRetries) {
                await new Promise(resolve =>
                    setTimeout(resolve, finalConfig.retryDelay * attempt)
                );
            }
        }
    }
    
    throw lastError!;
}

/**
 * Borsa MCP Client
 */
export class BorsaMCPClient {
    private config: MCPConfig;
    
    constructor(config: Partial<MCPConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    
    /**
     * Get current price for a BIST stock
     */
    async getStockPrice(symbol: string): Promise<BorsaMCPResult> {
        return executeWithRetry(['get_hizli_bilgi', symbol], this.config);
    }
    
    /**
     * Get TEFAS fund price
     */
    async getFundPrice(fundCode: string): Promise<BorsaMCPResult> {
        return executeWithRetry(['get_fund_detail', fundCode], this.config);
    }
    
    /**
     * Get BtcTurk crypto price (TRY pairs)
     */
    async getCryptoPrice(pair: string): Promise<BorsaMCPResult> {
        return executeWithRetry(['get_kripto_ticker', pair], this.config);
    }
    
    /**
     * Get Coinbase global crypto price (USD/EUR pairs)
     */
    async getCoinbasePrice(pair: string): Promise<BorsaMCPResult> {
        return executeWithRetry(['get_coinbase_ticker', pair], this.config);
    }
    
    /**
     * Get currency/commodity price from Doviz.com
     */
    async getCurrencyPrice(code: string): Promise<BorsaMCPResult> {
        return executeWithRetry(['get_dovizcom_guncel', code], this.config);
    }
    
    /**
     * Search for BIST ticker code
     */
    async searchTicker(query: string): Promise<BorsaMCPResult> {
        return executeWithRetry(['find_ticker_code', query], this.config);
    }
    
    /**
     * Search for TEFAS funds
     */
    async searchFunds(query: string, category?: string): Promise<BorsaMCPResult> {
        const args = ['search_funds', query];
        if (category) {
            args.push('--category', category);
        }
        return executeWithRetry(args, this.config);
    }
    
    /**
     * Check if Borsa MCP is available
     */
    async healthCheck(): Promise<boolean> {
        try {
            // Try to get a simple command
            await executeMCPCommand(['--help'], { ...this.config, timeout: 5000 });
            return true;
        } catch (error) {
            if (this.config.verbose) {
                console.error('[Borsa MCP] Health check failed:', error);
            }
            return false;
        }
    }
}

// Export singleton instance
export const borsaMCPClient = new BorsaMCPClient({
    verbose: process.env.ENABLE_BORSA_MCP_LOGS === 'true'
});
