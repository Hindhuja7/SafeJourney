import dynamic from "next/dynamic";
// Use TomTom-based map instead of Leaflet
const MapViewClient = dynamic(() => import("./MapViewClientTomTom"), { ssr: false });

// Wrapper component to pass props through
export default function MapView({ routes, coords, selectedRouteIndex, onRouteSelect }) {
  return (
    <MapViewClient 
      routes={routes} 
      coords={coords}
      selectedRouteIndex={selectedRouteIndex}
      onRouteSelect={onRouteSelect}
    />
  );
}
