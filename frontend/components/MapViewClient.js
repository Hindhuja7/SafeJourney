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

  const decode = (geom) => {
    try {
      return polyline.decode(geom).map(([lat, lng]) => [lat, lng]);
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    if (!mapRef.current || !routes || routes.length === 0) return;
    // collect all points to fit bounds
    const all = [];
    routes.forEach((r) => {
      const pts = decode(r.geometry);
      pts.forEach((p) => all.push(p));
    });
    if (all.length) {
      const bounds = L.latLngBounds(all);
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [routes]);

  const center = coords && coords.source ? coords.source : [17.385, 78.4867];
  const colors = ["#2563EB", "#16A34A", "#EF4444"];

  return (
    <MapContainer whenCreated={(m) => (mapRef.current = m)} center={center} zoom={13} style={{ height: "520px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* markers */}
      {coords?.source && (
        <Marker position={coords.source}>
          <Popup>Source</Popup>
        </Marker>
      )}
      {coords?.destination && (
        <Marker position={coords.destination}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {routes.map((r, i) => {
        const pts = decode(r.geometry);
        const color = colors[i % colors.length];
        return <Polyline key={i} positions={pts} pathOptions={{ color, weight: 6, opacity: 0.9 }} />;
      })}
    </MapContainer>
  );
}
