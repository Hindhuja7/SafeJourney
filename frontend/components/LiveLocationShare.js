// components/LiveLocationShare.js
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
import SOSAlert from "./SOSAlert";
import MapViewClient from "./MapView";
import RouteInfoCard from "./RouteInfoCard";
import ReviewForm from "./ReviewForm";

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
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [contacts, setContacts] = useState([{ name: "", phone: "" }]);
  const [showContactsSection, setShowContactsSection] = useState(true); // Show by default

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

  const handleGetRoutes = async () => {
    setError("");
    setLoadingRoutes(true);

    if (!source || !destination) {
      setError("Please enter both source and destination");
      setLoadingRoutes(false);
      return;
    }

    try {
      // Get routes from backend
      const routesResponse = await axios.post(API_ENDPOINTS.routes, {
        sourceAddress: source,
        destinationAddress: destination
      });

      const { coords, routes, safestRoute } = routesResponse.data;

      if (!routes || routes.length === 0) {
        setError("No routes found. Please try different locations.");
        setLoadingRoutes(false);
        return;
      }

      // Don't auto-select - let user choose, but default to safest if they don't select
      // Only set safest if no route was previously selected
      if (!selectedRoute) {
        // Don't set it yet - let user see all routes first
        // The getCurrentSelectedRoute() will return safest as default
      }
      
      setRouteInfo({
        source,
        destination,
        distance: `${safestRoute.distance_km} km`,
        duration: `${Math.round(safestRoute.duration_min)} min`,
        safetyScore: Math.floor(safestRoute.aiScore * 20), // Convert 0-5 to 0-100
        routes: routes,
        coords: coords,
        selectedRoute: selectedRoute || null // Don't auto-select, let user choose
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch routes. Please check your addresses and try again.");
    } finally {
      setLoadingRoutes(false);
    }
  };

  const handleAddContact = () => {
    setContacts([...contacts, { name: "", phone: "" }]);
  };

  const handleRemoveContact = (index) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...contacts];
    updatedContacts[index][field] = value;
    setContacts(updatedContacts);
  };

  const getValidContacts = () => {
    return contacts.filter(contact => contact.name.trim() && contact.phone.trim());
  };

  const handleStartSharing = async () => {
    setError("");

    if (!source || !destination) {
      setError("Please enter both source and destination");
      return;
    }

    if (!routeInfo) {
      setError("Please fetch routes first");
      return;
    }

    // Ensure a route is selected (default to safest if none selected)
    const routeToUse = selectedRoute || getCurrentSelectedRoute();
    if (!routeToUse) {
      setError("No route available. Please fetch routes again.");
      return;
    }

    // Get valid contacts (name and phone both filled)
    const validContacts = getValidContacts();
    
    // Format contacts for backend (backend expects array of {name, phone})
    const formattedContacts = validContacts.map(contact => ({
      name: contact.name.trim(),
      phone: contact.phone.trim()
    }));

    try {
      // Start live location sharing
      // If no contacts provided, send empty array - backend will use TWILIO_PHONE_NUMBER as default
      const res = await axios.post(API_ENDPOINTS.liveLocation.start, {
        userId,
        selectedContacts: formattedContacts.length > 0 ? formattedContacts : [],
        updateIntervalMinutes: updateInterval,
        batteryPercent,
      });

      setIsSharing(true);
      setSessionStatus(res.data);
      
      // Update routeInfo with the route being used
      if (routeInfo && routeToUse) {
        setRouteInfo({
          ...routeInfo,
          selectedRoute: routeToUse,
          distance: `${routeToUse.distance_km} km`,
          duration: `${Math.round(routeToUse.duration_min)} min`,
          safetyScore: Math.floor(routeToUse.aiScore * 20)
        });
      }
      
      startLocationTracking(updateInterval);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to start live location sharing");
    }
  };

  const handleStopSharing = async () => {
    try {
      const stopResponse = await axios.post(API_ENDPOINTS.liveLocation.stop, { userId });
      
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }

      setIsSharing(false);
      setSessionStatus(null);
      setCurrentLocation(null);
      setSessionData(stopResponse.data.sessionData);
      setShowReviewForm(true);
      // Reset contacts for next journey
      setContacts([{ name: "", phone: "" }]);
      setShowContactsSection(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to stop live location sharing");
    }
  };

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    if (routeInfo) {
      setRouteInfo({
        ...routeInfo,
        selectedRoute: route,
        distance: `${route.distance_km} km`,
        duration: `${Math.round(route.duration_min)} min`,
        safetyScore: Math.floor(route.aiScore * 20)
      });
    }
  };

  // Get the currently selected route or default to safest
  const getCurrentSelectedRoute = () => {
    if (selectedRoute) {
      return selectedRoute;
    }
    if (routeInfo?.routes && routeInfo.routes.length > 0) {
      // Return safest route (first one, as they're sorted by safety)
      return routeInfo.routes[0];
    }
    return null;
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setRouteInfo(null);
    setSource("");
    setDestination("");
    setSelectedRoute(null);
    setSessionData(null);
  };

  const getRecommendedInterval = () => {
    if (batteryPercent === null) return 5;
    if (batteryPercent > 80) return 2;
    if (batteryPercent > 50) return 5;
    if (batteryPercent > 20) return 10;
    return 15;
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Review Form */}
        {showReviewForm && (
          <div className="mb-6">
            <ReviewForm 
              userId={userId}
              sessionData={sessionData}
              routeUsed={selectedRoute}
              sourceAddress={source}
              destinationAddress={destination}
              onReviewSubmitted={handleReviewSubmitted}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Controls & Information */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Main Control Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                  <span className="text-lg">📍</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Live Location</h2>
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
                      onChange={(e) => {
                        setSource(e.target.value);
                        // Clear routes when source changes
                        if (routeInfo) {
                          setRouteInfo(null);
                          setSelectedRoute(null);
                        }
                      }}
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
                      onChange={(e) => {
                        setDestination(e.target.value);
                        // Clear routes when destination changes
                        if (routeInfo) {
                          setRouteInfo(null);
                          setSelectedRoute(null);
                        }
                      }}
                      placeholder="Where are you going?"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  {/* Get Routes Button */}
                  <button
                    onClick={handleGetRoutes}
                    disabled={!source || !destination || loadingRoutes}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {loadingRoutes ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Finding Routes...
                      </div>
                    ) : (
                      "🔍 Get Routes"
                    )}
                  </button>
                </div>
              )}

              {/* Route Selection */}
              {!isSharing && routeInfo?.routes && routeInfo.routes.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <span>🗺️</span>
                      Choose Your Route
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {routeInfo.routes.length} route{routeInfo.routes.length > 1 ? 's' : ''} available
                    </span>
                  </div>
                  
                  {/* Selected Route Note - Only show if user has selected or if we're using default */}
                  {(() => {
                    const currentRoute = getCurrentSelectedRoute();
                    if (!currentRoute) return null;
                    
                    const isSafestRoute = currentRoute.label === "Safest (Recommended)";
                    const isUserSelected = selectedRoute && selectedRoute.id === currentRoute.id;
                    const isDefault = !selectedRoute && isSafestRoute;
                    
                    return (
                      <div className={`mb-4 p-4 rounded-xl border-2 shadow-md ${
                        isDefault
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400"
                          : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-400"
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isDefault ? "bg-blue-100" : "bg-green-100"
                          }`}>
                            <span className={`text-xl ${isDefault ? "text-blue-600" : "text-green-600"}`}>
                              {isDefault ? "ℹ️" : "✓"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className={`text-base font-bold ${
                              isDefault ? "text-blue-900" : "text-green-900"
                            }`}>
                              {isDefault
                                ? `Selected safest route (default): ${currentRoute.label}`
                                : `Selected route: ${currentRoute.label || `Route ${routeInfo.routes.findIndex(r => r.id === currentRoute.id) + 1}`}`
                              }
                            </p>
                            {isDefault && (
                              <p className="text-sm text-blue-700 mt-1 font-medium">
                                Click on any route below to select a different one
                              </p>
                            )}
                          </div>
                        </div>
                        <div className={`mt-3 pt-3 border-t-2 ${
                          isDefault ? "border-blue-200" : "border-green-200"
                        }`}>
                          <div className={`grid grid-cols-3 gap-3 text-sm font-semibold ${
                            isDefault ? "text-blue-800" : "text-green-800"
                          }`}>
                            <div className="text-center p-2 bg-white/60 rounded-lg">
                              <span className="block text-xs text-gray-600 mb-1 font-normal">Distance</span>
                              <span className="text-base">{currentRoute.distance_km} km</span>
                            </div>
                            <div className="text-center p-2 bg-white/60 rounded-lg">
                              <span className="block text-xs text-gray-600 mb-1 font-normal">Duration</span>
                              <span className="text-base">{Math.round(currentRoute.duration_min)} min</span>
                            </div>
                            <div className="text-center p-2 bg-white/60 rounded-lg">
                              <span className="block text-xs text-gray-600 mb-1 font-normal">Safety</span>
                              <span className="text-base">{currentRoute.aiScore?.toFixed(1) || "N/A"}/5.0</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Route Selection Prompt */}
                  {!selectedRoute && (
                    <div className="mb-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                        <span>👆</span>
                        Please select a route below (or use safest route as default)
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {routeInfo.routes.map((route, index) => {
                      const currentRoute = getCurrentSelectedRoute();
                      const isSelected = selectedRoute?.id === route.id || (!selectedRoute && index === 0 && route.label === "Safest (Recommended)");
                      
                      return (
                        <RouteInfoCard
                          key={route.id || index}
                          route={route}
                          index={index}
                          isSelected={isSelected}
                          onSelect={handleRouteSelect}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contacts Section */}
              {!isSharing && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-xl">📱</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">Emergency Contacts</h3>
                        <p className="text-xs text-gray-500">Who should receive your location updates?</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowContactsSection(!showContactsSection)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                      type="button"
                    >
                      {showContactsSection ? "▼ Hide" : "▶ Show"}
                    </button>
                  </div>

                  {showContactsSection && (
                    <div className="space-y-4 p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-400 shadow-lg">
                      {/* Info Banner */}
                      <div className="flex items-start gap-3 p-4 bg-white rounded-xl border-2 border-blue-300 shadow-sm">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xl">💡</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 mb-2">
                            Add Emergency Contacts (Optional)
                          </p>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            Add contacts who will receive your location updates and SOS alerts during your journey. 
                            <span className="block mt-1 font-semibold text-blue-700">
                              If you don't add any contacts, the system will automatically use the default emergency contact (Twilio number).
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      {/* Contact Input Cards */}
                      <div className="space-y-4">
                        {contacts.map((contact, index) => (
                          <div key={index} className="bg-white p-5 rounded-xl border-2 border-blue-300 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                                  <span className="text-white text-base font-bold">{index + 1}</span>
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-gray-800 block">Contact {index + 1}</span>
                                  <span className="text-xs text-gray-500">Emergency contact</span>
                                </div>
                              </div>
                              {contacts.length > 1 && (
                                <button
                                  onClick={() => handleRemoveContact(index)}
                                  className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all border-2 border-red-200 hover:border-red-300 hover:shadow-md"
                                  type="button"
                                  title="Remove contact"
                                >
                                  <span className="text-lg">🗑️</span>
                                </button>
                              )}
                            </div>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                  <span>👤</span>
                                  Contact Name
                                  <span className="text-red-500 text-xs">(Required)</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g., John Doe, Mom, Friend"
                                  value={contact.name}
                                  onChange={(e) => handleContactChange(index, "name", e.target.value)}
                                  className="w-full p-3.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium placeholder-gray-400"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                  <span>📞</span>
                                  Phone Number
                                  <span className="text-red-500 text-xs">(Required)</span>
                                </label>
                                <input
                                  type="tel"
                                  placeholder="e.g., +1234567890, +919876543210"
                                  value={contact.phone}
                                  onChange={(e) => handleContactChange(index, "phone", e.target.value)}
                                  className="w-full p-3.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium placeholder-gray-400"
                                />
                                <p className="text-xs text-gray-500 mt-1.5 ml-1">
                                  Include country code (e.g., +1 for USA, +91 for India)
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Add Contact Button */}
                      <button
                        onClick={handleAddContact}
                        type="button"
                        className="w-full py-3.5 text-sm text-white hover:text-blue-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-2 border-blue-500 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                      >
                        <span className="text-2xl font-bold">+</span>
                        Add Another Contact
                      </button>

                      {getValidContacts().length > 0 && (
                        <div className="mt-3 p-3 bg-green-100 border-2 border-green-300 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 text-lg">✓</span>
                            <p className="text-sm font-semibold text-green-800">
                              {getValidContacts().length} contact{getValidContacts().length > 1 ? 's' : ''} will receive location updates
                            </p>
                          </div>
                          <div className="mt-2 space-y-1">
                            {getValidContacts().map((contact, idx) => (
                              <p key={idx} className="text-xs text-green-700 ml-6">
                                • {contact.name} ({contact.phone})
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {getValidContacts().length === 0 && (
                        <div className="mt-3 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <span className="text-yellow-600 text-lg">ℹ️</span>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-yellow-800 mb-1">
                                No contacts added yet
                              </p>
                              <p className="text-xs text-yellow-700">
                                {contacts.some(c => c.name || c.phone) 
                                  ? "Please fill both name and phone number for each contact, or leave all fields empty to use the default emergency contact."
                                  : "If you don't add any contacts, the system will automatically use the default emergency contact (Twilio number) for location updates and SOS alerts."}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="font-semibold text-green-800 text-sm">Live Sharing Active</p>
                  </div>
                  
                  {routeInfo && (
                    <div className="space-y-2 text-sm text-green-700">
                      <p>🚗 <strong>Route:</strong> {routeInfo.source} → {routeInfo.destination}</p>
                      <p>📏 <strong>Distance:</strong> {routeInfo.distance}</p>
                      <p>⏱️ <strong>Duration:</strong> {routeInfo.duration}</p>
                      <p>🛡️ <strong>Safety Score:</strong> {routeInfo.safetyScore}/100</p>
                      {sessionStatus.selectedContacts && sessionStatus.selectedContacts.length > 0 ? (
                        <p>📱 <strong>Contacts:</strong> {sessionStatus.selectedContacts.length} contact{sessionStatus.selectedContacts.length > 1 ? 's' : ''} receiving updates</p>
                      ) : (
                        <p>📱 <strong>Contacts:</strong> Using default emergency contact</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              {!isSharing ? (
                <button
                  onClick={handleStartSharing}
                  disabled={!source || !destination || !routeInfo}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {!routeInfo ? "📍 Get Routes First" : "🚀 Start Journey Sharing"}
                </button>
              ) : (
                <button
                  onClick={handleStopSharing}
                  className="w-full bg-red-600 text-white py-3.5 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
              {/* Map Header */}
              <div className="border-b border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <span>🗺️</span>
                    {isSharing ? "Live Journey Map" : "Route Planning"}
                  </h3>
                  {currentAddress && (
                    <div className="text-xs text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
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
                  selectedRoute={selectedRoute}
                />
              </div>

              {/* Map Footer */}
              {isSharing && routeInfo && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl mb-1">🛡️</p>
                      <p className="text-xs font-medium text-gray-600">Safety Score</p>
                      <p className="text-base font-bold text-gray-800">{routeInfo.safetyScore}/100</p>
                    </div>
                    <div>
                      <p className="text-xl mb-1">📏</p>
                      <p className="text-xs font-medium text-gray-600">Distance</p>
                      <p className="text-base font-bold text-gray-800">{routeInfo.distance}</p>
                    </div>
                    <div>
                      <p className="text-xl mb-1">⏱️</p>
                      <p className="text-xs font-medium text-gray-600">Duration</p>
                      <p className="text-base font-bold text-gray-800">{routeInfo.duration}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}