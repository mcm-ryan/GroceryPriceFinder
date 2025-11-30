import axios from 'axios';
import type {
  OverpassResponse,
  OverpassQueryOptions,
  OverpassElementUnion,
  OverpassNode,
  OverpassWay,
} from '../types/overpass.types';

/**
 * Overpass API Client
 *
 * Queries OpenStreetMap via the Overpass API to find grocery stores.
 * Implements rate limiting and error handling as per Overpass API usage policy.
 *
 * API Documentation: https://wiki.openstreetmap.org/wiki/Overpass_API
 * Usage Policy: No more than 2 requests per second
 */
class OverpassClient {
  private readonly apiUrl: string;
  private readonly defaultTimeout: number;
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number; // milliseconds

  constructor() {
    this.apiUrl = process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';
    this.defaultTimeout = parseInt(process.env.OVERPASS_TIMEOUT_MS || '25000', 10);
    this.minRequestInterval = parseInt(process.env.OVERPASS_RATE_LIMIT_MS || '1000', 10);
  }

  /**
   * Build Overpass QL query to find grocery stores
   */
  private buildQuery(options: OverpassQueryOptions): string {
    const { latitude, longitude, radius, timeout, storeNames } = options;

    // Build name filter regex (case-insensitive)
    // Example: "Walmart|Target"
    const nameRegex = storeNames.join('|');

    // Overpass QL query
    // Searches for nodes and ways tagged as supermarkets with matching names
    const query = `
[out:json][timeout:${timeout}];
(
  node["shop"="supermarket"]["name"~"${nameRegex}",i](around:${radius},${latitude},${longitude});
  way["shop"="supermarket"]["name"~"${nameRegex}",i](around:${radius},${latitude},${longitude});
);
out center;
    `.trim();

    return query;
  }

  /**
   * Rate limiting: Ensure we don't exceed API rate limits
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before next Overpass request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Query Overpass API for grocery stores
   */
  async findStores(options: OverpassQueryOptions): Promise<OverpassResponse> {
    // Enforce rate limiting
    await this.enforceRateLimit();

    const query = this.buildQuery(options);

    console.log(`Querying Overpass API for stores near (${options.latitude}, ${options.longitude})`);

    try {
      const response = await axios.post<OverpassResponse>(
        this.apiUrl,
        `data=${encodeURIComponent(query)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': process.env.USER_AGENT || 'GroceryPriceFinder/1.0',
          },
          timeout: this.defaultTimeout,
        }
      );

      console.log(`Overpass API returned ${response.data.elements.length} elements`);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Overpass API request timed out');
        }
        if (error.response) {
          throw new Error(
            `Overpass API error: ${error.response.status} - ${error.response.statusText}`
          );
        }
        throw new Error(`Network error querying Overpass API: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Extract coordinates from an element
   */
  getElementCoordinates(element: OverpassElementUnion): { lat: number; lon: number } | null {
    if (element.type === 'node') {
      const node = element as OverpassNode;
      return { lat: node.lat, lon: node.lon };
    }

    if (element.type === 'way' || element.type === 'relation') {
      const item = element as OverpassWay;
      if (item.center) {
        return { lat: item.center.lat, lon: item.center.lon };
      }
    }

    return null;
  }

  /**
   * Extract store name from tags
   */
  getStoreName(element: OverpassElementUnion): string | null {
    return element.tags?.name || null;
  }

  /**
   * Build address string from tags
   */
  getStoreAddress(element: OverpassElementUnion): string {
    const tags = element.tags;
    if (!tags) return 'Address not available';

    // Try full address first
    if (tags['addr:full']) {
      return tags['addr:full'];
    }

    // Build from components
    const parts: string[] = [];

    if (tags['addr:housenumber'] && tags['addr:street']) {
      parts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`);
    } else if (tags['addr:street']) {
      parts.push(tags['addr:street']);
    }

    if (tags['addr:city']) {
      parts.push(tags['addr:city']);
    }

    if (tags['addr:state']) {
      parts.push(tags['addr:state']);
    }

    if (tags['addr:postcode']) {
      parts.push(tags['addr:postcode']);
    }

    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  }

  /**
   * Get website URL from tags
   */
  getWebsiteUrl(element: OverpassElementUnion, storeName: string): string | undefined {
    // Check if element has website tag
    if (element.tags?.website) {
      return element.tags.website;
    }

    // Fallback to default websites based on store name
    const name = storeName.toLowerCase();
    if (name.includes('walmart')) {
      return 'https://www.walmart.com';
    }
    if (name.includes('target')) {
      return 'https://www.target.com';
    }

    return undefined;
  }
}

// Export singleton instance
export const overpassClient = new OverpassClient();
