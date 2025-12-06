import type { GroceryItem, ItemPrice } from '@grocery-price-finder/types';
import type { PriceProvider } from './PriceProvider.interface';
import { MockPriceProvider } from './MockPriceProvider';
import { cacheService } from '../cacheService';

/**
 * Price Provider Manager
 *
 * Central orchestration point for fetching prices from different providers.
 * Implements fallback strategy:
 * 1. Try real scraper (Walmart/Target) if enabled
 * 2. Fall back to mock provider if scraper fails
 * 3. Use cache when available to reduce load
 *
 * This manager makes the system resilient to scraper failures and
 * provides a consistent interface for the rest of the application.
 */
export class PriceProviderManager {
  private providers: Map<string, PriceProvider>;
  private mockProvider: MockPriceProvider;
  private forceMockData: boolean;

  constructor() {
    this.providers = new Map();
    this.mockProvider = new MockPriceProvider();
    this.forceMockData = process.env.FORCE_MOCK_DATA === 'true';

    // Register providers (scrapers will be added in Phase 3)
    // For now, we'll just use the mock provider
    this.registerProvider('mock', this.mockProvider);
  }

  /**
   * Register a new price provider
   */
  registerProvider(name: string, provider: PriceProvider): void {
    this.providers.set(name.toLowerCase(), provider);
  }

  /**
   * Get prices for items from a specific store
   * @param storeName - Name of the store (e.g., "Walmart", "Target")
   * @param items - List of items to price
   * @returns Prices with mock data indicators
   */
  async getPricesForStore(
    storeName: string,
    items: GroceryItem[]
  ): Promise<{ prices: ItemPrice[]; usedMockData: boolean; mockDataReason?: string }> {
    // Check if we're forcing mock data (for demos)
    if (this.forceMockData) {
      const prices = await this.mockProvider.getPrices(items);
      return {
        prices,
        usedMockData: true,
        mockDataReason: 'Demo mode enabled (FORCE_MOCK_DATA=true)',
      };
    }

    // Try to get prices from cache first
    const cachedPrices = this.getPricesFromCache(storeName, items);
    if (cachedPrices.length === items.length) {
      console.log(`Cache hit for all items at ${storeName}`);
      return {
        prices: cachedPrices,
        usedMockData: false,
      };
    }

    // Select provider based on store name
    const provider = this.selectProvider(storeName);

    // Try to get prices from the selected provider
    try {
      const available = await provider.isAvailable();
      if (!available) {
        throw new Error(`Provider ${provider.name} is not available`);
      }

      const prices = await provider.getPrices(items);

      // Cache successful results
      this.cachePrices(storeName, items, prices);

      // Check if we got mock data
      const isMock = provider.name === 'MockProvider';
      return {
        prices,
        usedMockData: isMock,
        mockDataReason: isMock ? 'Scraper not yet implemented' : undefined,
      };
    } catch (error) {
      // Log the error
      console.warn(`Provider ${provider.name} failed for ${storeName}:`, error);

      // Fall back to mock provider
      const prices = await this.mockProvider.getPrices(items);
      return {
        prices,
        usedMockData: true,
        mockDataReason: `Scraper failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Select appropriate provider for a store
   * In Phase 1, always returns mock provider
   * In Phase 3+, will return actual scrapers
   */
  private selectProvider(storeName: string): PriceProvider {
    const normalizedName = storeName.toLowerCase();

    // In Phase 3+, we'll check for walmart/target scrapers here
    // For now, always return mock
    if (normalizedName.includes('walmart')) {
      return this.providers.get('walmart') || this.mockProvider;
    }

    if (normalizedName.includes('target')) {
      return this.providers.get('target') || this.mockProvider;
    }

    // Default to mock
    return this.mockProvider;
  }

  /**
   * Attempt to get prices from cache
   */
  private getPricesFromCache(storeName: string, items: GroceryItem[]): ItemPrice[] {
    const cachedPrices: ItemPrice[] = [];

    for (const item of items) {
      const cachedPrice = cacheService.getPrice(storeName, item.productId);
      if (cachedPrice !== null) {
        cachedPrices.push({
          itemName: item.name,
          price: cachedPrice,
          currency: 'USD',
          isMockData: false,
        });
      }
    }

    return cachedPrices;
  }

  /**
   * Cache prices for future requests
   */
  private cachePrices(storeName: string, items: GroceryItem[], prices: ItemPrice[]): void {
    // Map prices back to items by index to get productId
    for (let i = 0; i < prices.length && i < items.length; i++) {
      const priceData = prices[i];
      const item = items[i];
      if (priceData.price !== null && !priceData.isMockData) {
        cacheService.setPrice(storeName, item.productId, priceData.price);
      }
    }
  }

  /**
   * Get list of registered providers
   */
  getProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Export singleton instance
export const priceProviderManager = new PriceProviderManager();
