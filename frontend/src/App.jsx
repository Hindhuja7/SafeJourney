/**
 * Main App component for SafeJourney
 * Modern UI with dark/light mode and enhanced interactions
 */

import { useState, useEffect, useRef } from 'react';
import Map from './Map.jsx';
import NavigationView from './NavigationView.jsx';
import { fetchSafeRoutes, geocodeLocation, searchAutocomplete, reverseGeocode } from './api.js';
import './App.css';

function App() {
  const [originName, setOriginName] = useState('');
  const [destName, setDestName] = useState('');
  const [originLat, setOriginLat] = useState('');
  const [originLon, setOriginLon] = useState('');
  const [destLat, setDestLat] = useState('');
  const [destLon, setDestLon] = useState('');
  const [routes, setRoutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [safestRouteIndex, setSafestRouteIndex] = useState(-1);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(-1);
  const [geocodingOrigin, setGeocodingOrigin] = useState(false);
  const [geocodingDest, setGeocodingDest] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationRoute, setNavigationRoute] = useState(null);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [hoveredRouteIndex, setHoveredRouteIndex] = useState(-1);
  
  const originInputRef = useRef(null);
  const destInputRef = useRef(null);
  const originTimeoutRef = useRef(null);
  const destTimeoutRef = useRef(null);

  const origin = originLat && originLon ? [parseFloat(originLon), parseFloat(originLat)] : null;
  const destination = destLat && destLon ? [parseFloat(destLon), parseFloat(destLat)] : null;

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.setAttribute('data-theme', !darkMode ? 'dark' : 'light');
  };

  // Initialize theme
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setGettingCurrentLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          setOriginLat(lat.toString());
          setOriginLon(lon.toString());

          const result = await reverseGeocode(lat, lon);
          if (result && result.address) {
            setOriginName(result.address);
          } else {
            setOriginName(`Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
          }

          setGettingCurrentLocation(false);
        } catch (error) {
          console.error('Error reverse geocoding current location:', error);
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setOriginLat(lat.toString());
          setOriginLon(lon.toString());
          setOriginName(`Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
          setGettingCurrentLocation(false);
        }
      },
      (error) => {
        console.error('Error getting current location:', error);
        setError('Failed to get your current location. Please allow location access.');
        setGettingCurrentLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleGeocodeOrigin = async () => {
    if (!originName.trim()) {
      setError('Please enter an origin location');
      return;
    }

    setGeocodingOrigin(true);
    setError(null);
    try {
      const result = await geocodeLocation(originName);
      setOriginLat(result.lat.toString());
      setOriginLon(result.lon.toString());
      setOriginName(result.address);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to find origin location');
    } finally {
      setGeocodingOrigin(false);
    }
  };

  const handleGeocodeDest = async () => {
    if (!destName.trim()) {
      setError('Please enter a destination location');
      return;
    }

    setGeocodingDest(true);
    setError(null);
    try {
      const result = await geocodeLocation(destName);
      setDestLat(result.lat.toString());
      setDestLon(result.lon.toString());
      setDestName(result.address);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to find destination location');
    } finally {
      setGeocodingDest(false);
    }
  };

  const handleFindRoutes = async () => {
    if (!originLat || !originLon || !destLat || !destLon) {
      setError('Please enter both origin and destination locations');
      return;
    }

    const originLatNum = parseFloat(originLat);
    const originLonNum = parseFloat(originLon);
    const destLatNum = parseFloat(destLat);
    const destLonNum = parseFloat(destLon);

    if (isNaN(originLatNum) || isNaN(originLonNum) || isNaN(destLatNum) || isNaN(destLonNum)) {
      setError('Invalid coordinates. Please search for locations by name.');
      return;
    }

    setLoading(true);
    setError(null);
    setRoutes(null);
    setSelectedRouteIndex(-1);

    try {
      console.log('Fetching routes from API...', {
        origin: { lat: originLatNum, lon: originLonNum },
        destination: { lat: destLatNum, lon: destLonNum }
      });

      const data = await fetchSafeRoutes(originLatNum, originLonNum, destLatNum, destLonNum);
      console.log('Received routes data:', data);

      if (!data || !data.routes || data.routes.length === 0) {
        setError('No routes found between these locations');
        return;
      }

      setRoutes(data.routes);
      const safestIdx = data.safestRouteIndex || 0;
      setSafestRouteIndex(safestIdx);
      setSelectedRouteIndex(safestIdx);
      
      console.log(`Successfully loaded ${data.routes.length} routes`);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch routes. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (index) => {
    setSelectedRouteIndex(index);
  };

  const handleStartNavigation = (route) => {
    console.log('Start Navigation clicked for route:', route);

    if (!route) {
      setError('Please select a route to navigate');
      return;
    }

    if (navigator.geolocation) {
      console.log('Starting navigation immediately...');
      setNavigationRoute(route);
      setIsNavigating(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Location permission granted for GPS tracking');
        },
        (error) => {
          console.warn('Location permission denied:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.log('Starting navigation (geolocation not supported, GPS tracking disabled)');
      setNavigationRoute(route);
      setIsNavigating(true);
      setError(null);
    }
  };

  const handleExitNavigation = () => {
    setIsNavigating(false);
    setNavigationRoute(null);
  };

  const handleReroute = (newRoute) => {
    setNavigationRoute(newRoute);
    if (routes && routes.length > 0) {
      const updatedRoutes = [...routes];
      updatedRoutes[selectedRouteIndex] = newRoute;
      setRoutes(updatedRoutes);
    }
  };

  const handleMapClick = async (coords, type) => {
    try {
      const result = await reverseGeocode(coords.lat, coords.lon);

      if (type === 'origin') {
        setOriginLat(coords.lat.toString());
        setOriginLon(coords.lon.toString());
        if (result && result.address) {
          setOriginName(result.address);
        }
      } else if (type === 'destination') {
        setDestLat(coords.lat.toString());
        setDestLon(coords.lon.toString());
        if (result && result.address) {
          setDestName(result.address);
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding map click:', error);
      if (type === 'origin') {
        setOriginLat(coords.lat.toString());
        setOriginLon(coords.lon.toString());
        setOriginName(`Lat: ${coords.lat.toFixed(4)}, Lon: ${coords.lon.toFixed(4)}`);
      } else if (type === 'destination') {
        setDestLat(coords.lat.toString());
        setDestLon(coords.lon.toString());
        setDestName(`Lat: ${coords.lat.toFixed(4)}, Lon: ${coords.lon.toFixed(4)}`);
      }
    }
  };

  // Autocomplete for origin
  const handleOriginInputChange = (value) => {
    setOriginName(value);
    setShowOriginSuggestions(true);

    if (originTimeoutRef.current) {
      clearTimeout(originTimeoutRef.current);
    }

    if (value.trim().length >= 2) {
      originTimeoutRef.current = setTimeout(async () => {
        try {
          const suggestions = await searchAutocomplete(value, 5);
          setOriginSuggestions(suggestions);
        } catch (error) {
          console.error('Error fetching origin suggestions:', error);
          setOriginSuggestions([]);
        }
      }, 300);
    } else {
      setOriginSuggestions([]);
    }
  };

  // Autocomplete for destination
  const handleDestInputChange = (value) => {
    setDestName(value);
    setShowDestSuggestions(true);

    if (destTimeoutRef.current) {
      clearTimeout(destTimeoutRef.current);
    }

    if (value.trim().length >= 2) {
      destTimeoutRef.current = setTimeout(async () => {
        try {
          const suggestions = await searchAutocomplete(value, 5);
          setDestSuggestions(suggestions);
        } catch (error) {
          console.error('Error fetching destination suggestions:', error);
          setDestSuggestions([]);
        }
      }, 300);
    } else {
      setDestSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleOriginSuggestionSelect = (suggestion) => {
    setOriginName(suggestion.address);
    setOriginLat(suggestion.lat.toString());
    setOriginLon(suggestion.lon.toString());
    setShowOriginSuggestions(false);
    setOriginSuggestions([]);
  };

  const handleDestSuggestionSelect = (suggestion) => {
    setDestName(suggestion.address);
    setDestLat(suggestion.lat.toString());
    setDestLon(suggestion.lon.toString());
    setShowDestSuggestions(false);
    setDestSuggestions([]);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (originInputRef.current && !originInputRef.current.contains(event.target)) {
        setShowOriginSuggestions(false);
      }
      if (destInputRef.current && !destInputRef.current.contains(event.target)) {
        setShowDestSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show navigation view if navigating
  if (isNavigating && navigationRoute) {
    console.log('Rendering NavigationView with route:', navigationRoute);
    const originCoords = (originLat && originLon) ? [parseFloat(originLon), parseFloat(originLat)] : null;
    const destinationCoords = (destLat && destLon) ? [parseFloat(destLon), parseFloat(destLat)] : null;
    return (
      <NavigationView
        route={navigationRoute}
        origin={originCoords}
        destination={destinationCoords}
        onExit={handleExitNavigation}
        onReroute={handleReroute}
      />
    );
  }

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🛡️</div>
            <div>
              <h1>SafeJourney</h1>
              <span className="tagline">Safety-Aware Routing</span>
            </div>
          </div>
          <div className="header-controls">
            <button 
              className="theme-toggle"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Input Section */}
      <div className="input-section">
        <div className="input-grid">
          {/* Origin */}
          <div ref={originInputRef} className="input-group">
            <label className="input-label">
              <span className="label-icon">📍</span>
              Origin Location
            </label>
            <div className="input-row">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={originName}
                  onChange={(e) => handleOriginInputChange(e.target.value)}
                  onFocus={() => originName.length >= 2 && setShowOriginSuggestions(true)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGeocodeOrigin()}
                  placeholder="e.g., Hyderabad, Telangana"
                  className="location-input"
                />
                {showOriginSuggestions && originSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {originSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleOriginSuggestionSelect(suggestion)}
                        className="suggestion-item"
                      >
                        <div className="suggestion-primary">
                          {suggestion.poiName || suggestion.address}
                        </div>
                        {suggestion.poiName && (
                          <div className="suggestion-secondary">
                            {suggestion.address}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleGeocodeOrigin}
                disabled={geocodingOrigin}
                className="btn btn-primary"
              >
                {geocodingOrigin ? <div className="spinner"></div> : 'Search'}
              </button>
              <button
                onClick={handleUseCurrentLocation}
                disabled={gettingCurrentLocation}
                className="btn btn-secondary"
                title="Use your current GPS location as origin"
              >
                {gettingCurrentLocation ? <div className="spinner"></div> : '📍 Current'}
              </button>
            </div>
            <div className="input-hint">
              Or click on map to select | Lat: {originLat || 'N/A'}, Lon: {originLon || 'N/A'}
            </div>
          </div>

          {/* Destination */}
          <div ref={destInputRef} className="input-group">
            <label className="input-label">
              <span className="label-icon">🎯</span>
              Destination Location
            </label>
            <div className="input-row">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={destName}
                  onChange={(e) => handleDestInputChange(e.target.value)}
                  onFocus={() => destName.length >= 2 && setShowDestSuggestions(true)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGeocodeDest()}
                  placeholder="e.g., Narayanaguda, Hyderabad"
                  className="location-input"
                />
                {showDestSuggestions && destSuggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {destSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleDestSuggestionSelect(suggestion)}
                        className="suggestion-item"
                      >
                        <div className="suggestion-primary">
                          {suggestion.poiName || suggestion.address}
                        </div>
                        {suggestion.poiName && (
                          <div className="suggestion-secondary">
                            {suggestion.address}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleGeocodeDest}
                disabled={geocodingDest}
                className="btn btn-primary"
              >
                {geocodingDest ? <div className="spinner"></div> : 'Search'}
              </button>
            </div>
            <div className="input-hint">
              Or click on map to select | Lat: {destLat || 'N/A'}, Lon: {destLon || 'N/A'}
            </div>
          </div>
        </div>
        <div className="action-section">
          <button
            onClick={handleFindRoutes}
            disabled={loading || !originLat || !destLat}
            className="btn btn-action"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Finding Safe Routes...
              </>
            ) : (
              <>
                <span className="btn-icon">🛡️</span>
                Find Safe Routes
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Map */}
        <div className="map-container">
          <Map
            origin={origin}
            destination={destination}
            routes={routes}
            safestRouteIndex={safestRouteIndex}
            selectedRouteIndex={selectedRouteIndex}
            onMapClick={handleMapClick}
          />
        </div>

        {/* Routes List */}
        {routes && routes.length > 0 && (
          <div className="routes-sidebar">
            <div className="sidebar-header">
              <h2>Available Routes</h2>
              <span className="subtitle">Sorted by Safety Score</span>
            </div>
            <div className="routes-list">
              {routes.map((route, index) => {
                const isSafest = index === safestRouteIndex;
                const isSelected = index === selectedRouteIndex;
                const isHovered = index === hoveredRouteIndex;
                const riskPercent = (route.riskScore * 100).toFixed(1);
                const distanceKm = route.summary?.lengthInMeters ? (route.summary.lengthInMeters / 1000).toFixed(2) : 'N/A';
                const timeMin = route.summary?.travelTimeInSeconds ? Math.round(route.summary.travelTimeInSeconds / 60) : 'N/A';

                return (
                  <div
                    key={route.id || index}
                    onClick={() => handleRouteSelect(index)}
                    onMouseEnter={() => setHoveredRouteIndex(index)}
                    onMouseLeave={() => setHoveredRouteIndex(-1)}
                    className={`route-card ${isSelected ? 'selected' : ''} ${isSafest ? 'safest' : ''} ${isHovered ? 'hovered' : ''}`}
                  >
                    <div className="route-header">
                      <div className="route-title">
                        <h3>Route {index + 1}</h3>
                        <div className="route-badges">
                          {isSafest && (
                            <span className="badge badge-safest">
                              🛡️ SAFEST
                            </span>
                          )}
                          {isSelected && (
                            <span className="badge badge-selected">
                              ✅ SELECTED
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="risk-indicator">
                        <div className="risk-value">{riskPercent}%</div>
                        <div className="risk-label">Risk Score</div>
                      </div>
                    </div>
                    
                    <div className="route-stats">
                      <div className="stat">
                        <span className="stat-icon">📏</span>
                        <span className="stat-value">{distanceKm} km</span>
                      </div>
                      <div className="stat">
                        <span className="stat-icon">⏱️</span>
                        <span className="stat-value">{timeMin} min</span>
                      </div>
                      <div className="stat">
                        <span className="stat-icon">🛣️</span>
                        <span className="stat-value">{route.segments?.length || 0} segments</span>
                      </div>
                    </div>

                    {/* Hover Card for Detailed Info */}
                    {isHovered && (
                      <div className="route-hover-card">
                        <div className="hover-card-content">
                          <h4>Route {index + 1} Details</h4>
                          <div className="detail-grid">
                            <div className="detail-item">
                              <span className="detail-label">Total Distance:</span>
                              <span className="detail-value">{distanceKm} km</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Estimated Time:</span>
                              <span className="detail-value">{timeMin} minutes</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Safety Score:</span>
                              <span className="detail-value">{riskPercent}% risk</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Route Segments:</span>
                              <span className="detail-value">{route.segments?.length || 0}</span>
                            </div>
                          </div>
                          <div className="safety-meter">
                            <div className="safety-labels">
                              <span>Low Risk</span>
                              <span>High Risk</span>
                            </div>
                            <div className="meter-bar">
                              <div 
                                className="meter-fill"
                                style={{ width: `${riskPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartNavigation(route);
                      }}
                      className="btn btn-navigation"
                    >
                      <span className="btn-icon">🧭</span>
                      Start Navigation
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;