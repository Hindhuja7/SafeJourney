/**
 * GPS Tracker Service
 * Wrapper for browser Geolocation API with continuous position updates
 */

export class GPSTracker {
  constructor(options = {}) {
    this.options = {
      enableHighAccuracy: options.enableHighAccuracy !== false,
      timeout: options.timeout || 10000,
      maximumAge: options.maximumAge || 0,
      updateInterval: options.updateInterval || 2000, // 2 seconds
      ...options
    };
    
    this.watchId = null;
    this.callbacks = [];
    this.currentPosition = null;
    this.isTracking = false;
    this.errorCallbacks = [];
  }

  /**
   * Start tracking position
   * @param {Function} callback - Called with position updates {lat, lon, accuracy, heading, speed}
   * @param {Function} errorCallback - Called on errors
   */
  start(callback, errorCallback) {
    if (this.isTracking) {
      console.warn('GPS tracking already started');
      return;
    }

    if (!navigator.geolocation) {
      const error = new Error('Geolocation is not supported by this browser');
      if (errorCallback) errorCallback(error);
      return;
    }

    if (callback) this.callbacks.push(callback);
    if (errorCallback) this.errorCallbacks.push(errorCallback);

    const watchOptions = {
      enableHighAccuracy: this.options.enableHighAccuracy,
      timeout: this.options.timeout,
      maximumAge: this.options.maximumAge
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handleError(error),
      watchOptions
    );

    this.isTracking = true;
    console.log('GPS tracking started');
  }

  /**
   * Stop tracking position
   */
  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    this.isTracking = false;
    this.callbacks = [];
    this.errorCallbacks = [];
    console.log('GPS tracking stopped');
  }

  /**
   * Add callback for position updates
   */
  onPositionUpdate(callback) {
    if (callback && !this.callbacks.includes(callback)) {
      this.callbacks.push(callback);
    }
  }

  /**
   * Remove position update callback
   */
  offPositionUpdate(callback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * Add error callback
   */
  onError(callback) {
    if (callback && !this.errorCallbacks.includes(callback)) {
      this.errorCallbacks.push(callback);
    }
  }

  /**
   * Remove error callback
   */
  offError(callback) {
    this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
  }

  handlePositionUpdate(position) {
    const pos = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp
    };

    // Filter by accuracy if needed
    if (this.options.minAccuracy && pos.accuracy > this.options.minAccuracy) {
      console.warn(`Position accuracy ${pos.accuracy}m exceeds minimum ${this.options.minAccuracy}m`);
      return;
    }

    this.currentPosition = pos;

    // Notify all callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(pos);
      } catch (error) {
        console.error('Error in position update callback:', error);
      }
    });
  }

  handleError(error) {
    let errorMessage = 'Unknown geolocation error';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out.';
        break;
      default:
        errorMessage = `Geolocation error: ${error.message}`;
        break;
    }

    console.error('GPS Error:', errorMessage, error);

    // Notify all error callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(new Error(errorMessage), error);
      } catch (err) {
        console.error('Error in error callback:', err);
      }
    });
  }

  /**
   * Get current position (one-time)
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed
          });
        },
        (error) => {
          let errorMessage = 'Unknown geolocation error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: this.options.enableHighAccuracy,
          timeout: this.options.timeout,
          maximumAge: this.options.maximumAge
        }
      );
    });
  }

  /**
   * Check if geolocation is available
   */
  static isAvailable() {
    return 'geolocation' in navigator;
  }

  /**
   * Request location permission
   */
  static async requestPermission() {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve(false);
          } else {
            reject(error);
          }
        },
        { timeout: 5000 }
      );
    });
  }

  getCurrentPositionSync() {
    return this.currentPosition;
  }

  isActive() {
    return this.isTracking;
  }
}

