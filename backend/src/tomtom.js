/**
 * Hybrid API integration module
 * Uses free APIs (OSRM, Nominatim, Overpass) for routing, geocoding, and POIs
 * Uses TomTom API only for real-time traffic data (incidents, traffic flow)
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

// Log API key status (without exposing the actual key)
if (!TOMTOM_API_KEY || TOMTOM_API_KEY === 'YOUR_KEY') {
  console.warn('⚠️  WARNING: TOMTOM_API_KEY is not set or is set to default value.');
  console.warn('   Please set your TomTom API key in the .env file.');
} else {
  console.log('✅ TomTom API key loaded (length:', TOMTOM_API_KEY.length, 'characters)');
}

/**
 * Fetch multiple route alternatives from OSRM (Open Source Routing Machine) - FREE
 * Hybrid approach: Use free OSRM for routing, TomTom only for traffic data
 * @param {number} originLat - Origin latitude
 * @param {number} originLon - Origin longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLon - Destination longitude
 * @returns {Promise<Array>} Array of route objects in TomTom-compatible format
 */
export async function fetchRoutes(originLat, originLon, destLat, destLon) {
  // Use OSRM (Open Source Routing Machine) - FREE, no API key needed
  // OSRM format: lon,lat (note: longitude first!)
  // Note: TomTom API key is no longer required for routing (hybrid approach)
  const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson&alternatives=true`;

  try {
    console.log('Fetching routes from OSRM (free, hybrid approach)...');
    console.log('URL:', osrmUrl);

    const response = await fetch(osrmUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SafeJourneyApp/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`OSRM API error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn('OSRM returned no routes');
      return [];
    }

    // Convert OSRM format to TomTom-compatible format
    const routes = data.routes.map((osrmRoute, index) => {
      // Extract coordinates from GeoJSON geometry
      const coordinates = osrmRoute.geometry.coordinates || []; // [lon, lat] pairs

      // Convert to TomTom format: {latitude, longitude} points
      const points = coordinates.map(coord => ({
        latitude: coord[1], // lat is second in GeoJSON
        longitude: coord[0] // lon is first in GeoJSON
      }));

      // Create legs structure (TomTom format)
      const legs = [{
        summary: {
          lengthInMeters: Math.round(osrmRoute.distance),
          travelTimeInSeconds: Math.round(osrmRoute.duration),
          trafficDelayInSeconds: 0,
          trafficLengthInMeters: 0
        },
        points: points
      }];

      // Create route in TomTom-compatible format
      return {
        summary: {
          lengthInMeters: Math.round(osrmRoute.distance),
          travelTimeInSeconds: Math.round(osrmRoute.duration),
          trafficDelayInSeconds: 0,
          trafficLengthInMeters: 0,
          routeType: index === 0 ? 'fastest' : 'alternative',
          departureTime: new Date().toISOString(),
          arrivalTime: new Date(Date.now() + osrmRoute.duration * 1000).toISOString()
        },
        legs: legs,
        sections: legs, // Some code checks sections too
        points: points, // Direct points array
        geometry: {
          points: points // For compatibility
        }
      };
    });

    console.log(`Successfully fetched ${routes.length} routes from OSRM`);
    return routes;
  } catch (error) {
    console.error('Error fetching routes from OSRM:', error.message);
    throw new Error(`Failed to fetch routes: ${error.message}`);
  }
}

/**
 * Fetch incidents for a bounding box
 * @param {number} minLon - Minimum longitude
 * @param {number} minLat - Minimum latitude
 * @param {number} maxLon - Maximum longitude
 * @param {number} maxLat - Maximum latitude
 * @returns {Promise<Array>} Array of incident objects
 */
export async function fetchIncidents(minLon, minLat, maxLon, maxLat) {
  const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
  // Remove fields parameter - it's causing errors, just get all incident data
  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?bbox=${bbox}&key=${TOMTOM_API_KEY}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    const data = await response.json();

    if (!response.ok) {
      console.warn(`TomTom Incident API error (${response.status}): ${data.detailedError?.message || data.error?.message || 'Unknown error'}`);
      return []; // Return empty array on error to not break the flow
    }

    return data.incidents || [];
  } catch (error) {
    console.warn('Error fetching incidents (continuing without them):', error.message);
    return []; // Return empty array on error to not break the flow
  }
}

/**
 * Fetch traffic flow data for a point
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object|null>} Flow data object or null
 */
export async function fetchTrafficFlow(lat, lon) {
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lon}&key=${TOMTOM_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`TomTom Flow API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.flowSegmentData || null;
  } catch (error) {
    console.error('Error fetching traffic flow:', error);
    return null; // Return null on error
  }
}

/**
 * Fetch POIs (police, hospitals, gas stations) near a point
 * Hybrid approach: Use Overpass API (OpenStreetMap) - FREE
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Search radius in meters (default: 500)
 * @returns {Promise<Array>} Array of POI objects
 */
export async function fetchPOIs(lat, lon, radius = 500) {
  // Use Overpass API (OpenStreetMap) - FREE, no API key needed
  try {
    // Overpass API query for police, hospitals, and gas stations
    const overpassQuery = `
      [out:json][timeout:10];
      (
        node["amenity"="police"](around:${radius},${lat},${lon});
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        node["amenity"="fuel"](around:${radius},${lat},${lon});
        way["amenity"="police"](around:${radius},${lat},${lon});
        way["amenity"="hospital"](around:${radius},${lat},${lon});
        way["amenity"="fuel"](around:${radius},${lat},${lon});
      );
      out center;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SafeJourneyApp/1.0'
      }
    });

    if (!response.ok) {
      console.warn('Overpass API error, returning empty POI list');
      return [];
    }

    const data = await response.json();

    // Convert Overpass format to TomTom-compatible format
    const pois = (data.elements || []).map(element => {
      const position = element.center || { lat: element.lat, lon: element.lon };
      const tags = element.tags || {};

      return {
        position: {
          lat: position.lat,
          lon: position.lon
        },
        poi: {
          name: tags.name || tags['name:en'] || 'Unknown',
          category: tags.amenity || 'unknown'
        },
        type: 'POI'
      };
    });

    console.log(`Found ${pois.length} POIs from Overpass API (free)`);
    return pois;
  } catch (error) {
    console.warn('Error fetching POIs from Overpass API:', error.message);
    return []; // Return empty array on error
  }
}

/**
 * Search for location autocomplete suggestions
 * Hybrid approach: Use Nominatim (OpenStreetMap) - FREE
 * @param {string} query - Partial address or location name
 * @param {number} limit - Maximum number of results (default: 5)
 * @returns {Promise<Array>} Array of suggestion objects with address, lat, lon
 */
export async function searchAutocomplete(query, limit = 5) {
  if (!query || query.trim() === '') {
    return [];
  }

  const encodedQuery = encodeURIComponent(query);

  // Use Nominatim (OpenStreetMap) - FREE, no API key needed
  // Documentation: https://nominatim.org/release-docs/develop/api/Search/
  const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=${limit}&addressdetails=1&extratags=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SafeJourneyApp/1.0' // Required by Nominatim
      }
    });

    if (!response.ok) {
      console.warn(`Autocomplete error (${response.status}): ${response.statusText}`);
      return [];
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return data.map(result => {
        // Format address from Nominatim response
        const address = result.display_name ||
          [result.address?.road,
          result.address?.city || result.address?.town || result.address?.village,
          result.address?.state,
          result.address?.country].filter(Boolean).join(', ') ||
          query;

        return {
          address: address,
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          type: result.type || result.class || 'address',
          poiName: result.name || result.address?.name || null
        };
      });
    }

    return [];
  } catch (error) {
    // Handle network errors gracefully
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.warn(`Network error in autocomplete "${query}": ${error.message}`);
    } else {
      console.error('Error in autocomplete:', error.message);
    }
    return [];
  }
}

/**
 * Reverse geocode coordinates to address
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object|null>} Object with address or null
 */
export async function reverseGeocode(lat, lon) {
  if (lat == null || lon == null) {
    return null;
  }

  const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${TOMTOM_API_KEY}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    const data = await response.json();

    if (!response.ok) {
      console.warn(`Reverse geocoding error (${response.status}): ${data.detailedError?.message || data.error?.message || 'Unknown error'}`);
      return null;
    }

    if (data.addresses && data.addresses.length > 0) {
      const address = data.addresses[0].address;
      return {
        address: address.freeformAddress || `${address.streetName || ''} ${address.municipality || ''} ${address.countrySubdivision || ''}`.trim() || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        lat: lat,
        lon: lon
      };
    }

    // Fallback: return coordinates as address
    return {
      address: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      lat: lat,
      lon: lon
    };
  } catch (error) {
    // Handle network errors gracefully
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.warn(`Network error in reverse geocoding: ${error.message}`);
    } else {
      console.error('Error in reverse geocoding:', error.message);
    }
    // Return coordinates as fallback
    return {
      address: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      lat: lat,
      lon: lon
    };
  }
}

/**
 * Geocode an address/location name to coordinates
 * @param {string} query - Address or location name
 * @returns {Promise<Object|null>} Object with lat, lon, and address or null
 */
export async function geocodeAddress(query) {
  if (!query || query.trim() === '') {
    return null;
  }

  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.tomtom.com/search/2/geocode/${encodedQuery}.json?key=${TOMTOM_API_KEY}&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    const data = await response.json();

    if (!response.ok) {
      console.warn(`Geocoding error (${response.status}): ${data.detailedError?.message || data.error?.message || 'Unknown error'}`);
      return null;
    }

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.position.lat,
        lon: result.position.lon,
        address: result.address.freeformAddress || query
      };
    }

    return null;
  } catch (error) {
    // Handle network errors gracefully
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.warn(`Network error geocoding "${query}": ${error.message}. Check your internet connection.`);
    } else {
      console.error('Error geocoding address:', error.message);
    }
    return null;
  }
}

/**
 * Calculate bounding box from an array of coordinates
 * @param {Array<Array<number>>} coordinates - Array of [lon, lat] pairs
 * @returns {Object} Bounding box {minLon, minLat, maxLon, maxLat}
 */
export function calculateBoundingBox(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return { minLon: 0, minLat: 0, maxLon: 0, maxLat: 0 };
  }

  let minLon = coordinates[0][0];
  let maxLon = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLat = coordinates[0][1];

  for (const [lon, lat] of coordinates) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return { minLon, minLat, maxLon, maxLat };
}

