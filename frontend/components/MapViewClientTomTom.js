/**
 * TomTom Maps-based MapViewClient Component
 * Replaces Leaflet with TomTom Maps SDK for route visualization
 */

import { useEffect, useRef, useState } from 'react';
import polyline from '@mapbox/polyline';

export default function MapViewClientTomTom({ routes, coords, selectedRouteIndex = -1, onRouteSelect }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("MapViewClientTomTom - Routes:", routes?.length, "Coords:", coords);
    if (routes && routes.length > 0) {
      console.log("First route:", routes[0]);
      console.log("First route geometry:", routes[0]?.geometry);
    }
  }, [routes, coords]);

  // Initialize TomTom map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    
    let checkInterval;
    
    // Wait for TomTom SDK to load
    const initializeMap = () => {
      const tomtomKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY || 'jVkAR9XI8Wv46NpotYg8OE5LTlDPZOKj';
      
      if (!window.tt) {
        console.log('Waiting for TomTom SDK to load...');
        checkInterval = setInterval(() => {
          if (window.tt) {
            clearInterval(checkInterval);
            doInitializeMap();
          }
        }, 100);
        return;
      }

      doInitializeMap();
    };

    const doInitializeMap = () => {
      if (!window.tt || !mapContainerRef.current) {
        console.error('TomTom SDK not available or container missing');
        return;
      }

      const center = coords?.source ? [coords.source[1], coords.source[0]] : [78.4867, 17.385]; // [lon, lat]
      
      try {
        const map = window.tt.map({
          key: process.env.NEXT_PUBLIC_TOMTOM_API_KEY || 'jVkAR9XI8Wv46NpotYg8OE5LTlDPZOKj',
          container: mapContainerRef.current,
          center: center,
          zoom: 12
        });

        mapInstanceRef.current = map;

        map.on('load', () => {
          console.log('TomTom map loaded');
          setMapLoaded(true);
        });
      } catch (error) {
        console.error('Error initializing TomTom map:', error);
      }
    };

    initializeMap();

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null;
      }
    };
  }, [coords]);

  // Decode polyline geometry
  const decodePolyline = (geom) => {
    if (!geom) {
      console.warn("MapViewClientTomTom: No geometry provided");
      return [];
    }
    try {
      const decoded = polyline.decode(geom);
      console.log(`MapViewClientTomTom: Decoded ${decoded.length} points from polyline`);
      return decoded.map(([lat, lng]) => [lng, lat]); // Convert to [lon, lat] for TomTom
    } catch (e) {
      console.error("Polyline decode error:", e, "Geometry:", geom?.substring(0, 50));
      return [];
    }
  };

  // Convert risk score to RGB color (like tomtom branch)
  const riskToColor = (riskScore) => {
    // riskScore is 0-1, lower is safer
    // Convert to 0-1 scale where 0 = safest (green), 1 = most dangerous (red)
    const r = Math.round(255 * riskScore);
    const g = Math.round(255 * (1 - riskScore));
    return `rgb(${r},${g},0)`; // red → green gradient
  };

  // Update markers and routes when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !coords || !routes || routes.length === 0) {
      return;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clear existing polylines and event handlers
    polylinesRef.current.forEach(polyline => {
      try {
        // Remove event handlers if they exist
        if (polyline.clickHandler) {
          map.off('click', polyline.layerId, polyline.clickHandler);
        }
        if (polyline.mouseEnterHandler) {
          map.off('mouseenter', polyline.layerId, polyline.mouseEnterHandler);
        }
        if (polyline.mouseLeaveHandler) {
          map.off('mouseleave', polyline.layerId, polyline.mouseLeaveHandler);
        }
        
        // Remove layer and source
        if (map.getLayer(polyline.layerId)) {
          map.removeLayer(polyline.layerId);
        }
        if (map.getSource(polyline.sourceId)) {
          map.removeSource(polyline.sourceId);
        }
      } catch (e) {
        // Ignore errors
      }
    });
    polylinesRef.current = [];

    // Add source marker
    if (coords.source && Array.isArray(coords.source) && coords.source.length >= 2) {
      const sourcePos = [coords.source[1], coords.source[0]]; // [lon, lat]
      const sourceMarker = new window.tt.Marker({
        color: '#007bff' // Blue
      })
        .setLngLat(sourcePos)
        .addTo(map);
      markersRef.current.push(sourceMarker);
    }

    // Add destination marker
    if (coords.destination && Array.isArray(coords.destination) && coords.destination.length >= 2) {
      const destPos = [coords.destination[1], coords.destination[0]]; // [lon, lat]
      const destMarker = new window.tt.Marker({
        color: '#dc3545' // Red
      })
        .setLngLat(destPos)
        .addTo(map);
      markersRef.current.push(destMarker);
    }

    // Draw routes with risk-based coloring
    routes.forEach((route, index) => {
      if (!route.geometry) return;

      const coordinates = decodePolyline(route.geometry);
      if (coordinates.length < 2) {
        console.warn(`Route ${index} has insufficient coordinates: ${coordinates.length}`);
        return;
      }

      const isSafest = index === 0;
      const isSelected = index === selectedRouteIndex;
      
      // Use risk score for coloring if available, otherwise use index-based colors
      let color;
      if (route.riskScore !== undefined && route.riskScore !== null) {
        color = riskToColor(route.riskScore);
      } else {
        // Fallback to index-based colors
        color = isSafest ? '#2563EB' : index === 1 ? '#16A34A' : '#EF4444';
      }
      
      // Selected route is thickest, safest is medium, others are thin
      const lineWidth = isSelected ? 8 : (isSafest ? 6 : 4);
      const opacity = isSelected ? 1.0 : (isSafest ? 0.9 : 0.6);

      const sourceId = `route-${index}`;
      const layerId = `route-layer-${index}`;

      // Add route as GeoJSON source
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            routeIndex: index,
            isSelected: isSelected,
            isSafest: isSafest
          },
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });

      // Add route layer
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
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

      // Make route clickable if onRouteSelect callback is provided
      if (onRouteSelect) {
        const clickHandler = (e) => {
          e.originalEvent.stopPropagation();
          if (onRouteSelect) {
            onRouteSelect(index);
          }
        };
        
        const mouseEnterHandler = () => {
          map.getCanvas().style.cursor = 'pointer';
        };
        
        const mouseLeaveHandler = () => {
          map.getCanvas().style.cursor = '';
        };
        
        map.on('click', layerId, clickHandler);
        map.on('mouseenter', layerId, mouseEnterHandler);
        map.on('mouseleave', layerId, mouseLeaveHandler);
        
        polylinesRef.current.push({ 
          sourceId, 
          layerId, 
          routeIndex: index,
          clickHandler,
          mouseEnterHandler,
          mouseLeaveHandler
        });
      } else {
        polylinesRef.current.push({ sourceId, layerId, routeIndex: index });
      }
    });

    // Fit map to show all routes
    if (coords.source && coords.destination) {
      const allPoints = [];
      routes.forEach(route => {
        if (route.geometry) {
          const pts = decodePolyline(route.geometry);
          pts.forEach(p => allPoints.push(p));
        }
      });
      
      if (allPoints.length > 0) {
        const bounds = new window.tt.LngLatBounds();
        allPoints.forEach(point => bounds.extend(point));
        if (coords.source) bounds.extend([coords.source[1], coords.source[0]]);
        if (coords.destination) bounds.extend([coords.destination[1], coords.destination[0]]);
        map.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [mapLoaded, routes, coords, selectedRouteIndex, onRouteSelect]);

  if (!coords || !routes || routes.length === 0) {
    return <div className="w-full h-full flex items-center justify-center bg-gray-100">Loading map...</div>;
  }

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    />
  );
}

