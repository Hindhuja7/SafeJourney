// config/api.js
// API Configuration for SafeJourney
// Works for both web and mobile (Capacitor)

// Get backend URL from environment or use defaults
const getBackendUrl = () => {
  // Check if NEXT_PUBLIC_API_URL is explicitly set (highest priority)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Production - Render deployment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If frontend is on Render, use Render backend URL pattern
    if (hostname.includes('onrender.com')) {
      // Extract subdomain and construct backend URL
      // Frontend: safejourney-frontend.onrender.com
      // Backend: safejourney-backend.onrender.com
      return 'https://safejourney-backend.onrender.com';
    }
  }

  // In mobile (Capacitor), use environment variable or default to production
  if (typeof window !== 'undefined' && window.Capacitor) {
    // Mobile app - use environment variable or production URL
    return process.env.REACT_APP_API_URL ||
      'https://safejourney-backend.onrender.com';
  }

  // Web development - use localhost or environment variable
  if (typeof window !== 'undefined') {
    return 'http://localhost:5010';
  }

  // Server-side (Next.js SSR) - default to localhost for dev
  return 'http://localhost:5010';
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
  auth: {
    login: apiUrl('api/auth/login'),
    register: apiUrl('api/auth/register'),
    logout: apiUrl('api/auth/logout'),
    verify: apiUrl('api/auth/verify'),
  },
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