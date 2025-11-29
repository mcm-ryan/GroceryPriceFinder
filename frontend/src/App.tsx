import { useState } from 'react';
import type { GroceryItem, StoreWithPrices } from '@grocery-price-finder/types';
import { compareStores } from './api/compare';
import './App.css';

function App() {
  // State
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [groceryList, setGroceryList] = useState<string>('milk\neggs\nbread');
  const [results, setResults] = useState<StoreWithPrices[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Get user's geolocation
  const handleGetLocation = () => {
    setGettingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(4));
        setLongitude(position.coords.longitude.toFixed(4));
        setGettingLocation(false);
      },
      (error) => {
        setError(`Location error: ${error.message}`);
        setGettingLocation(false);
      }
    );
  };

  // Parse grocery list from textarea (one item per line)
  const parseGroceryList = (): GroceryItem[] => {
    return groceryList
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Support format: "item" or "item x quantity"
        const match = line.match(/^(.+?)\s*(?:x\s*(\d+))?$/i);
        if (match) {
          const name = match[1].trim();
          const quantity = match[2] ? parseInt(match[2], 10) : 1;
          return { name, quantity };
        }
        return { name: line, quantity: 1 };
      });
  };

  // Compare prices
  const handleCompare = async () => {
    setError(null);
    setResults([]);

    // Validate inputs
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid coordinates or use the location button');
      return;
    }

    const items = parseGroceryList();
    if (items.length === 0) {
      setError('Please enter at least one grocery item');
      return;
    }

    setLoading(true);

    try {
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
          <div className="location-inputs">
            <div className="input-group">
              <label>Latitude:</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="40.7128"
                disabled={gettingLocation}
              />
            </div>
            <div className="input-group">
              <label>Longitude:</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-74.0060"
                disabled={gettingLocation}
              />
            </div>
            <button
              onClick={handleGetLocation}
              disabled={gettingLocation}
              className="location-btn"
            >
              {gettingLocation ? 'Getting location...' : '📍 Use My Location'}
            </button>
          </div>
        </section>

        {/* Grocery List Input */}
        <section className="input-section">
          <h2>Grocery List</h2>
          <p className="hint">Enter one item per line. Format: "item" or "item x quantity"</p>
          <textarea
            value={groceryList}
            onChange={(e) => setGroceryList(e.target.value)}
            rows={8}
            placeholder="milk&#10;eggs x 2&#10;bread"
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
                    {store.items.map((item, itemIndex) => (
                      <tr key={itemIndex}>
                        <td>{item.itemName}</td>
                        <td>
                          {parseGroceryList().find(i => i.name === item.itemName)?.quantity || 1}
                        </td>
                        <td>
                          {formatPrice(item.price)}
                          {item.isMockData && <span className="mock-badge">demo</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
        )}
      </main>

      <footer>
        <p>
          Phase 1 MVP • Using {results.length > 0 && results[0].usedMockData ? 'demo' : 'real'} data
        </p>
      </footer>
    </div>
  );
}

export default App;
