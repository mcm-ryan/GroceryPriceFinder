import { db } from '../db/client';
import { products } from '../db/schema';
import { eq, or, like, desc, asc, inArray } from 'drizzle-orm';
import type { ProductSearchResult } from '@grocery-price-finder/types';

class ProductService {
  /**
   * Search for products by query string
   * - Empty query returns common products
   * - Query searches normalized_name and search_terms
   * - Results sorted by is_common DESC, normalized_name ASC
   */
  async searchProducts(query: string, limit: number = 10): Promise<ProductSearchResult[]> {
    const trimmedQuery = query.trim();

    let results;

    if (!trimmedQuery) {
      // Return common products for empty query
      results = await db
        .select()
        .from(products)
        .where(eq(products.isCommon, true))
        .orderBy(asc(products.normalizedName))
        .limit(limit);
    } else {
      // Search by normalized name or search terms
      const normalized = trimmedQuery.toLowerCase();
      const searchPattern = `%${normalized}%`;

      results = await db
        .select()
        .from(products)
        .where(
          or(
            like(products.normalizedName, searchPattern),
            like(products.searchTerms, searchPattern)
          )
        )
        .orderBy(desc(products.isCommon), asc(products.normalizedName))
        .limit(limit);
    }

    // Transform to ProductSearchResult format
    return results.map(product => this.formatProductSearchResult(product));
  }

  /**
   * Get a single product by ID
   */
  async getProductById(id: number) {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get multiple products by IDs (batch fetch)
   * Returns a Map for efficient lookup
   */
  async getProductsByIds(ids: number[]): Promise<Map<number, typeof products.$inferSelect>> {
    if (ids.length === 0) {
      return new Map();
    }

    const results = await db
      .select()
      .from(products)
      .where(inArray(products.id, ids));

    const productMap = new Map();
    results.forEach(product => {
      productMap.set(product.id, product);
    });

    return productMap;
  }

  /**
   * Format a product for search results with display name
   */
  private formatProductSearchResult(product: typeof products.$inferSelect): ProductSearchResult {
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      brand: product.brand || undefined,
      size: product.size || undefined,
      unit: product.unit || undefined,
      displayName: this.formatDisplayName(product),
    };
  }

  /**
   * Format product display name
   * Examples:
   * - "Whole Milk (1 gallon)"
   * - "Cheddar Cheese (8 oz)"
   * - "Bananas"
   */
  private formatDisplayName(product: typeof products.$inferSelect): string {
    if (product.size) {
      return `${product.name} (${product.size})`;
    }
    return product.name;
  }
}

// Export singleton instance
export const productService = new ProductService();
