/**
 * Navigation View Component
 * Full-screen navigation mode with turn-by-turn instructions and map
 */

import { useEffect, useState, useRef } from 'react';
import { NavigationEngine, NavigationState } from './navigation/NavigationEngine.js';
import { GPSTracker } from './navigation/GPSTracker.js';
import { VoiceGuidance } from './navigation/VoiceGuidance.js';
import { ReroutingService } from './navigation/ReroutingService.js';
import Map from './Map.jsx';
import InstructionsPanel from './navigation/InstructionsPanel.jsx';

export default function NavigationView({ route, origin, destination, onExit, onReroute }) {
  const [navigationState, setNavigationState] = useState(NavigationState.IDLE);
  const [currentInstruction, setCurrentInstruction] = useState(null);
  const [distanceToTurn, setDistanceToTurn] = useState(null);
  const [distanceRemaining, setDistanceRemaining] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isRerouting, setIsRerouting] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [currentRoute, setCurrentRoute] = useState(route);

  console.log('NavigationView rendered with route:', route ? 'yes' : 'no', 'destination:', destination, 'origin:', origin);

  const engineRef = useRef(null);
  const gpsTrackerRef = useRef(null);
  const voiceGuidanceRef = useRef(null);
  const reroutingServiceRef = useRef(null);
  const hasSpokenStartRef = useRef(false);
  // Store original origin IMMEDIATELY - use the first non-null origin value we receive
  const originalOriginRef = useRef(null);
  const navigationStartTimeRef = useRef(null);
  const initialDeviationGracePeriod = 0; // No delay - start routing instantly

  // Store original origin when component mounts or origin changes (only set once, never change)
  useEffect(() => {
    if (origin && origin.length === 2 && origin[0] != null && origin[1] != null) {
      // Only set if we don't have one yet, or if current one is invalid
      if (!originalOriginRef.current ||
        !Array.isArray(originalOriginRef.current) ||
        originalOriginRef.current.length !== 2) {
        originalOriginRef.current = [...origin]; // Create a copy to avoid reference issues
        console.log('Stored original origin:', originalOriginRef.current);
      }
    }
  }, [origin]);

  // Update current route when route prop changes
  useEffect(() => {
    if (route) {
      setCurrentRoute(route);
    }
  }, [route]);

  useEffect(() => {
    if (!currentRoute) {
      console.warn('NavigationView: No route provided');
      return;
    }

    console.log('NavigationView: Initializing navigation with route:', currentRoute);

    try {
      // Initialize navigation engine
      const engine = new NavigationEngine(
        currentRoute,
        (newState) => {
          console.log('Navigation state changed:', newState);
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
      console.log('Navigation engine initialized');
    } catch (error) {
      console.error('Error initializing navigation engine:', error);
      return;
    }

    // Initialize voice guidance
    try {
      const voice = new VoiceGuidance({ enabled: true });
      voiceGuidanceRef.current = voice;
      console.log('Voice guidance initialized');
    } catch (error) {
      console.error('Error initializing voice guidance:', error);
      // Continue without voice guidance
      voiceGuidanceRef.current = null;
    }

    try {
      // Initialize GPS tracker
      const gps = new GPSTracker({
        enableHighAccuracy: true,
        updateInterval: 2000
      });
      gpsTrackerRef.current = gps;
      console.log('GPS tracker initialized');

      // Initialize rerouting service
      const rerouting = new ReroutingService({
        deviationThreshold: 50,
        rerouteDelay: 2000
      });
      rerouting.onReroute((newRoute) => {
        setIsRerouting(false);
        // Update current route but preserve original origin
        setCurrentRoute(newRoute);
        if (onReroute) {
          onReroute(newRoute);
        }
        // Update engine with new route
        engineRef.current?.updateRoute(newRoute);
        console.log('Route updated via rerouting, but origin preserved:', originalOriginRef.current);
      });
      rerouting.onRerouteError((error) => {
        setIsRerouting(false);
        console.error('Rerouting failed:', error);
      });
      reroutingServiceRef.current = rerouting;
      console.log('Rerouting service initialized');

      // Extract destination from route
      const routeDestination = currentRoute.geometry?.points?.[currentRoute.geometry.points.length - 1] ||
        (destination ? { lat: destination[1], lon: destination[0] } : null);
      console.log('Route destination:', routeDestination);

      // Check if GPS is available
      if (!GPSTracker.isAvailable()) {
        console.error('GPS is not available in this browser');
        return;
      }

      // Start GPS tracking
      console.log('Starting GPS tracking...');
      navigationStartTimeRef.current = Date.now(); // Record navigation start time
      gps.start(
        (position) => {
          console.log('GPS position update:', position);
          setUserPosition([position.lon, position.lat]);
          setCurrentSpeed(position.speed ? (position.speed * 3.6) : 0); // Convert m/s to km/h

          // Update navigation engine
          const update = engineRef.current?.updatePosition(position.lat, position.lon);

          if (!update) {
            console.warn('Navigation engine update returned null');
            return;
          }

          if (update.arrived) {
            console.log('Arrived at destination');
            return;
          }

          // No grace period - reroute immediately if needed
          if (update.deviated && update.needsReroute && routeDestination) {
            console.log('Deviation detected, triggering reroute immediately');
            setIsRerouting(true);
            if (reroutingServiceRef.current) {
              reroutingServiceRef.current.checkAndReroute(update, position, { lat: routeDestination.lat, lon: routeDestination.lon });
            }
          } else {
            setCurrentInstruction(update.currentInstruction);
            setDistanceToTurn(update.currentInstruction?.distanceToInstruction || null);
            setDistanceRemaining(update.distanceRemaining || null);
            setProgress(update.progress || 0);

            // Speak instruction if close to turn (within 200m)
            if (update.currentInstruction && update.currentInstruction.distanceToInstruction && update.currentInstruction.distanceToInstruction < 200) {
              voiceGuidanceRef.current?.speakInstruction(update.currentInstruction, update.currentInstruction.distanceToInstruction);
            }
          }
        },
        (error) => {
          console.error('GPS Error in NavigationView:', error);
          setGpsError(error.message || 'Unable to get your location');
          // Show error to user
          alert(`GPS Error: ${error.message || 'Unable to get your location. Please check your browser settings.'}`);
        }
      );

      // Speak start instruction only once
      if (!hasSpokenStartRef.current && voiceGuidanceRef.current) {
        hasSpokenStartRef.current = true;
        voiceGuidanceRef.current.speak('Navigation started. Follow the route.');
      }
      console.log('Navigation started successfully');
    } catch (error) {
      console.error('Error setting up navigation:', error);
      alert(`Error starting navigation: ${error.message}`);
    }

    return () => {
      console.log('Cleaning up navigation...');
      hasSpokenStartRef.current = false; // Reset flag on cleanup
      if (gpsTrackerRef.current) {
        gpsTrackerRef.current.stop();
      }
      if (voiceGuidanceRef.current) {
        voiceGuidanceRef.current.stop();
      }
      if (reroutingServiceRef.current) {
        reroutingServiceRef.current.reset();
      }
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, [currentRoute, destination, onReroute]);

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

  const formatTime = (meters, speedKmh) => {
    if (!meters || !speedKmh || speedKmh < 5) return '--';
    const hours = meters / 1000 / speedKmh;
    const minutes = Math.round(hours * 60);
    if (minutes < 1) return '< 1 min';
    return `${minutes} min`;
  };

  if (!currentRoute) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2>No route provided for navigation</h2>
        <button onClick={onExit} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Map View */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Map
          origin={originalOriginRef.current || origin}
          destination={destination || (currentRoute?.geometry?.points?.length > 0 ? [currentRoute.geometry.points[currentRoute.geometry.points.length - 1].lon, currentRoute.geometry.points[currentRoute.geometry.points.length - 1].lat] : null)}
          routes={currentRoute ? [currentRoute] : []}
          safestRouteIndex={0}
          selectedRouteIndex={0}
          navigationMode={true}
          userPosition={userPosition}
        />

        {/* GPS Error Display */}
        {gpsError && (
          <div style={{
            position: 'absolute',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '8px',
            zIndex: 1001,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>GPS Error</div>
            <div style={{ fontSize: '14px' }}>{gpsError}</div>
            <button
              onClick={() => setGpsError(null)}
              style={{
                marginTop: '10px',
                padding: '5px 10px',
                backgroundColor: 'white',
                color: '#dc3545',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Overlay - Top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '15px 20px',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '4px' }}>
                {isRerouting ? 'Re-routing...' : 'Navigation Active'}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {currentInstruction?.text || 'Calculating route...'}
              </div>
            </div>
            <button
              onClick={handleExit}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Exit
            </button>
          </div>
        </div>

        {/* Navigation Info - Bottom Left */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '8px',
          padding: '15px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          zIndex: 1000,
          minWidth: '200px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Distance to Turn</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
              {formatDistance(distanceToTurn)}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              {formatTime(distanceToTurn, currentSpeed)}
            </div>
          </div>

          <div style={{ marginBottom: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Distance Remaining</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {formatDistance(distanceRemaining)}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              {formatTime(distanceRemaining, currentSpeed)}
            </div>
          </div>

          <div style={{ paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Current Speed</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {currentSpeed > 0 ? `${Math.round(currentSpeed)} km/h` : '--'}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Route Progress</div>
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#e0e0e0',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress * 100}%`,
                height: '100%',
                backgroundColor: '#28a745',
                transition: 'width 0.3s'
              }} />
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px', textAlign: 'right' }}>
              {Math.round(progress * 100)}%
            </div>
          </div>
        </div>

        {/* Instructions Toggle Button */}
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            padding: '12px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 1000
          }}
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>

        {/* Instructions Panel */}
        {showInstructions && engineRef.current && (
          <div style={{
            position: 'absolute',
            top: '80px',
            right: '20px',
            width: '320px',
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 1000
          }}>
            <InstructionsPanel
              instructions={engineRef.current.getInstructions()}
              currentInstructionIndex={currentInstruction?.index || 0}
            />
          </div>
        )}
      </div>
    </div>
  );
}

