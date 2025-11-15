// "use client";

// import { useState } from "react";
// import axios from "axios";
// import dynamic from "next/dynamic";
// import RouteInfoCard from "../components/RouteInfoCard";

// // Dynamic import to fix "window is not defined"
// const MapView = dynamic(() => import("../components/MapViewClient"), { ssr: false });

// export default function Home() {
//   const [routes, setRoutes] = useState([]);
//   const [source] = useState([17.385, 78.4867]); // Hyderabad example
//   const [destination] = useState([17.45, 78.45]);

//   const fetchRoutes = async () => {
//     try {
//       const res = await axios.post("http://localhost:5000/api/routes", { source, destination });

//       // Sort routes by score descending
//       const sorted = [...res.data.routes].sort((a, b) => b.score - a.score);

//       // Assign labels and scoring method
//       const labeled = sorted.slice(0, 3).map((r, i) => {
//         let label = "";
//         if (i === 0) label = "Safest (Recommended)";
//         else if (i === 1) label = "Normal";
//         else label = "Unsafe";

//         return { ...r, label, scoringMethod: r.scoringMethod || "Fallback" };
//       });

//       setRoutes(labeled);
//     } catch (err) {
//       console.error(err.message);
//     }
//   };

//   return (
//     <div className="flex flex-col h-screen">
//       <h1 className="text-2xl font-bold text-center mt-4">
//         🚦 SafeJourney — Route Safety Map
//       </h1>

//       <button
//         onClick={fetchRoutes}
//         className="bg-purple-600 text-white px-4 py-2 rounded-lg m-4 self-center"
//       >
//         Fetch & Score Routes
//       </button>

//       <div className="flex flex-1">
//         <MapView routes={routes} source={source} destination={destination} />

//         <div className="w-1/3 overflow-y-auto p-4 relative">
//           {routes.map((r) => (
//             <div key={r.id} className="bg-white shadow-lg rounded-2xl p-4 mb-4">
//               <h2 className="text-lg font-semibold">{r.label}</h2>
//               <p><b>Name:</b> {r.name}</p>
//               <p><b>Distance:</b> {r.distance_km} km</p>
//               <p><b>Duration:</b> {r.duration_min} min</p>
//               <p><b>AI Score:</b> {r.score}</p>
//               <p><b>Reason:</b> {r.reason}</p>
//               <p><b>Scoring Method:</b> {r.scoringMethod}</p>
//             </div>
//           ))}

//           {/* Legend */}
//           <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow-lg">
//             <div><span className="inline-block w-4 h-4 bg-green-500 mr-2"></span> Safest</div>
//             <div><span className="inline-block w-4 h-4 bg-orange-500 mr-2"></span> Normal</div>
//             <div><span className="inline-block w-4 h-4 bg-red-500 mr-2"></span> Unsafe</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }






import { useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import RouteInfoCard from "../components/RouteInfoCard";

// Dynamic wrapper for client-only Leaflet component
const MapView = dynamic(() => import("../components/MapView"), { ssr: false });

export default function Home() {
  const [srcAddr, setSrcAddr] = useState("");
  const [dstAddr, setDstAddr] = useState("");
  const [routes, setRoutes] = useState([]);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRoutes = async () => {
    if (!srcAddr.trim() || !dstAddr.trim()) {
      alert("Please enter both source and destination addresses.");
      return;
    }
    setLoading(true);
    setRoutes([]);
    setCoords(null);

    try {
      const res = await axios.post("http://localhost:5000/api/routes", {
        sourceAddress: srcAddr.trim(),
        destinationAddress: dstAddr.trim()
      });

      setCoords(res.data.coords || null);
      setRoutes(res.data.routes || []);
    } catch (err) {
      console.error("Fetch error:", err?.response?.data || err.message);
      alert("Failed to fetch routes. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#f4f0ff] to-[#ffffff]">
      <h1 className="text-3xl font-bold text-center text-purple-800 mb-6">SafeJourney</h1>

      <div className="max-w-3xl mx-auto bg-white p-4 rounded-2xl shadow mb-6">
        <input
          value={srcAddr}
          onChange={(e) => setSrcAddr(e.target.value)}
          placeholder="Source address (e.g., Miyapur, Hyderabad)"
          className="w-full p-3 mb-3 border rounded"
        />
        <input
          value={dstAddr}
          onChange={(e) => setDstAddr(e.target.value)}
          placeholder="Destination address (e.g., LB Nagar, Hyderabad)"
          className="w-full p-3 mb-3 border rounded"
        />
        <button
          onClick={fetchRoutes}
          className="w-full bg-purple-600 text-white p-3 rounded-lg"
          disabled={loading}
        >
          {loading ? "Finding routes..." : "Find Routes"}
        </button>
      </div>

      {/* Map */}
      {routes.length > 0 && coords && (
        <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden shadow mb-6">
          <MapView routes={routes} coords={coords} />
        </div>
      )}

      {/* Route cards (shows distance/duration/score/reason/method) */}
      {routes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
  {routes.map((route, idx) => (
    <RouteInfoCard key={idx} route={route} index={idx} />
  ))}
</div>

      )}
    </div>
  );
}
