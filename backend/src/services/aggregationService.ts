import type { Store, GroceryItem, StoreWithPrices, ItemPrice } from '@grocery-price-finder/types';
import { priceProviderManager } from './prices/PriceProviderManager';

/**
 * Aggregation Service
 *
 * Combines store discovery results with price data to create the final
 * comparison response. Responsibilities:
 * - Fetch prices for each store
 * - Calculate total costs per store
 * - Handle missing prices gracefully
 * - Rank stores by cheapest total
 * - Track which stores used mock data
 */
class AggregationService {
  /**
   * Get price comparisons for all stores
   * @param stores - List of nearby stores
   * @param items - Grocery list to price
   * @returns Stores with pricing data, sorted by total cost (cheapest first)
   */
  async compareStores(stores: Store[], items: GroceryItem[]): Promise<StoreWithPrices[]> {
    // Fetch prices for each store in parallel for better performance
    const storePromises = stores.map(store => this.getStoreWithPrices(store, items));
    const storesWithPrices = await Promise.all(storePromises);

    // Sort by total cost (cheapest first)
    // Stores with null totals (missing prices) go to the end
    return storesWithPrices.sort((a, b) => {
      if (a.total === null) return 1;
      if (b.total === null) return -1;
      return a.total - b.total;
    });
  }

  /**
   * Get prices for a single store and calculate total
   */
  private async getStoreWithPrices(store: Store, items: GroceryItem[]): Promise<StoreWithPrices> {
    try {
      // Fetch prices for this store
      const { prices, usedMockData, mockDataReason } = await priceProviderManager.getPricesForStore(
        store.name,
        items
      );

      // Calculate total (null if any prices are missing)
      const total = this.calculateTotal(prices);

      return {
        ...store,
        items: prices,
        total,
        usedMockData,
        mockDataReason,
      };
    } catch (error) {
      console.error(`Failed to get prices for ${store.name}:`, error);

      // Return store with error state
      return {
        ...store,
        items: items.map(item => ({
          itemName: item.name,
          price: null,
          currency: 'USD',
          isMockData: false,
        })),
        total: null,
        usedMockData: true,
        mockDataReason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Calculate total cost from item prices
   * Returns null if any prices are missing (null)
   */
  private calculateTotal(prices: ItemPrice[]): number | null {
    let total = 0;
    let hasMissingPrice = false;

    for (const priceData of prices) {
      if (priceData.price === null) {
        hasMissingPrice = true;
        break;
      }
      total += priceData.price;
    }

    // Only return total if we have all prices
    // This ensures fair comparison between stores
    if (hasMissingPrice) {
      return null;
    }

    // Round to 2 decimal places
    return Math.round(total * 100) / 100;
  }

  /**
   * Get statistics about price coverage
   * Useful for debugging and monitoring
   */
  getStats(storesWithPrices: StoreWithPrices[]): {
    totalStores: number;
    storesWithCompletePrices: number;
    storesUsingMockData: number;
  } {
    return {
      totalStores: storesWithPrices.length,
      storesWithCompletePrices: storesWithPrices.filter(s => s.total !== null).length,
      storesUsingMockData: storesWithPrices.filter(s => s.usedMockData).length,
    };
  }
}

// Export singleton instance
export const aggregationService = new AggregationService();
