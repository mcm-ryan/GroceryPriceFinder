// Grocery item
export interface GroceryItem {
  name: string;
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
}

// Store with pricing information
export interface StoreWithPrices extends Store {
  items: ItemPrice[];
  total: number | null; // null if prices unavailable
}

// API Request/Response types

export interface CompareRequest {
  latitude: number;
  longitude: number;
  items: GroceryItem[];
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
