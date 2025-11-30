import axios from 'axios';
import type {
  GeoapifyResponse,
  GeoapifyQueryOptions,
  GeoapifyFeature,
} from '../types/geoapify.types';

/**
 * Geoapify API Client
 *
 * Queries Geoapify Places API to find grocery stores near a location.
 * Much more reliable than Overpass API with free tier of 3,000 requests/day.
 *
 * API Documentation: https://apidocs.geoapify.com/docs/places/
 */
class GeoapifyClient {
  private readonly apiKey: string;
  private readonly apiUrl: string = 'https://api.geoapify.com/v2/places';
  private readonly defaultTimeout: number = 10000; // 10 seconds

  constructor() {
    this.apiKey = process.env.GEOAPIFY_API_KEY || '';
    if (!this.apiKey) {
      console.warn('GEOAPIFY_API_KEY not set - Geoapify client will not work');
    }
  }

  /**
   * Check if Geoapify is configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Find grocery stores near a location
   */
  async findStores(options: GeoapifyQueryOptions): Promise<GeoapifyResponse> {
    if (!this.isConfigured()) {
      throw new Error('Geoapify API key not configured');
    }

    const { latitude, longitude, radius, categories, limit = 50, storeNames } = options;

    // Build categories string
    const categoriesParam = categories && categories.length > 0
      ? categories.join(',')
      : 'commercial.supermarket';

    // Build URL with query parameters
    // Note: Geoapify uses lon,lat order (GeoJSON standard)
    const url = `${this.apiUrl}?` +
      `categories=${categoriesParam}&` +
      `filter=circle:${longitude},${latitude},${radius}&` +
      `limit=${limit}&` +
      `apiKey=${this.apiKey}`;

    console.log(`Querying Geoapify API for stores near (${latitude}, ${longitude})`);

    try {
      const response = await axios.get<GeoapifyResponse>(url, {
        headers: {
          'User-Agent': process.env.USER_AGENT || 'GroceryPriceFinder/1.0',
        },
        timeout: this.defaultTimeout,
      });

      console.log(`Geoapify API returned ${response.data.features.length} features`);

      // Filter by store names if provided
      let features = response.data.features;
      if (storeNames && storeNames.length > 0) {
        features = this.filterByStoreNames(features, storeNames);
        console.log(`Filtered to ${features.length} stores matching: ${storeNames.join(', ')}`);
      }

      return {
        ...response.data,
        features,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Geoapify API request timed out');
        }
        if (error.response) {
          const status = error.response.status;
          if (status === 429) {
            throw new Error('Geoapify API rate limit exceeded');
          }
          if (status === 401 || status === 403) {
            throw new Error('Geoapify API authentication failed - check API key');
          }
          throw new Error(
            `Geoapify API error: ${status} - ${error.response.statusText}`
          );
        }
        throw new Error(`Network error querying Geoapify API: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Filter features by store names (case-insensitive)
   */
  private filterByStoreNames(
    features: GeoapifyFeature[],
    storeNames: string[]
  ): GeoapifyFeature[] {
    const lowerStoreNames = storeNames.map(name => name.toLowerCase());
    return features.filter(feature => {
      const name = feature.properties.name?.toLowerCase() || '';
      return lowerStoreNames.some(storeName => name.includes(storeName));
    });
  }

  /**
   * Get coordinates from a feature (already in lat/lon format)
   */
  getFeatureCoordinates(feature: GeoapifyFeature): { lat: number; lon: number } {
    // GeoJSON coordinates are [lon, lat]
    const [lon, lat] = feature.geometry.coordinates;
    return { lat, lon };
  }

  /**
   * Get store name from feature
   */
  getStoreName(feature: GeoapifyFeature): string | null {
    return feature.properties.name || null;
  }

  /**
   * Build address string from feature properties
   */
  getStoreAddress(feature: GeoapifyFeature): string {
    const props = feature.properties;

    // Try formatted address first
    if (props.formatted) {
      return props.formatted;
    }

    // Try address_line1 and address_line2
    if (props.address_line1) {
      return props.address_line2
        ? `${props.address_line1}, ${props.address_line2}`
        : props.address_line1;
    }

    // Build from components
    const parts: string[] = [];

    if (props.housenumber && props.street) {
      parts.push(`${props.housenumber} ${props.street}`);
    } else if (props.street) {
      parts.push(props.street);
    }

    if (props.city) {
      parts.push(props.city);
    }

    if (props.state) {
      parts.push(props.state);
    }

    if (props.postcode) {
      parts.push(props.postcode);
    }

    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  }

  /**
   * Get website URL from feature
   */
  getWebsiteUrl(feature: GeoapifyFeature, storeName: string): string | undefined {
    // Check if feature has website
    if (feature.properties.website) {
      return feature.properties.website;
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

  /**
   * Get distance from feature (already calculated by Geoapify!)
   */
  getDistance(feature: GeoapifyFeature): number | undefined {
    return feature.properties.distance;
  }
}

// Export singleton instance
export const geoapifyClient = new GeoapifyClient();
