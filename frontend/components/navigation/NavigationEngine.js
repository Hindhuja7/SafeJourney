/**
 * Navigation Engine
 * Core navigation logic: route matching, instruction generation, state management
 */

import { getDistance } from 'geolib';

// Calculate bearing between two points (in degrees, 0-360)
function calculateBearing(point1, point2) {
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const deltaLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  
  const x = Math.sin(deltaLon) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  
  const bearing = Math.atan2(x, y) * 180 / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360
}

export const NavigationState = {
  IDLE: 'idle',
  NAVIGATING: 'navigating',
  REROUTING: 'rerouting',
  ARRIVED: 'arrived',
  ERROR: 'error'
};

export class NavigationEngine {
  constructor(route, onStateChange, onInstructionChange) {
    this.route = route;
    this.onStateChange = onStateChange;
    this.onInstructionChange = onInstructionChange;
    this.state = NavigationState.IDLE;
    this.currentPosition = null;
    this.currentSegmentIndex = 0;
    this.instructions = [];
    this.deviationThreshold = 50; // meters
    this.arrivalThreshold = 30; // meters
    this.hasStartedRoute = false;
    this.startRouteDistance = 200;
    
    this.initializeRoute();
  }

  initializeRoute() {
    const points = this.extractRoutePoints(this.route);
    this.routePoints = points;
    this.instructions = this.generateInstructions(points);
    this.totalDistance = this.calculateTotalDistance(points);
    this.setState(NavigationState.IDLE);
  }

  extractRoutePoints(route) {
    const points = [];
    
    // Handle different route formats
    if (route.geometry && route.geometry.points) {
      // Format: { geometry: { points: [{lat, lon}, ...] } }
      route.geometry.points.forEach(point => {
        points.push({
          lat: point.lat,
          lon: point.lon
        });
      });
    } else if (route.geometry && typeof route.geometry === 'string') {
      // Format: { geometry: "polyline_encoded_string" } - decode it
      try {
        // Try to decode polyline if @mapbox/polyline is available
        if (typeof window !== 'undefined' && window.polyline) {
          const decoded = window.polyline.decode(route.geometry);
          decoded.forEach(([lat, lon]) => {
            points.push({ lat, lon });
          });
        } else {
          // Fallback: use source and destination from coords if available
          console.warn('Polyline decoder not available, using fallback');
        }
      } catch (e) {
        console.error('Error decoding polyline:', e);
      }
    } else if (route.segments && route.segments.length > 0) {
      route.segments.forEach(segment => {
        if (segment.start) {
          points.push({ lat: segment.start.lat, lon: segment.start.lon });
        }
        if (segment.end) {
          points.push({ lat: segment.end.lat, lon: segment.end.lon });
        }
      });
    } else if (route.coords) {
      // Handle coords format from main branch
      if (route.coords.source) {
        const src = route.coords.source;
        points.push({ 
          lat: Array.isArray(src) ? src[0] : src.lat, 
          lon: Array.isArray(src) ? src[1] : src.lon 
        });
      }
      if (route.coords.destination) {
        const dest = route.coords.destination;
        points.push({ 
          lat: Array.isArray(dest) ? dest[0] : dest.lat, 
          lon: Array.isArray(dest) ? dest[1] : dest.lon 
        });
      }
    }
    
    // If no points extracted, return empty array (will be handled by updatePosition)
    if (points.length === 0) {
      console.warn('NavigationEngine: Could not extract route points from route:', route);
    }
    
    return points;
  }

  generateInstructions(points) {
    const instructions = [];
    
    if (points.length < 2) return instructions;
    
    instructions.push({
      type: 'start',
      text: 'Start navigation',
      distance: 0,
      point: points[0]
    });
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];
      
      const bearing1 = calculateBearing(
        { latitude: prev.lat, longitude: prev.lon },
        { latitude: current.lat, longitude: current.lon }
      );
      const bearing2 = calculateBearing(
        { latitude: current.lat, longitude: current.lon },
        { latitude: next.lat, longitude: next.lon }
      );
      
      const angleChange = ((bearing2 - bearing1 + 540) % 360) - 180;
      
      if (Math.abs(angleChange) > 15) {
        const distance = getDistance(
          { latitude: prev.lat, longitude: prev.lon },
          { latitude: current.lat, longitude: current.lon }
        );
        
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
          text: this.formatInstruction(turnType, distance),
          distance: distance,
          point: current,
          angle: angleChange
        });
      }
    }
    
    const lastPoint = points[points.length - 1];
    instructions.push({
      type: 'arrive',
      text: 'You have arrived at your destination',
      distance: 0,
      point: lastPoint
    });
    
    return instructions;
  }

  formatInstruction(type, distance) {
    const distanceText = distance < 1000 
      ? `${Math.round(distance)} meters` 
      : `${(distance / 1000).toFixed(1)} kilometers`;
    
    switch (type) {
      case 'turn-left':
        return `In ${distanceText}, turn left`;
      case 'turn-right':
        return `In ${distanceText}, turn right`;
      case 'u-turn':
        return `In ${distanceText}, make a U-turn`;
      case 'continue':
        return `Continue straight for ${distanceText}`;
      default:
        return `In ${distanceText}, ${type}`;
    }
  }

  calculateTotalDistance(points) {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += getDistance(
        { latitude: points[i - 1].lat, longitude: points[i - 1].lon },
        { latitude: points[i].lat, longitude: points[i].lon }
      );
    }
    return total;
  }

  updatePosition(lat, lon) {
    this.currentPosition = { lat, lon };
    
    if (this.state === NavigationState.IDLE) {
      this.setState(NavigationState.NAVIGATING);
    }
    
    // Check if routePoints is valid
    if (!this.routePoints || this.routePoints.length === 0) {
      console.warn('NavigationEngine: No route points available');
      return {
        deviated: false,
        distance: 0,
        currentInstruction: null,
        progress: 0,
        distanceRemaining: 0
      };
    }
    
    const destination = this.routePoints[this.routePoints.length - 1];
    if (!destination || !destination.lat || !destination.lon) {
      console.warn('NavigationEngine: Invalid destination point');
      return {
        deviated: false,
        distance: 0,
        currentInstruction: null,
        progress: 0,
        distanceRemaining: 0
      };
    }
    
    const distanceToDest = getDistance(
      { latitude: lat, longitude: lon },
      { latitude: destination.lat, longitude: destination.lon }
    );
    
    if (distanceToDest < this.arrivalThreshold) {
      this.setState(NavigationState.ARRIVED);
      return { arrived: true };
    }
    
    const nearestPoint = this.findNearestPointOnRoute(lat, lon);
    const distanceFromRoute = nearestPoint.distance;
    const distanceFromStart = getDistance(
      { latitude: lat, longitude: lon },
      { latitude: this.routePoints[0].lat, longitude: this.routePoints[0].lon }
    );
    
    const nearRouteStart = distanceFromStart < this.startRouteDistance;
    
    if (!this.hasStartedRoute && distanceFromRoute < this.deviationThreshold) {
      this.hasStartedRoute = true;
    }
    
    const shouldCheckDeviation = this.hasStartedRoute || (!nearRouteStart && distanceFromRoute > this.deviationThreshold);
    
    if (shouldCheckDeviation && distanceFromRoute > this.deviationThreshold) {
      return { 
        deviated: true, 
        distance: distanceFromRoute,
        needsReroute: true 
      };
    }
    
    const currentInstruction = this.getCurrentInstruction(nearestPoint.segmentIndex);
    
    return {
      deviated: false,
      distance: distanceFromRoute,
      currentInstruction,
      progress: nearestPoint.progress,
      distanceRemaining: this.calculateRemainingDistance(nearestPoint.segmentIndex)
    };
  }

  findNearestPointOnRoute(lat, lon) {
    let minDistance = Infinity;
    let nearestSegmentIndex = 0;
    let nearestPoint = null;
    let progress = 0;
    
    for (let i = 0; i < this.routePoints.length - 1; i++) {
      const p1 = this.routePoints[i];
      const p2 = this.routePoints[i + 1];
      
      const distance = this.pointToLineDistance({ lat, lon }, p1, p2);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestSegmentIndex = i;
        nearestPoint = this.projectPointToLine({ lat, lon }, p1, p2);
        
        const segmentDistance = getDistance(
          { latitude: p1.lat, longitude: p1.lon },
          { latitude: p2.lat, longitude: p2.lon }
        );
        const distanceToP1 = getDistance(
          { latitude: lat, longitude: lon },
          { latitude: p1.lat, longitude: p1.lon }
        );
        progress = i / (this.routePoints.length - 1) + (distanceToP1 / segmentDistance) / (this.routePoints.length - 1);
      }
    }
    
    return {
      distance: minDistance,
      segmentIndex: nearestSegmentIndex,
      point: nearestPoint || this.routePoints[nearestSegmentIndex],
      progress: Math.min(progress, 1)
    };
  }

  pointToLineDistance(point, lineStart, lineEnd) {
    const A = point.lat - lineStart.lat;
    const B = point.lon - lineStart.lon;
    const C = lineEnd.lat - lineStart.lat;
    const D = lineEnd.lon - lineStart.lon;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = lineStart.lat;
      yy = lineStart.lon;
    } else if (param > 1) {
      xx = lineEnd.lat;
      yy = lineEnd.lon;
    } else {
      xx = lineStart.lat + param * C;
      yy = lineStart.lon + param * D;
    }
    
    const dx = point.lat - xx;
    const dy = point.lon - yy;
    
    return Math.sqrt(dx * dx + dy * dy) * 111000;
  }

  projectPointToLine(point, lineStart, lineEnd) {
    const A = point.lat - lineStart.lat;
    const B = point.lon - lineStart.lon;
    const C = lineEnd.lat - lineStart.lat;
    const D = lineEnd.lon - lineStart.lon;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    if (param < 0) {
      return lineStart;
    } else if (param > 1) {
      return lineEnd;
    } else {
      return {
        lat: lineStart.lat + param * C,
        lon: lineStart.lon + param * D
      };
    }
  }

  getCurrentInstruction(segmentIndex) {
    for (let i = 0; i < this.instructions.length; i++) {
      const instruction = this.instructions[i];
      if (instruction.point) {
        const instructionSegmentIndex = this.findSegmentIndexForPoint(instruction.point);
        if (instructionSegmentIndex >= segmentIndex) {
          const currentPoint = this.routePoints[segmentIndex];
          const distance = getDistance(
            { latitude: this.currentPosition.lat, longitude: this.currentPosition.lon },
            { latitude: instruction.point.lat, longitude: instruction.point.lon }
          );
          
          return {
            ...instruction,
            distanceToInstruction: distance,
            index: i
          };
        }
      }
    }
    
    return this.instructions[this.instructions.length - 1];
  }

  findSegmentIndexForPoint(point) {
    let minDistance = Infinity;
    let nearestIndex = 0;
    
    for (let i = 0; i < this.routePoints.length; i++) {
      const distance = getDistance(
        { latitude: point.lat, longitude: point.lon },
        { latitude: this.routePoints[i].lat, longitude: this.routePoints[i].lon }
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }
    
    return nearestIndex;
  }

  calculateRemainingDistance(segmentIndex) {
    let remaining = 0;
    
    for (let i = segmentIndex; i < this.routePoints.length - 1; i++) {
      remaining += getDistance(
        { latitude: this.routePoints[i].lat, longitude: this.routePoints[i].lon },
        { latitude: this.routePoints[i + 1].lat, longitude: this.routePoints[i + 1].lon }
      );
    }
    
    return remaining;
  }

  setState(newState) {
    if (this.state !== newState) {
      this.state = newState;
      if (this.onStateChange) {
        this.onStateChange(newState);
      }
    }
  }

  getState() {
    return this.state;
  }

  getInstructions() {
    return this.instructions;
  }

  getRoutePoints() {
    return this.routePoints;
  }

  updateRoute(newRoute) {
    this.route = newRoute;
    this.initializeRoute();
    this.currentSegmentIndex = 0;
  }

  stop() {
    this.setState(NavigationState.IDLE);
    this.currentPosition = null;
    this.currentSegmentIndex = 0;
  }
}

