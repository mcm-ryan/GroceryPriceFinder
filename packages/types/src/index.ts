// Product database schema
export interface Product {
  id: number;
  name: string;
  normalizedName: string;
  category: string;
  brand?: string;
  size?: string;
  unit?: string;
  searchTerms?: string;
  isCommon?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Product search result (what the API returns)
export interface ProductSearchResult {
  id: number;
  name: string;
  category: string;
  brand?: string;
  size?: string;
  unit?: string;
  displayName: string; // Formatted for display: "Whole Milk (1 gal)"
}

// Product search response
export interface ProductSearchResponse {
  products: ProductSearchResult[];
}

// Grocery item (with product metadata)
export interface GroceryItem {
  productId: number;      // REQUIRED
  name: string;           // For display/logging
  normalizedName: string; // For price provider matching
  category: string;       // For future filtering
  quantity: number;
}

// Location coordinates
export interface Location {
  latitude: number;
  longitude: number;
}

// Store information
export interface Store {
  id: string;
  name: string;
  address: string;
  distance?: number; // in meters
  websiteUrl?: string;
}

// Price information for an item at a store
export interface ItemPrice {
  itemName: string;
  price: number | null; // null if not available
  currency: string;
  isMockData?: boolean; // indicates if this came from mock provider
}

// Store with pricing information
export interface StoreWithPrices extends Store {
  items: ItemPrice[];
  total: number | null; // null if prices unavailable
  usedMockData: boolean; // true if any prices are mocked
  mockDataReason?: string; // why mocks were used (e.g., "Scraper failed")
}

// API Request/Response types

export interface CompareRequest {
  latitude: number;
  longitude: number;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

export interface CompareResponse {
  stores: StoreWithPrices[];
  timestamp: string;
}

// Error response
export interface ErrorResponse {
  error: string;
  message: string;
}
