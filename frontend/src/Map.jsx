/**
 * Optimized Map component with proper loading states
 */

import { useEffect, useRef, useState } from 'react';
import './Map.css';

function riskToColor(risk) {
  if (risk < 0.3) return '#10b981';
  if (risk < 0.6) return '#f59e0b';
  return '#ef4444';
}

function getRiskLevel(risk) {
  if (risk < 0.3) return { level: 'Low', color: '#10b981', emoji: '🟢' };
  if (risk < 0.6) return { level: 'Medium', color: '#f59e0b', emoji: '🟡' };
  return { level: 'High', color: '#ef4444', emoji: '🔴' };
}

export default function Map({ 
  origin, 
  destination, 
  routes, 
  safestRouteIndex, 
  selectedRouteIndex, 
  onMapClick, 
  navigationMode = false, 
  userPosition = null 
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [clickMode, setClickMode] = useState(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [mapError, setMapError] = useState(null);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const tomtomKey = import.meta.env.VITE_TOMTOM_API_KEY;
    
    if (!tomtomKey) {
      setMapError('TomTom API key not found');
      return;
    }

    if (!window.tt) {
      setMapError('TomTom Maps SDK not loaded yet');
      return;
    }

    try {
      console.log('Initializing TomTom map...');

      const map = window.tt.map({
        key: tomtomKey,
        container: mapRef.current,
        center: [78.4867, 17.3850],
        zoom: 10
      });

      mapInstanceRef.current = map;

      map.on('load', () => {
        console.log('TomTom map loaded successfully');
        setMapLoaded(true);
        setMapError(null);
      });

      map.on('styledata', () => {
        console.log('Map style loaded');
        setStyleLoaded(true);
      });

      map.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Failed to load map tiles');
      });

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

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [clickMode, onMapClick]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add origin marker
    if (origin && origin.length === 2) {
      const originMarker = new window.tt.Marker({
        color: '#3b82f6'
      }).setLngLat(origin).addTo(map);
      markersRef.current.push(originMarker);
    }

    // Add destination marker
    if (destination && destination.length === 2) {
      const destMarker = new window.tt.Marker({
        color: '#ef4444'
      }).setLngLat(destination).addTo(map);
      markersRef.current.push(destMarker);
    }

    // Fit bounds to show markers
    if (origin && destination) {
      const bounds = new window.tt.LngLatBounds()
        .extend(origin)
        .extend(destination);

      map.fitBounds(bounds, { 
        padding: 50,
        duration: 1000
      });
    }
  }, [origin, destination, mapLoaded]);

  // Draw routes - WAIT FOR STYLE TO LOAD
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !styleLoaded || !routes || routes.length === 0) {
      return;
    }

    const map = mapInstanceRef.current;
    
    const drawRoutes = () => {
      console.log(`Drawing ${routes.length} routes on map...`);

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
          console.warn('Error removing polyline:', e);
        }
      });
      polylinesRef.current = [];

      routes.forEach((route, routeIndex) => {
        const isSelected = routeIndex === selectedRouteIndex;
        const isSafest = routeIndex === safestRouteIndex;
        
        const lineWidth = isSelected ? 6 : (isSafest ? 5 : 4);
        const opacity = isSelected ? 0.9 : 0.7;

        if (route.geometry && route.geometry.points && route.geometry.points.length > 0) {
          const coordinates = route.geometry.points.map(point => {
            if (point.lon !== undefined && point.lat !== undefined) {
              return [point.lon, point.lat];
            } else if (Array.isArray(point)) {
              return [point[1], point[0]];
            }
            return null;
          }).filter(coord => coord !== null && coord.length === 2);

          if (coordinates.length < 2) return;

          const avgRisk = route.riskScore != null ? route.riskScore : 0.5;
          const color = riskToColor(avgRisk);
          const routeId = `route-${routeIndex}`;
          
          try {
            // Check if style is loaded before adding sources/layers
            if (!map.isStyleLoaded()) {
              console.log('Map style not ready, waiting...');
              return;
            }

            // Remove existing source if it exists
            if (map.getSource(routeId)) {
              map.removeSource(routeId);
            }
            
            // Add route source
            map.addSource(routeId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: coordinates
                }
              }
            });

            // Add route layer
            map.addLayer({
              id: routeId,
              type: 'line',
              source: routeId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': color,
                'line-width': lineWidth,
                'line-opacity': opacity
              }
            });

            // Store reference for cleanup
            polylinesRef.current.push({ 
              sourceId: routeId, 
              layerId: routeId 
            });

            console.log(`Route ${routeIndex} drawn successfully`);

          } catch (error) {
            console.error(`Error drawing route ${routeIndex}:`, error);
          }
        }
      });
    };

    // Use setTimeout to ensure style is fully loaded
    setTimeout(drawRoutes, 100);
  }, [routes, safestRouteIndex, selectedRouteIndex, mapLoaded, styleLoaded]);

  return (
    <div className="map-container">
      <div ref={mapRef} className="map-element" />
      
      {/* Map Loading Indicator */}
      {!mapLoaded && !mapError && (
        <div className="map-loading">
          <div className="spinner"></div>
          <span>Loading Map...</span>
        </div>
      )}

      {/* Map Error Display */}
      {mapError && (
        <div className="map-error">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <div className="error-title">Map Loading</div>
            <div className="error-message">Map is initializing...</div>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="map-controls">
        <div className="control-group">
          <div className="control-label">Click to Set:</div>
          <button
            onClick={() => setClickMode(clickMode === 'origin' ? null : 'origin')}
            className={`control-btn ${clickMode === 'origin' ? 'active' : ''}`}
          >
            {clickMode === 'origin' ? '✓ Origin' : 'Set Origin'}
          </button>
          <button
            onClick={() => setClickMode(clickMode === 'destination' ? null : 'destination')}
            className={`control-btn ${clickMode === 'destination' ? 'active' : ''}`}
          >
            {clickMode === 'destination' ? '✓ Destination' : 'Set Destination'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="map-legend">
        <h4>Safety Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color safe"></div>
            <span>Safe (Low Risk)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color medium"></div>
            <span>Medium Risk</span>
          </div>
          <div className="legend-item">
            <div className="legend-color unsafe"></div>
            <span>Unsafe (High Risk)</span>
          </div>
        </div>
      </div>
    </div>
  );
}