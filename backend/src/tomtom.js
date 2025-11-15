/**
 * TomTom API integration module
 * Handles all TomTom API calls: routes, incidents, traffic flow, and POIs
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
 * Fetch multiple route alternatives from TomTom Routing API
 * @param {number} originLat - Origin latitude
 * @param {number} originLon - Origin longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLon - Destination longitude
 * @returns {Promise<Array>} Array of route objects
 */
export async function fetchRoutes(originLat, originLon, destLat, destLon) {
  if (!TOMTOM_API_KEY || TOMTOM_API_KEY === 'YOUR_KEY') {
    throw new Error('TomTom API key is not set. Please set TOMTOM_API_KEY in your .env file.');
  }

  // Try TomTom Routing API with different endpoint format
  // Some versions use waypoints as query parameter instead of path
  const waypoints = `${originLat},${originLon}:${destLat},${destLon}`;

  // Try format: calculateRoute/json?waypoints={waypoints}&key={key}
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${waypoints}/json?key=${TOMTOM_API_KEY}&traffic=true&routeType=fastest&travelMode=car`;

  try {
    console.log('Fetching routes from TomTom API...');
    console.log('URL:', url.replace(TOMTOM_API_KEY, '***'));

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('TomTom API Error Response:', JSON.stringify(data, null, 2));
      console.error('Response Status:', response.status, response.statusText);
      const errorMsg = data.detailedError?.message || data.error?.message || data.errorText || data.message || JSON.stringify(data);
      throw new Error(`TomTom Routing API error (${response.status}): ${errorMsg}`);
    }

    // TomTom returns a single route object, not an array
    // To get alternatives, we'll make multiple calls with different route types
    let routes = [];

    // The response contains a single route
    if (data.routes && Array.isArray(data.routes)) {
      routes = data.routes;
    } else if (data.routes) {
      routes = [data.routes];
    } else if (data.route) {
      routes = [data.route];
    } else {
      // Try to get the route from the response directly
      routes = [data];
    }

    // If we got a route, try to get alternatives by calling with different route types
    if (routes.length > 0) {
      const routeTypes = ['fastest', 'shortest', 'eco'];
      const alternativePromises = routeTypes.slice(1).map(async (routeType) => {
        try {
          const altUrl = `https://api.tomtom.com/routing/1/calculateRoute/${waypoints}/json?key=${TOMTOM_API_KEY}&traffic=true&routeType=${routeType}&travelMode=car`;

          const altResponse = await fetch(altUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });
          if (altResponse.ok) {
            const altData = await altResponse.json();
            // altData is the route object itself, not wrapped
            if (altData && (altData.legs || altData.sections || altData.summary)) {
              return altData;
            }
            // Fallback to nested structure
            return altData.routes || altData.route || altData;
          }
        } catch (e) {
          console.warn(`Failed to fetch ${routeType} route:`, e.message);
        }
        return null;
      });

      const alternatives = await Promise.all(alternativePromises);

      // Helper function to check if routes are similar (same distance/time)
      const routesAreSimilar = (r1, r2) => {
        const s1 = r1.summary || {};
        const s2 = r2.summary || {};
        const dist1 = s1.lengthInMeters || 0;
        const dist2 = s2.lengthInMeters || 0;
        const time1 = s1.travelTimeInSeconds || 0;
        const time2 = s2.travelTimeInSeconds || 0;

        // Consider routes similar if distance and time are within 5% of each other
        const distDiff = Math.abs(dist1 - dist2) / Math.max(dist1, dist2, 1);
        const timeDiff = Math.abs(time1 - time2) / Math.max(time1, time2, 1);

        return distDiff < 0.05 && timeDiff < 0.05;
      };

      alternatives.forEach(alt => {
        if (alt) {
          // Check if this route is already in the list (by comparing summaries)
          const isDuplicate = routes.some(r => routesAreSimilar(r, alt));
          if (!isDuplicate) {
            routes.push(alt);
            console.log(`Added alternative route: ${alt.summary?.routeType || 'unknown'}`);
          } else {
            console.log(`Skipped duplicate route: ${alt.summary?.routeType || 'unknown'}`);
          }
        }
      });
    }

    if (routes.length === 0) {
      console.warn('TomTom API returned no routes');
      return [];
    }

    console.log(`Successfully fetched ${routes.length} routes from TomTom`);
    return routes;
  } catch (error) {
    console.error('Error fetching routes:', error.message);
    if (error.message.includes('API key')) {
      throw error;
    }
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
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Search radius in meters (default: 500)
 * @returns {Promise<Array>} Array of POI objects
 */
export async function fetchPOIs(lat, lon, radius = 500) {
  // Category sets: police=7366, hospitals=7322, fuel=7311
  const categorySet = '7366,7322,7311';
  const url = `https://api.tomtom.com/search/2/poiSearch/.json?key=${TOMTOM_API_KEY}&lat=${lat}&lon=${lon}&radius=${radius}&categorySet=${categorySet}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`TomTom POI API error: ${data.error?.message || 'Unknown error'}`);
    }

    return data.results || [];
  } catch (error) {
    console.error('Error fetching POIs:', error);
    return []; // Return empty array on error
  }
}

/**
 * Search for location autocomplete suggestions
 * @param {string} query - Partial address or location name
 * @param {number} limit - Maximum number of results (default: 5)
 * @returns {Promise<Array>} Array of suggestion objects with address, lat, lon
 */
export async function searchAutocomplete(query, limit = 5) {
  if (!query || query.trim() === '') {
    return [];
  }

  const encodedQuery = encodeURIComponent(query);
  // Use TomTom Search API with typeahead for autocomplete
  const url = `https://api.tomtom.com/search/2/search/${encodedQuery}.json?key=${TOMTOM_API_KEY}&limit=${limit}&typeahead=true`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    const data = await response.json();

    if (!response.ok) {
      console.warn(`Autocomplete error (${response.status}): ${data.detailedError?.message || data.error?.message || 'Unknown error'}`);
      return [];
    }

    if (data.results && data.results.length > 0) {
      return data.results.map(result => ({
        address: result.address?.freeformAddress || result.poi?.name || query,
        lat: result.position.lat,
        lon: result.position.lon,
        type: result.type || 'address',
        poiName: result.poi?.name
      }));
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

