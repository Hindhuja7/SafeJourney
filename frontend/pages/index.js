import { useState, useEffect } from "react";
import axios from "axios";
import RouteInfoCard from "../components/RouteInfoCard";
import MapView from "../components/MapView";
import LiveLocationShare from "../components/LiveLocationShare";
import Login from "../components/Login";
import NavigationView from "../components/NavigationView";
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
  const [isNavigating, setIsNavigating] = useState(false);

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#ffffff'
    }}>
      {/* Header with Logout - Preserved from main branch */}
      <header style={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🛡️ SafeJourney</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px' }}>Welcome, {user.name}!</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Source and Destination Input - Matching tomtom branch UI */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #ddd',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Origin */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Origin Location
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={srcAddr}
                onChange={(e) => setSrcAddr(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchRoutes()}
                placeholder="e.g., Hyderabad, Telangana"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={fetchRoutes}
                disabled={loading || !srcAddr.trim() || !dstAddr.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: (loading || !srcAddr.trim() || !dstAddr.trim()) ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (loading || !srcAddr.trim() || !dstAddr.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {loading ? '...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Destination */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Destination Location
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={dstAddr}
                onChange={(e) => setDstAddr(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchRoutes()}
                placeholder="e.g., Narayanaguda, Hyderabad"
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={fetchRoutes}
                disabled={loading || !srcAddr.trim() || !dstAddr.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: (loading || !srcAddr.trim() || !dstAddr.trim()) ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (loading || !srcAddr.trim() || !dstAddr.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {loading ? '...' : 'Search'}
              </button>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <button
            onClick={fetchRoutes}
            disabled={loading || !srcAddr.trim() || !dstAddr.trim()}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: (loading || !srcAddr.trim() || !dstAddr.trim()) ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (loading || !srcAddr.trim() || !dstAddr.trim()) ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {loading ? 'Finding Routes...' : 'Find Safe Routes'}
          </button>
        </div>
      </div>

      {/* Main Content Area with Map and Routes Sidebar - Matching tomtom branch layout */}
      {routes.length > 0 && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 300px)', minHeight: '600px', marginBottom: '20px' }}>
          {/* Map Section */}
          <div style={{ flex: 1, position: 'relative', height: '100%' }}>
            <div style={{ width: '100%', height: '100%' }}>
              <MapView 
                routes={routes} 
                coords={coords}
                selectedRouteIndex={routes.findIndex(r => 
                  selectedRoute && 
                  r.distance_km === selectedRoute.distance_km && 
                  r.duration_min === selectedRoute.duration_min &&
                  r.label === selectedRoute.label
                )}
                onRouteSelect={(index) => {
                  if (routes[index]) {
                    setSelectedRoute(routes[index]);
                    window.currentRouteUsed = routes[index];
                  }
                }}
              />
            </div>
          </div>

          {/* Routes Sidebar - Matching tomtom branch UI exactly */}
          {routes && routes.length > 0 && (
            <div style={{
              width: '350px',
              backgroundColor: 'white',
              borderLeft: '1px solid #ddd',
              overflowY: 'auto',
              padding: '20px'
            }}>
              <h2 style={{ marginTop: 0, fontSize: '20px', marginBottom: '15px' }}>
                Routes (Sorted by Safety)
              </h2>
              {routes.map((route, index) => {
                const isSafest = index === 0; // First route is safest after sorting
                const isSelected = selectedRoute && (
                  selectedRoute.distance_km === route.distance_km && 
                  selectedRoute.duration_min === route.duration_min &&
                  selectedRoute.label === route.label
                );
                const riskPercent = route.riskScore !== undefined 
                  ? (route.riskScore * 100).toFixed(1) 
                  : route.aiScore !== undefined 
                    ? ((5 - route.aiScore) / 5 * 100).toFixed(1) 
                    : 'N/A';

                return (
                  <div
                    key={route.id || index}
                    onClick={() => {
                      setSelectedRoute(route);
                      window.currentRouteUsed = route;
                    }}
                    style={{
                      padding: '15px',
                      marginBottom: '15px',
                      border: isSelected ? '3px solid #007bff' : (isSafest ? '2px solid #28a745' : '1px solid #ddd'),
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#e7f3ff' : (isSafest ? '#f0fff4' : 'white'),
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px' }}>
                        Route {index + 1}
                        {isSafest && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'normal'
                          }}>
                            SAFEST
                          </span>
                        )}
                        {isSelected && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'normal'
                          }}>
                            SELECTED
                          </span>
                        )}
                      </h3>
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      Risk Score: <strong>{riskPercent}%</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      <div>Distance: {route.distance_km} km</div>
                      <div>Time: {Math.round(parseFloat(route.duration_min))} min</div>
                    </div>
                    {route.segments && (
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                        Segments: {route.segments.length || 0}
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRoute(route);
                        window.currentRouteUsed = route;
                        setIsNavigating(true);
                      }}
                      style={{
                        width: '100%',
                        marginTop: '12px',
                        padding: '10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                    >
                      🧭 Start Navigation
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Navigation View - Full Screen Overlay */}
      {isNavigating && selectedRoute && coords && (
        <NavigationView
          route={selectedRoute}
          origin={coords.source ? [coords.source.lon, coords.source.lat] : null}
          destination={coords.destination ? [coords.destination.lon, coords.destination.lat] : null}
          onExit={() => setIsNavigating(false)}
          onReroute={(newRoute) => {
            setSelectedRoute(newRoute);
            window.currentRouteUsed = newRoute;
          }}
        />
      )}


      {/* Live Location Sharing Feature - Below Map (Preserved from main branch - functionality unchanged) */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '20px',
        marginBottom: '20px'
      }}>
        <LiveLocationShare userId={user.id} />
      </div>
    </div>
  );
}
