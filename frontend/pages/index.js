import { useState, useEffect } from "react";
import axios from "axios";
import RouteInfoCard from "../components/RouteInfoCard";
import MapView from "../components/MapView";
import LiveLocationShare from "../components/LiveLocationShare";
import Login from "../components/Login";
import { API_ENDPOINTS } from "../config/api";

export default function Home() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [srcAddr, setSrcAddr] = useState("");
  const [dstAddr, setDstAddr] = useState("");
  const [routes, setRoutes] = useState([]);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      // Verify token
      axios.get(`${API_ENDPOINTS.auth}/verify`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      }).then(res => {
        setUser(res.data.user);
        setToken(storedToken);
      }).catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });
    }
  }, []);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await axios.post(`${API_ENDPOINTS.auth}/logout`, { token });
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    setRoutes([]);
    setSelectedRoute(null);
    setSrcAddr("");
    setDstAddr("");
  };

  const fetchRoutes = async () => {
    if (!srcAddr.trim() || !dstAddr.trim()) {
      alert("Please enter both source and destination addresses.");
      return;
    }
    setLoading(true);
    setRoutes([]);
    setCoords(null);

    try {
      const res = await axios.post(API_ENDPOINTS.routes, {
        sourceAddress: srcAddr.trim(),
        destinationAddress: dstAddr.trim()
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setCoords(res.data.coords || null);
      const fetchedRoutes = res.data.routes || [];
      setRoutes(fetchedRoutes);
      
      // Default to safest route (first one after sorting)
      if (fetchedRoutes.length > 0) {
        const safestRoute = fetchedRoutes[0];
        setSelectedRoute(safestRoute);
        window.currentRouteUsed = safestRoute;
      } else {
        setSelectedRoute(null);
      }
      
      window.currentSourceAddress = srcAddr.trim();
      window.currentDestinationAddress = dstAddr.trim();

      // Store route data in backend for logged-in users
      if (user && token) {
        try {
          await axios.post(`${API_ENDPOINTS.routes}/store`, {
            userId: user.id,
            sourceAddress: srcAddr.trim(),
            destinationAddress: dstAddr.trim(),
            selectedRoute: fetchedRoutes[0] || null,
            timestamp: new Date().toISOString()
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (err) {
          console.error("Error storing route data:", err);
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
      const errorMessage = err?.response?.data?.error || err?.message || "Unknown error";
      alert(`Failed to fetch routes: ${errorMessage}\n\nMake sure backend is running`);
    } finally {
      setLoading(false);
    }
  };

  // Show login page if not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#f4f0ff] to-[#ffffff]">
      {/* Header with Logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-purple-800">🛡️ SafeJourney</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-700">Welcome, {user.name}!</span>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Source and Destination Input - TOP */}
      <div className="max-w-3xl mx-auto bg-white p-4 rounded-2xl shadow mb-6">
        <h2 className="text-xl font-semibold text-purple-800 mb-4">📍 Find Safe Routes</h2>
        <input
          value={srcAddr}
          onChange={(e) => setSrcAddr(e.target.value)}
          placeholder="Source address (e.g., Miyapur, Hyderabad)"
          className="w-full p-3 mb-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          value={dstAddr}
          onChange={(e) => setDstAddr(e.target.value)}
          placeholder="Destination address (e.g., LB Nagar, Hyderabad)"
          className="w-full p-3 mb-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={fetchRoutes}
          className="w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Finding routes..." : "Find Routes"}
        </button>
      </div>

      {/* Route Cards - Below Input with Color Highlighting */}
      {routes.length > 0 && (
        <div className="max-w-6xl mx-auto mb-6">
          <h2 className="text-2xl font-bold text-center text-purple-800 mb-4">
            Available Routes ({routes.length})
          </h2>
          
          {/* Route Selection Message */}
          {selectedRoute && (
            <div className={`p-4 rounded-lg border-2 mb-4 ${
              selectedRoute.label === "Safest (Recommended)" 
                ? "bg-green-50 border-green-300 text-green-800"
                : selectedRoute.label === "Moderate"
                ? "bg-yellow-50 border-yellow-300 text-yellow-800"
                : "bg-red-50 border-red-300 text-red-800"
            }`}>
              <p className="font-semibold text-lg">
                {selectedRoute.label === "Safest (Recommended)" 
                  ? "✓ Safest route selected (Default)"
                  : `✓ ${selectedRoute.label} route selected`}
              </p>
              <p className="text-sm mt-1 opacity-90">
                {selectedRoute.label === "Safest (Recommended)" 
                  ? "The safest route has been automatically selected for you. You can select a different route below."
                  : "You have selected this route. Click on another route card to change selection."}
              </p>
            </div>
          )}

          {/* Route Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {routes.map((route, idx) => (
              <RouteInfoCard 
                key={idx} 
                route={route} 
                index={idx}
                isSelected={selectedRoute && (
                  selectedRoute.distance_km === route.distance_km && 
                  selectedRoute.duration_min === route.duration_min &&
                  selectedRoute.label === route.label
                )}
                onSelect={(route) => {
                  setSelectedRoute(route);
                  window.currentRouteUsed = route;
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      {routes.length > 0 && coords && (
        <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden shadow mb-6" style={{ height: "520px", width: "100%" }}>
          <MapView routes={routes} coords={coords} />
        </div>
      )}

      {/* Live Location Sharing Feature - Below Map */}
      <div className="max-w-6xl mx-auto mb-6">
        <LiveLocationShare userId={user.id} />
      </div>
    </div>
  );
}
