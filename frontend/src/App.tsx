import { useState } from 'react';
import type { StoreWithPrices, ProductSearchResult } from '@grocery-price-finder/types';
import { compareStores } from './api/compare';
import { reverseGeocode, geocodeZipCode } from './api/geocoding';
import { ProductAutocomplete } from './components/ProductAutocomplete';
import { SelectedProductsList, type SelectedProduct } from './components/SelectedProductsList';
import './App.css';

type LocationMode = 'precise' | 'zipcode';

function App() {
  // State
  const [locationMode, setLocationMode] = useState<LocationMode>('precise');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [locationDisplay, setLocationDisplay] = useState<string>(''); // City, State ZIP
  const [zipCode, setZipCode] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [results, setResults] = useState<StoreWithPrices[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Get user's geolocation
  const handleGetLocation = async () => {
    setGettingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat.toFixed(4));
        setLongitude(lng.toFixed(4));

        // Reverse geocode to get city, state, zip
        try {
          const address = await reverseGeocode(lat, lng);
          setLocationDisplay(address.formatted);
        } catch (err) {
          // If reverse geocoding fails, fall back to showing coordinates
          setLocationDisplay(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          console.error('Reverse geocoding failed:', err);
        }

        setGettingLocation(false);
      },
      (error) => {
        setError(`Location error: ${error.message}`);
        setGettingLocation(false);
      }
    );
  };

  // Handle product selection from autocomplete
  const handleProductSelect = (product: ProductSearchResult) => {
    // Check if product already exists in the list
    const existing = selectedProducts.find(p => p.product.id === product.id);
    if (existing) {
      // If exists, increment quantity
      setSelectedProducts(selectedProducts.map(p =>
        p.product.id === product.id
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ));
    } else {
      // If new, add to list
      setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (productId: number, quantity: number) => {
    setSelectedProducts(selectedProducts.map(p =>
      p.product.id === productId
        ? { ...p, quantity }
        : p
    ));
  };

  // Handle product removal
  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.product.id !== productId));
  };

  // Compare prices
  const handleCompare = async () => {
    setError(null);
    setResults([]);

    let lat: number;
    let lng: number;

    // Get coordinates based on location mode
    if (locationMode === 'precise') {
      // Use precise coordinates
      lat = parseFloat(latitude);
      lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        setError('Please use the location button to get your precise location');
        return;
      }
    } else {
      // Use zip code - need to geocode it first
      if (!zipCode.trim()) {
        setError('Please enter a zip code');
        return;
      }

      setLoading(true);

      try {
        const coords = await geocodeZipCode(zipCode);
        lat = coords.latitude;
        lng = coords.longitude;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to geocode zip code');
        setLoading(false);
        return;
      }
    }

    // Check if we have products
    if (selectedProducts.length === 0) {
      setError('Please add at least one product to your grocery list');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Convert selected products to API format
      const items = selectedProducts.map(sp => ({
        productId: sp.product.id,
        quantity: sp.quantity,
      }));

      const response = await compareStores({
        latitude: lat,
        longitude: lng,
        items,
      });

      setResults(response.stores);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare prices');
    } finally {
      setLoading(false);
    }
  };

  // Format price
  const formatPrice = (price: number | null): string => {
    if (price === null) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  // Format distance
  const formatDistance = (meters: number | undefined): string => {
    if (!meters) return '';
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="app">
      <header>
        <h1>🛒 Grocery Price Finder</h1>
        <p>Compare grocery prices at nearby stores</p>
      </header>

      <main>
        {/* Location Input */}
        <section className="input-section">
          <h2>Your Location</h2>

          {/* Location Mode Selector */}
          <div className="location-mode-selector">
            <label>
              <input
                type="radio"
                name="locationMode"
                value="precise"
                checked={locationMode === 'precise'}
                onChange={() => setLocationMode('precise')}
              />
              <span>Use My Precise Location</span>
            </label>
            <label>
              <input
                type="radio"
                name="locationMode"
                value="zipcode"
                checked={locationMode === 'zipcode'}
                onChange={() => setLocationMode('zipcode')}
              />
              <span>Enter Zip Code</span>
            </label>
          </div>

          {/* Precise Location Mode */}
          {locationMode === 'precise' && (
            <div className="location-inputs">
              {locationDisplay ?? (
                <div className="location-display">
                  <strong>{locationDisplay}</strong>
                </div>
              )}
              <button
                onClick={handleGetLocation}
                disabled={gettingLocation}
                className="location-btn"
              >
                {gettingLocation ? 'Getting location...' : '📍 Use My Location'}
              </button>
            </div>
          )}

          {/* Zip Code Mode */}
          {locationMode === 'zipcode' && (
            <div className="location-inputs">
              <div className="input-group">
                <label>Zip Code:</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="10001"
                  maxLength={10}
                />
              </div>
            </div>
          )}
        </section>

        {/* Grocery List Input */}
        <section className="input-section">
          <h2>Grocery List</h2>
          <ProductAutocomplete
            onProductSelect={handleProductSelect}
            placeholder="Search for products (e.g., milk, eggs, bread)..."
          />
          <SelectedProductsList
            products={selectedProducts}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemoveProduct}
          />
        </section>

        {/* Compare Button */}
        <div className="action-section">
          <button
            onClick={handleCompare}
            disabled={loading}
            className="compare-btn"
          >
            {loading ? 'Comparing prices...' : '🔍 Compare Prices'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <section className="results-section">
            <h2>Results ({results.length} stores found)</h2>

            {results.map((store, index) => (
              <div key={store.id} className="store-card">
                <div className="store-header">
                  <div>
                    <h3>
                      {index === 0 && '🏆 '}
                      {store.name}
                    </h3>
                    <p className="store-details">
                      {store.address}
                      {store.distance && ` • ${formatDistance(store.distance)}`}
                    </p>
                  </div>
                  <div className="store-total">
                    <div className="total-label">Total</div>
                    <div className="total-amount">{formatPrice(store.total)}</div>
                  </div>
                </div>

                {store.usedMockData && (
                  <div className="mock-data-badge">
                    ℹ️ Demo Data: {store.mockDataReason}
                  </div>
                )}

                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {store.items.map((item, itemIndex) => {
                      // Find the quantity from selected products
                      const selectedProduct = selectedProducts.find(
                        sp => sp.product.name === item.itemName
                      );
                      const quantity = selectedProduct?.quantity || 1;

                      return (
                        <tr key={itemIndex}>
                          <td>{item.itemName}</td>
                          <td>{quantity}</td>
                          <td>
                            {formatPrice(item.price)}
                            {item.isMockData && <span className="mock-badge">demo</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
        )}
      </main>

      <footer>
        <p>
          Phase 2.5 MVP • Product Database • Using {results.length > 0 && results[0].usedMockData ? 'demo' : 'real'} data
        </p>
      </footer>
    </div>
  );
}

export default App;
