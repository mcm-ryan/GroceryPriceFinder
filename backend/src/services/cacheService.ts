import NodeCache from 'node-cache';
import type { Store } from '@grocery-price-finder/types';

/**
 * Cache Service
 *
 * Provides in-memory caching for store data and price data to reduce API calls
 * and improve response times. Uses node-cache with TTL (time-to-live) expiration.
 *
 * Design Note: Uses simple in-memory cache for MVP. Can be swapped with Redis
 * for production by maintaining the same interface.
 */
class CacheService {
  private storeCache: NodeCache;
  private priceCache: NodeCache;

  constructor() {
    // Store cache: 24 hours TTL (stores don't change often)
    const storeTTL = parseInt(process.env.CACHE_STORE_TTL || '86400', 10);
    this.storeCache = new NodeCache({ stdTTL: storeTTL, checkperiod: 600 });

    // Price cache: 4 hours TTL (prices change more frequently)
    const priceTTL = parseInt(process.env.CACHE_PRICE_TTL || '14400', 10);
    this.priceCache = new NodeCache({ stdTTL: priceTTL, checkperiod: 300 });
  }

  // Store cache methods
  getStores(lat: number, lng: number, radius: number): Store[] | null {
    const key = this.getStoreKey(lat, lng, radius);
    const cached = this.storeCache.get<Store[]>(key);
    return cached || null;
  }

  setStores(lat: number, lng: number, radius: number, stores: Store[]): void {
    const key = this.getStoreKey(lat, lng, radius);
    this.storeCache.set(key, stores);
  }

  private getStoreKey(lat: number, lng: number, radius: number): string {
    // Round coordinates to 3 decimal places (~100m precision) for cache key
    const roundedLat = lat.toFixed(3);
    const roundedLng = lng.toFixed(3);
    return `stores:${roundedLat}:${roundedLng}:${radius}`;
  }

  // Price cache methods
  getPrice(storeName: string, productId: number): number | null {
    const key = this.getPriceKey(storeName, productId);
    const cached = this.priceCache.get<number>(key);
    return cached !== undefined ? cached : null;
  }

  setPrice(storeName: string, productId: number, price: number | null): void {
    if (price === null) return; // Don't cache null prices
    const key = this.getPriceKey(storeName, productId);
    this.priceCache.set(key, price);
  }

  private getPriceKey(storeName: string, productId: number): string {
    // Normalize store name and use productId for stable cache keys
    const normalizedStore = storeName.toLowerCase().trim();
    return `price:${normalizedStore}:${productId}`;
  }

  // Utility methods
  clearAll(): void {
    this.storeCache.flushAll();
    this.priceCache.flushAll();
  }

  getStats() {
    return {
      stores: this.storeCache.getStats(),
      prices: this.priceCache.getStats(),
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();
