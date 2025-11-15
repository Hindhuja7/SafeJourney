/**
 * API client for navigation features (Next.js compatible)
 * Uses the same backend endpoints as the main app
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Fetch safe routes from backend (for rerouting)
 * @param {number} originLat - Origin latitude
 * @param {number} originLon - Origin longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLon - Destination longitude
 * @returns {Promise<Object>} Response with routes and safety scores
 */
export async function fetchSafeRoutes(originLat, originLon, destLat, destLon) {
  try {
    // Use the /api/routes endpoint (POST) instead of /safe-routes (GET)
    const response = await axios.post(`${API_URL}/api/routes`, {
      sourceAddress: `${originLat},${originLon}`, // Format as address string
      destinationAddress: `${destLat},${destLon}`
    });
    
    // Transform response to match expected format
    if (response.data && response.data.routes && response.data.routes.length > 0) {
      return {
        routes: response.data.routes,
        safestRouteIndex: 0 // First route is usually safest
      };
    }
    
    throw new Error('No routes found');
  } catch (error) {
    console.error('Error fetching safe routes:', error);
    throw error;
  }
}

