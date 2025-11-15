// API Configuration for SafeJourney
// Works for both web and mobile (Capacitor)

// Get backend URL from environment or use defaults
const getBackendUrl = () => {
  // In mobile (Capacitor), use environment variable or default to production
  if (typeof window !== 'undefined' && window.Capacitor) {
    // Mobile app - use environment variable or production URL
    return process.env.NEXT_PUBLIC_API_URL || 
           process.env.REACT_APP_API_URL || 
           'https://your-backend-url.com'; // Replace with your deployed backend URL
  }
  
  // Web development - use localhost or environment variable
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 
           process.env.REACT_APP_API_URL || 
           'http://localhost:5000';
  }
  
  // Server-side (Next.js SSR)
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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
};

export default API_BASE_URL;

