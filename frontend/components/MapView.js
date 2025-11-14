import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import polyline from "@mapbox/polyline";

export default function MapView({ routes }) {
  const decodePolyline = (str) => polyline.decode(str);

  const getColor = (label) => {
    if (label === "Safest (Recommended)") return "green";
    if (label === "Normal") return "orange";
    return "red";
  };

  // Center map at first route's start
  const center = routes[0] ? [routes[0].geometry && decodePolyline(routes[0].geometry)[0][0], routes[0].geometry && decodePolyline(routes[0].geometry)[0][1]] : [17.4239, 78.4865];

  return (
    <MapContainer center={center} zoom={13} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {routes.map((route) => {
        const positions = decodePolyline(route.geometry).map(([lat, lng]) => [lat, lng]);
        return <Polyline key={route.id} positions={positions} color={getColor(route.label)} weight={5} />;
      })}
    </MapContainer>
  );
}
