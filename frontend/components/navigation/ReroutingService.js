/**
 * Re-routing Service
 * Handles automatic re-routing when user deviates from route
 */

import { fetchSafeRoutes } from '../../lib/navigationApi.js';

export class ReroutingService {
  constructor(options = {}) {
    this.options = {
      deviationThreshold: options.deviationThreshold || 50,
      rerouteDelay: options.rerouteDelay || 2000,
      maxRerouteAttempts: options.maxRerouteAttempts || 3,
      ...options
    };
    
    this.isRerouting = false;
    this.rerouteAttempts = 0;
    this.rerouteTimer = null;
    this.onRerouteCallback = null;
    this.onRerouteErrorCallback = null;
  }

  async checkAndReroute(navigationUpdate, currentPosition, destination) {
    if (!navigationUpdate || !currentPosition || !destination) {
      return null;
    }

    if (this.isRerouting) {
      return null;
    }

    if (navigationUpdate.deviated && navigationUpdate.needsReroute) {
      if (this.rerouteTimer) {
        clearTimeout(this.rerouteTimer);
      }

      return new Promise((resolve) => {
        this.rerouteTimer = setTimeout(async () => {
          await this.performReroute(currentPosition, destination, resolve);
        }, this.options.rerouteDelay);
      });
    }

    if (!navigationUpdate.deviated) {
      this.rerouteAttempts = 0;
    }

    return null;
  }

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
      const routeData = await fetchSafeRoutes(
        currentPosition.lat,
        currentPosition.lon,
        destination.lat,
        destination.lon
      );

      if (!routeData || !routeData.routes || routeData.routes.length === 0) {
        throw new Error('No routes found for re-routing');
      }

      const newRoute = routeData.routes[routeData.safestRouteIndex || 0];

      console.log('Re-routing successful, new route found');

      this.isRerouting = false;
      this.rerouteAttempts = 0;

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

  onReroute(callback) {
    this.onRerouteCallback = callback;
  }

  onRerouteError(callback) {
    this.onRerouteErrorCallback = callback;
  }

  cancelReroute() {
    if (this.rerouteTimer) {
      clearTimeout(this.rerouteTimer);
      this.rerouteTimer = null;
    }
    this.isRerouting = false;
  }

  reset() {
    this.cancelReroute();
    this.rerouteAttempts = 0;
  }

  isCurrentlyRerouting() {
    return this.isRerouting;
  }
}

