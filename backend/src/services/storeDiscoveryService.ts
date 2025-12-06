import type { Store } from '@grocery-price-finder/types';
import { cacheService } from './cacheService';
import { geoapifyClient } from './geoapifyClient';
import type { GeoapifyFeature } from '../types/geoapify.types';

/**
 * Store Discovery Service
 *
 * Finds grocery stores near a given location using Geoapify Places API.
 * Implements caching to reduce API calls and improve performance.
 */
class StoreDiscoveryService {
  private readonly DEFAULT_RADIUS_METERS = 8000; // 8km (5 miles)
  private readonly TARGET_STORE_NAMES = ['Walmart', 'Target'];

  /**
   * Find grocery stores near a location
   * @param latitude - User's latitude
   * @param longitude - User's longitude
   * @param radius - Search radius in meters (default: 8000m / 5 miles)
   * @returns Array of nearby stores
   */
  async findNearbyStores(
    latitude: number,
    longitude: number,
    radius: number = this.DEFAULT_RADIUS_METERS
  ): Promise<Store[]> {
    // Check cache first
    const cached = cacheService.getStores(latitude, longitude, radius);
    if (cached) {
      console.log('Store cache hit');
      return cached;
    }

    // Query Geoapify Places API
    try {
      if (!geoapifyClient.isConfigured()) {
        throw new Error('Geoapify API key not configured');
      }

      const response = await geoapifyClient.findStores({
        latitude,
        longitude,
        radius,
        categories: ['commercial.supermarket'],
        limit: 50,
        storeNames: this.TARGET_STORE_NAMES,
      });

      // Convert Geoapify features to Store objects
      const stores = this.convertGeoapifyFeaturesToStores(response.features);

      console.log(`Found ${stores.length} stores via Geoapify`);

      // If no stores found after filtering, fall back to mock data
      if (stores.length === 0) {
        console.log('No matching stores found via Geoapify, falling back to mock data');
        const mockStores = await this.getMockStores(latitude, longitude);
        // Don't cache mock fallback data (we want to retry real API next time)
        return mockStores;
      }

      // Cache results
      cacheService.setStores(latitude, longitude, radius, stores);

      return stores;
    } catch (error) {
      console.error('Error querying Geoapify API:', error);

      // Fallback to mock data on error
      console.log('Falling back to mock store data');
      const mockStores = await this.getMockStores(latitude, longitude);

      // Don't cache mock data on errors (we want to retry real API next time)
      return mockStores;
    }
  }

  /**
   * Convert Geoapify features to Store objects
   */
  private convertGeoapifyFeaturesToStores(features: GeoapifyFeature[]): Store[] {
    const stores: Store[] = [];

    for (const feature of features) {
      // Get store name
      const name = geoapifyClient.getStoreName(feature);
      if (!name) {
        console.warn(`Feature ${feature.properties.place_id} has no name, skipping`);
        continue;
      }

      // Get distance (Geoapify already calculates it!)
      const distance = geoapifyClient.getDistance(feature);

      // Build store object
      const store: Store = {
        id: `geoapify-${feature.properties.place_id}`,
        name,
        address: geoapifyClient.getStoreAddress(feature),
        distance: distance ? Math.round(distance) : undefined,
        websiteUrl: geoapifyClient.getWebsiteUrl(feature, name),
      };

      stores.push(store);
    }

    // Sort by distance (closest first) - Geoapify may already sort, but ensure it
    stores.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    // Limit to reasonable number (avoid overwhelming user)
    return stores.slice(0, 10);
  }

  /**
   * Mock store data for Phase 1 testing
   * TODO Phase 2: Remove this and replace with OpenStreetMap API calls
   */
  private async getMockStores(latitude: number, longitude: number): Promise<Store[]> {
    // Simulate slight network delay
    await this.delay(200);

    // Generate mock stores based on location
    // In a real app, these would come from OpenStreetMap
    const mockStores: Store[] = [
      {
        id: 'walmart-1',
        name: 'Walmart Supercenter',
        address: '123 Main St, City, ST 12345',
        distance: this.calculateMockDistance(latitude, longitude, 0),
        websiteUrl: 'https://www.walmart.com',
      },
      {
        id: 'target-1',
        name: 'Target',
        address: '456 Oak Ave, City, ST 12345',
        distance: this.calculateMockDistance(latitude, longitude, 1),
        websiteUrl: 'https://www.target.com',
      },
      {
        id: 'walmart-2',
        name: 'Walmart Neighborhood Market',
        address: '789 Elm St, City, ST 12345',
        distance: this.calculateMockDistance(latitude, longitude, 2),
        websiteUrl: 'https://www.walmart.com',
      },
      {
        id: 'target-2',
        name: 'Target',
        address: '321 Pine Rd, City, ST 12345',
        distance: this.calculateMockDistance(latitude, longitude, 3),
        websiteUrl: 'https://www.target.com',
      },
    ];

    // Sort by distance
    return mockStores.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  /**
   * Generate mock distance based on store index
   */
  private calculateMockDistance(lat: number, lng: number, index: number): number {
    // Generate distances between 1-7km based on coordinates and index
    const hash = Math.abs(Math.floor(lat * lng * 1000)) + index * 1000;
    return 1000 + (hash % 6000); // 1km to 7km
  }

  /**
   * Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * This will be used in Phase 2 when we get real store coordinates
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}

// Export singleton instance
export const storeDiscoveryService = new StoreDiscoveryService();
