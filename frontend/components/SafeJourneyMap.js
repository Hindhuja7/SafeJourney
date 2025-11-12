import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function SafeJourneyMap() {
  const center = [17.385, 78.4867]; // Hyderabad

  // --- Static route data (mock backend response) ---
  const routes = [
    {
      id: "safest",
      name: "Main Corridor (Safest)",
      color: "green",
      score: 9.1,
      reason: "Well-lit, crowded, fewer crime reports",
      coords: [
        [17.348, 78.557],
        [17.365, 78.535],
        [17.377, 78.52],
        [17.385, 78.505],
        [17.392, 78.49],
        [17.399, 78.475],
        [17.408, 78.46],
        [17.42, 78.44],
        [17.435, 78.42],
        [17.447, 78.386],
      ],
    },
    {
      id: "normal",
      name: "Inner Ring Road (Normal)",
      color: "orange",
      score: 6.8,
      reason: "Moderate lighting, few isolated zones",
      coords: [
        [17.348, 78.557],
        [17.358, 78.54],
        [17.37, 78.515],
        [17.387, 78.498],
        [17.403, 78.478],
        [17.419, 78.455],
        [17.447, 78.386],
      ],
    },
    {
      id: "worst",
      name: "Outer Bypass (Unsafe)",
      color: "red",
      score: 4.3,
      reason: "Poor lighting, isolated, past incidents",
      coords: [
        [17.348, 78.557],
        [17.36, 78.55],
        [17.38, 78.53],
        [17.4, 78.5],
        [17.43, 78.43],
        [17.447, 78.386],
      ],
    },
  ];

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
      />

      {routes.map((route) => (
        <Polyline key={route.id} positions={route.coords} color={route.color}>
          <Popup>
            <b>{route.name}</b>
            <br />
            Safety Score: {route.score}/10
            <br />
            Reason: {route.reason}
          </Popup>
        </Polyline>
      ))}

      <Marker position={center}>
        <Popup>City Center - Hyderabad</Popup>
      </Marker>
    </MapContainer>
  );
}
