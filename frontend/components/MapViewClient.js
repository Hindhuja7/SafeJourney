// "use client";

// import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";

// // Custom icons for source and destination
// const sourceIcon = new L.Icon({
//   iconUrl: "/marker-source.png",
//   iconSize: [30, 30],
// });
// const destIcon = new L.Icon({
//   iconUrl: "/marker-dest.png",
//   iconSize: [30, 30],
// });

// export default function MapViewClient({ routes, source, destination }) {
//   const center = [(source[0] + destination[0]) / 2, (source[1] + destination[1]) / 2];

//   const getColor = (label) =>
//     label?.includes("Safest") ? "green" : label === "Normal" ? "orange" : "red";

//   // Decode OSRM polyline to [lat, lng] array
//   const decodePolyline = (str, precision = 5) => {
//     let index = 0,
//       lat = 0,
//       lng = 0,
//       coordinates = [],
//       shift = 0,
//       result = 0,
//       byte = null;
//     const factor = 10 ** precision;

//     while (index < str.length) {
//       shift = result = 0;
//       do {
//         byte = str.charCodeAt(index++) - 63;
//         result |= (byte & 0x1f) << shift;
//         shift += 5;
//       } while (byte >= 0x20);
//       const dlat = (result & 1 ? ~(result >> 1) : result >> 1);
//       lat += dlat;

//       shift = result = 0;
//       do {
//         byte = str.charCodeAt(index++) - 63;
//         result |= (byte & 0x1f) << shift;
//         shift += 5;
//       } while (byte >= 0x20);
//       const dlng = (result & 1 ? ~(result >> 1) : result >> 1);
//       lng += dlng;

//       coordinates.push([lat / factor, lng / factor]);
//     }

//     return coordinates;
//   };

//   return (
//     <MapContainer center={center} zoom={13} className="w-2/3 h-full">
//       <TileLayer
//         attribution="© OpenStreetMap contributors"
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />

//       {/* Source and Destination markers */}
//       <Marker position={source} icon={sourceIcon} />
//       <Marker position={destination} icon={destIcon} />

//       {/* Draw all routes */}
//       {routes.map((r) => (
//         <Polyline
//           key={r.id}
//           positions={decodePolyline(r.geometry)}
//           color={getColor(r.label)}
//           weight={6}
//         />
//       ))}
//     </MapContainer>
//   );
// }



import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import polyline from "@mapbox/polyline";
import L from "leaflet";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// Fix default icon paths (CDN)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});

export default function MapViewClient({ routes, coords }) {
  const mapRef = useRef();

  // Debug logging
  useEffect(() => {
    console.log("MapViewClient - Routes:", routes?.length, "Coords:", coords);
    if (routes && routes.length > 0) {
      console.log("First route:", routes[0]);
      console.log("First route geometry:", routes[0]?.geometry);
    }
  }, [routes, coords]);

  const decode = (geom) => {
    if (!geom) {
      console.warn("MapViewClient: No geometry provided");
      return [];
    }
    try {
      const decoded = polyline.decode(geom);
      console.log(`MapViewClient: Decoded ${decoded.length} points from polyline`);
      return decoded.map(([lat, lng]) => [lat, lng]);
    } catch (e) {
      console.error("Polyline decode error:", e, "Geometry:", geom?.substring(0, 50));
      return [];
    }
  };

  // Fit map to all route points
  useEffect(() => {
    if (!mapRef.current || !routes || routes.length === 0) return;

    const allPoints = [];
    routes.forEach((r) => {
      if (r.geometry) {
        const pts = decode(r.geometry);
        pts.forEach((p) => allPoints.push(p));
      }
    });

    // Add source and destination to bounds
    if (coords?.source) allPoints.push(coords.source);
    if (coords?.destination) allPoints.push(coords.destination);

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [routes, coords]);

  if (!coords || !routes || routes.length === 0) {
    return <div className="w-full h-full flex items-center justify-center">Loading map...</div>;
  }

  const center = coords?.source || [17.385, 78.4867]; // default Hyderabad

  return (
    <MapContainer
      whenCreated={(m) => (mapRef.current = m)}
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer 
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
      />

      {/* Source Marker */}
      {coords?.source && (
        <Marker position={coords.source}>
          <Popup>Source</Popup>
        </Marker>
      )}

      {/* Destination Marker */}
      {coords?.destination && (
        <Marker position={coords.destination}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {/* Draw all route polylines */}
      {routes.map((r, i) => {
        if (!r.geometry) return null;
        const pts = decode(r.geometry);
        if (pts.length === 0) return null;
        const isSafest = i === 0; // first route is safest after sorting
        const color = isSafest ? "#2563EB" : i === 1 ? "#16A34A" : "#EF4444";
        return (
          <Polyline 
            key={r.id || i} 
            positions={pts} 
            pathOptions={{ color, weight: 6, opacity: 0.9 }} 
          />
        );
      })}

    </MapContainer>
  );
}
