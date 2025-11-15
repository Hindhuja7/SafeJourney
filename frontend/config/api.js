// API Configuration for SafeJourney
// Works for both web and mobile (Capacitor)

// Get backend URL from environment or use defaults
// Next.js makes NEXT_PUBLIC_* variables available in both client and server
const getBackendUrl = () => {
  // In browser, process.env.NEXT_PUBLIC_* is available
  // Fallback to localhost:5000 for development
  return (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) 
    ? process.env.NEXT_PUBLIC_API_URL 
    : 'http://localhost:5000';
};

export const API_BASE_URL = getBackendUrl();

// Helper function to build full API URL
export const apiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Export commonly used endpoints
export const API_ENDPOINTS = {
  auth: apiUrl('api/auth'),
  health: apiUrl('api/health'),
  routes: apiUrl('api/routes'),
  liveLocation: {
    contacts: (userId) => apiUrl(`api/live-location/contacts/${userId}`),
    status: (userId) => apiUrl(`api/live-location/status/${userId}`),
    start: apiUrl('api/live-location/start'),
    stop: apiUrl('api/live-location/stop'),
    update: apiUrl('api/live-location/update'),
    sos: {
      start: apiUrl('api/live-location/sos/start'),
      checkin: apiUrl('api/live-location/sos/checkin'),
      emergency: apiUrl('api/live-location/sos/emergency'),
      status: (userId) => apiUrl(`api/live-location/sos/status/${userId}`),
    },
  },
  reviews: {
    submit: apiUrl('api/reviews/submit'),
    getUserReviews: (userId) => apiUrl(`api/reviews/${userId}`),
    getSessionReview: (sessionId) => apiUrl(`api/reviews/session/${sessionId}`),
  },
};

export default API_BASE_URL;

