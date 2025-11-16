// components/MapViewClient.js
"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from 'maplibre-gl';

// Client-side only component to avoid SSR issues
function MapContent({ routes, coords, selectedRoute, onMapClick, selectionMode }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize TomTom Map
  useEffect(() => {
    if (!isClient || !mapRef.current) {
      console.log('MapViewClient: Not initializing - isClient:', isClient, 'mapRef:', !!mapRef.current);
      return;
    }

    let checkSDKInterval = null;
    let isMounted = true;

    const initializeTomTomMap = async () => {
      try {
        // Get API key from environment (should be set in .env.local)
        const TOMTOM_API_KEY = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;

        if (!TOMTOM_API_KEY) {
          console.error("⚠️ TomTom API key not set. Please set NEXT_PUBLIC_TOMTOM_API_KEY in .env.local");
          return;
        }

        console.log('MapViewClient: Initializing map with MapLibre and TomTom tiles');

        // Calculate center point
        let center = [78.4867, 17.3850]; // Default to Hyderabad [lon, lat]
        if (coords?.source && Array.isArray(coords.source) && coords.source.length === 2) {
          center = [coords.source[1], coords.source[0]]; // [lon, lat]
        }

        console.log('MapViewClient: Map center:', center);

        // Initialize map using MapLibre with TomTom style
        const initializeMap = () => {
          if (!isMounted || !mapRef.current) {
            console.warn('MapViewClient: Component unmounted or ref lost');
            return;
          }

          try {
            // Check if MapLibre is available
            if (!maplibregl || !maplibregl.Map) {
              console.error('MapViewClient: MapLibre GL not available');
              return;
            }

            console.log('MapViewClient: Creating map with MapLibre');

            // Use MapLibre with OpenStreetMap style (free alternative)
            // You can switch to TomTom tiles later if needed
            const map = new maplibregl.Map({
              container: mapRef.current,
              style: {
                version: 8,
                sources: {
                  'osm-tiles': {
                    type: 'raster',
                    tiles: [
                      'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                    ],
                    tileSize: 256,
                    attribution: '© OpenStreetMap contributors'
                  }
                },
                layers: [
                  {
                    id: 'osm-tiles-layer',
                    type: 'raster',
                    source: 'osm-tiles',
                    minzoom: 0,
                    maxzoom: 19
                  }
                ]
              },
              center: center,
              zoom: 13
            });

            console.log('MapViewClient: Map instance created:', !!map);

            mapInstanceRef.current = map;

            // Wait for map to be ready
            map.on('load', () => {
              console.log('MapViewClient: Map loaded successfully');
              if (isMounted) {
                setIsMapReady(true);
              }
            });

            map.on('error', (error) => {
              console.error('MapViewClient: Map error:', error);
            });

          } catch (error) {
            console.error("MapViewClient: Error creating map:", error);
          }
        };

        // Wait for MapLibre to be available
        const waitForSDK = () => {
          if (maplibregl && maplibregl.Map) {
            console.log('MapViewClient: MapLibre available');
            initializeMap();
            return true;
          }
          return false;
        };

        // Listen for SDK ready event (now for MapLibre)
        const handleSDKReady = () => {
          console.log('MapViewClient: Received map-ready event');
          if (waitForSDK()) {
            if (checkSDKInterval) clearInterval(checkSDKInterval);
            window.removeEventListener('tomtom-sdk-ready', handleSDKReady);
          }
        };
        window.addEventListener('tomtom-sdk-ready', handleSDKReady);

        if (!waitForSDK()) {
          console.warn("MapViewClient: MapLibre not loaded yet, waiting...");
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max wait

          checkSDKInterval = setInterval(() => {
            attempts++;
            if (waitForSDK()) {
              clearInterval(checkSDKInterval);
              window.removeEventListener('tomtom-sdk-ready', handleSDKReady);
            } else if (attempts >= maxAttempts) {
              console.error('MapViewClient: MapLibre failed to load after', maxAttempts * 100, 'ms');
              clearInterval(checkSDKInterval);
              window.removeEventListener('tomtom-sdk-ready', handleSDKReady);
            }
          }, 100);
        }

        // Cleanup function
        return () => {
          isMounted = false;
          if (checkSDKInterval) {
            clearInterval(checkSDKInterval);
          }
          window.removeEventListener('tomtom-sdk-ready', handleSDKReady);
          if (mapInstanceRef.current) {
            try {
              // Remove map instance
              if (typeof mapInstanceRef.current.remove === 'function') {
                mapInstanceRef.current.remove();
              } else if (mapInstanceRef.current.mapLibreMap && typeof mapInstanceRef.current.mapLibreMap.remove === 'function') {
                mapInstanceRef.current.mapLibreMap.remove();
              }
            } catch (error) {
              console.error('MapViewClient: Error cleaning up map:', error);
            }
            mapInstanceRef.current = null;
          }
        };
      } catch (error) {
        console.error("MapViewClient: Error initializing TomTom map:", error);
      }
    };

    initializeTomTomMap();
  }, [isClient, coords]);

  // Update map click handler when selection mode changes
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const mapLibreMap = map.mapLibreMap || map;

    // Remove existing click handler
    mapLibreMap.off('click');

    // Add new click handler if in selection mode
    if (onMapClick && selectionMode) {
      mapLibreMap.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        console.log('MapViewClient: Map clicked for selection', { lat, lng, selectionMode });
        onMapClick(lat, lng);
      });

      // Change cursor to pointer when in selection mode
      mapLibreMap.getCanvas().style.cursor = 'pointer';
    } else {
      // Reset cursor to default
      mapLibreMap.getCanvas().style.cursor = '';
    }

    // Cleanup
    return () => {
      if (mapLibreMap) {
        mapLibreMap.off('click');
        mapLibreMap.getCanvas().style.cursor = '';
      }
    };
  }, [isMapReady, onMapClick, selectionMode]);

  // Update map with routes and markers
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) {
      console.log('MapViewClient: Map not ready', { isMapReady, hasMap: !!mapInstanceRef.current, hasRoutes: !!routes, routesCount: routes?.length });
      return;
    }

    // Always show map, but only draw routes if they exist
    if (!routes || routes.length === 0) {
      console.log('MapViewClient: No routes to display', { routes, coords, selectedRoute });
      // Still show markers if coords exist
      if (coords && (coords.source || coords.destination)) {
        console.log('MapViewClient: Showing markers only');
        // Add markers even when no routes
        const map = mapInstanceRef.current;
        if (map) {
          const mapLibreMap = map.mapLibreMap || map;
          // Add markers logic here if needed
        }
      }
      return;
    }

    console.log('MapViewClient: Updating map with routes', {
      routesCount: routes.length,
      routes: routes.map(r => ({ id: r.id, label: r.label, hasGeometry: !!r.geometry })),
      coords,
      selectedRoute: selectedRoute ? { id: selectedRoute.id, label: selectedRoute.label } : null
    });

    const updateMap = async () => {
      try {
        const map = mapInstanceRef.current;
        if (!map) {
          console.error('MapViewClient: Map instance not available');
          return;
        }

        // Get MapLibre map instance (TomTom SDK wraps MapLibre)
        const mapLibreMap = map.mapLibreMap || map;

        if (!mapLibreMap) {
          console.error('MapViewClient: MapLibreMap not available');
          return;
        }

        // Remove existing sources and layers
        if (mapLibreMap.getSource("routes")) {
          if (mapLibreMap.getLayer("routes-layer")) {
            mapLibreMap.removeLayer("routes-layer");
          }
          mapLibreMap.removeSource("routes");
        }
        if (mapLibreMap.getSource("markers")) {
          if (mapLibreMap.getLayer("markers-layer")) {
            mapLibreMap.removeLayer("markers-layer");
          }
          mapLibreMap.removeSource("markers");
        }

        // Prepare route coordinates
        const allCoordinates = [];
        const routeFeatures = [];

        routes.forEach((route, i) => {
          const isSelected = selectedRoute?.id === route.id;
          const isSafest = route.label === "Safest (Recommended)";

          // Parse geometry - backend returns { geometry: { points: [{ lat, lon }, ...] } }
          let routeCoords = [];
          console.log(`Route ${i} geometry:`, route.geometry);

          if (route.geometry) {
            if (route.geometry.points && Array.isArray(route.geometry.points)) {
              // Format: { points: [{ lat, lon }, ...] }
              console.log(`Route ${i} has ${route.geometry.points.length} points`);
              routeCoords = route.geometry.points.map(p => {
                if (typeof p === 'object' && p.lat !== undefined && p.lon !== undefined) {
                  return [p.lon, p.lat]; // TomTom uses [lon, lat]
                } else if (typeof p === 'object' && p.latitude !== undefined && p.longitude !== undefined) {
                  return [p.longitude, p.latitude]; // TomTom uses [lon, lat]
                } else if (Array.isArray(p) && p.length >= 2) {
                  // Could be [lat, lon] or [lon, lat]
                  const first = p[0];
                  const second = p[1];
                  // Check if first is longitude (typically -180 to 180) or latitude (typically -90 to 90)
                  if (Math.abs(first) <= 180 && Math.abs(second) <= 90) {
                    return [first, second]; // [lon, lat]
                  } else {
                    return [second, first]; // [lat, lon] -> convert to [lon, lat]
                  }
                }
                return null;
              }).filter(c => c !== null && Array.isArray(c) && c.length === 2);
            } else if (typeof route.geometry === 'string') {
              // Format: "lat,lon|lat,lon|..."
              routeCoords = route.geometry.split('|').map(point => {
                const [lat, lon] = point.split(',').map(Number);
                return [lon, lat]; // TomTom uses [lon, lat]
              });
            } else if (Array.isArray(route.geometry)) {
              routeCoords = route.geometry.map(p => {
                if (Array.isArray(p) && p.length >= 2) {
                  const first = p[0];
                  const second = p[1];
                  if (Math.abs(first) <= 180 && Math.abs(second) <= 90) {
                    return [first, second]; // [lon, lat]
                  } else {
                    return [second, first]; // [lat, lon] -> convert to [lon, lat]
                  }
                }
                return [p.lon || p.longitude, p.lat || p.latitude];
              }).filter(c => c && Array.isArray(c) && c.length === 2);
            }
          }

          console.log(`Route ${i} parsed ${routeCoords.length} coordinates`);

          if (routeCoords.length === 0) {
            console.warn(`Route ${i} has no valid coordinates after parsing. Geometry:`, route.geometry);
          }

          if (routeCoords.length > 0) {
            // Add to all coordinates for bounds
            routeCoords.forEach(coord => allCoordinates.push(coord));

            // Determine color based on selection
            let color = "#6b7280"; // gray
            let width = 4;
            if (isSelected) {
              color = "#7c3aed"; // purple
              width = 6;
            } else if (isSafest) {
              color = "#2563EB"; // blue
              width = 5;
            }

            // Create GeoJSON LineString
            routeFeatures.push({
              type: "Feature",
              properties: {
                routeId: route.id,
                isSelected,
                isSafest,
                color,
                width
              },
              geometry: {
                type: "LineString",
                coordinates: routeCoords
              }
            });
          }
        });

        // Add routes as GeoJSON source
        console.log(`Adding ${routeFeatures.length} route features to map`);

        if (routeFeatures.length > 0) {
          // Remove existing routes layer if it exists
          if (mapLibreMap.getLayer("routes-layer")) {
            mapLibreMap.removeLayer("routes-layer");
          }
          if (mapLibreMap.getSource("routes")) {
            mapLibreMap.removeSource("routes");
          }

          mapLibreMap.addSource("routes", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: routeFeatures
            }
          });

          // Add route layer
          mapLibreMap.addLayer({
            id: "routes-layer",
            type: "line",
            source: "routes",
            paint: {
              "line-color": ["get", "color"],
              "line-width": ["get", "width"],
              "line-opacity": 0.8
            }
          });

          console.log('Routes layer added successfully');
        } else {
          console.warn('No route features to add to map');
        }

        // Add markers for source and destination
        const markerFeatures = [];

        if (coords?.source && Array.isArray(coords.source) && coords.source.length === 2) {
          markerFeatures.push({
            type: "Feature",
            properties: {
              type: "source",
              title: "Start Point"
            },
            geometry: {
              type: "Point",
              coordinates: [coords.source[1], coords.source[0]] // [lon, lat]
            }
          });
          allCoordinates.push([coords.source[1], coords.source[0]]);
        }

        if (coords?.destination && Array.isArray(coords.destination) && coords.destination.length === 2) {
          markerFeatures.push({
            type: "Feature",
            properties: {
              type: "destination",
              title: "Destination"
            },
            geometry: {
              type: "Point",
              coordinates: [coords.destination[1], coords.destination[0]] // [lon, lat]
            }
          });
          allCoordinates.push([coords.destination[1], coords.destination[0]]);
        }

        if (markerFeatures.length > 0) {
          mapLibreMap.addSource("markers", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: markerFeatures
            }
          });

          // Add marker layer
          mapLibreMap.addLayer({
            id: "markers-layer",
            type: "circle",
            source: "markers",
            paint: {
              "circle-radius": 8,
              "circle-color": [
                "case",
                ["==", ["get", "type"], "source"],
                "#10b981", // green for source
                "#ef4444"  // red for destination
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff"
            }
          });
        }

        // Fit map to show all routes and markers
        if (allCoordinates.length > 0) {
          // Calculate bounds manually
          let minLon = allCoordinates[0][0];
          let maxLon = allCoordinates[0][0];
          let minLat = allCoordinates[0][1];
          let maxLat = allCoordinates[0][1];

          allCoordinates.forEach(coord => {
            minLon = Math.min(minLon, coord[0]);
            maxLon = Math.max(maxLon, coord[0]);
            minLat = Math.min(minLat, coord[1]);
            maxLat = Math.max(maxLat, coord[1]);
          });

          // Fit bounds using MapLibre API
          const { LngLatBounds } = await import("maplibre-gl");
          const bounds = new LngLatBounds([minLon, minLat], [maxLon, maxLat]);
          mapLibreMap.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 }
          });
        }
      } catch (error) {
        console.error("Error updating map:", error);
      }
    };

    updateMap();
  }, [isMapReady, routes, coords, selectedRoute]); // Re-run when any of these change

  if (!isClient) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-purple-900 text-gray-500 dark:text-purple-300">
        <div className="text-6xl mb-4">🗺️</div>
        <p className="text-lg font-semibold mb-2">Loading Map...</p>
        <p className="text-sm">Preparing your navigation</p>
      </div>
    );
  }

  // Always show map, even if no routes/coords

  return (
    <div className="w-full h-full relative" style={{ minHeight: "100%", height: "100%", width: "100%" }}>
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{
          minHeight: "100%",
          height: "100%",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#f3f4f6"
        }}
      />
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading map...</p>
            {!maplibregl && (
              <p className="text-gray-500 text-sm mt-2">Waiting for MapLibre GL...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapViewClient({ routes, coords, selectedRoute }) {
  return <MapContent routes={routes} coords={coords} selectedRoute={selectedRoute} />;
}
