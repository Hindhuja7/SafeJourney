// components/navigation/NavigationView.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import MapViewClient from "../MapViewClient";

export default function NavigationView({ route, origin, destination, originName, destinationName, onExit }) {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [currentInstruction, setCurrentInstruction] = useState(null);
  const [upcomingInstructions, setUpcomingInstructions] = useState([]);
  const [distanceToNextTurn, setDistanceToNextTurn] = useState(null);
  const [currentStreet, setCurrentStreet] = useState(null);
  const [distanceRemaining, setDistanceRemaining] = useState(route?.distance_km || 0);
  const [eta, setEta] = useState(route?.duration_min || 0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [instructions, setInstructions] = useState([]);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  
  const positionWatchRef = useRef(null);
  const distanceIntervalRef = useRef(null);

  useEffect(() => {
    // Fetch navigation instructions from backend
    const fetchInstructions = async () => {
      if (!route) return;
      
      try {
        // For now, generate instructions from route geometry
        // In production, use TomTom's Navigation SDK or API
        const generatedInstructions = generateInstructionsFromRoute(route);
        setInstructions(generatedInstructions);
        
        if (generatedInstructions.length > 0) {
          setCurrentInstruction(generatedInstructions[0]);
          setUpcomingInstructions(generatedInstructions.slice(1));
          setCurrentInstructionIndex(0);
        }
      } catch (error) {
        console.error("Error fetching instructions:", error);
        // Fallback: generate basic instructions
        const basicInstructions = generateBasicInstructions(route);
        setInstructions(basicInstructions);
        if (basicInstructions.length > 0) {
          setCurrentInstruction(basicInstructions[0]);
          setUpcomingInstructions(basicInstructions.slice(1));
        }
      }
    };

    fetchInstructions();
  }, [route]);

  // Start GPS tracking when navigation starts
  useEffect(() => {
    if (!isNavigating) return;

    if ("geolocation" in navigator) {
      positionWatchRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentPosition({ lat: latitude, lon: longitude });
          updateNavigation(position.coords);
        },
        (error) => {
          console.error("GPS error:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }

    return () => {
      if (positionWatchRef.current !== null) {
        navigator.geolocation.clearWatch(positionWatchRef.current);
      }
      if (distanceIntervalRef.current) {
        clearInterval(distanceIntervalRef.current);
      }
    };
  }, [isNavigating, instructions]);

  const generateInstructionsFromRoute = (route) => {
    const instructions = [];
    
    if (!route.geometry || !route.geometry.points || route.geometry.points.length < 2) {
      return generateBasicInstructions(route);
    }

    const points = route.geometry.points;
    
    // Start instruction
    instructions.push({
      type: "start",
      text: "Start navigation",
      icon: "🚀",
      distance: 0,
      point: { lat: points[0].lat || points[0][0], lon: points[0].lon || points[0][1] }
    });

    // Generate turn instructions from route points
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];
      
      const prevLat = prev.lat || prev[0] || prev.latitude;
      const prevLon = prev.lon || prev[1] || prev.longitude;
      const currLat = current.lat || current[0] || current.latitude;
      const currLon = current.lon || current[1] || current.longitude;
      const nextLat = next.lat || next[0] || next.latitude;
      const nextLon = next.lon || next[1] || next.longitude;

      if (!prevLat || !prevLon || !currLat || !currLon || !nextLat || !nextLon) continue;

      // Calculate bearing change
      const bearing1 = Math.atan2(currLon - prevLon, currLat - prevLat) * 180 / Math.PI;
      const bearing2 = Math.atan2(nextLon - currLon, nextLat - currLat) * 180 / Math.PI;
      
      let angleChange = bearing2 - bearing1;
      if (angleChange > 180) angleChange -= 360;
      if (angleChange < -180) angleChange += 360;

      // Only create instruction for significant turns (>30 degrees)
      if (Math.abs(angleChange) > 30) {
        let turnType = "straight";
        let icon = "→";
        let text = "Continue straight";

        if (angleChange > 30 && angleChange < 120) {
          turnType = "turn-right";
          icon = "→";
          text = "Turn right";
        } else if (angleChange < -30 && angleChange > -120) {
          turnType = "turn-left";
          icon = "←";
          text = "Turn left";
        } else if (Math.abs(angleChange) >= 120) {
          turnType = "u-turn";
          icon = "↷";
          text = "Make a U-turn";
        }

        // Calculate distance from previous instruction
        const distance = calculateDistance(
          instructions[instructions.length - 1].point.lat,
          instructions[instructions.length - 1].point.lon,
          currLat,
          currLon
        );

        instructions.push({
          type: turnType,
          text,
          icon,
          distance: Math.round(distance),
          point: { lat: currLat, lon: currLon },
          angle: angleChange
        });
      }
    }

    // Arrival instruction
    const lastPoint = points[points.length - 1];
    const lastLat = lastPoint.lat || lastPoint[0] || lastPoint.latitude;
    const lastLon = lastPoint.lon || lastPoint[1] || lastPoint.longitude;
    
    if (lastLat && lastLon) {
      const distance = calculateDistance(
        instructions[instructions.length - 1].point.lat,
        instructions[instructions.length - 1].point.lon,
        lastLat,
        lastLon
      );

      instructions.push({
        type: "arrive",
        text: "You have arrived",
        icon: "✓",
        distance: Math.round(distance),
        point: { lat: lastLat, lon: lastLon }
      });
    }

    return instructions;
  };

  const generateBasicInstructions = (route) => {
    return [
      {
        type: "start",
        text: "Start navigation",
        icon: "🚀",
        distance: 0,
        point: { lat: origin?.[0] || 0, lon: origin?.[1] || 0 }
      },
      {
        type: "arrive",
        text: `Arrive at ${destinationName || "destination"}`,
        icon: "✓",
        distance: Math.round(route?.distance_km * 1000 || 0),
        point: { lat: destination?.[0] || 0, lon: destination?.[1] || 0 }
      }
    ];
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const updateNavigation = (coords) => {
    if (!instructions.length || currentInstructionIndex >= instructions.length) return;

    const currentInst = instructions[currentInstructionIndex];
    if (!currentInst) return;

    const distanceToInstruction = calculateDistance(
      coords.latitude,
      coords.longitude,
      currentInst.point.lat,
      currentInst.point.lon
    );

    setDistanceToNextTurn(distanceToInstruction);

    // Update remaining distance and ETA
    const remainingKm = (route?.distance_km || 0) - (distanceToInstruction / 1000);
    setDistanceRemaining(Math.max(0, remainingKm));

    const avgSpeed = 50; // Assume 50 km/h average
    const remainingMinutes = (remainingKm / avgSpeed) * 60;
    setEta(Math.max(0, Math.round(remainingMinutes)));

    // Move to next instruction if close enough (within 50 meters)
    if (distanceToInstruction < 50 && currentInstructionIndex < instructions.length - 1) {
      const nextIndex = currentInstructionIndex + 1;
      setCurrentInstructionIndex(nextIndex);
      setCurrentInstruction(instructions[nextIndex]);
      setUpcomingInstructions(instructions.slice(nextIndex + 1));
    }
  };

  const startNavigation = () => {
    setIsNavigating(true);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    if (positionWatchRef.current !== null) {
      navigator.geolocation.clearWatch(positionWatchRef.current);
    }
  };

  const getInstructionColor = (type) => {
    switch (type) {
      case "start":
        return "bg-blue-500";
      case "turn-left":
        return "bg-orange-500";
      case "turn-right":
        return "bg-green-500";
      case "u-turn":
        return "bg-red-500";
      case "arrive":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden" style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Map View - Full Screen */}
      <div className="absolute inset-0 w-full h-full" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
        <MapViewClient 
          routes={route ? [route] : []}
          coords={{
            source: origin || [],
            destination: destination || []
          }}
          selectedRoute={route}
        />
        
        {/* Current Position Marker */}
        {currentPosition && isNavigating && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Navigation Instructions Overlay - Top */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 pt-12 z-10">
        {/* Header with route info */}
        <div className="flex items-center justify-between">
          <div className="text-white flex-1 min-w-0">
            <p className="text-sm opacity-90 truncate">{originName || "Starting point"}</p>
            <p className="text-xs opacity-70 truncate">→ {destinationName || "Destination"}</p>
          </div>
          <button
            onClick={onExit}
            className="px-3 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all text-sm ml-4 flex-shrink-0"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main Instruction Card - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-10" style={{ maxHeight: '50vh' }}>
        {!isNavigating ? (
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Navigate</h2>
              <p className="text-gray-600">Distance: {route?.distance_km || 0} km • Duration: {Math.round(route?.duration_min || 0)} min</p>
            </div>
            <button
              onClick={startNavigation}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              🧭 Start Navigation
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full max-h-[50vh] overflow-hidden">
            {/* Current Instruction */}
            {currentInstruction && (
              <div className={`p-6 ${getInstructionColor(currentInstruction.type)} text-white flex-shrink-0`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-6xl flex-shrink-0">{currentInstruction.icon}</div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-3xl font-bold">{formatDistance(distanceToNextTurn || currentInstruction.distance)}</p>
                    <p className="text-sm opacity-90">to next turn</p>
                  </div>
                </div>
                <p className="text-2xl font-bold mb-2 truncate">{currentInstruction.text}</p>
                {currentStreet && (
                  <p className="text-sm opacity-90 truncate">{currentStreet}</p>
                )}
              </div>
            )}

            {/* Route Stats */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 border-t flex-shrink-0">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Remaining</p>
                <p className="text-base font-bold text-gray-900">{distanceRemaining.toFixed(1)} km</p>
              </div>
              <div className="text-center border-x border-gray-300">
                <p className="text-xs text-gray-600 mb-1">ETA</p>
                <p className="text-base font-bold text-gray-900">{eta} min</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Safety</p>
                <p className="text-base font-bold text-green-600">{route?.aiScore?.toFixed(1) || "N/A"}/5.0</p>
              </div>
            </div>

            {/* Upcoming Instructions - Scrollable */}
            {upcomingInstructions.length > 0 && (
              <div className="overflow-y-auto flex-1 min-h-0 bg-white border-t">
                <div className="p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Upcoming Turns</p>
                  <div className="space-y-3">
                    {upcomingInstructions.slice(0, 5).map((inst, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <div className="text-2xl flex-shrink-0">{inst.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{inst.text}</p>
                          <p className="text-xs text-gray-600">{formatDistance(inst.distance)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stop Navigation Button */}
            <div className="p-4 border-t bg-white flex-shrink-0">
              <button
                onClick={stopNavigation}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all text-sm"
              >
                🛑 Stop Navigation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

