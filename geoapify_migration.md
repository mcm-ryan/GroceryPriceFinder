# Migration Guide: Overpass API to Geoapify

## Overview
This guide provides instructions for migrating from Overpass API to Geoapify for finding nearby grocery stores based on user location.

## Why Migrate?
- **Reliability**: Geoapify offers more stable service compared to Overpass API's server overload issues
- **Performance**: Managed commercial service with predictable uptime
- **Caching**: Results can be stored and reused without repeated API calls
- **Free Tier**: 3,000 requests/day without credit card required

## Setup

### 1. Get API Key
1. Sign up at https://www.geoapify.com/
2. Navigate to your dashboard to get your API key
3. Store the API key securely (environment variable recommended)

```bash
# Example .env file
GEOAPIFY_API_KEY=your_api_key_here
```

## API Differences

### Overpass API Structure
```javascript
// Typical Overpass query
const query = `
  [out:json];
  node["shop"="supermarket"](around:5000,${lat},${lon});
  out body;
`;
const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
```

### Geoapify Structure
```javascript
// Equivalent Geoapify query
const radius = 5000; // meters
const url = `https://api.geoapify.com/v2/places?categories=commercial.supermarket&filter=circle:${lon},${lat},${radius}&limit=50&apiKey=${apiKey}`;
```

## Key Differences to Note

1. **Coordinate Order**: 
   - Overpass: `(lat, lon)`
   - Geoapify: `lon,lat` (follows GeoJSON standard)

2. **Response Format**:
   - Overpass returns `elements` array
   - Geoapify returns `features` array in GeoJSON format

3. **Distance Parameter**:
   - Both use meters, but syntax differs
   - Geoapify: `filter=circle:lon,lat,radius_in_meters`

## Implementation

### Basic Request Example
```javascript
async function findNearbyGroceryStores(latitude, longitude, radiusMeters = 5000) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  const url = `https://api.geoapify.com/v2/places` +
    `?categories=commercial.supermarket` +
    `&filter=circle:${longitude},${latitude},${radiusMeters}` +
    `&limit=50` +
    `&apiKey=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geoapify API error: ${response.status}`);
  }
  
  return await response.json();
}
```

### Response Structure
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Store Name",
        "street": "123 Main St",
        "city": "City Name",
        "postcode": "12345",
        "distance": 1234,
        "place_id": "unique_id",
        "categories": ["commercial.supermarket"]
      },
      "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      }
    }
  ]
}
```

## Migration Steps

### Step 1: Update Data Parsing
Replace Overpass element parsing with Geoapify feature parsing:

**Before (Overpass):**
```javascript
const stores = data.elements.map(element => ({
  id: element.id,
  name: element.tags?.name || 'Unnamed Store',
  lat: element.lat,
  lon: element.lon,
  address: element.tags?.['addr:street'] || ''
}));
```

**After (Geoapify):**
```javascript
const stores = data.features.map(feature => ({
  id: feature.properties.place_id,
  name: feature.properties.name || 'Unnamed Store',
  lat: feature.geometry.coordinates[1],
  lon: feature.geometry.coordinates[0],
  address: feature.properties.street || '',
  distance: feature.properties.distance // bonus: distance included!
}));
```

### Step 2: Update Category Filtering
If you were filtering multiple store types with Overpass:

**Before (Overpass):**
```
node["shop"~"supermarket|convenience|grocery"]
```

**After (Geoapify):**
```javascript
const categories = [
  'commercial.supermarket',
  'commercial.convenience',
  'commercial.grocery'
].join(',');

const url = `...&categories=${categories}&...`;
```

### Step 3: Handle Distance/Radius
Both APIs use meters, but verify your existing radius values are appropriate:
- 1000m = ~0.6 miles
- 5000m = ~3.1 miles
- 10000m = ~6.2 miles

### Step 4: Error Handling
Add appropriate error handling for API rate limits and failures:

```javascript
try {
  const data = await findNearbyGroceryStores(lat, lon);
  // Process data
} catch (error) {
  if (error.message.includes('429')) {
    // Rate limit exceeded
    console.error('Rate limit exceeded. Consider upgrading plan.');
  } else {
    console.error('API request failed:', error);
  }
}
```

## Additional Features

### Sorting by Distance
Geoapify automatically includes distance in meters:
```javascript
const sortedStores = data.features.sort((a, b) => 
  a.properties.distance - b.properties.distance
);
```

### Filtering by Bounding Box (Alternative to Circle)
```javascript
// Southwest and Northeast corners
const url = `https://api.geoapify.com/v2/places` +
  `?categories=commercial.supermarket` +
  `&filter=rect:${swLon},${swLat},${neLon},${neLat}` +
  `&limit=50` +
  `&apiKey=${apiKey}`;
```

### Bias Results by Location
Even without strict filtering, you can bias results toward a location:
```javascript
const url = `...&bias=proximity:${lon},${lat}&...`;
```

## Available Grocery Store Categories

- `commercial.supermarket` - Large grocery stores
- `commercial.convenience` - Convenience stores
- `commercial.grocery` - General grocery stores
- `commercial.food` - Broader food category (includes restaurants)

## Rate Limits

- **Free tier**: 3,000 requests/day
- **No credit card required** for free tier
- Monitor usage in Geoapify dashboard
- Consider caching results to reduce API calls

## Testing Checklist

- [ ] API key is properly loaded from environment
- [ ] Coordinates are passed in correct order (lon, lat)
- [ ] Response parsing handles missing fields gracefully
- [ ] Distance calculations work as expected
- [ ] Error handling covers rate limits and network failures
- [ ] Results are filtered/sorted appropriately
- [ ] UI displays store information correctly

## Useful Resources

- [Geoapify Places API Documentation](https://apidocs.geoapify.com/docs/places/)
- [Category List](https://apidocs.geoapify.com/docs/places/#categories)
- [API Playground](https://apidocs.geoapify.com/playground/places/)

## Example Migration Diff

```diff
- const query = `[out:json];node["shop"="supermarket"](around:${radius},${lat},${lon});out body;`;
- const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
+ const url = `https://api.geoapify.com/v2/places?categories=commercial.supermarket&filter=circle:${lon},${lat},${radius}&limit=50&apiKey=${apiKey}`;

- const stores = data.elements.map(el => ({
-   name: el.tags?.name,
-   lat: el.lat,
-   lon: el.lon
- }));
+ const stores = data.features.map(f => ({
+   name: f.properties.name,
+   lat: f.geometry.coordinates[1],
+   lon: f.geometry.coordinates[0],
+   distance: f.properties.distance
+ }));
```