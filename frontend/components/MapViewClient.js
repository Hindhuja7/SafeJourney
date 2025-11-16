// components/MapViewClient.js
"use client";

import { useEffect, useRef, useState } from "react";

// Client-side only component to avoid SSR issues
function MapContent({ routes, coords, selectedRoute }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize TomTom Map
  useEffect(() => {
    if (!isClient || mapRef.current === null) return;

    const initializeTomTomMap = async () => {
      try {
        // Get API key from environment or use a default (should be set in .env.local)
        const TOMTOM_API_KEY = process.env.NEXT_PUBLIC_TOMTOM_API_KEY || "YOUR_TOMTOM_API_KEY";

        if (TOMTOM_API_KEY === "YOUR_TOMTOM_API_KEY") {
          console.warn("⚠️ TomTom API key not set. Please set NEXT_PUBLIC_TOMTOM_API_KEY in .env.local");
        }

        // Calculate center point
        let center = [78.4867, 17.3850]; // Default to Hyderabad [lon, lat]
        if (coords?.source && Array.isArray(coords.source) && coords.source.length === 2) {
          center = [coords.source[1], coords.source[0]]; // [lon, lat]
        }

        // Initialize map - TomTom SDK v0.32+ uses TomTomMap class
        // Import TomTomMap from the map module
        // Use direct path to avoid Next.js subpath export issues
        const mapModule = await import("@tomtom-org/maps-sdk/map/dist/map.es.js");
        const { TomTomMap } = mapModule;
        
        // Create TomTomMap instance
        // Constructor takes: (mapLibreOptions, tomtomParams)
        const map = new TomTomMap(
          {
            container: mapRef.current,
            center: center,
            zoom: 13
          },
          {
            key: TOMTOM_API_KEY,
            style: "standardLight" // Use standard light style
          }
        );

        mapInstanceRef.current = map;

        // Wait for map to be ready
        // TomTomMap uses mapReady property and mapLibreMap for events
        const checkMapReady = () => {
          if (map.mapReady) {
            setIsMapReady(true);
          } else {
            // Wait for style to load
            map.mapLibreMap.once("style.load", () => {
              setIsMapReady(true);
            });
          }
        };
        
        checkMapReady();

        // Cleanup function
        return () => {
          if (mapInstanceRef.current && mapInstanceRef.current.mapLibreMap) {
            mapInstanceRef.current.mapLibreMap.remove();
            mapInstanceRef.current = null;
          }
        };
      } catch (error) {
        console.error("Error initializing TomTom map:", error);
      }
    };

    initializeTomTomMap();
  }, [isClient, coords]);

  // Update map with routes and markers
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !routes || routes.length === 0) return;

    const updateMap = async () => {
      try {
        const map = mapInstanceRef.current;
        if (!map || !map.mapLibreMap) return;
        
        // Use the underlying MapLibre map for layer operations
        const mapLibreMap = map.mapLibreMap;

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
          
          // Parse geometry
          let routeCoords = [];
          if (route.geometry) {
            if (typeof route.geometry === 'string') {
              // Format: "lat,lon|lat,lon|..."
              routeCoords = route.geometry.split('|').map(point => {
                const [lat, lon] = point.split(',').map(Number);
                return [lon, lat]; // TomTom uses [lon, lat]
              });
            } else if (Array.isArray(route.geometry)) {
              routeCoords = route.geometry.map(p => [p[1] || p.lon, p[0] || p.lat]);
            }
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
        if (routeFeatures.length > 0) {
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
  }, [isMapReady, routes, coords, selectedRoute]);

  if (!isClient) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-purple-900 text-gray-500 dark:text-purple-300">
        <div className="text-6xl mb-4">🗺️</div>
        <p className="text-lg font-semibold mb-2">Loading Map...</p>
        <p className="text-sm">Preparing your navigation</p>
      </div>
    );
  }

  if (!coords || !routes || routes.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-purple-900 text-gray-500 dark:text-purple-300">
        <div className="text-6xl mb-4">🗺️</div>
        <p className="text-lg font-semibold mb-2">Ready to Navigate</p>
        <p className="text-sm">Enter source and destination to see routes</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: "400px" }} />
    </div>
  );
}

export default function MapViewClient({ routes, coords, selectedRoute }) {
  return <MapContent routes={routes} coords={coords} selectedRoute={selectedRoute} />;
}
