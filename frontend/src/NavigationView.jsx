/**
 * Enhanced Navigation View with modern dark theme
 * Includes built-in InstructionsPanel to avoid missing file errors
 */

import { useEffect, useState, useRef } from 'react';
import Map from './Map.jsx';

// Mock navigation engine for demonstration
class MockNavigationEngine {
  constructor(route, onStateChange, onInstructionChange) {
    this.route = route;
    this.onStateChange = onStateChange;
    this.onInstructionChange = onInstructionChange;
    this.instructions = this.generateInstructions();
  }

  generateInstructions() {
    return [
      { index: 0, type: 'start', text: 'Start navigation from current location', distance: 0, duration: 0 },
      { index: 1, type: 'continue', text: 'Continue straight on Main Road', distance: 1500, duration: 120 },
      { index: 2, type: 'turn-right', text: 'Turn right onto Highway 45', distance: 500, duration: 60 },
      { index: 3, type: 'continue', text: 'Continue for 2.5 km', distance: 2500, duration: 180 },
      { index: 4, type: 'turn-left', text: 'Turn left onto Destination Street', distance: 300, duration: 45 },
      { index: 5, type: 'arrive', text: 'Arrive at destination', distance: 0, duration: 0 }
    ];
  }

  updatePosition(lat, lon) {
    // Mock position update
    const progress = Math.min(0.3 + Math.random() * 0.5, 0.95); // Mock progress
    const currentInstruction = this.instructions[Math.floor(progress * this.instructions.length)];
    
    return {
      arrived: progress > 0.95,
      deviated: false,
      needsReroute: false,
      currentInstruction,
      distanceRemaining: this.route.summary?.lengthInMeters * (1 - progress) || 8500,
      progress
    };
  }

  getInstructions() {
    return this.instructions;
  }

  stop() {
    // Cleanup
  }
}

// Built-in InstructionsPanel component
function InstructionsPanel({ instructions, currentInstructionIndex, onInstructionClick }) {
  const panelRef = useRef(null);
  const currentRef = useRef(null);

  useEffect(() => {
    // Scroll to current instruction
    if (currentRef.current && panelRef.current) {
      currentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentInstructionIndex]);

  if (!instructions || instructions.length === 0) {
    return (
      <div className="instructions-panel">
        <div className="panel-header">
          <h3>Turn-by-Turn Instructions</h3>
        </div>
        <div className="no-instructions">
          <p>No instructions available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="instructions-panel" ref={panelRef}>
      <div className="panel-header">
        <h3>Turn-by-Turn Instructions</h3>
        <div className="instructions-count">
          {instructions.length} steps
        </div>
      </div>
      
      <div className="instructions-list">
        {instructions.map((instruction, index) => {
          const isCurrent = index === currentInstructionIndex;
          const isPast = index < currentInstructionIndex;
          const isFuture = index > currentInstructionIndex;

          return (
            <div
              key={index}
              ref={isCurrent ? currentRef : null}
              onClick={() => onInstructionClick && onInstructionClick(instruction, index)}
              className={`instruction-item ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''} ${isFuture ? 'future' : ''}`}
              style={{ cursor: onInstructionClick ? 'pointer' : 'default' }}
            >
              <div className="instruction-content">
                {/* Instruction Number and Icon */}
                <div className="instruction-marker">
                  <div className="instruction-number">
                    {isPast ? '✓' : index + 1}
                  </div>
                  <div className="instruction-line"></div>
                </div>

                {/* Instruction Icon */}
                <div className="instruction-icon">
                  {getInstructionIcon(instruction.type)}
                </div>

                {/* Instruction Text */}
                <div className="instruction-text">
                  <div className="instruction-main">
                    {instruction.text}
                  </div>
                  
                  {instruction.distance > 0 && (
                    <div className="instruction-distance">
                      {formatDistance(instruction.distance)}
                      {instruction.duration && (
                        <span className="instruction-duration">
                          • {formatDuration(instruction.duration)}
                        </span>
                      )}
                    </div>
                  )}

                  {instruction.safetyWarning && (
                    <div className="safety-warning">
                      <span className="warning-icon">⚠️</span>
                      {instruction.safetyWarning}
                    </div>
                  )}
                </div>

                {/* Status Indicator */}
                {isCurrent && (
                  <div className="current-indicator">
                    <div className="pulse-dot"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .instructions-panel {
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-light);
          max-height: 500px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-width: 320px;
        }

        .panel-header {
          padding: 1.25rem;
          border-bottom: 1px solid var(--border-light);
          background: var(--bg-secondary);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .instructions-count {
          font-size: 0.875rem;
          color: var(--text-tertiary);
          background: var(--bg-tertiary);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
        }

        .no-instructions {
          padding: 2rem;
          text-align: center;
          color: var(--text-tertiary);
          font-style: italic;
        }

        .instructions-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .instruction-item {
          padding: 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 0.75rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          background: var(--bg-primary);
          position: relative;
        }

        .instruction-item:hover {
          background: var(--bg-secondary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .instruction-item.current {
          background: rgba(59, 130, 246, 0.08);
          border-color: var(--accent-primary);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .instruction-item.past {
          opacity: 0.7;
          background: var(--bg-tertiary);
        }

        .instruction-item.past .instruction-number {
          background: var(--accent-success);
          color: white;
        }

        .instruction-content {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          position: relative;
        }

        .instruction-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .instruction-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.3s ease;
        }

        .instruction-item.current .instruction-number {
          background: var(--accent-primary);
          color: white;
          transform: scale(1.1);
        }

        .instruction-line {
          width: 2px;
          flex: 1;
          background: var(--border-light);
          border-radius: 1px;
        }

        .instruction-item:last-child .instruction-line {
          display: none;
        }

        .instruction-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .instruction-item.current .instruction-icon {
          background: var(--accent-primary);
          color: white;
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .instruction-item.past .instruction-icon {
          background: var(--text-tertiary);
          color: white;
        }

        .instruction-text {
          flex: 1;
          min-width: 0;
        }

        .instruction-main {
          font-weight: 500;
          font-size: 0.95rem;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .instruction-item.current .instruction-main {
          font-weight: 600;
          color: var(--accent-primary);
          font-size: 1rem;
        }

        .instruction-distance {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .instruction-duration {
          color: var(--text-tertiary);
          font-size: 0.75rem;
        }

        .safety-warning {
          font-size: 0.75rem;
          color: var(--accent-danger);
          background: rgba(239, 68, 68, 0.1);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          border-left: 3px solid var(--accent-danger);
        }

        .warning-icon {
          font-size: 0.9rem;
        }

        .current-indicator {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-success);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        /* Scrollbar Styling */
        .instructions-list::-webkit-scrollbar {
          width: 6px;
        }

        .instructions-list::-webkit-scrollbar-track {
          background: var(--bg-tertiary);
          border-radius: 3px;
        }

        .instructions-list::-webkit-scrollbar-thumb {
          background: var(--border-medium);
          border-radius: 3px;
        }

        .instructions-list::-webkit-scrollbar-thumb:hover {
          background: var(--text-tertiary);
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// Helper functions for InstructionsPanel
function getInstructionIcon(type) {
  const icons = {
    'depart': '🚀',
    'turn-left': '↰',
    'turn-right': '↱',
    'turn-sharp-left': '↲',
    'turn-sharp-right': '↳',
    'turn-slight-left': '⬋',
    'turn-slight-right': '⬊',
    'continue': '→',
    'uturn': '↶',
    'roundabout': '🔄',
    'fork': '⇶',
    'merge': '🔄',
    'ramp': '↗️',
    'exit': '↘️',
    'arrive': '🏁',
    'arrive-left': '🏁',
    'arrive-right': '🏁',
    'start': '📍'
  };

  return icons[type] || '•';
}

function formatDistance(meters) {
  if (!meters || meters < 0) return '';
  
  if (meters < 10) {
    return `${Math.round(meters)} m`;
  } else if (meters < 1000) {
    return `${Math.round(meters / 10) * 10} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
}

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '';
  
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}

// Main NavigationView Component
export default function NavigationView({ route, origin, destination, onExit, onReroute }) {
  const [navigationState, setNavigationState] = useState('NAVIGATING');
  const [currentInstruction, setCurrentInstruction] = useState(null);
  const [distanceToTurn, setDistanceToTurn] = useState(500);
  const [distanceRemaining, setDistanceRemaining] = useState(8500);
  const [progress, setProgress] = useState(0.3);
  const [currentSpeed, setCurrentSpeed] = useState(45);
  const [isRerouting, setIsRerouting] = useState(false);
  const [userPosition, setUserPosition] = useState(origin);
  const [showInstructions, setShowInstructions] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const engineRef = useRef(null);
  const gpsWatchId = useRef(null);

  useEffect(() => {
    if (!route) {
      console.warn('NavigationView: No route provided');
      return;
    }

    console.log('NavigationView: Initializing navigation with route:', route);

    // Initialize mock navigation engine
    engineRef.current = new MockNavigationEngine(
      route,
      setNavigationState,
      setCurrentInstruction
    );

    // Set initial instruction
    setCurrentInstruction(engineRef.current.getInstructions()[0]);

    // Start mock GPS updates
    const interval = setInterval(() => {
      if (userPosition) {
        // Simulate movement along the route
        const newLng = userPosition[0] + (Math.random() - 0.5) * 0.001;
        const newLat = userPosition[1] + (Math.random() - 0.5) * 0.001;
        setUserPosition([newLng, newLat]);
        setCurrentSpeed(30 + Math.random() * 30);
        
        // Update navigation state
        const update = engineRef.current.updatePosition(newLat, newLng);
        if (update) {
          setDistanceRemaining(update.distanceRemaining);
          setProgress(update.progress);
          if (update.currentInstruction) {
            setCurrentInstruction(update.currentInstruction);
            setDistanceToTurn(update.currentInstruction.distance || 0);
          }
        }
      }
    }, 3000);

    // Request real GPS if available
    if (navigator.geolocation) {
      gpsWatchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPosition = [
            position.coords.longitude,
            position.coords.latitude
          ];
          setUserPosition(newPosition);
          setCurrentSpeed(position.coords.speed ? (position.coords.speed * 3.6) : currentSpeed);
          setGpsError(null);
        },
        (error) => {
          console.error('GPS Error:', error);
          setGpsError('GPS signal weak. Using simulated navigation.');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }

    return () => {
      clearInterval(interval);
      if (gpsWatchId.current) {
        navigator.geolocation.clearWatch(gpsWatchId.current);
      }
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, [route]);

  const handleExit = () => {
    if (gpsWatchId.current) {
      navigator.geolocation.clearWatch(gpsWatchId.current);
    }
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

  const formatArrivalTime = () => {
    if (!distanceRemaining || !currentSpeed) return '--';
    const minutes = Math.round((distanceRemaining / 1000) / (currentSpeed / 60));
    const arrival = new Date(Date.now() + minutes * 60000);
    return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!route) {
    return (
      <div className="navigation-error">
        <div className="error-content">
          <h2>No route provided for navigation</h2>
          <button onClick={onExit} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="navigation-container">
      {/* Map View */}
      <div className="navigation-map">
        <Map
          origin={origin}
          destination={destination}
          routes={[route]}
          safestRouteIndex={0}
          selectedRouteIndex={0}
          navigationMode={true}
          userPosition={userPosition}
        />

        {/* GPS Error Display */}
        {gpsError && (
          <div className="gps-error-overlay">
            <div className="error-card">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <div className="error-title">GPS Notice</div>
                <div className="error-message">{gpsError}</div>
              </div>
              <button
                onClick={() => setGpsError(null)}
                className="btn btn-secondary"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Navigation Header */}
        <div className="navigation-header">
          <div className="header-content">
            <div className="nav-info">
              <div className="nav-status">
                {isRerouting ? (
                  <div className="rerouting-indicator">
                    <div className="spinner"></div>
                    Re-routing...
                  </div>
                ) : (
                  <div className="nav-active">
                    <div className="status-indicator"></div>
                    Navigation Active
                  </div>
                )}
              </div>
              <div className="current-instruction">
                {currentInstruction?.text || 'Follow the route'}
              </div>
            </div>
            <button
              onClick={handleExit}
              className="btn btn-danger"
            >
              Exit Navigation
            </button>
          </div>
        </div>

        {/* Navigation Info Panel */}
        <div className="navigation-info-panel">
          <div className="info-section">
            <div className="info-group">
              <div className="info-label">Distance to Turn</div>
              <div className="info-value primary">
                {formatDistance(distanceToTurn)}
              </div>
              <div className="info-subtext">
                {formatTime(distanceToTurn, currentSpeed)}
              </div>
            </div>

            <div className="info-divider"></div>

            <div className="info-group">
              <div className="info-label">Distance Remaining</div>
              <div className="info-value">
                {formatDistance(distanceRemaining)}
              </div>
              <div className="info-subtext">
                {formatTime(distanceRemaining, currentSpeed)}
              </div>
            </div>

            <div className="info-divider"></div>

            <div className="info-group">
              <div className="info-label">Current Speed</div>
              <div className="info-value">
                {currentSpeed > 0 ? `${Math.round(currentSpeed)} km/h` : '--'}
              </div>
              <div className="info-subtext">
                ETA: {formatArrivalTime()}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-header">
              <span>Route Progress</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Instructions Toggle */}
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="instructions-toggle"
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>

        {/* Instructions Panel */}
        {showInstructions && engineRef.current && (
          <div className="instructions-overlay">
            <InstructionsPanel
              instructions={engineRef.current.getInstructions()}
              currentInstructionIndex={currentInstruction?.index || 0}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .navigation-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          background: #0f172a;
          display: flex;
          flex-direction: column;
        }

        .navigation-map {
          flex: 1;
          position: relative;
          background: #0f172a;
        }

        .navigation-error {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .error-content {
          text-align: center;
          color: white;
        }

        .error-content h2 {
          margin-bottom: 2rem;
          font-size: 1.5rem;
        }

        .gps-error-overlay {
          position: absolute;
          top: 100px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1001;
        }

        .error-card {
          background: #f59e0b;
          color: white;
          padding: 1.25rem;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 300px;
        }

        .error-icon {
          font-size: 1.5rem;
        }

        .error-content {
          flex: 1;
        }

        .error-title {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .error-message {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .navigation-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
          backdrop-filter: blur(10px);
          color: white;
          padding: 1rem 1.5rem;
          z-index: 1000;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1400px;
          margin: 0 auto;
        }

        .nav-info {
          flex: 1;
        }

        .nav-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          opacity: 0.8;
        }

        .rerouting-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #fbbf24;
        }

        .nav-active {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .current-instruction {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background: #b91c1c;
        }

        .navigation-info-panel {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 1000;
          min-width: 280px;
          color: white;
        }

        .info-section {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .info-group {
          text-align: center;
          flex: 1;
        }

        .info-label {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .info-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .info-value.primary {
          color: #60a5fa;
        }

        .info-subtext {
          font-size: 0.75rem;
          color: #cbd5e1;
        }

        .info-divider {
          width: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        .progress-section {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1rem;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #94a3b8;
          margin-bottom: 0.5rem;
        }

        .progress-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #3b82f6);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .instructions-toggle {
          position: absolute;
          bottom: 20px;
          right: 20px;
          padding: 0.75rem 1.5rem;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(10px);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          z-index: 1000;
          transition: all 0.2s;
        }

        .instructions-toggle:hover {
          background: rgba(30, 41, 59, 0.95);
          transform: translateY(-1px);
        }

        .instructions-overlay {
          position: absolute;
          top: 80px;
          right: 20px;
          width: 350px;
          max-height: calc(100vh - 120px);
          z-index: 1000;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}