/**
 * Re-routing Service
 * Handles automatic re-routing when user deviates from route
 */

import { fetchSafeRoutes } from '../api.js';

export class ReroutingService {
  constructor(options = {}) {
    this.options = {
      deviationThreshold: options.deviationThreshold || 50, // meters
      rerouteDelay: options.rerouteDelay || 2000, // ms - delay before rerouting
      maxRerouteAttempts: options.maxRerouteAttempts || 3,
      ...options
    };
    
    this.isRerouting = false;
    this.rerouteAttempts = 0;
    this.rerouteTimer = null;
    this.onRerouteCallback = null;
    this.onRerouteErrorCallback = null;
  }

  /**
   * Check if user has deviated and trigger re-routing if needed
   * @param {Object} navigationUpdate - Result from NavigationEngine.updatePosition
   * @param {Object} currentPosition - Current GPS position {lat, lon}
   * @param {Object} destination - Destination {lat, lon}
   */
  async checkAndReroute(navigationUpdate, currentPosition, destination) {
    if (!navigationUpdate || !currentPosition || !destination) {
      return null;
    }

    // If already rerouting, don't trigger again
    if (this.isRerouting) {
      return null;
    }

    // If user has deviated significantly
    if (navigationUpdate.deviated && navigationUpdate.needsReroute) {
      // Clear any existing timer
      if (this.rerouteTimer) {
        clearTimeout(this.rerouteTimer);
      }

      // Delay rerouting to avoid too frequent reroutes
      return new Promise((resolve) => {
        this.rerouteTimer = setTimeout(async () => {
          await this.performReroute(currentPosition, destination, resolve);
        }, this.options.rerouteDelay);
      });
    }

    // Reset reroute attempts if user is back on route
    if (!navigationUpdate.deviated) {
      this.rerouteAttempts = 0;
    }

    return null;
  }

  /**
   * Perform the actual re-routing
   */
  async performReroute(currentPosition, destination, resolve) {
    if (this.rerouteAttempts >= this.options.maxRerouteAttempts) {
      console.warn('Max reroute attempts reached');
      if (this.onRerouteErrorCallback) {
        this.onRerouteErrorCallback(new Error('Max reroute attempts reached'));
      }
      this.isRerouting = false;
      if (resolve) resolve(null);
      return null;
    }

    this.isRerouting = true;
    this.rerouteAttempts++;

    console.log(`Re-routing attempt ${this.rerouteAttempts} from current position...`);

    try {
      // Fetch new routes from current position to destination
      const routeData = await fetchSafeRoutes(
        currentPosition.lat,
        currentPosition.lon,
        destination.lat,
        destination.lon
      );

      if (!routeData || !routeData.routes || routeData.routes.length === 0) {
        throw new Error('No routes found for re-routing');
      }

      // Get the safest route (first in sorted list)
      const newRoute = routeData.routes[routeData.safestRouteIndex || 0];

      console.log('Re-routing successful, new route found');

      this.isRerouting = false;
      this.rerouteAttempts = 0; // Reset on success

      // Notify callback
      if (this.onRerouteCallback) {
        this.onRerouteCallback(newRoute, routeData);
      }

      if (resolve) resolve({ route: newRoute, routeData });

      return { route: newRoute, routeData };
    } catch (error) {
      console.error('Re-routing error:', error);
      this.isRerouting = false;

      if (this.onRerouteErrorCallback) {
        this.onRerouteErrorCallback(error);
      }

      if (resolve) resolve(null);
      return null;
    }
  }

  /**
   * Set callback for successful reroute
   */
  onReroute(callback) {
    this.onRerouteCallback = callback;
  }

  /**
   * Set callback for reroute errors
   */
  onRerouteError(callback) {
    this.onRerouteErrorCallback = callback;
  }

  /**
   * Cancel pending reroute
   */
  cancelReroute() {
    if (this.rerouteTimer) {
      clearTimeout(this.rerouteTimer);
      this.rerouteTimer = null;
    }
    this.isRerouting = false;
  }

  /**
   * Reset reroute state
   */
  reset() {
    this.cancelReroute();
    this.rerouteAttempts = 0;
  }

  /**
   * Check if currently rerouting
   */
  isCurrentlyRerouting() {
    return this.isRerouting;
  }
}

