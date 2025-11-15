/**
 * Main App component for SafeJourney
 * Provides UI for origin/destination input and displays routes
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
  const originInputRef = useRef(null);
  const destInputRef = useRef(null);
  const originTimeoutRef = useRef(null);
  const destTimeoutRef = useRef(null);

  const origin = originLat && originLon ? [parseFloat(originLon), parseFloat(originLat)] : null;
  const destination = destLat && destLon ? [parseFloat(destLon), parseFloat(destLat)] : null;

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

          // Set coordinates
          setOriginLat(lat.toString());
          setOriginLon(lon.toString());

          // Reverse geocode to get address name
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
    // Validate inputs
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
      console.log('Fetching routes...');
      const data = await fetchSafeRoutes(originLatNum, originLonNum, destLatNum, destLonNum);
      console.log('Received routes data:', {
        routeCount: data.routes?.length || 0,
        safestIndex: data.safestRouteIndex
      });

      if (!data || !data.routes || data.routes.length === 0) {
        setError('No routes found');
        return;
      }

      setRoutes(data.routes);
      const safestIdx = data.safestRouteIndex || 0;
      setSafestRouteIndex(safestIdx);
      setSelectedRouteIndex(safestIdx); // Select safest route by default
      console.log('Routes set successfully');

      // Debug: Log first route structure
      if (data.routes && data.routes.length > 0) {
        const firstRoute = data.routes[0];
        console.log('First route structure:', {
          hasSegments: !!firstRoute.segments,
          segmentCount: firstRoute.segments?.length || 0,
          firstSegment: firstRoute.segments?.[0],
          hasGeometry: !!firstRoute.geometry,
          geometryPoints: firstRoute.geometry?.points?.length || 0
        });
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch routes');
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

    // Request location permission before starting navigation
    if (navigator.geolocation) {
      // Start navigation immediately - no delay
      console.log('Starting navigation immediately...');
      setNavigationRoute(route);
      setIsNavigating(true);
      setError(null); // Clear any previous errors

      // Request location permission in background (for GPS tracking)
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
      // Start navigation even if geolocation is not supported
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
    // Update the routes list with the new route
    if (routes && routes.length > 0) {
      const updatedRoutes = [...routes];
      updatedRoutes[selectedRouteIndex] = newRoute;
      setRoutes(updatedRoutes);
    }
  };

  const handleMapClick = async (coords, type) => {
    try {
      // Reverse geocode to get address name
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
      // Still set coordinates even if reverse geocoding fails
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

    // Clear previous timeout
    if (originTimeoutRef.current) {
      clearTimeout(originTimeoutRef.current);
    }

    // Debounce autocomplete search
    if (value.trim().length >= 2) {
      originTimeoutRef.current = setTimeout(async () => {
        try {
          const suggestions = await searchAutocomplete(value, 5);
          setOriginSuggestions(suggestions);
        } catch (error) {
          console.error('Error fetching origin suggestions:', error);
          setOriginSuggestions([]);
        }
      }, 300); // 300ms delay
    } else {
      setOriginSuggestions([]);
    }
  };

  // Autocomplete for destination
  const handleDestInputChange = (value) => {
    setDestName(value);
    setShowDestSuggestions(true);

    // Clear previous timeout
    if (destTimeoutRef.current) {
      clearTimeout(destTimeoutRef.current);
    }

    // Debounce autocomplete search
    if (value.trim().length >= 2) {
      destTimeoutRef.current = setTimeout(async () => {
        try {
          const suggestions = await searchAutocomplete(value, 5);
          setDestSuggestions(suggestions);
        } catch (error) {
          console.error('Error fetching destination suggestions:', error);
          setDestSuggestions([]);
        }
      }, 300); // 300ms delay
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>SafeJourney - Safety-Aware Routing</h1>
      </header>

      {/* Input Section */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #ddd'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Origin */}
          <div ref={originInputRef} style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Origin Location
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={originName}
                  onChange={(e) => handleOriginInputChange(e.target.value)}
                  onFocus={() => originName.length >= 2 && setShowOriginSuggestions(true)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGeocodeOrigin()}
                  placeholder="e.g., Hyderabad, Telangana"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                {showOriginSuggestions && originSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginTop: '2px'
                  }}>
                    {originSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleOriginSuggestionSelect(suggestion)}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          borderBottom: index < originSuggestions.length - 1 ? '1px solid #eee' : 'none',
                          hover: { backgroundColor: '#f0f0f0' }
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                          {suggestion.poiName || suggestion.address}
                        </div>
                        {suggestion.poiName && (
                          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
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
                style={{
                  padding: '8px 16px',
                  backgroundColor: geocodingOrigin ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: geocodingOrigin ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {geocodingOrigin ? '...' : 'Search'}
              </button>
              <button
                onClick={handleUseCurrentLocation}
                disabled={gettingCurrentLocation}
                style={{
                  padding: '8px 16px',
                  backgroundColor: gettingCurrentLocation ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: gettingCurrentLocation ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}
                title="Use your current GPS location as origin"
              >
                {gettingCurrentLocation ? '...' : '📍 Current Location'}
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Or click on map to select | Lat: {originLat || 'N/A'}, Lon: {originLon || 'N/A'}
            </div>
          </div>

          {/* Destination */}
          <div ref={destInputRef} style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Destination Location
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={destName}
                  onChange={(e) => handleDestInputChange(e.target.value)}
                  onFocus={() => destName.length >= 2 && setShowDestSuggestions(true)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGeocodeDest()}
                  placeholder="e.g., Narayanaguda, Hyderabad"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                {showDestSuggestions && destSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginTop: '2px'
                  }}>
                    {destSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleDestSuggestionSelect(suggestion)}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          borderBottom: index < destSuggestions.length - 1 ? '1px solid #eee' : 'none'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                          {suggestion.poiName || suggestion.address}
                        </div>
                        {suggestion.poiName && (
                          <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
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
                style={{
                  padding: '8px 16px',
                  backgroundColor: geocodingDest ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: geocodingDest ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {geocodingDest ? '...' : 'Search'}
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Or click on map to select | Lat: {destLat || 'N/A'}, Lon: {destLon || 'N/A'}
            </div>
          </div>
        </div>
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <button
            onClick={handleFindRoutes}
            disabled={loading}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {loading ? 'Finding Routes...' : 'Find Safe Routes'}
          </button>
        </div>
        {error && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
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
          <div style={{
            width: '350px',
            backgroundColor: 'white',
            borderLeft: '1px solid #ddd',
            overflowY: 'auto',
            padding: '20px'
          }}>
            <h2 style={{ marginTop: 0, fontSize: '20px', marginBottom: '15px' }}>
              Routes (Sorted by Safety)
            </h2>
            {routes.map((route, index) => {
              const isSafest = index === safestRouteIndex;
              const isSelected = index === selectedRouteIndex;
              const riskPercent = (route.riskScore * 100).toFixed(1);

              return (
                <div
                  key={route.id}
                  onClick={() => handleRouteSelect(index)}
                  style={{
                    padding: '15px',
                    marginBottom: '15px',
                    border: isSelected ? '3px solid #007bff' : (isSafest ? '2px solid #28a745' : '1px solid #ddd'),
                    borderRadius: '6px',
                    backgroundColor: isSelected ? '#e7f3ff' : (isSafest ? '#f0fff4' : 'white'),
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>
                      Route {route.id + 1}
                      {isSafest && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 8px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'normal'
                        }}>
                          SAFEST
                        </span>
                      )}
                      {isSelected && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 8px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'normal'
                        }}>
                          SELECTED
                        </span>
                      )}
                    </h3>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    Risk Score: <strong>{riskPercent}%</strong>
                  </div>
                  {route.summary && (
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {route.summary.lengthInMeters && (
                        <div>Distance: {(route.summary.lengthInMeters / 1000).toFixed(2)} km</div>
                      )}
                      {route.summary.travelTimeInSeconds && (
                        <div>Time: {Math.round(route.summary.travelTimeInSeconds / 60)} min</div>
                      )}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                    Segments: {route.segments?.length || 0}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartNavigation(route);
                    }}
                    style={{
                      width: '100%',
                      marginTop: '12px',
                      padding: '10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                  >
                    🧭 Start Navigation
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
