/**
 * API client for communicating with SafeJourney backend
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Geocode an address/location name to coordinates
 * @param {string} query - Address or location name
 * @returns {Promise<Object>} Object with lat, lon, and address
 */
export async function geocodeLocation(query) {
  try {
    const response = await axios.post(`${API_URL}/geocode`, { query });
    return response.data;
  } catch (error) {
    console.error('Error geocoding location:', error);
    throw error;
  }
}

export async function searchAutocomplete(query, limit = 5) {
  try {
    const response = await axios.post(`${API_URL}/autocomplete`, { query, limit });
    return response.data;
  } catch (error) {
    console.error('Error in autocomplete:', error);
    return [];
  }
}

export async function reverseGeocode(lat, lon) {
  try {
    const response = await axios.post(`${API_URL}/reverse-geocode`, { lat, lon });
    return response.data;
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    // Return coordinates as fallback
    return {
      address: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      lat: lat,
      lon: lon
    };
  }
}

/**
 * Fetch safe routes from backend
 * @param {number} originLat - Origin latitude
 * @param {number} originLon - Origin longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLon - Destination longitude
 * @returns {Promise<Object>} Response with routes and safety scores
 */
export async function fetchSafeRoutes(originLat, originLon, destLat, destLon) {
  try {
    const response = await axios.get(`${API_URL}/safe-routes`, {
      params: {
        originLat,
        originLon,
        destLat,
        destLon
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching safe routes:', error);
    throw error;
  }
}
