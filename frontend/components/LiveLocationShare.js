import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
import SOSAlert from "./SOSAlert";

export default function LiveLocationShare({ userId = 1 }) {
  const [isSharing, setIsSharing] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [deviceContacts, setDeviceContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [defaultContacts, setDefaultContacts] = useState([]);
  const [updateInterval, setUpdateInterval] = useState(5); // minutes
  const [batteryPercent, setBatteryPercent] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [error, setError] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);

  const locationIntervalRef = useRef(null);
  const watchIdRef = useRef(null);

  // Load contacts and check status on mount
  useEffect(() => {
    loadContacts();
    checkStatus();
    getBatteryStatus();
  }, [userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Reverse geocode coordinates to address
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

  const loadContacts = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.liveLocation.contacts(userId));
      const defaults = res.data.defaultContacts || res.data.emergencyContacts || [];
      
      setDefaultContacts(defaults);
      
      // Only show device contacts, not default/emergency contacts in the list
      setContacts(deviceContacts);
    } catch (err) {
      console.error("Error loading contacts:", err);
      setError("Failed to load contacts");
    }
  };

  // Load device contacts using Contacts Picker API
  const loadDeviceContacts = async () => {
    setLoadingContacts(true);
    setError("");

    try {
      // Check if Contacts Picker API is available (Chrome/Edge on Android)
      if ('contacts' in navigator && 'select' in navigator.contacts) {
        const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: true });
        
        if (contacts && contacts.length > 0) {
          const formattedContacts = contacts
            .filter(contact => contact.tel && contact.tel.length > 0)
            .map(contact => ({
              name: contact.name?.[0] || 'Unknown',
              phone: contact.tel[0]
            }));
          
          setDeviceContacts(formattedContacts);
          
          // Update contacts list to show only device contacts
          setContacts(formattedContacts);
          
          // Auto-select first contact if none selected
          if (selectedContacts.length === 0 && formattedContacts.length >= 1) {
            setSelectedContacts(formattedContacts.slice(0, 1));
          }
        }
      } else {
        // Fallback: Manual contact input
        const name = prompt("Enter contact name:");
        if (name) {
          const phone = prompt("Enter contact phone number:");
          if (phone) {
            const newContact = { name: name.trim(), phone: phone.trim() };
            const updatedDeviceContacts = [...deviceContacts, newContact];
            setDeviceContacts(updatedDeviceContacts);
            
            // Update contacts list to show only device contacts
            setContacts(updatedDeviceContacts);
            
            // Auto-select if this is the first contact
            if (selectedContacts.length === 0 && updatedDeviceContacts.length >= 1) {
              setSelectedContacts(updatedDeviceContacts.slice(0, 1));
            }
          }
        }
      }
    } catch (err) {
      console.error("Error loading device contacts:", err);
      setError("Failed to load device contacts. You can use default contacts or add manually.");
    } finally {
      setLoadingContacts(false);
    }
  };

  const checkStatus = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.liveLocation.status(userId));
      if (res.data.isActive) {
        setIsSharing(true);
        setSessionStatus(res.data);
        setSelectedContacts(res.data.selectedContacts || []);
        setUpdateInterval(res.data.updateIntervalMinutes || 5);
        setBatteryPercent(res.data.batteryPercent);
        setCurrentLocation(res.data.currentLocation);
        
        // Get address for existing location
        if (res.data.currentLocation) {
          const address = await reverseGeocode(
            res.data.currentLocation.latitude,
            res.data.currentLocation.longitude
          );
          if (address) {
            setCurrentAddress(address);
          }
        }
        
        // Resume location tracking
        startLocationTracking(res.data.updateIntervalMinutes || 5);
      }
    } catch (err) {
      console.error("Error checking status:", err);
    }
  };

  const getBatteryStatus = async () => {
    // Try Battery API (Chrome, Edge)
    if ("getBattery" in navigator) {
      try {
        const battery = await navigator.getBattery();
        setBatteryPercent(Math.round(battery.level * 100));
        
        // Update battery when it changes
        battery.addEventListener("levelchange", () => {
          setBatteryPercent(Math.round(battery.level * 100));
        });
        return;
      } catch (err) {
        console.log("Battery API error:", err);
      }
    }
    
    // Fallback: Try to get battery from experimental API (if available)
    if ("battery" in navigator) {
      try {
        const battery = navigator.battery || navigator.webkitBattery || navigator.mozBattery;
        if (battery) {
          setBatteryPercent(Math.round(battery.level * 100));
          battery.addEventListener("levelchange", () => {
            setBatteryPercent(Math.round(battery.level * 100));
          });
        }
      } catch (err) {
        console.log("Battery API not available");
      }
    }
    
    // If no battery API available, show a note
    console.log("Battery API not supported in this browser. User can manually select interval.");
  };

  const handleContactToggle = (contact) => {
    setSelectedContacts((prev) => {
      const isSelected = prev.some((c) => c.phone === contact.phone);
      if (isSelected) {
        // Deselect
        return prev.filter((c) => c.phone !== contact.phone);
      } else {
        // Select
        return [...prev, contact];
      }
    });
  };

  const startLocationTracking = (intervalMinutes) => {
    // Clear any existing interval
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }

    // Get initial location
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          
          // Get address immediately
          const address = await reverseGeocode(latitude, longitude);
          if (address) {
            setCurrentAddress(address);
          }
          
          updateLocation(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError("Failed to get location. Please enable location permissions.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // Update location at specified interval
      locationIntervalRef.current = setInterval(async () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Get address for updated location
            const address = await reverseGeocode(latitude, longitude);
            if (address) {
              setCurrentAddress(address);
            }
            
            updateLocation(latitude, longitude);
          },
          (error) => console.error("Location update error:", error),
          { enableHighAccuracy: true }
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
      
      // Get address for the location
      const address = await reverseGeocode(latitude, longitude);
      if (address) {
        setCurrentAddress(address);
      }
    } catch (err) {
      console.error("Error updating location:", err);
    }
  };

  const handleStartSharing = async () => {
    setError("");

    // Use selected contacts if available, otherwise use default contacts
    let contactsToUse = [];
    
    if (selectedContacts.length >= 1) {
      // User has selected 1+ contacts from device or list
      contactsToUse = selectedContacts;
    } else if (defaultContacts.length >= 1) {
      // No contacts selected, use default contacts automatically
      contactsToUse = defaultContacts.slice(0, 1);
    } else {
      setError("Please select at least 1 contact or ensure default contacts are configured");
      return;
    }

    if (contactsToUse.length < 1) {
      setError("At least 1 contact is required. Please select a contact or configure default contacts.");
      return;
    }

    try {
      const res = await axios.post(API_ENDPOINTS.liveLocation.start, {
        userId,
        selectedContacts: contactsToUse,
        updateIntervalMinutes: updateInterval,
        batteryPercent,
      });

      setIsSharing(true);
      setSessionStatus(res.data);
      
      // Get initial address if location is available
      if (currentLocation) {
        const address = await reverseGeocode(currentLocation.latitude, currentLocation.longitude);
        if (address) {
          setCurrentAddress(address);
        }
      }
      
      startLocationTracking(updateInterval);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to start live location sharing");
    }
  };

  const handleStopSharing = async () => {
    try {
      await axios.post(API_ENDPOINTS.liveLocation.stop, { userId });
      
      // Clear intervals
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      setIsSharing(false);
      setSessionStatus(null);
      setCurrentLocation(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to stop live location sharing");
    }
  };

  const getRecommendedInterval = () => {
    if (!batteryPercent) return 5;
    if (batteryPercent > 80) return 2; // High battery - frequent updates
    if (batteryPercent > 50) return 5; // Medium battery - moderate updates
    if (batteryPercent > 20) return 10; // Low battery - less frequent
    return 15; // Very low battery - minimal updates
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-purple-800 mb-4">📍 Live Location Sharing</h2>

      {/* Battery Status & Note */}
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        {batteryPercent !== null ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-yellow-800">Battery: {batteryPercent}%</span>
              <span className="text-sm text-yellow-700">
                Recommended: {getRecommendedInterval()} min intervals
              </span>
            </div>
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> Choose your update interval based on your battery percentage. 
              Lower battery = longer intervals to save power. If you don't select a contact, 
              your default contact (selected during login) will be used automatically.
            </p>
          </>
        ) : (
          <p className="text-sm text-yellow-700">
            <strong>Note:</strong> Choose your update interval based on your battery percentage. 
            Lower battery = longer intervals to save power. If you don't select a contact, 
            your default contact (selected during login) will be used automatically.
            <br />
            <span className="text-xs text-yellow-600 mt-1 block">
              (Battery API not available in this browser - select interval manually)
            </span>
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Status Display */}
      {isSharing && sessionStatus && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-800">✓ Live location sharing active</p>
              <p className="text-sm text-green-700">
                Sharing with {sessionStatus.selectedContacts?.length || 0} contacts
              </p>
              <p className="text-sm text-green-700">
                Update interval: {sessionStatus.updateIntervalMinutes} minutes
              </p>
              {currentLocation && (
                <p className="text-xs text-green-600 mt-1">
                  {currentAddress ? (
                    <>📍 {currentAddress}</>
                  ) : (
                    <>📍 {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)} (Loading address...)</>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={handleStopSharing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Stop Sharing
            </button>
          </div>
        </div>
      )}

      {/* SOS Alert Component */}
      {isSharing && (
        <SOSAlert userId={userId} isLocationSharing={isSharing} />
      )}

      {/* Contact Selection */}
      {!isSharing && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block font-semibold text-gray-700">
                Select Contact (Minimum 1 required)
              </label>
              <button
                onClick={loadDeviceContacts}
                disabled={loadingContacts}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingContacts ? (
                  <>⏳ Loading...</>
                ) : (
                  <>📱 Import from Device</>
                )}
              </button>
            </div>

            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              💡 <strong>Tip:</strong> Click "Import from Device" to select a contact from your phone. 
              If you don't select any, your default contact will be used automatically.
            </div>

            <div className="border-2 border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
              {contacts.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No contacts available. Please add contacts first.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {contacts.map((contact, idx) => {
                      const isSelected = selectedContacts.some((c) => c.phone === contact.phone);
                      const isDefault = defaultContacts.some((c) => c.phone === contact.phone);
                      return (
                        <label
                          key={idx}
                          className={`flex items-center p-3 rounded-lg cursor-pointer border-2 transition-all ${
                            isSelected
                              ? "bg-purple-100 border-purple-500 shadow-sm"
                              : "bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleContactToggle(contact)}
                            disabled={false}
                            className="mr-3 w-5 h-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">{contact.name}</span>
                              {isDefault && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                                  Default
                                </span>
                              )}
                              {isSelected && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{contact.phone}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  
                  {selectedContacts.length === 0 && defaultContacts.length >= 1 && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-800">
                        ℹ️ No contact selected from device. <strong>Default contact will be used automatically:</strong> {defaultContacts[0]?.name || "Default Contact"}
                      </p>
                    </div>
                  )}

                  {selectedContacts.length >= 1 && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ {selectedContacts.length} contact(s) selected: {selectedContacts.map((c) => c.name).join(", ")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Update Interval Selection */}
          <div className="mb-4">
            <label className="block font-semibold text-gray-700 mb-2">
              Update Interval (minutes)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[2, 5, 10, 15, 30].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setUpdateInterval(minutes)}
                  className={`p-3 border-2 rounded-lg font-semibold transition-all ${
                    updateInterval === minutes
                      ? "bg-purple-600 text-white border-purple-600 shadow-md"
                      : "bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                  }`}
                >
                  {minutes} min
                </button>
              ))}
            </div>
            {batteryPercent !== null && (
              <p className="text-xs text-gray-600 mt-2">
                💡 Based on your battery ({batteryPercent}%), recommended: <strong>{getRecommendedInterval()} minutes</strong>
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Select an interval based on your battery level (Lower battery = longer intervals to save power)
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartSharing}
            disabled={selectedContacts.length < 1 && defaultContacts.length < 1}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {selectedContacts.length >= 1 
              ? `Start Sharing with ${selectedContacts.length} Selected Contact(s)` 
              : defaultContacts.length >= 1
              ? `Start Sharing (Using Default Contact)`
              : "Add at least 1 contact to start"}
          </button>
        </>
      )}
    </div>
  );
}

