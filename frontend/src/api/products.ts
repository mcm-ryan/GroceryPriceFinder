import type { ProductSearchResponse } from '@grocery-price-finder/types';

const API_BASE_URL = 'http://localhost:3001';

/**
 * Search for products by query string
 */
export async function searchProducts(query: string, limit: number = 10): Promise<ProductSearchResponse> {
  const url = `${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}&limit=${limit}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Product search failed: ${response.statusText}`);
  }

  return response.json();
}
