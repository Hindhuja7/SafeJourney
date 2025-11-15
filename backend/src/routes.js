/**
 * API routes for SafeJourney backend
 * Main endpoint: /safe-routes
 */

import express from 'express';
import { fetchRoutes, fetchIncidents, fetchTrafficFlow, fetchPOIs, calculateBoundingBox, geocodeAddress, searchAutocomplete, reverseGeocode } from './tomtom.js';
import {
  splitRouteIntoSegments,
  calculateSegmentRisk,
  calculateRouteRisk,
  calculateLightingScore,
  calculateIncidentScore,
  calculateTrafficFlowScore,
  calculatePOISafetyScore,
  calculateIsolationScore,
  calculateTimeOfDayScore
} from './scoring.js';

/**
 * Extract turn-by-turn instructions from route
 */
function extractRouteInstructions(route) {
  const instructions = [];
  
  if (!route.geometry || !route.geometry.points || route.geometry.points.length < 2) {
    return instructions;
  }
  
  const points = route.geometry.points;
  
  // Start instruction
  instructions.push({
    type: 'start',
    text: 'Start navigation',
    point: { lat: points[0].lat, lon: points[0].lon },
    distance: 0
  });
  
  // Extract turns from route segments
  // This is a simplified version - in production, you'd parse TomTom's maneuver data
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const current = points[i];
    const next = points[i + 1];
    
    // Calculate bearing change to detect turns
    const bearing1 = Math.atan2(
      current.lon - prev.lon,
      current.lat - prev.lat
    ) * 180 / Math.PI;
    const bearing2 = Math.atan2(
      next.lon - current.lon,
      next.lat - current.lat
    ) * 180 / Math.PI;
    
    let angleChange = bearing2 - bearing1;
    if (angleChange > 180) angleChange -= 360;
    if (angleChange < -180) angleChange += 360;
    
    if (Math.abs(angleChange) > 15) {
      let turnType = 'continue';
      if (angleChange > 15 && angleChange < 165) {
        turnType = 'turn-right';
      } else if (angleChange < -15 && angleChange > -165) {
        turnType = 'turn-left';
      } else if (Math.abs(angleChange) >= 165) {
        turnType = 'u-turn';
      }
      
      instructions.push({
        type: turnType,
        text: `Turn ${turnType === 'turn-left' ? 'left' : turnType === 'turn-right' ? 'right' : 'around'}`,
        point: { lat: current.lat, lon: current.lon },
        angle: angleChange
      });
    }
  }
  
  // Arrival instruction
  const lastPoint = points[points.length - 1];
  instructions.push({
    type: 'arrive',
    text: 'You have arrived at your destination',
    point: { lat: lastPoint.lat, lon: lastPoint.lon },
    distance: 0
  });
  
  return instructions;
}

const router = express.Router();

/**
 * POST /geocode
 * Body: { query: "location name" }
 * Returns: { lat, lon, address } or null
 */
router.post('/geocode', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }
    
    const result = await geocodeAddress(query);
    
    if (!result) {
      // Check if it's a network error vs not found
      return res.status(404).json({ 
        error: 'Location not found or network error. Please check your internet connection and try again.' 
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error in /geocode endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /autocomplete
 * Body: { query: "partial location name", limit: 5 }
 * Returns: Array of suggestion objects
 */
router.post('/autocomplete', async (req, res) => {
  try {
    const { query, limit } = req.body;
    
    if (!query || query.trim() === '') {
      return res.json([]);
    }
    
    const suggestions = await searchAutocomplete(query, limit || 5);
    res.json(suggestions);
  } catch (error) {
    console.error('Error in /autocomplete endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /reverse-geocode
 * Body: { lat: number, lon: number }
 * Returns: { address, lat, lon }
 */
router.post('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lon } = req.body;
    
    if (lat == null || lon == null) {
      return res.status(400).json({ error: 'Missing lat or lon parameter' });
    }
    
    const result = await reverseGeocode(parseFloat(lat), parseFloat(lon));
    
    if (!result) {
      return res.status(404).json({ 
        error: 'Address not found or network error' 
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error in /reverse-geocode endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /navigation/instructions
 * Body: { route: routeObject }
 * Returns: Array of turn-by-turn instructions
 */
router.post('/navigation/instructions', async (req, res) => {
  try {
    const { route } = req.body;
    
    if (!route) {
      return res.status(400).json({ error: 'Missing route parameter' });
    }
    
    // Extract instructions from route geometry
    const instructions = extractRouteInstructions(route);
    
    res.json({ instructions });
  } catch (error) {
    console.error('Error extracting instructions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /navigation/reroute
 * Query params: currentLat, currentLon, destLat, destLon
 * Returns: New route from current position to destination
 */
router.get('/navigation/reroute', async (req, res) => {
  try {
    const { currentLat, currentLon, destLat, destLon } = req.query;
    
    if (!currentLat || !currentLon || !destLat || !destLon) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Use existing safe-routes logic but from current position
    const originLatNum = parseFloat(currentLat);
    const originLonNum = parseFloat(currentLon);
    const destLatNum = parseFloat(destLat);
    const destLonNum = parseFloat(destLon);
    
    // Fetch routes (this will use the same logic as /safe-routes)
    const tomtomRoutes = await fetchRoutes(originLatNum, originLonNum, destLatNum, destLonNum);
    
    if (!tomtomRoutes || tomtomRoutes.length === 0) {
      return res.status(404).json({ error: 'No routes found' });
    }
    
    // Return the first route (fastest) for rerouting
    // In a full implementation, you'd want to recalculate safety scores
    res.json({ route: tomtomRoutes[0] });
  } catch (error) {
    console.error('Error in reroute:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /safe-routes
 * Query params: originLat, originLon, destLat, destLon
 * Returns: Enriched route data with safety scores
 */
router.get('/safe-routes', async (req, res) => {
  try {
    const { originLat, originLon, destLat, destLon } = req.query;
    
    // Validate input
    if (!originLat || !originLon || !destLat || !destLon) {
      return res.status(400).json({
        error: 'Missing required parameters: originLat, originLon, destLat, destLon'
      });
    }
    
    const originLatNum = parseFloat(originLat);
    const originLonNum = parseFloat(originLon);
    const destLatNum = parseFloat(destLat);
    const destLonNum = parseFloat(destLon);
    
    if (isNaN(originLatNum) || isNaN(originLonNum) || isNaN(destLatNum) || isNaN(destLonNum)) {
      return res.status(400).json({
        error: 'Invalid coordinates. All parameters must be valid numbers.'
      });
    }
    
    console.log(`Fetching safe routes from (${originLatNum}, ${originLonNum}) to (${destLatNum}, ${destLonNum})`);
    
    // Step 1: Fetch TomTom routes
    const tomtomRoutes = await fetchRoutes(originLatNum, originLonNum, destLatNum, destLonNum);
    
    if (!tomtomRoutes || tomtomRoutes.length === 0) {
      return res.status(404).json({
        error: 'No routes found'
      });
    }
    
    console.log(`Found ${tomtomRoutes.length} routes`);
    
    // Step 2: Collect all route coordinates to calculate bounding box
    const allCoordinates = [];
    for (const route of tomtomRoutes) {
      if (route.legs && route.legs.length > 0) {
        for (const leg of route.legs) {
          if (leg.points && leg.points.length > 0) {
            for (const point of leg.points) {
              // TomTom returns points as {latitude, longitude}
              allCoordinates.push([point.longitude, point.latitude]);
            }
          }
        }
      }
      // Also check for route-level points if available
      if (route.points && route.points.length > 0) {
        for (const point of route.points) {
          allCoordinates.push([point.longitude, point.latitude]);
        }
      }
    }
    
    // Step 3: Calculate bounding box and fetch incidents
    const bbox = calculateBoundingBox(allCoordinates);
    console.log('Fetching incidents for bounding box:', bbox);
    const incidents = await fetchIncidents(bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat);
    console.log(`Found ${incidents.length} incidents`);
    
    // Step 4: Fetch POIs for the area (use center of bounding box)
    const centerLat = (bbox.minLat + bbox.maxLat) / 2;
    const centerLon = (bbox.minLon + bbox.maxLon) / 2;
    const radius = Math.max(
      Math.abs(bbox.maxLat - bbox.minLat) * 111000, // Convert lat diff to meters
      Math.abs(bbox.maxLon - bbox.minLon) * 111000 * Math.cos(centerLat * Math.PI / 180)
    );
    
    console.log('Fetching POIs...');
    const pois = await fetchPOIs(centerLat, centerLon, Math.min(radius, 5000)); // Max 5km radius
    console.log(`Found ${pois.length} POIs`);
    
    // Step 5: Deduplicate routes before processing
    // Remove routes that are too similar (same distance/time)
    const uniqueRoutes = [];
    const routeSignatures = new Set();
    
    for (const route of tomtomRoutes) {
      let currentRoute = route;
      if (Array.isArray(currentRoute) && currentRoute.length > 0) {
        currentRoute = currentRoute[0];
      }
      
      const summary = currentRoute.summary || {};
      const distance = summary.lengthInMeters || 0;
      const time = summary.travelTimeInSeconds || 0;
      
      // Create a signature based on distance and time (rounded to avoid floating point issues)
      const signature = `${Math.round(distance / 100)}_${Math.round(time / 10)}`;
      
      if (!routeSignatures.has(signature)) {
        routeSignatures.add(signature);
        uniqueRoutes.push(currentRoute);
        console.log(`Added unique route: distance=${(distance/1000).toFixed(2)}km, time=${(time/60).toFixed(0)}min`);
      } else {
        console.log(`Skipped duplicate route: distance=${(distance/1000).toFixed(2)}km, time=${(time/60).toFixed(0)}min`);
      }
    }
    
    console.log(`Processing ${uniqueRoutes.length} unique routes (from ${tomtomRoutes.length} total)`);
    
    // Step 6: Process each unique route
    const enrichedRoutes = [];
    
    for (let i = 0; i < uniqueRoutes.length; i++) {
      let route = uniqueRoutes[i];
      
      // Route is already unwrapped from deduplication step
      
      // Log route structure for debugging
      if (i === 0) {
        console.log('Sample route structure keys:', Object.keys(route));
        if (route.legs) console.log('Route has legs:', route.legs.length);
        if (route.sections) console.log('Route has sections:', route.sections.length);
      }
      
      // Extract route points from TomTom response
      // TomTom Routing API returns points in route.legs[].points or route.sections[].points
      const routePoints = [];
      
      // Try legs first (this is what TomTom uses)
      if (route.legs && Array.isArray(route.legs) && route.legs.length > 0) {
        for (const leg of route.legs) {
          if (leg.points && Array.isArray(leg.points) && leg.points.length > 0) {
            for (const point of leg.points) {
              if (point.latitude !== undefined && point.longitude !== undefined) {
                routePoints.push([point.latitude, point.longitude]);
              }
            }
          }
        }
      }
      
      // Try sections (newer format)
      if (routePoints.length === 0 && route.sections && Array.isArray(route.sections) && route.sections.length > 0) {
        for (const section of route.sections) {
          if (section.points && Array.isArray(section.points) && section.points.length > 0) {
            for (const point of section.points) {
              if (point.latitude !== undefined && point.longitude !== undefined) {
                routePoints.push([point.latitude, point.longitude]);
              }
            }
          }
        }
      }
      
      // Try direct points array
      if (routePoints.length === 0 && route.points && Array.isArray(route.points)) {
        for (const point of route.points) {
          const lat = point.latitude || point.lat;
          const lon = point.longitude || point.lon;
          if (lat !== undefined && lon !== undefined) {
            routePoints.push([lat, lon]);
          }
        }
      }
      
      if (routePoints.length === 0) {
        console.warn(`Route ${i} has no point data. Route keys:`, Object.keys(route));
        console.warn('Route sample:', JSON.stringify(route).substring(0, 500));
        continue;
      }
      
      console.log(`Route ${i} extracted ${routePoints.length} points`);
      
      // Create a simple string representation for segment splitting
      // Format: "lat,lon|lat,lon|..."
      const routePolyline = routePoints.map(p => `${p[0]},${p[1]}`).join('|');
      
      // Split route into segments (pass points array directly)
      const segments = splitRouteIntoSegments(routePoints);
      
      if (segments.length === 0) {
        console.warn(`Route ${i} has no segments, skipping`);
        continue;
      }
      
      // Process each segment
      const enrichedSegments = [];
      console.log(`Processing ${segments.length} segments for route ${i}...`);
      
      // Optimize: Sample traffic flow data (every 10th segment) to speed up processing
      // Use cached flow data for nearby segments
      const flowDataCache = new Map();
      let defaultFlowData = null;
      
      const getFlowData = async (lat, lon) => {
        // Round to 2 decimal places for caching (about 1km precision)
        const key = `${Math.round(lat * 100) / 100},${Math.round(lon * 100) / 100}`;
        if (!flowDataCache.has(key)) {
          try {
            const flowData = await fetchTrafficFlow(lat, lon);
            flowDataCache.set(key, flowData);
            if (!defaultFlowData) defaultFlowData = flowData; // Store first as default
            return flowData;
          } catch (e) {
            // If API fails, use default or null
            return defaultFlowData || null;
          }
        }
        return flowDataCache.get(key);
      };
      
      // Pre-fetch flow data for a few sample points along the route
      const sampleIndices = [0, Math.floor(segments.length / 4), Math.floor(segments.length / 2), Math.floor(segments.length * 3 / 4), segments.length - 1];
      for (const idx of sampleIndices) {
        if (segments[idx]) {
          const midLat = (segments[idx].start.lat + segments[idx].end.lat) / 2;
          const midLon = (segments[idx].start.lon + segments[idx].end.lon) / 2;
          await getFlowData(midLat, midLon);
        }
      }
      
      let processedCount = 0;
      for (const segment of segments) {
        processedCount++;
        if (processedCount % 50 === 0) {
          console.log(`  Processed ${processedCount}/${segments.length} segments...`);
        }
        
        // Get traffic flow for segment midpoint (use cached data)
        const midLat = (segment.start.lat + segment.end.lat) / 2;
        const midLon = (segment.start.lon + segment.end.lon) / 2;
        const flowData = await getFlowData(midLat, midLon);
        
        // Validate segment has valid coordinates
        if (!segment.start || !segment.end || 
            segment.start.lat == null || segment.start.lon == null ||
            segment.end.lat == null || segment.end.lon == null) {
          console.warn(`Skipping invalid segment in route ${i}`);
          continue;
        }
        
        // Calculate segment risk
        const riskScore = calculateSegmentRisk(segment, incidents, pois, flowData);
        
        // Ensure riskScore is a valid number
        const validRiskScore = (typeof riskScore === 'number' && !isNaN(riskScore)) ? riskScore : 0.5;
        
        // Ensure length is valid
        const validLength = (typeof segment.length === 'number' && !isNaN(segment.length)) ? segment.length : 0;
        
        enrichedSegments.push({
          start: {
            lat: segment.start.lat,
            lon: segment.start.lon
          },
          end: {
            lat: segment.end.lat,
            lon: segment.end.lon
          },
          length: validLength,
          riskScore: validRiskScore
        });
      }
      
      console.log(`Route ${i} processed ${enrichedSegments.length} segments`);
      
      // Calculate route risk (length-weighted average)
      const routeRiskScore = calculateRouteRisk(enrichedSegments);
      
      // Limit segment data sent to frontend to avoid huge responses
      // Send only essential segment data (start, end, riskScore) for visualization
      const simplifiedSegments = enrichedSegments.map(seg => ({
        start: seg.start,
        end: seg.end,
        length: seg.length,
        riskScore: seg.riskScore
        // Omit detailed features to reduce response size
      }));
      
      enrichedRoutes.push({
        id: i,
        riskScore: routeRiskScore,
        segments: simplifiedSegments,
        geometry: {
          polyline: routePolyline,
          points: routePoints.map(p => ({ lat: p[0], lon: p[1] }))
        },
        summary: route.summary || {}
      });
      
      console.log(`Route ${i} completed with risk score: ${routeRiskScore.toFixed(3)}`);
    }
    
    console.log(`All routes processed. Sorting by safety...`);
    
    // Step 6: Sort routes by risk (ascending - lowest risk = safest)
    enrichedRoutes.sort((a, b) => a.riskScore - b.riskScore);
    
    // Step 7: Find safest route index
    const safestRouteIndex = enrichedRoutes.length > 0 ? 0 : -1;
    
    console.log(`Returning ${enrichedRoutes.length} routes. Safest route index: ${safestRouteIndex}`);
    
    // Return response
    res.json({
      safestRouteIndex,
      routes: enrichedRoutes
    });
    
  } catch (error) {
    console.error('Error in /safe-routes endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;

