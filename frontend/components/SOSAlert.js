import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

export default function SOSAlert({ userId, isLocationSharing }) {
  const [sosActive, setSosActive] = useState(false);
  const [checkInInterval, setCheckInInterval] = useState(10); // Default: 10 minutes (2, 5, 10, or 20 minutes)
  const [timeRemaining, setTimeRemaining] = useState(null); // seconds
  const [nextCheckIn, setNextCheckIn] = useState(null);
  const [showCheckInPrompt, setShowCheckInPrompt] = useState(false);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [noResponseCountdown, setNoResponseCountdown] = useState(null); // seconds remaining before auto-emergency
  const [alertResults, setAlertResults] = useState(null); // Store alert results with phone numbers

  const countdownIntervalRef = useRef(null);
  const checkInTimeoutRef = useRef(null);

  // Load SOS status on mount
  useEffect(() => {
    if (isLocationSharing) {
      checkSOSStatus();
    }
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (checkInTimeoutRef.current) {
        if (typeof checkInTimeoutRef.current === 'object' && checkInTimeoutRef.current.timeout) {
          clearTimeout(checkInTimeoutRef.current.timeout);
          if (checkInTimeoutRef.current.interval) {
            clearInterval(checkInTimeoutRef.current.interval);
          }
        } else {
          clearTimeout(checkInTimeoutRef.current);
        }
      }
    };
  }, [userId, isLocationSharing]);

  // Check SOS status from backend
  const checkSOSStatus = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.liveLocation.sos.status(userId));
      if (res.data && res.data.isActive) {
        setSosActive(true);
        setCheckInInterval(res.data.checkInIntervalMinutes);
        if (res.data.nextCheckIn) {
          const nextCheckInTime = new Date(res.data.nextCheckIn);
          setNextCheckIn(nextCheckInTime);
          startCountdown(nextCheckInTime);
        }
      }
      if (res.data && res.data.emergencyTriggered) {
        setEmergencyTriggered(true);
        setSosActive(false);
      }
    } catch (err) {
      console.error("Error checking SOS status:", err);
      // Don't set error state - SOS might not be started yet
    }
  };

  // Start countdown timer
  const startCountdown = (targetTime) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      setTimeRemaining(diff);

      if (diff === 0) {
        // Time's up - show check-in prompt
        setShowCheckInPrompt(true);
        clearInterval(countdownIntervalRef.current);
        
        // Start countdown for auto-emergency (3 minutes = 180 seconds)
        const autoEmergencyDelay = 3 * 60 * 1000; // 3 minutes
        setNoResponseCountdown(180); // 3 minutes in seconds
        
        // Start countdown display
        let remainingSeconds = 180;
        const noResponseCountdownInterval = setInterval(() => {
          remainingSeconds--;
          setNoResponseCountdown(remainingSeconds);
          
          if (remainingSeconds <= 0) {
            clearInterval(noResponseCountdownInterval);
            setNoResponseCountdown(null);
            triggerEmergencyNoResponse();
          }
        }, 1000);
        
        // Store interval reference to clear it if user responds
        checkInTimeoutRef.current = {
          timeout: setTimeout(() => {
            clearInterval(noResponseCountdownInterval);
            setNoResponseCountdown(null);
            triggerEmergencyNoResponse();
          }, autoEmergencyDelay),
          interval: noResponseCountdownInterval
        };
      }
    };

    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);
  };

  // Start SOS alert system
  const handleStartSOS = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(API_ENDPOINTS.liveLocation.sos.start, {
        userId,
        checkInIntervalMinutes: checkInInterval
      });

      setSosActive(true);
      const nextCheckInTime = new Date(res.data.nextCheckIn);
      setNextCheckIn(nextCheckInTime);
      startCountdown(nextCheckInTime);
      setError(""); // Clear any previous errors
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to start SOS alert system";
      setError(errorMsg);
      console.error("Error starting SOS:", err);
      
      // Show helpful error message
      if (errorMsg.includes("No active live location session")) {
        setError("⚠️ Please start location sharing first, then start SOS Alert System");
      }
    } finally {
      setLoading(false);
    }
  };

  // User checks in (safe or not safe)
  const handleCheckIn = async (isSafe) => {
    setLoading(true);
    setError("");

    // Clear timeout and countdown if user responds
    if (checkInTimeoutRef.current) {
      if (typeof checkInTimeoutRef.current === 'object' && checkInTimeoutRef.current.timeout) {
        clearTimeout(checkInTimeoutRef.current.timeout);
        clearInterval(checkInTimeoutRef.current.interval);
      } else {
        clearTimeout(checkInTimeoutRef.current);
      }
    }
    setNoResponseCountdown(null); // Clear countdown display

    try {
      const res = await axios.post(API_ENDPOINTS.liveLocation.sos.checkin, {
        userId,
        isSafe: isSafe
      });

      if (res.data.emergencyTriggered) {
        setEmergencyTriggered(true);
        setSosActive(false);
        setShowCheckInPrompt(false);
        // Store alert results to show which numbers received alerts
        if (res.data.alertResults) {
          setAlertResults(res.data.alertResults);
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      } else {
        // Reset for next check-in
        setShowCheckInPrompt(false);
        const nextCheckInTime = new Date(res.data.nextCheckIn);
        setNextCheckIn(nextCheckInTime);
        startCountdown(nextCheckInTime);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to process check-in");
      console.error("Error checking in:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger emergency if no response
  const triggerEmergencyNoResponse = async () => {
    try {
      setNoResponseCountdown(null); // Clear countdown
      const res = await axios.post(API_ENDPOINTS.liveLocation.sos.emergency, {
        userId
      });
      setEmergencyTriggered(true);
      setSosActive(false);
      setShowCheckInPrompt(false);
      // Store alert results to show which numbers received alerts
      if (res.data.alertResults) {
        setAlertResults(res.data.alertResults);
      }
    } catch (err) {
      console.error("Error triggering emergency:", err);
      setError("Failed to trigger emergency alert");
    }
  };

  // Format time remaining
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isLocationSharing) {
    return null; // Don't show SOS if location sharing is not active
  }

  if (emergencyTriggered) {
    return (
      <div className="bg-red-600 text-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🚨</div>
          <h2 className="text-2xl font-bold mb-2">EMERGENCY ALERT SENT</h2>
          <p className="text-lg mb-4">
            Your emergency contacts have been notified with your location and nearby police stations.
          </p>

          {/* Show which phone numbers received alerts */}
          {alertResults && (
            <div className="mt-4 p-4 bg-red-700 rounded-lg text-left">
              <h3 className="font-semibold mb-3 text-lg">📱 Alert Sent To:</h3>
              
              {/* Contact alerts */}
              {alertResults.contacts && alertResults.contacts.length > 0 && (
                <div className="mb-3">
                  <p className="font-semibold mb-2">Emergency Contacts:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {alertResults.contacts.map((result, idx) => (
                      <li key={idx} className={result.success ? "text-green-200" : "text-yellow-200"}>
                        {result.success ? "✅" : "⚠️"} {result.contact || "Contact"} - {result.phone}
                        {result.error && <span className="text-xs block ml-4">Error: {result.error}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Police station alerts */}
              {alertResults.policeStations && alertResults.policeStations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-500">
                  <p className="font-semibold mb-2">🚔 Police Stations:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {alertResults.policeStations.map((result, idx) => (
                      <li key={idx} className="text-green-200">
                        ✅ {result.contact} - {result.phone}
                        {result.note && <span className="text-xs block ml-4">{result.note}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <p className="text-sm mt-4 opacity-90">
            Help is on the way. Stay safe!
          </p>
        </div>
      </div>
    );
  }

  if (showCheckInPrompt) {
    return (
      <div className="bg-yellow-500 text-white rounded-2xl shadow-lg p-6 mb-6 animate-pulse">
        <div className="text-center">
          <div className="text-4xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold mb-4">Safety Check-In Required</h2>
          <p className="text-lg mb-6">
            Are you safe? Please confirm your safety status.
          </p>
          
          {noResponseCountdown !== null && noResponseCountdown > 0 && (
            <div className="mb-6 p-4 bg-red-600 rounded-lg">
              <p className="text-sm font-semibold mb-2">
                ⚠️ Emergency alert will be sent in:
              </p>
              <p className="text-3xl font-bold mb-2">
                {formatTime(noResponseCountdown)}
              </p>
              <p className="text-xs opacity-90">
                If you don't respond, emergency alert will be sent to your contacts and nearby police stations
              </p>
            </div>
          )}
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleCheckIn(true)}
              disabled={loading}
              className="px-8 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 transition-all"
            >
              ✅ I'm Safe
            </button>
            <button
              onClick={() => handleCheckIn(false)}
              disabled={loading}
              className="px-8 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 transition-all"
            >
              🚨 I'm NOT Safe
            </button>
          </div>
          
          {error && (
            <p className="text-red-200 mt-4 text-sm">{error}</p>
          )}
          
          <p className="text-sm mt-4 opacity-90">
            If you don't respond within 3 minutes, an emergency alert will be sent automatically to your contacts and nearby police stations.
          </p>
        </div>
      </div>
    );
  }

  if (sosActive) {
    return (
      <div className="bg-orange-100 border-2 border-orange-400 rounded-2xl shadow-lg p-6 mb-6">
        <div className="text-center">
          <div className="text-3xl mb-3">🛡️</div>
          <h2 className="text-xl font-bold text-orange-800 mb-2">SOS Alert Active</h2>
          <p className="text-orange-700 mb-4">
            Next safety check-in in:
          </p>
          <div className="text-4xl font-bold text-orange-800 mb-4">
            {timeRemaining !== null ? formatTime(timeRemaining) : "..."}
          </div>
          <p className="text-sm text-orange-600">
            You will be prompted to confirm your safety at the next check-in time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-blue-800 mb-4">🛡️ SOS Safety Alert System</h2>
      
      <p className="text-blue-700 mb-4">
        Enable periodic safety check-ins. If you don't respond or indicate you're not safe, 
        an emergency alert will be sent to your contacts with your location and nearby police stations.
      </p>

      <div className="mb-4">
        <label className="block font-semibold text-blue-800 mb-2">
          Check-In Interval
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[2, 5, 10, 20].map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => setCheckInInterval(minutes)}
              disabled={loading}
              className={`p-3 border-2 rounded-lg font-semibold transition-all ${
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
        <p className="text-xs text-gray-600 mt-1 italic">
          Default: 10 minutes (selected automatically if you don't choose)
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleStartSOS}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "Starting..." : "🛡️ Start SOS Alert System"}
      </button>
    </div>
  );
}

