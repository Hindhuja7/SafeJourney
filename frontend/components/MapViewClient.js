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



import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapViewClient({ routes }) {
  // Map label to color
  const labelColors = {
    "Safest (Recommended)": "#4ade80", // Green
    Normal: "#facc15",                 // Yellow
    Unsafe: "#f87171",                 // Red
  };

  return (
    <MapContainer
      center={[17.4239, 78.4865]}
      zoom={13}
      scrollWheelZoom={true}
      className="w-full h-full rounded-3xl shadow-xl"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={decodePolyline(route.geometry)}
          pathOptions={{
            color: labelColors[route.label] || '#3b82f6',
            weight: 5,
          }}
        />
      ))}
    </MapContainer>
  );
}

// Decode polyline to [lat,lng]
function decodePolyline(str) {
  const points = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < str.length) {
    let b, shift = 0, result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1 ? ~(result >> 1) : result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1 ? ~(result >> 1) : result >> 1);
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}
