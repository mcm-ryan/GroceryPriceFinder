/**
 * Overpass API Type Definitions
 *
 * Types for OpenStreetMap Overpass API responses.
 * API Documentation: https://wiki.openstreetmap.org/wiki/Overpass_API
 */

/**
 * Overpass API element types
 */
export type OverpassElementType = 'node' | 'way' | 'relation';

/**
 * Tags associated with an OSM element
 */
export interface OverpassTags {
  name?: string;
  'addr:street'?: string;
  'addr:housenumber'?: string;
  'addr:city'?: string;
  'addr:state'?: string;
  'addr:postcode'?: string;
  'addr:full'?: string;
  shop?: string;
  brand?: string;
  'brand:wikidata'?: string;
  website?: string;
  phone?: string;
  opening_hours?: string;
  [key: string]: string | undefined;
}

/**
 * Base OSM element
 */
export interface OverpassElement {
  type: OverpassElementType;
  id: number;
  tags?: OverpassTags;
}

/**
 * Node element (point location)
 */
export interface OverpassNode extends OverpassElement {
  type: 'node';
  lat: number;
  lon: number;
}

/**
 * Way element (area/building with center point)
 */
export interface OverpassWay extends OverpassElement {
  type: 'way';
  center?: {
    lat: number;
    lon: number;
  };
  nodes?: number[];
}

/**
 * Relation element (complex geographic entity)
 */
export interface OverpassRelation extends OverpassElement {
  type: 'relation';
  center?: {
    lat: number;
    lon: number;
  };
  members?: Array<{
    type: OverpassElementType;
    ref: number;
    role: string;
  }>;
}

/**
 * Union type for all element types
 */
export type OverpassElementUnion = OverpassNode | OverpassWay | OverpassRelation;

/**
 * Complete Overpass API response
 */
export interface OverpassResponse {
  version: number;
  generator: string;
  osm3s: {
    timestamp_osm_base: string;
    copyright: string;
  };
  elements: OverpassElementUnion[];
}

/**
 * Query builder options
 */
export interface OverpassQueryOptions {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  timeout: number; // in seconds
  storeNames: string[]; // e.g., ["Walmart", "Target"]
}
