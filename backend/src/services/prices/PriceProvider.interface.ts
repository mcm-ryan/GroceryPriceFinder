import type { GroceryItem, ItemPrice } from '@grocery-price-finder/types';

/**
 * PriceProvider Interface
 *
 * Defines the contract for all price data providers (scrapers, APIs, mocks).
 * This abstraction allows us to:
 * - Easily swap implementations (scraper -> API -> mock)
 * - Test with mock data during development
 * - Gracefully fall back when a provider fails
 *
 * Strategy Pattern: Each provider implements this interface differently
 */
export interface PriceProvider {
  /**
   * Provider name for logging and debugging
   */
  name: string;

  /**
   * Fetch prices for a list of grocery items
   * @param items - List of items to price
   * @returns Array of prices (may include nulls for items not found)
   * @throws Error if provider completely fails (not just missing items)
   */
  getPrices(items: GroceryItem[]): Promise<ItemPrice[]>;

  /**
   * Check if this provider is currently available/enabled
   * @returns true if provider can be used, false otherwise
   */
  isAvailable(): Promise<boolean>;
}
