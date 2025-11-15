/**
 * Map component using TomTom Maps SDK
 * Displays routes with color-coded segments based on safety scores
 */

import { useEffect, useRef, useState } from 'react';

// TomTom Maps SDK is loaded via CDN in index.html
// Access via window.tt

/**
 * Convert risk score to RGB color
 * @param {number} risk - Risk score (0-1)
 * @returns {string} RGB color string
 */
function riskToColor(risk) {
  const r = Math.round(255 * risk);
  const g = Math.round(255 * (1 - risk));
  return `rgb(${r},${g},0)`; // red → green
}

export default function Map({ origin, destination, routes, safestRouteIndex, selectedRouteIndex, onMapClick, navigationMode = false, userPosition = null }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const userPositionMarkerRef = useRef(null);
  const originMarkerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [clickMode, setClickMode] = useState(null); // 'origin' or 'destination'

  useEffect(() => {
    // Initialize TomTom map
    if (!window.tt || mapInstanceRef.current) return;

    const tomtomKey = import.meta.env.VITE_TOMTOM_API_KEY || 'YOUR_KEY';
    
    // Initialize map - TomTom SDK v6
    const map = window.tt.map({
      key: tomtomKey,
      container: mapRef.current,
      center: origin || [0, 0],
      zoom: 12
    });

    mapInstanceRef.current = map;

    map.on('load', () => {
      setMapLoaded(true);
      // Style is loaded when map is loaded
      setStyleLoaded(true);
    });
    
    // Also listen for style load event (if available)
    if (map.on) {
      map.on('style.load', () => {
        setStyleLoaded(true);
      });
      
      // Check if style is already loaded (if method exists)
      if (typeof map.isStyleLoaded === 'function' && map.isStyleLoaded()) {
        setStyleLoaded(true);
      }
    }

    // Add click handler for map
    const handleMapClick = (e) => {
      if (clickMode && onMapClick) {
        const coords = {
          lat: e.lngLat.lat,
          lon: e.lngLat.lng
        };
        onMapClick(coords, clickMode);
        setClickMode(null);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off('click', handleMapClick);
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [clickMode, onMapClick]);

  // Update map when origin/destination changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const map = mapInstanceRef.current;

    // Clear existing markers (except user position and origin in navigation mode)
    if (!navigationMode) {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      originMarkerRef.current = null;
    } else {
      // In navigation mode, only remove destination marker, keep origin and user position
      markersRef.current = markersRef.current.filter(m => 
        m !== userPositionMarkerRef.current && m !== originMarkerRef.current
      );
      markersRef.current.forEach(marker => {
        if (marker !== userPositionMarkerRef.current && marker !== originMarkerRef.current) {
          marker.remove();
        }
      });
      markersRef.current = markersRef.current.filter(m => 
        m === userPositionMarkerRef.current || m === originMarkerRef.current
      );
    }

    // Add or update origin marker (always show, but use different color in navigation mode)
    if (origin && origin.length === 2 && origin[0] != null && origin[1] != null) {
      // In navigation mode, only update if the position actually changed significantly (not just reference)
      if (navigationMode && originMarkerRef.current) {
        try {
          const currentPos = originMarkerRef.current.getLngLat();
          const newPos = { lng: origin[0], lat: origin[1] };
          // Check if position actually changed (within 10 meter tolerance for navigation mode)
          const latDiff = Math.abs(currentPos.lat - newPos.lat);
          const lngDiff = Math.abs(currentPos.lng - newPos.lng);
          // Rough distance check (1 degree ≈ 111km, so 0.0001 ≈ 11m)
          if (latDiff < 0.0001 && lngDiff < 0.0001) {
            // Position hasn't changed significantly, don't update marker
            console.log('Origin marker position unchanged, skipping update');
            return;
          } else {
            console.log('Origin marker position changed significantly, updating:', {
              old: { lat: currentPos.lat, lng: currentPos.lng },
              new: { lat: newPos.lat, lng: newPos.lng },
              diff: { lat: latDiff, lng: lngDiff }
            });
          }
        } catch (e) {
          // If getLngLat fails, continue to update marker
          console.warn('Error checking origin marker position:', e);
        }
      }
      
      // Remove old origin marker if it exists
      if (originMarkerRef.current) {
        originMarkerRef.current.remove();
        markersRef.current = markersRef.current.filter(m => m !== originMarkerRef.current);
      }
      
      console.log('Creating origin marker at:', origin, 'color:', navigationMode ? 'green' : 'blue');
      const originMarker = new window.tt.Marker({
        color: navigationMode ? '#28a745' : '#007bff' // Green in navigation mode, blue otherwise
      })
        .setLngLat(origin)
        .addTo(map);
      originMarkerRef.current = originMarker;
      markersRef.current.push(originMarker);
    } else {
      console.warn('Origin is invalid or missing:', origin);
    }

    // Add destination marker
    if (destination) {
      const destMarker = new window.tt.Marker({
        color: '#dc3545' // Red for destination
      })
        .setLngLat(destination)
        .addTo(map);
      markersRef.current.push(destMarker);
    }

    // Fit map to show both markers (only if not in navigation mode)
    if (origin && destination && !navigationMode) {
      const bounds = new window.tt.LngLatBounds()
        .extend(origin)
        .extend(destination);
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [origin, destination, mapLoaded, navigationMode]);

  // Update user position marker in navigation mode
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !navigationMode || !userPosition) return;

    const map = mapInstanceRef.current;

    // Remove old user position marker (but keep origin marker)
    if (userPositionMarkerRef.current) {
      userPositionMarkerRef.current.remove();
      markersRef.current = markersRef.current.filter(m => m !== userPositionMarkerRef.current);
    }

    // Add new user position marker (blue, larger)
    const userMarker = new window.tt.Marker({
      color: '#007bff',
      scale: 1.2
    })
      .setLngLat(userPosition)
      .addTo(map);

    userPositionMarkerRef.current = userMarker;
    markersRef.current.push(userMarker);

    // Center map on user position in navigation mode (but origin marker stays at original location)
    map.setCenter(userPosition);
    map.setZoom(16); // Closer zoom for navigation

    // Rotate map based on heading if available
    // (This would require heading data from GPS)
  }, [userPosition, mapLoaded, navigationMode]);

  // Draw routes when routes data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !styleLoaded || !routes || routes.length === 0) {
      // Only log once per render cycle to reduce console spam
      if (!routes || routes.length === 0) {
        return;
      }
      return;
    }

    const map = mapInstanceRef.current;
    
    // Check if map is ready (TomTom SDK might not have isStyleLoaded)
    // If the map loaded event fired, we should be good to go
    if (!mapLoaded) {
      console.warn('Map not loaded yet, waiting...');
      return;
    }

    console.log(`Drawing ${routes.length} routes on map...`);

    // Small delay to ensure map is fully ready
    const drawRoutes = () => {
      // Clear existing polylines
      polylinesRef.current.forEach(polyline => {
        try {
          if (map.getLayer(polyline.layerId)) {
            map.removeLayer(polyline.layerId);
          }
          if (map.getSource(polyline.sourceId)) {
            map.removeSource(polyline.sourceId);
          }
        } catch (e) {
          // Ignore errors when removing
        }
      });
      polylinesRef.current = [];

      // Draw each route
      let routesDrawn = 0;
      routes.forEach((route, routeIndex) => {
      console.log(`Processing route ${routeIndex}:`, {
        hasSegments: !!route.segments,
        segmentCount: route.segments?.length || 0,
        hasGeometry: !!route.geometry,
        hasPoints: !!route.geometry?.points,
        pointCount: route.geometry?.points?.length || 0,
        riskScore: route.riskScore
      });
      const isSafest = routeIndex === safestRouteIndex;
      const isSelected = routeIndex === selectedRouteIndex;
      // Selected route is thickest, safest is medium, others are thin
      const lineWidth = isSelected ? 8 : (isSafest ? 5 : 3);
      const opacity = isSelected ? 1.0 : (isSafest ? 0.9 : 0.6);

      // Try to draw using full geometry first (more reliable)
      if (route.geometry && route.geometry.points && route.geometry.points.length > 0) {
        console.log(`Drawing route ${routeIndex} using geometry points (${route.geometry.points.length} points)`);
        
        // Convert points to coordinates array [lon, lat]
        const coordinates = route.geometry.points.map(p => {
          // Handle both {lat, lon} and [lat, lon] formats
          if (typeof p === 'object' && p.lon !== undefined && p.lat !== undefined) {
            const lon = typeof p.lon === 'number' && !isNaN(p.lon) ? p.lon : null;
            const lat = typeof p.lat === 'number' && !isNaN(p.lat) ? p.lat : null;
            if (lon !== null && lat !== null) {
              return [lon, lat];
            }
          } else if (Array.isArray(p) && p.length >= 2) {
            // If array, assume [lat, lon] and convert to [lon, lat]
            const lat = typeof p[0] === 'number' && !isNaN(p[0]) ? p[0] : null;
            const lon = typeof p[1] === 'number' && !isNaN(p[1]) ? p[1] : null;
            if (lon !== null && lat !== null) {
              return [lon, lat];
            }
          }
          return null;
        }).filter(c => c !== null && Array.isArray(c) && c.length === 2 && 
                      typeof c[0] === 'number' && !isNaN(c[0]) && 
                      typeof c[1] === 'number' && !isNaN(c[1]));
        
        if (coordinates.length < 2) {
          console.warn(`Route ${routeIndex} has insufficient coordinates: ${coordinates.length}`);
          return;
        }
        
        const avgRisk = route.riskScore != null && !isNaN(route.riskScore) ? route.riskScore : 0.5;
        const color = riskToColor(avgRisk);
        const routeId = `route-${routeIndex}-full`;
        
        // Ensure lineWidth and opacity are valid numbers
        const validLineWidth = (lineWidth != null && !isNaN(lineWidth) && lineWidth > 0) ? lineWidth : 3;
        const validOpacity = (opacity != null && !isNaN(opacity) && opacity >= 0 && opacity <= 1) ? opacity : 0.8;

        const routeGeoJson = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        };

        try {
          // Remove existing layer and source if they exist
          if (map.getLayer(routeId)) {
            map.removeLayer(routeId);
          }
          if (map.getSource(routeId)) {
            map.removeSource(routeId);
          }
          
          // Add new source and layer
          map.addSource(routeId, {
            type: 'geojson',
            data: routeGeoJson
          });

          map.addLayer({
            id: routeId,
            type: 'line',
            source: routeId,
            paint: {
              'line-color': color,
              'line-width': validLineWidth,
              'line-opacity': validOpacity
            }
          });

          polylinesRef.current.push({ sourceId: routeId, layerId: routeId });
          console.log(`Route ${routeIndex} drawn successfully with ${coordinates.length} points`);
          routesDrawn++;
        } catch (error) {
          console.error(`Error adding route ${routeIndex}:`, error);
        }
      } else if (route.segments && route.segments.length > 0) {
        // Fallback: draw segments individually
        console.log(`Drawing ${route.segments.length} segments for route ${routeIndex} (fallback)`);
        let validSegments = 0;
        
        // Collect all segment coordinates first
        const allCoordinates = [];
        route.segments.forEach((segment, segIndex) => {
          // Validate segment data
          if (!segment || !segment.start || !segment.end || 
              segment.start.lat == null || segment.start.lon == null ||
              segment.end.lat == null || segment.end.lon == null) {
            return;
          }
          
          validSegments++;
          // Add start point (avoid duplicates)
          if (allCoordinates.length === 0 || 
              allCoordinates[allCoordinates.length - 1][0] !== segment.start.lon ||
              allCoordinates[allCoordinates.length - 1][1] !== segment.start.lat) {
            allCoordinates.push([segment.start.lon, segment.start.lat]);
          }
          // Add end point
          allCoordinates.push([segment.end.lon, segment.end.lat]);
        });
        
        if (allCoordinates.length < 2) {
          console.warn(`Route ${routeIndex} has insufficient segment coordinates`);
          return;
        }
        
        // Draw as single line with average risk
        const avgRisk = route.riskScore != null && !isNaN(route.riskScore) ? route.riskScore : 0.5;
        const color = riskToColor(avgRisk);
        const routeId = `route-${routeIndex}-segments`;
        
        // Ensure lineWidth and opacity are valid numbers
        const validLineWidth = (lineWidth != null && !isNaN(lineWidth) && lineWidth > 0) ? lineWidth : 3;
        const validOpacity = (opacity != null && !isNaN(opacity) && opacity >= 0 && opacity <= 1) ? opacity : 0.8;

        const routeGeoJson = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: allCoordinates
          }
        };

        try {
          // Remove existing layer and source if they exist
          if (map.getLayer(routeId)) {
            map.removeLayer(routeId);
          }
          if (map.getSource(routeId)) {
            map.removeSource(routeId);
          }
          
          // Add new source and layer
          map.addSource(routeId, {
            type: 'geojson',
            data: routeGeoJson
          });

          map.addLayer({
            id: routeId,
            type: 'line',
            source: routeId,
            paint: {
              'line-color': color,
              'line-width': validLineWidth,
              'line-opacity': validOpacity
            }
          });

          polylinesRef.current.push({ sourceId: routeId, layerId: routeId });
          console.log(`Route ${routeIndex} drawn from ${validSegments} segments`);
          routesDrawn++;
        } catch (error) {
          console.error(`Error adding route ${routeIndex} from segments:`, error);
        }
      } else {
        console.warn(`Route ${routeIndex} has no segments or geometry points - cannot draw`);
      }
    });
    
      console.log(`Finished drawing routes. Routes drawn: ${routesDrawn}/${routes.length}, Total polylines: ${polylinesRef.current.length}`);
      
      // Fit map to show all routes if we have origin/destination
      if (origin && destination && routes.length > 0) {
        try {
          const bounds = new window.tt.LngLatBounds()
            .extend(origin)
            .extend(destination);
          
          // Extend bounds to include route points
          routes.forEach(route => {
            if (route.geometry && route.geometry.points) {
              route.geometry.points.forEach(point => {
                if (point.lon && point.lat) {
                  bounds.extend([point.lon, point.lat]);
                }
              });
            }
          });
          
          map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
        } catch (e) {
          console.warn('Error fitting bounds:', e);
        }
      }
    };
    
    // Wait a bit for map to be fully ready
    setTimeout(drawRoutes, 100);
  }, [routes, safestRouteIndex, selectedRouteIndex, mapLoaded, styleLoaded, origin, destination]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Map Click Mode Buttons */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Click to Set:</div>
        <button
          onClick={() => setClickMode(clickMode === 'origin' ? null : 'origin')}
          style={{
            padding: '6px 12px',
            backgroundColor: clickMode === 'origin' ? '#007bff' : '#f0f0f0',
            color: clickMode === 'origin' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {clickMode === 'origin' ? '✓ Origin' : 'Set Origin'}
        </button>
        <button
          onClick={() => setClickMode(clickMode === 'destination' ? null : 'destination')}
          style={{
            padding: '6px 12px',
            backgroundColor: clickMode === 'destination' ? '#007bff' : '#f0f0f0',
            color: clickMode === 'destination' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {clickMode === 'destination' ? '✓ Destination' : 'Set Destination'}
        </button>
        {clickMode && (
          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', textAlign: 'center' }}>
            Click on map
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>Safety Legend</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '4px',
              backgroundColor: riskToColor(0.2),
              borderRadius: '2px'
            }}></div>
            <span style={{ fontSize: '12px' }}>Safe (Low Risk)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '4px',
              backgroundColor: riskToColor(0.5),
              borderRadius: '2px'
            }}></div>
            <span style={{ fontSize: '12px' }}>Medium Risk</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px',
              height: '4px',
              backgroundColor: riskToColor(0.8),
              borderRadius: '2px'
            }}></div>
            <span style={{ fontSize: '12px' }}>Unsafe (High Risk)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

