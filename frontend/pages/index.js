import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import the map to avoid "window not defined" error
const SafeJourneyMap = dynamic(() => import("../components/SafeJourneyMap"), {
  ssr: false,
});

export default function Home() {
  const [routes, setRoutes] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch routes data from backend API
    fetch("http://localhost:5000/api/routes")
      .then((res) => res.json())
      .then((data) => {
        setRoutes(data.routes);
        setMessage(data.message);
      })
      .catch((err) => {
        console.error("Error fetching routes:", err);
        setMessage("⚠️ Unable to fetch route data (backend might be off)");
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f0ff] to-[#ffffff] flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-purple-800 mb-2">
        SafeJourney 🚶‍♀️
      </h1>
      <p className="text-purple-600 mb-4">{message}</p>

      {/* Map */}
      <div className="w-full h-[500px] rounded-2xl shadow-xl overflow-hidden mb-6">
        <SafeJourneyMap />
      </div>

      {/* Route Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
        {routes.map((route) => (
          <div
            key={route.routeId}
            className="bg-white/60 backdrop-blur-lg rounded-2xl shadow-md border border-purple-100 p-4 text-center"
          >
            <h2
              className={`text-lg font-semibold mb-1 ${
                route.safetyScore >= 8
                  ? "text-green-600"
                  : route.safetyScore >= 6
                  ? "text-orange-500"
                  : "text-red-500"
              }`}
            >
              {route.name}
            </h2>
            <p className="text-sm text-gray-700">
              <strong>Safety Score:</strong> {route.safetyScore}/10
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Reason:</strong> {route.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
