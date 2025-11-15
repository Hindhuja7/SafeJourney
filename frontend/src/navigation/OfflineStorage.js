/**
 * Offline Storage Service
 * Uses IndexedDB to cache routes for offline navigation
 */

const DB_NAME = 'SafeJourneyDB';
const DB_VERSION = 1;
const STORE_ROUTES = 'routes';
const STORE_AREAS = 'areas';

export class OfflineStorage {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize IndexedDB
   */
  async initialize() {
    if (this.initialized && this.db) {
      return this.db;
    }

    if (!('indexedDB' in window)) {
      throw new Error('IndexedDB is not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.initialized = true;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create routes store
        if (!db.objectStoreNames.contains(STORE_ROUTES)) {
          const routeStore = db.createObjectStore(STORE_ROUTES, { keyPath: 'routeId', autoIncrement: false });
          routeStore.createIndex('timestamp', 'timestamp', { unique: false });
          routeStore.createIndex('origin', 'origin', { unique: false });
          routeStore.createIndex('destination', 'destination', { unique: false });
        }

        // Create areas store for POI and incident data
        if (!db.objectStoreNames.contains(STORE_AREAS)) {
          const areaStore = db.createObjectStore(STORE_AREAS, { keyPath: 'areaId', autoIncrement: false });
          areaStore.createIndex('bbox', 'bbox', { unique: false });
          areaStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Save route for offline use
   * @param {Object} routeData - Route data to save
   * @param {string} routeId - Unique route identifier
   */
  async saveRoute(routeData, routeId) {
    await this.initialize();

    const route = {
      routeId: routeId || `route_${Date.now()}`,
      geometry: routeData.geometry,
      instructions: routeData.instructions || [],
      metadata: {
        distance: routeData.distance || 0,
        time: routeData.time || 0,
        riskScore: routeData.riskScore || 0,
        origin: routeData.origin,
        destination: routeData.destination
      },
      segments: routeData.segments || [],
      timestamp: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_ROUTES], 'readwrite');
      const store = transaction.objectStore(STORE_ROUTES);
      const request = store.put(route);

      request.onsuccess = () => {
        console.log('Route saved for offline use:', route.routeId);
        resolve(route.routeId);
      };

      request.onerror = () => {
        reject(new Error('Failed to save route'));
      };
    });
  }

  /**
   * Load route from offline storage
   * @param {string} routeId - Route identifier
   */
  async loadRoute(routeId) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_ROUTES], 'readonly');
      const store = transaction.objectStore(STORE_ROUTES);
      const request = store.get(routeId);

      request.onsuccess = () => {
        const route = request.result;
        if (route) {
          resolve(route);
        } else {
          reject(new Error('Route not found in offline storage'));
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to load route'));
      };
    });
  }

  /**
   * Get all saved routes
   */
  async getAllRoutes() {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_ROUTES], 'readonly');
      const store = transaction.objectStore(STORE_ROUTES);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to get routes'));
      };
    });
  }

  /**
   * Delete route from offline storage
   * @param {string} routeId - Route identifier
   */
  async deleteRoute(routeId) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_ROUTES], 'readwrite');
      const store = transaction.objectStore(STORE_ROUTES);
      const request = store.delete(routeId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete route'));
      };
    });
  }

  /**
   * Save area data (POIs, incidents) for offline use
   * @param {Object} areaData - Area data with POIs and incidents
   * @param {string} areaId - Unique area identifier
   */
  async saveArea(areaData, areaId) {
    await this.initialize();

    const area = {
      areaId: areaId || `area_${Date.now()}`,
      bbox: areaData.bbox,
      pois: areaData.pois || [],
      incidents: areaData.incidents || [],
      timestamp: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_AREAS], 'readwrite');
      const store = transaction.objectStore(STORE_AREAS);
      const request = store.put(area);

      request.onsuccess = () => {
        resolve(area.areaId);
      };

      request.onerror = () => {
        reject(new Error('Failed to save area data'));
      };
    });
  }

  /**
   * Load area data from offline storage
   * @param {string} areaId - Area identifier
   */
  async loadArea(areaId) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_AREAS], 'readonly');
      const store = transaction.objectStore(STORE_AREAS);
      const request = store.get(areaId);

      request.onsuccess = () => {
        const area = request.result;
        if (area) {
          resolve(area);
        } else {
          reject(new Error('Area not found in offline storage'));
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to load area data'));
      };
    });
  }

  /**
   * Get storage usage estimate
   */
  async getStorageUsage() {
    if (!navigator.storage || !navigator.storage.estimate) {
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        usagePercent: estimate.quota ? (estimate.usage / estimate.quota * 100) : 0
      };
    } catch (error) {
      console.error('Error getting storage estimate:', error);
      return null;
    }
  }

  /**
   * Clear all offline data
   */
  async clearAll() {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_ROUTES, STORE_AREAS], 'readwrite');
      
      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error('Failed to clear offline data'));
      };

      transaction.objectStore(STORE_ROUTES).clear();
      transaction.objectStore(STORE_AREAS).clear();
    });
  }

  /**
   * Check if IndexedDB is available
   */
  static isAvailable() {
    return 'indexedDB' in window;
  }
}

