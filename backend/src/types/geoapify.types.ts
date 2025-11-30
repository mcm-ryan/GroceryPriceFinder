/**
 * Geoapify API Type Definitions
 *
 * Types for Geoapify Places API responses.
 * API Documentation: https://apidocs.geoapify.com/docs/places/
 */

/**
 * GeoJSON Point geometry
 */
export interface GeoapifyGeometry {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Properties of a place feature
 */
export interface GeoapifyProperties {
  name?: string;
  street?: string;
  housenumber?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  categories: string[];
  place_id: string;
  distance?: number; // Distance in meters from query point
  lat?: number;
  lon?: number;
  datasource?: {
    sourcename?: string;
    attribution?: string;
    license?: string;
  };
  website?: string;
  phone?: string;
  opening_hours?: string;
  [key: string]: any;
}

/**
 * A single place feature in GeoJSON format
 */
export interface GeoapifyFeature {
  type: 'Feature';
  properties: GeoapifyProperties;
  geometry: GeoapifyGeometry;
}

/**
 * Complete Geoapify API response (GeoJSON FeatureCollection)
 */
export interface GeoapifyResponse {
  type: 'FeatureCollection';
  features: GeoapifyFeature[];
}

/**
 * Query options for Geoapify Places API
 */
export interface GeoapifyQueryOptions {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  categories?: string[]; // e.g., ['commercial.supermarket']
  limit?: number; // max results (default: 50)
  storeNames?: string[]; // for filtering by name (optional)
}
