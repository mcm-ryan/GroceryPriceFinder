import type { GroceryItem, ItemPrice } from '@grocery-price-finder/types';
import type { PriceProvider } from './PriceProvider.interface';

/**
 * Mock Price Provider
 *
 * Returns realistic mock prices for grocery items. Used for:
 * 1. Development and testing before scrapers are built
 * 2. Fallback when real scrapers fail or break
 * 3. Demo mode (controlled by FORCE_MOCK_DATA env var)
 *
 * Generates consistent random prices based on item name hash to ensure
 * the same item always gets roughly the same price across calls.
 */
export class MockPriceProvider implements PriceProvider {
  name = 'MockProvider';

  /**
   * Common grocery items with typical price ranges
   */
  private priceRanges: Record<string, { min: number; max: number }> = {
    milk: { min: 3.5, max: 5.0 },
    eggs: { min: 3.0, max: 6.0 },
    bread: { min: 2.5, max: 4.5 },
    butter: { min: 4.0, max: 6.5 },
    cheese: { min: 4.5, max: 8.0 },
    chicken: { min: 6.0, max: 12.0 },
    beef: { min: 8.0, max: 15.0 },
    rice: { min: 2.0, max: 5.0 },
    pasta: { min: 1.5, max: 3.5 },
    apples: { min: 2.0, max: 5.0 },
    bananas: { min: 1.5, max: 3.0 },
    tomatoes: { min: 2.5, max: 4.5 },
    lettuce: { min: 2.0, max: 4.0 },
    carrots: { min: 1.5, max: 3.5 },
    onions: { min: 1.0, max: 2.5 },
    potatoes: { min: 3.0, max: 6.0 },
    cereal: { min: 3.5, max: 6.5 },
    coffee: { min: 6.0, max: 12.0 },
    sugar: { min: 2.5, max: 4.5 },
    flour: { min: 3.0, max: 5.5 },
  };

  async getPrices(items: GroceryItem[]): Promise<ItemPrice[]> {
    // Simulate slight network delay
    await this.delay(100);

    return items.map((item) => ({
      itemName: item.name,
      price: this.generatePrice(item.name, item.quantity),
      currency: 'USD',
      isMockData: true,
    }));
  }

  async isAvailable(): Promise<boolean> {
    // Mock provider is always available
    return true;
  }

  /**
   * Generate a consistent price for an item based on its name
   */
  private generatePrice(itemName: string, quantity: number = 1): number {
    const normalized = itemName.toLowerCase().trim();

    // Check if we have a predefined range for this item
    const range = this.priceRanges[normalized] || { min: 2.0, max: 10.0 };

    // Generate consistent "random" price using simple hash
    const hash = this.simpleHash(normalized);
    const range_size = range.max - range.min;
    const basePrice = range.min + (hash % 100) / 100 * range_size;

    // Apply quantity multiplier
    const totalPrice = basePrice * quantity;

    // Round to 2 decimal places
    return Math.round(totalPrice * 100) / 100;
  }

  /**
   * Simple string hash for consistent price generation
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
