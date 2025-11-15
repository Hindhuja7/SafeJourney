import dynamic from "next/dynamic";

// Dynamically import MapViewClient with no SSR
const MapViewClient = dynamic(() => import("./MapViewClient"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 text-gray-500">
      <div className="text-6xl mb-4">🗺️</div>
      <p className="text-lg font-semibold mb-2">Loading Map...</p>
      <p className="text-sm">Preparing your navigation</p>
    </div>
  )
});

export default MapViewClient;