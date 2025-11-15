import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

export default function SOSAlert({ userId, isLocationSharing }) {
  const [sosActive, setSosActive] = useState(false);
  const [checkInInterval, setCheckInInterval] = useState(10); // 5, 10, or 20 minutes
  const [timeRemaining, setTimeRemaining] = useState(null); // seconds
  const [nextCheckIn, setNextCheckIn] = useState(null);
  const [showCheckInPrompt, setShowCheckInPrompt] = useState(false);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        clearTimeout(checkInTimeoutRef.current);
      }
    };
  }, [userId, isLocationSharing]);

  // Check SOS status from backend
  const checkSOSStatus = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.liveLocation.sos.status(userId));
      if (res.data.isActive) {
        setSosActive(true);
        setCheckInInterval(res.data.checkInIntervalMinutes);
        setNextCheckIn(new Date(res.data.nextCheckIn));
        startCountdown(new Date(res.data.nextCheckIn));
      }
      if (res.data.emergencyTriggered) {
        setEmergencyTriggered(true);
        setSosActive(false);
      }
    } catch (err) {
      console.error("Error checking SOS status:", err);
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
        
        // Auto-trigger emergency after 30 seconds if no response
        checkInTimeoutRef.current = setTimeout(() => {
          triggerEmergencyNoResponse();
        }, 30000); // 30 seconds grace period
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
    } catch (err) {
      setError(err.response?.data?.error || "Failed to start SOS alert system");
      console.error("Error starting SOS:", err);
    } finally {
      setLoading(false);
    }
  };

  // User checks in (safe or not safe)
  const handleCheckIn = async (isSafe) => {
    setLoading(true);
    setError("");

    // Clear timeout if user responds
    if (checkInTimeoutRef.current) {
      clearTimeout(checkInTimeoutRef.current);
    }

    try {
      const res = await axios.post(API_ENDPOINTS.liveLocation.sos.checkin, {
        userId,
        isSafe: isSafe
      });

      if (res.data.emergencyTriggered) {
        setEmergencyTriggered(true);
        setSosActive(false);
        setShowCheckInPrompt(false);
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
      await axios.post(API_ENDPOINTS.liveLocation.sos.emergency, {
        userId
      });
      setEmergencyTriggered(true);
      setSosActive(false);
      setShowCheckInPrompt(false);
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
          <p className="text-lg">
            Your emergency contacts have been notified with your location and nearby police stations.
          </p>
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
            If you don't respond, an emergency alert will be sent automatically.
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
        <div className="grid grid-cols-3 gap-2">
          {[5, 10, 20].map((minutes) => (
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

