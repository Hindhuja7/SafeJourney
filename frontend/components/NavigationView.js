/**
 * Navigation View Component for Next.js
 * Full-screen navigation mode with turn-by-turn instructions
 * Client-side only component
 */

import { useEffect, useState, useRef } from 'react';
import { NavigationEngine, NavigationState } from './navigation/NavigationEngine';
import { GPSTracker } from './navigation/GPSTracker';
import { VoiceGuidance } from './navigation/VoiceGuidance';
import { ReroutingService } from './navigation/ReroutingService';
import InstructionsPanel from './navigation/InstructionsPanel';
import dynamic from 'next/dynamic';

// Dynamically import Map to ensure it's client-side only
const Map = dynamic(() => import('./MapViewClientTomTom'), { ssr: false });

export default function NavigationView({ route, origin, destination, onExit, onReroute }) {
  const [mounted, setMounted] = useState(false);
  const [navigationState, setNavigationState] = useState('idle');
  const [currentInstruction, setCurrentInstruction] = useState(null);
  const [distanceToTurn, setDistanceToTurn] = useState(null);
  const [distanceRemaining, setDistanceRemaining] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isRerouting, setIsRerouting] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const engineRef = useRef(null);
  const gpsTrackerRef = useRef(null);
  const voiceGuidanceRef = useRef(null);
  const reroutingServiceRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !route || typeof window === 'undefined') return;

    // Create route geometry if not present
    let routeWithGeometry = route;
    if (!route.geometry && origin && destination) {
      routeWithGeometry = {
        ...route,
        geometry: {
          points: [
            { lat: origin[1], lon: origin[0] },
            { lat: destination[1], lon: destination[0] }
          ]
        }
      };
    }

    try {
      const engine = new NavigationEngine(
        routeWithGeometry,
        (newState) => {
          setNavigationState(newState);
          if (newState === NavigationState.ARRIVED) {
            voiceGuidanceRef.current?.speak('You have arrived at your destination');
          }
        },
        (instruction) => {
          setCurrentInstruction(instruction);
        }
      );
      engineRef.current = engine;

      const voice = new VoiceGuidance({ enabled: true });
      voiceGuidanceRef.current = voice;

      const gps = new GPSTracker({
        enableHighAccuracy: true,
        updateInterval: 2000
      });
      gpsTrackerRef.current = gps;

      const rerouting = new ReroutingService({
        deviationThreshold: 50,
        rerouteDelay: 2000
      });
      rerouting.onReroute((newRoute) => {
        setIsRerouting(false);
        if (onReroute) onReroute(newRoute);
        engineRef.current?.updateRoute(newRoute);
      });
      rerouting.onRerouteError((error) => {
        setIsRerouting(false);
        console.error('Rerouting failed:', error);
      });
      reroutingServiceRef.current = rerouting;

      if (!GPSTracker.isAvailable()) {
        setGpsError('GPS is not available in this browser');
        return;
      }

      const routeDestination = routeWithGeometry.geometry?.points?.[routeWithGeometry.geometry.points.length - 1] ||
        (destination ? { lat: destination[1], lon: destination[0] } : null);

      gps.start(
        (position) => {
          setUserPosition([position.lon, position.lat]);
          setCurrentSpeed(position.speed ? (position.speed * 3.6) : 0);

          const update = engineRef.current?.updatePosition(position.lat, position.lon);

          if (!update) return;

          if (update.arrived) return;

          if (update.deviated && update.needsReroute && routeDestination) {
            setIsRerouting(true);
            reroutingServiceRef.current?.checkAndReroute(update, position, { lat: routeDestination.lat, lon: routeDestination.lon });
          } else {
            setCurrentInstruction(update.currentInstruction);
            setDistanceToTurn(update.currentInstruction?.distanceToInstruction || null);
            setDistanceRemaining(update.distanceRemaining || null);
            setProgress(update.progress || 0);

            if (update.currentInstruction && update.currentInstruction.distanceToInstruction && update.currentInstruction.distanceToInstruction < 200) {
              voiceGuidanceRef.current?.speakInstruction(update.currentInstruction, update.currentInstruction.distanceToInstruction);
            }
          }
        },
        (error) => {
          setGpsError(error.message || 'Unable to get your location');
        }
      );

      voice.speak('Navigation started. Follow the route.');
    } catch (error) {
      console.error('Error setting up navigation:', error);
      setGpsError(`Error: ${error.message}`);
    }

    return () => {
      if (gpsTrackerRef.current) gpsTrackerRef.current.stop();
      if (voiceGuidanceRef.current) voiceGuidanceRef.current.stop();
      if (reroutingServiceRef.current) reroutingServiceRef.current.reset();
      if (engineRef.current) engineRef.current.stop();
    };
  }, [mounted, route, origin, destination, onReroute]);

  const handleExit = () => {
    if (gpsTrackerRef.current) gpsTrackerRef.current.stop();
    if (voiceGuidanceRef.current) voiceGuidanceRef.current.stop();
    if (reroutingServiceRef.current) reroutingServiceRef.current.reset();
    if (engineRef.current) engineRef.current.stop();
    if (onExit) onExit();
  };

  const formatDistance = (meters) => {
    if (!meters) return '--';
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  if (!mounted || !route) {
    return (
      <div className="fixed inset-0 z-[10000] bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Loading Navigation...</h2>
          <button onClick={onExit} className="px-6 py-3 bg-gray-200 rounded-lg">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Prepare route data for map display
  // origin and destination are passed as [lon, lat] arrays, but MapViewClient expects [lat, lon]
  const mapRoutes = route ? [route] : [];
  const mapCoords = origin && destination ? {
    source: Array.isArray(origin) ? [origin[1], origin[0]] : [origin.lat, origin.lon], // Convert [lon, lat] to [lat, lon]
    destination: Array.isArray(destination) ? [destination[1], destination[0]] : [destination.lat, destination.lon]
  } : null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col">
      {/* Navigation Map */}
      <div className="flex-1 relative">
        {mapCoords && mapRoutes.length > 0 ? (
          <Map routes={mapRoutes} coords={mapCoords} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-800">
            <div className="text-center">
              <p className="text-xl mb-2">Navigation Map</p>
              <p className="text-sm opacity-75">Loading route...</p>
            </div>
          </div>
        )}

        {/* Navigation Overlay - Top */}
        <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4 z-[1000]">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm opacity-80 mb-1">
                {isRerouting ? 'Re-routing...' : 'Navigation Active'}
              </div>
              <div className="text-xl font-bold">
                {currentInstruction?.text || 'Calculating route...'}
              </div>
            </div>
            <button
              onClick={handleExit}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Navigation Info - Bottom Left */}
        <div className="absolute bottom-5 left-5 bg-white bg-opacity-95 rounded-lg p-4 shadow-lg z-[1000] min-w-[200px]">
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-1">Distance to Turn</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatDistance(distanceToTurn)}
            </div>
          </div>

          <div className="mb-3 pt-3 border-t border-gray-300">
            <div className="text-xs text-gray-600 mb-1">Distance Remaining</div>
            <div className="text-xl font-bold">
              {formatDistance(distanceRemaining)}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-300">
            <div className="text-xs text-gray-600 mb-1">Current Speed</div>
            <div className="text-lg font-bold">
              {currentSpeed > 0 ? `${Math.round(currentSpeed)} km/h` : '--'}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="text-xs text-gray-600 mb-1">Route Progress</div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1 text-right">
              {Math.round(progress * 100)}%
            </div>
          </div>
        </div>

        {/* Instructions Toggle */}
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="absolute bottom-5 right-5 px-5 py-3 bg-white bg-opacity-95 rounded-lg font-bold shadow-lg z-[1000]"
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>

        {/* Instructions Panel */}
        {showInstructions && engineRef.current && (
          <div className="absolute top-20 right-5 w-80 max-h-[calc(100vh-120px)] z-[1000]">
            <InstructionsPanel
              instructions={engineRef.current.getInstructions()}
              currentInstructionIndex={currentInstruction?.index || 0}
            />
          </div>
        )}

        {/* GPS Error */}
        {gpsError && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white p-4 rounded-lg z-[1001] shadow-lg">
            <div className="font-bold mb-1">GPS Error</div>
            <div className="text-sm">{gpsError}</div>
            <button
              onClick={() => setGpsError(null)}
              className="mt-2 px-3 py-1 bg-white text-red-600 rounded text-sm"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

