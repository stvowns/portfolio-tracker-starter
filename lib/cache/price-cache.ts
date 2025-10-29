/**
 * Simple in-memory cache for price data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class PriceCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache with TTL
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttlMs
    });
  }

  /**
   * Clear specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const priceCache = new PriceCache();

// Cache TTL values (in milliseconds)
export const CACHE_TTL = {
  GOLD_PRICES: 5 * 60 * 1000, // 5 minutes
  SILVER_PRICES: 5 * 60 * 1000, // 5 minutes
  USD_TRY_RATE: 5 * 60 * 1000, // 5 minutes
};
