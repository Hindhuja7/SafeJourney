// components/SOSAlert.js
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

export default function SOSAlert({ userId, isLocationSharing }) {
  const [sosActive, setSosActive] = useState(false);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const [showCheckInPrompt, setShowCheckInPrompt] = useState(false);
  const [checkInInterval, setCheckInInterval] = useState(5);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [noResponseCountdown, setNoResponseCountdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alertResults, setAlertResults] = useState(null);

  const checkInIntervalRef = useRef(null);
  const noResponseTimerRef = useRef(null);

  useEffect(() => {
    checkSOSStatus();
    
    return () => {
      if (checkInIntervalRef.current) {
        clearInterval(checkInIntervalRef.current);
      }
      if (noResponseTimerRef.current) {
        clearTimeout(noResponseTimerRef.current);
      }
    };
  }, [userId]);

  const checkSOSStatus = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.liveLocation.sos.status(userId));
      
      if (res.data.isActive) {
        setSosActive(true);
        setCheckInInterval(res.data.checkInIntervalMinutes || 5);
        
        if (res.data.nextCheckIn) {
          startCountdown(res.data.nextCheckIn);
        }
        
        if (res.data.emergencyTriggered) {
          setEmergencyTriggered(true);
          setSosActive(false);
        }
      }
    } catch (err) {
      console.error("Error checking SOS status:", err);
    }
  };

  const startCountdown = (nextCheckIn) => {
    if (checkInIntervalRef.current) {
      clearInterval(checkInIntervalRef.current);
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const checkInTime = new Date(nextCheckIn).getTime();
      const remaining = Math.max(0, Math.floor((checkInTime - now) / 1000));
      
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setShowCheckInPrompt(true);
        startNoResponseCountdown();
        clearInterval(checkInIntervalRef.current);
      }
    };

    updateCountdown();
    checkInIntervalRef.current = setInterval(updateCountdown, 1000);
  };

  const startNoResponseCountdown = () => {
    setNoResponseCountdown(180); // 3 minutes
    
    if (noResponseTimerRef.current) {
      clearInterval(noResponseTimerRef.current);
    }

    noResponseTimerRef.current = setInterval(() => {
      setNoResponseCountdown(prev => {
        if (prev <= 1) {
          clearInterval(noResponseTimerRef.current);
          handleNoResponse();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleNoResponse = async () => {
    try {
      setLoading(true);
      const res = await axios.post(API_ENDPOINTS.liveLocation.sos.emergency, { userId });
      
      setEmergencyTriggered(true);
      setShowCheckInPrompt(false);
      setAlertResults(res.data.alertResults);
      
      if (checkInIntervalRef.current) {
        clearInterval(checkInIntervalRef.current);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to trigger emergency alert");
    } finally {
      setLoading(false);
    }
  };

  const handleStartSOS = async () => {
    try {
      setLoading(true);
      setError("");
      
      await axios.post(API_ENDPOINTS.liveLocation.sos.start, {
        userId,
        checkInIntervalMinutes: checkInInterval
      });

      setSosActive(true);
      startCountdown(new Date(Date.now() + checkInInterval * 60 * 1000).toISOString());
    } catch (err) {
      setError(err.response?.data?.error || "Failed to start SOS alert system");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (isSafe) => {
    try {
      setLoading(true);
      setError("");
      
      const res = await axios.post(API_ENDPOINTS.liveLocation.sos.checkin, {
        userId,
        isSafe
      });

      if (isSafe) {
        setShowCheckInPrompt(false);
        setNoResponseCountdown(null);
        if (noResponseTimerRef.current) {
          clearInterval(noResponseTimerRef.current);
        }
        
        // Restart countdown for next check-in
        if (res.data.nextCheckIn) {
          startCountdown(res.data.nextCheckIn);
        }
      } else {
        setEmergencyTriggered(true);
        setShowCheckInPrompt(false);
        setSosActive(false);
        setAlertResults(res.data.alertResults);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to process check-in");
    } finally {
      setLoading(false);
    }
  };

  // Format time for responsive display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isLocationSharing) {
    return null;
  }

  if (emergencyTriggered) {
    return (
      <div className="bg-red-600 text-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 animate-pulse">
        <div className="text-center">
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚨</div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">EMERGENCY ALERT SENT</h2>
          <p className="text-sm sm:text-base mb-4 opacity-90">
            Your emergency contacts have been notified with your location and nearby police stations.
          </p>

          {/* Alert Results */}
          {alertResults && (
            <div className="mt-4 p-3 sm:p-4 bg-red-700 rounded-lg text-left">
              <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">📱 Alert Sent To:</h3>
              
              {/* Contact alerts */}
              {alertResults.contacts && alertResults.contacts.length > 0 && (
                <div className="mb-3">
                  <p className="font-semibold mb-2 text-xs sm:text-sm">Emergency Contacts:</p>
                  <div className="space-y-1 text-xs">
                    {alertResults.contacts.map((result, idx) => (
                      <div key={idx} className={`flex items-center gap-2 ${result.success ? "text-green-200" : "text-yellow-200"}`}>
                        <span>{result.success ? "✅" : "⚠️"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{result.contact || "Contact"} - {result.phone}</p>
                          {result.error && (
                            <p className="text-xs opacity-75 mt-1">Error: {result.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Police station alerts */}
              {alertResults.policeStations && alertResults.policeStations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-500">
                  <p className="font-semibold mb-2 text-xs sm:text-sm">🚔 Police Stations:</p>
                  <div className="space-y-1 text-xs">
                    {alertResults.policeStations.map((result, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-green-200">
                        <span>✅</span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{result.contact} - {result.phone}</p>
                          {result.note && (
                            <p className="text-xs opacity-75 mt-1">{result.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-xs sm:text-sm mt-4 opacity-90">
            Help is on the way. Stay safe!
          </p>
        </div>
      </div>
    );
  }

  if (showCheckInPrompt) {
    return (
      <div className="bg-yellow-500 text-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 animate-pulse">
        <div className="text-center">
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⏰</div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Safety Check-In Required</h2>
          <p className="text-sm sm:text-base mb-4 sm:mb-6">
            Are you safe? Please confirm your safety status.
          </p>
          
          {noResponseCountdown !== null && noResponseCountdown > 0 && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-600 rounded-lg">
              <p className="text-xs sm:text-sm font-semibold mb-2">
                ⚠️ Emergency alert will be sent in:
              </p>
              <p className="text-2xl sm:text-3xl font-bold mb-2">
                {formatTime(noResponseCountdown)}
              </p>
              <p className="text-xs opacity-90">
                If you don't respond, emergency alert will be sent automatically
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => handleCheckIn(true)}
              disabled={loading}
              className="flex-1 px-4 sm:px-8 py-3 sm:py-4 bg-green-600 text-white rounded-lg font-bold text-sm sm:text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 transition-all"
            >
              ✅ I'm Safe
            </button>
            <button
              onClick={() => handleCheckIn(false)}
              disabled={loading}
              className="flex-1 px-4 sm:px-8 py-3 sm:py-4 bg-red-600 text-white rounded-lg font-bold text-sm sm:text-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 transition-all"
            >
              🚨 I'm NOT Safe
            </button>
          </div>
          
          {error && (
            <p className="text-red-200 mt-4 text-xs sm:text-sm">{error}</p>
          )}
          
          <p className="text-xs sm:text-sm mt-4 opacity-90">
            If you don't respond within 3 minutes, an emergency alert will be sent automatically.
          </p>
        </div>
      </div>
    );
  }

  if (sosActive) {
    return (
      <div className="bg-orange-100 border-2 border-orange-400 rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
        <div className="text-center">
          <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🛡️</div>
          <h2 className="text-lg sm:text-xl font-bold text-orange-800 mb-2">SOS Alert Active</h2>
          <p className="text-orange-700 text-sm sm:text-base mb-3 sm:mb-4">
            Next safety check-in in:
          </p>
          <div className="text-3xl sm:text-4xl font-bold text-orange-800 mb-3 sm:mb-4">
            {timeRemaining !== null ? formatTime(timeRemaining) : "..."}
          </div>
          <p className="text-xs sm:text-sm text-orange-600">
            You will be prompted to confirm your safety at the next check-in time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
      <div className="flex items-center gap-3 mb-3 sm:mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <span className="text-lg">🛡️</span>
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-blue-800">SOS Safety Alert System</h2>
          <p className="text-blue-700 text-xs sm:text-sm">
            Periodic safety check-ins with emergency alerts
          </p>
        </div>
      </div>

      <p className="text-blue-700 text-sm sm:text-base mb-4">
        Enable periodic safety check-ins. If you don't respond or indicate you're not safe, 
        emergency alerts will be sent automatically.
      </p>

      <div className="mb-4">
        <label className="block font-semibold text-blue-800 mb-2 text-sm sm:text-base">
          Check-In Interval
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[2, 5, 10, 20].map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => setCheckInInterval(minutes)}
              disabled={loading}
              className={`p-2 sm:p-3 border-2 rounded-lg font-semibold transition-all text-xs sm:text-sm ${
                checkInInterval === minutes
                  ? "bg-blue-600 text-white border-blue-600 shadow-md"
                  : "bg-white text-blue-700 border-blue-300 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              {minutes} min
            </button>
          ))}
        </div>
        <p className="text-xs text-blue-600 mt-2">
          You'll be asked to confirm your safety every {checkInInterval} minutes
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </div>
        </div>
      )}

      <button
        onClick={handleStartSOS}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Starting...
          </div>
        ) : (
          "🛡️ Start SOS Alert System"
        )}
      </button>
    </div>
  );
}