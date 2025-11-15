/**
 * Safety scoring module
 * Computes safety features and risk scores for route segments
 */

import { getDistance } from 'geolib';
import polyline from 'polyline';

/**
 * Split route geometry into segments of approximately 50 meters
 * @param {Array|string} routeData - Array of [lat, lon] pairs or encoded polyline string
 * @returns {Array<Object>} Array of segment objects with start, end, and length
 */
export function splitRouteIntoSegments(routeData) {
  try {
    let coordinates;
    
    // Handle both array of points and encoded polyline string
    if (Array.isArray(routeData)) {
      coordinates = routeData;
    } else if (typeof routeData === 'string') {
      // Try to decode if it's an encoded polyline
      try {
        coordinates = polyline.decode(routeData);
      } catch (e) {
        // If decode fails, try parsing as "lat,lon|lat,lon" format
        if (routeData.includes('|')) {
          coordinates = routeData.split('|').map(p => {
            const [lat, lon] = p.split(',').map(Number);
            return [lat, lon];
          });
        } else {
          throw new Error('Invalid polyline format');
        }
      }
    } else {
      return [];
    }
    
    if (!coordinates || coordinates.length < 2) {
      return [];
    }
    
    const segments = [];
    let currentSegment = {
      start: { lat: coordinates[0][0], lon: coordinates[0][1] },
      points: [[coordinates[0][0], coordinates[0][1]]]
    };
    
    let segmentLength = 0;
    const targetSegmentLength = 50; // 50 meters
    
    for (let i = 1; i < coordinates.length; i++) {
      const prevPoint = coordinates[i - 1];
      const currentPoint = coordinates[i];
      
      // Calculate distance between consecutive points
      const distance = getDistance(
        { latitude: prevPoint[0], longitude: prevPoint[1] },
        { latitude: currentPoint[0], longitude: currentPoint[1] }
      );
      
      segmentLength += distance;
      currentSegment.points.push([currentPoint[0], currentPoint[1]]);
      
      // If segment length exceeds target, finalize segment
      if (segmentLength >= targetSegmentLength || i === coordinates.length - 1) {
        currentSegment.end = { lat: currentPoint[0], lon: currentPoint[1] };
        currentSegment.length = segmentLength;
        segments.push(currentSegment);
        
        // Start new segment
        currentSegment = {
          start: { lat: currentPoint[0], lon: currentPoint[1] },
          points: [[currentPoint[0], currentPoint[1]]],
          length: 0
        };
        segmentLength = 0;
      }
    }
    
    return segments;
  } catch (error) {
    console.error('Error splitting route into segments:', error);
    return [];
  }
}

/**
 * Calculate incident score for a segment
 * @param {Object} segment - Segment object with start and end coordinates
 * @param {Array} incidents - Array of incident objects
 * @returns {number} Normalized incident score (0-1)
 */
export function calculateIncidentScore(segment, incidents) {
  if (!incidents || incidents.length === 0) {
    return 0;
  }
  
  let totalSeverity = 0;
  let count = 0;
  
  // Check if any incident is near this segment
  for (const incident of incidents) {
    if (!incident.geometry || !incident.geometry.coordinates) continue;
    
    const incidentCoords = incident.geometry.coordinates;
    const incidentLat = Array.isArray(incidentCoords[0]) ? incidentCoords[1] : incidentCoords[1];
    const incidentLon = Array.isArray(incidentCoords[0]) ? incidentCoords[0] : incidentCoords[0];
    
    // Check if incident is within 100m of segment
    const distToStart = getDistance(
      { latitude: segment.start.lat, longitude: segment.start.lon },
      { latitude: incidentLat, longitude: incidentLon }
    );
    const distToEnd = getDistance(
      { latitude: segment.end.lat, longitude: segment.end.lon },
      { latitude: incidentLat, longitude: incidentLon }
    );
    
    if (distToStart < 100 || distToEnd < 100) {
      // Severity: 1=low, 2=medium, 3=high, 4=critical
      const severity = incident.severity || 1;
      totalSeverity += severity;
      count++;
    }
  }
  
  // Normalize: max severity per incident is 4, normalize to 0-1
  // More incidents and higher severity = higher score
  const maxPossibleScore = count * 4;
  return maxPossibleScore > 0 ? Math.min(totalSeverity / maxPossibleScore, 1) : 0;
}

/**
 * Calculate POI safety score for a segment
 * More POIs nearby = safer (higher score)
 * @param {Object} segment - Segment object
 * @param {Array} pois - Array of POI objects
 * @returns {number} Normalized POI safety score (0-1)
 */
export function calculatePOISafetyScore(segment, pois) {
  if (!pois || pois.length === 0) {
    return 0;
  }
  
  let nearbyPOIs = 0;
  const searchRadius = 200; // 200 meters
  
  for (const poi of pois) {
    if (!poi.position) continue;
    
    const poiLat = poi.position.lat || poi.position.latitude;
    const poiLon = poi.position.lon || poi.position.longitude;
    
    if (poiLat === undefined || poiLon === undefined) continue;
    
    const distToStart = getDistance(
      { latitude: segment.start.lat, longitude: segment.start.lon },
      { latitude: poiLat, longitude: poiLon }
    );
    const distToEnd = getDistance(
      { latitude: segment.end.lat, longitude: segment.end.lon },
      { latitude: poiLat, longitude: poiLon }
    );
    
    if (distToStart < searchRadius || distToEnd < searchRadius) {
      nearbyPOIs++;
    }
  }
  
  // Normalize: assume max 10 POIs nearby is very safe (score = 1)
  return Math.min(nearbyPOIs / 10, 1);
}

/**
 * Calculate traffic flow score for a segment
 * Lower speed = higher risk (higher score)
 * @param {Object} segment - Segment object
 * @param {Object} flowData - Traffic flow data object
 * @returns {number} Normalized traffic flow score (0-1)
 */
export function calculateTrafficFlowScore(segment, flowData) {
  if (!flowData || !flowData.currentSpeed) {
    return 0.5; // Default medium risk if no data
  }
  
  const currentSpeed = flowData.currentSpeed;
  const freeFlowSpeed = flowData.freeFlowSpeed || 60; // Default 60 km/h
  
  // Lower speed relative to free flow = higher risk
  // Normalize: if speed is 0, score = 1 (highest risk), if speed = freeFlow, score = 0
  const speedRatio = Math.max(0, 1 - (currentSpeed / freeFlowSpeed));
  return Math.min(speedRatio, 1);
}

/**
 * Calculate lighting score (proxy using POI density)
 * More POIs = better lighting (higher score)
 * @param {Object} segment - Segment object
 * @param {Array} pois - Array of POI objects
 * @returns {number} Normalized lighting score (0-1)
 */
export function calculateLightingScore(segment, pois) {
  // Use POI density as proxy for lighting
  // More POIs = better lit areas
  return calculatePOISafetyScore(segment, pois);
}

/**
 * Calculate isolation score
 * Inverse of POI count + wide roads safer
 * More isolated = higher risk (higher score)
 * @param {Object} segment - Segment object
 * @param {Array} pois - Array of POI objects
 * @returns {number} Normalized isolation score (0-1)
 */
export function calculateIsolationScore(segment, pois) {
  // Inverse of POI safety score
  // More POIs = less isolated = lower score
  const poiScore = calculatePOISafetyScore(segment, pois);
  return 1 - poiScore;
}

/**
 * Calculate time of day score
 * Night = more risky (higher score)
 * @returns {number} Normalized time of day score (0-1)
 */
export function calculateTimeOfDayScore() {
  const hour = new Date().getHours();
  // If hour > 20 (8 PM) or < 5 (5 AM), it's night = more risky
  if (hour > 20 || hour < 5) {
    return 0.8; // High risk at night
  }
  return 0.2; // Lower risk during day
}

/**
 * Calculate segment risk score
 * @param {Object} segment - Segment object
 * @param {Array} incidents - Array of incident objects
 * @param {Array} pois - Array of POI objects
 * @param {Object} flowData - Traffic flow data object
 * @returns {number} Segment risk score (0-1, lower is safer)
 */
export function calculateSegmentRisk(segment, incidents, pois, flowData) {
  const lightingScore = calculateLightingScore(segment, pois);
  const incidentScore = calculateIncidentScore(segment, incidents);
  const poiSafetyScore = calculatePOISafetyScore(segment, pois);
  const trafficFlowScore = calculateTrafficFlowScore(segment, flowData);
  const isolationScore = calculateIsolationScore(segment, pois);
  const timeOfDayScore = calculateTimeOfDayScore();
  
  // Calculate risk using weighted formula
  const segmentRisk = 
    0.25 * (1 - lightingScore) +
    0.25 * incidentScore +
    0.20 * (1 - poiSafetyScore) +
    0.15 * trafficFlowScore +
    0.10 * isolationScore +
    0.05 * timeOfDayScore;
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, segmentRisk));
}

/**
 * Calculate route risk score (length-weighted average of segment risks)
 * @param {Array<Object>} segments - Array of segment objects with riskScore and length
 * @returns {number} Route risk score (0-1, lower is safer)
 */
export function calculateRouteRisk(segments) {
  if (!segments || segments.length === 0) {
    return 1; // High risk if no segments
  }
  
  let totalWeightedRisk = 0;
  let totalLength = 0;
  
  for (const segment of segments) {
    const risk = segment.riskScore || 0;
    const length = segment.length || 0;
    
    totalWeightedRisk += risk * length;
    totalLength += length;
  }
  
  if (totalLength === 0) {
    return 1;
  }
  
  return totalWeightedRisk / totalLength;
}

