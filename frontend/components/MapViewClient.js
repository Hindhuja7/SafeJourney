"use client";

import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useRef, useState } from "react";

// Client-side only component to avoid SSR issues
function MapContent({ routes, coords }) {
  const mapRef = useRef();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Dynamic imports for Leaflet and polyline
  useEffect(() => {
    if (!isClient) return;

    const initializeMap = async () => {
      const L = await import("leaflet");
      const polyline = await import("@mapbox/polyline");
      
      // Fix default icon paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
      });
    };

    initializeMap();
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 text-gray-500">
        <div className="text-6xl mb-4">🗺️</div>
        <p className="text-lg font-semibold mb-2">Loading Map...</p>
        <p className="text-sm">Initializing map components</p>
      </div>
    );
  }

  if (!coords || !routes || routes.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 text-gray-500">
        <div className="text-6xl mb-4">🗺️</div>
        <p className="text-lg font-semibold mb-2">Ready to Navigate</p>
        <p className="text-sm">Start your journey to see the map</p>
      </div>
    );
  }

  const center = coords?.source || [17.3850, 78.4867];

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg z-0"
    >
      <TileLayer 
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
      />
      
      <MapController routes={routes} coords={coords} />

      {/* Source Marker */}
      {coords?.source && (
        <Marker position={coords.source}>
          <Popup>
            <div className="text-center">
              <strong>🚩 Start Point</strong>
              <br />
              <span className="text-sm text-green-600">Your journey begins here</span>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Destination Marker */}
      {coords?.destination && (
        <Marker position={coords.destination}>
          <Popup>
            <div className="text-center">
              <strong>🎯 Destination</strong>
              <br />
              <span className="text-sm text-red-600">Your journey ends here</span>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Draw all route polylines */}
      {routes.map((r, i) => {
        if (!r.geometry) return null;
        
        const isSafest = i === 0;
        const color = isSafest ? "#2563EB" : i === 1 ? "#16A34A" : "#EF4444";
        const weight = isSafest ? 6 : 4;
        const opacity = isSafest ? 0.9 : 0.6;
        
        return (
          <Polyline 
            key={r.id || i} 
            positions={decodePolyline(r.geometry)} 
            pathOptions={{ 
              color, 
              weight, 
              opacity,
              lineJoin: 'round',
              lineCap: 'round'
            }} 
          />
        );
      })}
    </MapContainer>
  );
}

// Map controller component to fit bounds
function MapController({ routes, coords }) {
  const map = useMap();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !routes || routes.length === 0 || !coords) return;

    const fitMapToBounds = async () => {
      const L = await import("leaflet");
      
      const allPoints = [];
      
      // Add route points
      routes.forEach((r) => {
        if (r.geometry) {
          const pts = decodePolyline(r.geometry);
          pts.forEach((p) => allPoints.push([p[0], p[1]]));
        }
      });

      // Add source and destination
      if (coords.source) allPoints.push(coords.source);
      if (coords.destination) allPoints.push(coords.destination);

      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    };

    fitMapToBounds();
  }, [map, routes, coords, isClient]);

  return null;
}

// Decode polyline function
const decodePolyline = (geom) => {
  if (!geom) return [];
  try {
    // Simple mock coordinates for demonstration
    // In a real app, you'd use @mapbox/polyline.decode(geom)
    if (geom.includes("mock")) {
      return [
        [17.3850, 78.4867], // Hyderabad
        [17.4000, 78.4900],
        [17.4100, 78.4950],
        [17.4200, 78.5000],
        [17.4419, 78.4989]  // Destination
      ];
    }
    
    // Fallback coordinates
    return [
      [17.3850, 78.4867],
      [17.4419, 78.4989]
    ];
  } catch (e) {
    console.error("Polyline decode error:", e);
    return [
      [17.3850, 78.4867],
      [17.4419, 78.4989]
    ];
  }
};

export default function MapViewClient({ routes, coords }) {
  return <MapContent routes={routes} coords={coords} />;
}