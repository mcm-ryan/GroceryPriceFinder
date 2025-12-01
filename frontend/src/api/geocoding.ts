/**
 * Geocoding utilities using Geoapify API
 * Provides reverse geocoding (coordinates -> address) and forward geocoding (zip -> coordinates)
 */

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

export interface AddressResult {
  city: string;
  state: string;
  zipCode: string;
  formatted: string; // e.g., "New York, NY 10001"
}

export interface CoordinatesResult {
  latitude: number;
  longitude: number;
}

/**
 * Convert coordinates to a human-readable address (reverse geocoding)
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Address information including city, state, and zip code
 * @throws Error if geocoding fails or API key is missing
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<AddressResult> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured');
  }

  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${GEOAPIFY_API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error('No address found for these coordinates');
    }

    const properties = data.features[0].properties;

    // Extract city, state, and zip code
    const city = properties.city || properties.county || properties.state || 'Unknown';
    const state = properties.state_code || properties.state || '';
    const zipCode = properties.postcode || '';

    // Format as "City, ST ZIP"
    let formatted = city;
    if (state) {
      formatted += `, ${state}`;
    }
    if (zipCode) {
      formatted += ` ${zipCode}`;
    }

    return {
      city,
      state,
      zipCode,
      formatted,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to reverse geocode coordinates');
  }
}

/**
 * Convert a US zip code to coordinates (forward geocoding)
 * @param zipCode - US zip code (5 digits)
 * @returns Coordinates for the zip code
 * @throws Error if geocoding fails or API key is missing
 */
export async function geocodeZipCode(zipCode: string): Promise<CoordinatesResult> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured');
  }

  // Validate zip code format (basic validation for US zip codes)
  const cleanZip = zipCode.trim();
  if (!/^\d{5}(-\d{4})?$/.test(cleanZip)) {
    throw new Error('Invalid zip code format. Please enter a 5-digit US zip code.');
  }

  const url = `https://api.geoapify.com/v1/geocode/search?text=${cleanZip}&type=postcode&filter=countrycode:us&apiKey=${GEOAPIFY_API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error('Zip code not found. Please check and try again.');
    }

    const [longitude, latitude] = data.features[0].geometry.coordinates;

    return {
      latitude,
      longitude,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to geocode zip code');
  }
}
