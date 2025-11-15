import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
import SOSAlert from "./SOSAlert";
import MapViewClient from "./MapView"; // Import from MapView.js (the dynamic wrapper)
import Navigation from "./Navigation";

export default function LiveLocationShare({ userId = 1 }) {
  const [isSharing, setIsSharing] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(5);
  const [batteryPercent, setBatteryPercent] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("map");

  const locationIntervalRef = useRef(null);

  useEffect(() => {
    checkStatus();
    getBatteryStatus();
    
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [userId]);

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { "User-Agent": "SafeJourneyApp" } }
      );
      
      if (res.data && res.data.display_name) {
        return res.data.display_name;
      }
      return null;
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      return null;
    }
  };

  const checkStatus = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.liveLocation.status(userId));
      if (res.data.isActive) {
        setIsSharing(true);
        setSessionStatus(res.data);
        setUpdateInterval(res.data.updateIntervalMinutes || 5);
        setBatteryPercent(res.data.batteryPercent || null);
        setCurrentLocation(res.data.currentLocation);
        
        if (res.data.currentLocation) {
          const address = await reverseGeocode(
            res.data.currentLocation.latitude,
            res.data.currentLocation.longitude
          );
          if (address) {
            setCurrentAddress(address);
          }
        }
        
        startLocationTracking(res.data.updateIntervalMinutes || 5);
      }
    } catch (err) {
      console.error("Error checking status:", err);
    }
  };

  const getBatteryStatus = async () => {
    try {
      if (typeof window !== 'undefined' && "getBattery" in navigator) {
        const battery = await navigator.getBattery();
        setBatteryPercent(Math.round(battery.level * 100));
        
        battery.addEventListener("levelchange", () => {
          setBatteryPercent(Math.round(battery.level * 100));
        });
      } else {
        setBatteryPercent(100); // Default for browsers without Battery API
      }
    } catch (err) {
      console.log("Battery API not available");
      setBatteryPercent(100);
    }
  };

  const startLocationTracking = (intervalMinutes) => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          
          const address = await reverseGeocode(latitude, longitude);
          if (address) {
            setCurrentAddress(address);
          }
          
          updateLocation(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError("Failed to get location. Please enable location permissions.");
        }
      );

      locationIntervalRef.current = setInterval(async () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            const address = await reverseGeocode(latitude, longitude);
            if (address) {
              setCurrentAddress(address);
            }
            
            updateLocation(latitude, longitude);
          },
          (error) => console.error("Location update error:", error)
        );
      }, intervalMinutes * 60 * 1000);
    } else {
      setError("Geolocation is not supported by your browser");
    }
  };

  const updateLocation = async (latitude, longitude) => {
    try {
      await axios.post(API_ENDPOINTS.liveLocation.update, {
        userId,
        latitude,
        longitude,
      });
    } catch (err) {
      console.error("Error updating location:", err);
    }
  };

  const handleStartSharing = async () => {
    setError("");

    if (!source || !destination) {
      setError("Please enter both source and destination");
      return;
    }

    try {
      const res = await axios.post(API_ENDPOINTS.liveLocation.start, {
        userId,
        selectedContacts: [],
        updateIntervalMinutes: updateInterval,
        batteryPercent,
      });

      setIsSharing(true);
      setSessionStatus(res.data);
      
      // Generate mock route data for the map
      const mockRoutes = [
        {
          id: 1,
          geometry: "mock_route_geometry", // Using mock data to avoid polyline issues
          label: "Safest Route",
          distance_km: 8.5,
          duration_min: 25,
          aiScore: 4.8
        }
      ];

      const mockCoords = {
        source: [17.3850, 78.4867], // Hyderabad coordinates
        destination: [17.4419, 78.4989]
      };

      setRouteInfo({
        source,
        destination,
        distance: `${(Math.random() * 20 + 5).toFixed(1)} km`,
        duration: `${Math.floor(Math.random() * 45 + 15)} min`,
        safetyScore: Math.floor(Math.random() * 30 + 70),
        routes: mockRoutes,
        coords: mockCoords
      });
      
      startLocationTracking(updateInterval);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to start live location sharing");
    }
  };

  const handleStopSharing = async () => {
    try {
      await axios.post(API_ENDPOINTS.liveLocation.stop, { userId });
      
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }

      setIsSharing(false);
      setSessionStatus(null);
      setCurrentLocation(null);
      setRouteInfo(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to stop live location sharing");
    }
  };

  const getRecommendedInterval = () => {
    if (batteryPercent === null) return 5;
    if (batteryPercent > 80) return 2;
    if (batteryPercent > 50) return 5;
    if (batteryPercent > 20) return 10;
    return 15;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🛡️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  SafeJourney
                </h1>
                <p className="text-sm text-gray-500">Your safety companion</p>
              </div>
            </div>
            
            {/* Battery Indicator */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">🔋</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {batteryPercent !== null ? `${batteryPercent}%` : '...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Controls & Information */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Main Control Card */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/60 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📍</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Live Location</h2>
                  <p className="text-sm text-gray-600">Share your journey safely</p>
                </div>
              </div>

              {/* Route Input */}
              {!isSharing && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🚩 Start Location
                    </label>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="Where are you starting from?"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🎯 Destination
                    </label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Where are you going?"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Battery & Interval */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-700">Update Interval</span>
                  <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    🔋 {getRecommendedInterval()}min recommended
                  </span>
                </div>
                
                {!isSharing && (
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {[2, 5, 10, 15, 30].map((minutes) => (
                      <button
                        key={minutes}
                        onClick={() => setUpdateInterval(minutes)}
                        className={`p-2 border-2 rounded-lg font-semibold transition-all text-sm ${
                          updateInterval === minutes
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent shadow-md"
                            : "bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                        }`}
                      >
                        {minutes}m
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center text-red-700">
                    <span className="mr-2">⚠️</span>
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Status Display */}
              {isSharing && sessionStatus && (
                <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="font-semibold text-green-800">Live Sharing Active</p>
                  </div>
                  
                  {routeInfo && (
                    <div className="space-y-2 text-sm text-green-700">
                      <p>🚗 <strong>Route:</strong> {routeInfo.source} → {routeInfo.destination}</p>
                      <p>📏 <strong>Distance:</strong> {routeInfo.distance}</p>
                      <p>⏱️ <strong>Duration:</strong> {routeInfo.duration}</p>
                      <p>🛡️ <strong>Safety Score:</strong> {routeInfo.safetyScore}/100</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              {!isSharing ? (
                <button
                  onClick={handleStartSharing}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  🚀 Start Journey Sharing
                </button>
              ) : (
                <button
                  onClick={handleStopSharing}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  🛑 Stop Sharing
                </button>
              )}
            </div>

            {/* SOS Alert Component */}
            {isSharing && (
              <SOSAlert userId={userId} isLocationSharing={isSharing} />
            )}
          </div>

          {/* Right Column - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden h-full">
              {/* Map Header */}
              <div className="border-b border-gray-200/60 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span>🗺️</span>
                    Live Journey Map
                  </h3>
                  {currentAddress && (
                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      📍 {currentAddress.split(',').slice(0, 2).join(',')}
                    </div>
                  )}
                </div>
              </div>

              {/* Map Container */}
              <div className="h-[500px] lg:h-[600px] relative">
                <MapViewClient 
                  routes={routeInfo?.routes || []} 
                  coords={routeInfo?.coords || {}}
                />
              </div>

              {/* Map Footer */}
              {isSharing && routeInfo && (
                <div className="border-t border-gray-200/60 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">🛡️</p>
                      <p className="text-sm font-semibold text-gray-700">Safety Score</p>
                      <p className="text-lg font-bold text-gray-900">{routeInfo.safetyScore}/100</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">📏</p>
                      <p className="text-sm font-semibold text-gray-700">Distance</p>
                      <p className="text-lg font-bold text-gray-900">{routeInfo.distance}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">⏱️</p>
                      <p className="text-sm font-semibold text-gray-700">Duration</p>
                      <p className="text-lg font-bold text-gray-900">{routeInfo.duration}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}