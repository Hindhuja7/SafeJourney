import axios from "axios";

/**
 * Find nearby police stations using OpenStreetMap Nominatim API
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {number} radius - Search radius in kilometers (default: 5km)
 * @returns {Promise<Array>} Array of nearby police stations
 */
export async function findNearbyPoliceStations(latitude, longitude, radius = 5) {
  try {
    // Search for police stations using Nominatim
    const query = `[amenity=police]`;
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&lat=${latitude}&lon=${longitude}&radius=${radius * 1000}&limit=5`;
    
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "SafeJourneyApp"
      }
    });

    if (!response.data || response.data.length === 0) {
      // Fallback: Try a broader search
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=police+station&format=json&lat=${latitude}&lon=${longitude}&radius=${radius * 1000}&limit=5`;
      const fallbackResponse = await axios.get(fallbackUrl, {
        headers: {
          "User-Agent": "SafeJourneyApp"
        }
      });
      
      if (!fallbackResponse.data || fallbackResponse.data.length === 0) {
        return [];
      }
      
      return formatPoliceStations(fallbackResponse.data, latitude, longitude);
    }

    return formatPoliceStations(response.data, latitude, longitude);
  } catch (error) {
    console.error("Error finding police stations:", error);
    return [];
  }
}

/**
 * Format police station data
 */
function formatPoliceStations(stations, userLat, userLon) {
  return stations
    .map(station => {
      const lat = parseFloat(station.lat);
      const lon = parseFloat(station.lon);
      const distance = calculateDistance(userLat, userLon, lat, lon);
      
      return {
        name: station.display_name || station.name || "Police Station",
        address: station.display_name || "Unknown address",
        latitude: lat,
        longitude: lon,
        distance: distance.toFixed(2), // Distance in km
        distanceMeters: Math.round(distance * 1000)
      };
    })
    .sort((a, b) => a.distance - b.distance) // Sort by distance
    .slice(0, 3); // Return top 3 nearest
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Get emergency contact information (police helpline numbers)
 * @returns {Object} Emergency contact info
 */
export function getEmergencyContacts() {
  return {
    india: {
      police: "100",
      womenHelpline: "1091",
      childHelpline: "1098",
      ambulance: "102",
      fire: "101"
    },
    international: {
      police: "112", // International emergency number
      ambulance: "112"
    }
  };
}

