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
    this.hasStartedRoute = false; // Track if user has actually started moving along the route
    this.startRouteDistance = 200; // Consider route "started" when within 200m of route start
    
    this.initializeRoute();
  }

  initializeRoute() {
    // Extract route points
    const points = this.extractRoutePoints(this.route);
    this.routePoints = points;
    
    // Generate instructions from route
    this.instructions = this.generateInstructions(points);
    
    // Calculate total distance
    this.totalDistance = this.calculateTotalDistance(points);
    
    this.setState(NavigationState.IDLE);
  }

  extractRoutePoints(route) {
    const points = [];
    
    if (route.geometry && route.geometry.points) {
      route.geometry.points.forEach(point => {
        points.push({
          lat: point.lat,
          lon: point.lon
        });
      });
    } else if (route.segments && route.segments.length > 0) {
      // Use segments to build route
      route.segments.forEach(segment => {
        if (segment.start) {
          points.push({ lat: segment.start.lat, lon: segment.start.lon });
        }
        if (segment.end) {
          points.push({ lat: segment.end.lat, lon: segment.end.lon });
        }
      });
    }
    
    return points;
  }

  generateInstructions(points) {
    const instructions = [];
    
    if (points.length < 2) return instructions;
    
    // Start instruction
    instructions.push({
      type: 'start',
      text: 'Start navigation',
      distance: 0,
      point: points[0]
    });
    
    // Generate turn instructions
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
        // Significant turn detected
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
    
    // Arrival instruction
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
    
    // Check if arrived
    const destination = this.routePoints[this.routePoints.length - 1];
    const distanceToDest = getDistance(
      { latitude: lat, longitude: lon },
      { latitude: destination.lat, longitude: destination.lon }
    );
    
    if (distanceToDest < this.arrivalThreshold) {
      this.setState(NavigationState.ARRIVED);
      return { arrived: true };
    }
    
    // Find nearest point on route
    const nearestPoint = this.findNearestPointOnRoute(lat, lon);
    const distanceFromRoute = nearestPoint.distance;
    
    // Calculate distance from route start
    const distanceFromStart = getDistance(
      { latitude: lat, longitude: lon },
      { latitude: this.routePoints[0].lat, longitude: this.routePoints[0].lon }
    );
    
    // If user is near the start of the route (within 200m), don't consider it deviation yet
    // This allows user to start navigation even if they're not exactly at the origin
    const nearRouteStart = distanceFromStart < this.startRouteDistance;
    
    // Mark route as started if user is close to route
    if (!this.hasStartedRoute && distanceFromRoute < this.deviationThreshold) {
      this.hasStartedRoute = true;
      console.log('Route started - user is now on the route');
    }
    
    // Only check for deviation if:
    // 1. User has started the route (was on it at some point), OR
    // 2. User is far from both the route AND the route start (more than 200m from start)
    const shouldCheckDeviation = this.hasStartedRoute || (!nearRouteStart && distanceFromRoute > this.deviationThreshold);
    
    // Check for deviation (but be lenient near route start)
    if (shouldCheckDeviation && distanceFromRoute > this.deviationThreshold) {
      return { 
        deviated: true, 
        distance: distanceFromRoute,
        needsReroute: true 
      };
    }
    
    // If near route start but not on route, don't mark as deviated - just show instructions
    if (nearRouteStart && distanceFromRoute > this.deviationThreshold) {
      console.log(`User near route start (${distanceFromStart.toFixed(0)}m away) but not on route yet - allowing time to reach route`);
      // Still return instruction info but don't mark as deviated
    }
    
    // Update current instruction
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
      
      const distance = this.pointToLineDistance(
        { lat, lon },
        p1,
        p2
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestSegmentIndex = i;
        nearestPoint = this.projectPointToLine({ lat, lon }, p1, p2);
        
        // Calculate progress (0-1)
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
    
    return Math.sqrt(dx * dx + dy * dy) * 111000; // Convert to meters (approximate)
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
    // Find the next instruction based on current segment
    for (let i = 0; i < this.instructions.length; i++) {
      const instruction = this.instructions[i];
      if (instruction.point) {
        const instructionSegmentIndex = this.findSegmentIndexForPoint(instruction.point);
        if (instructionSegmentIndex >= segmentIndex) {
          // Calculate distance to this instruction
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
    
    return this.instructions[this.instructions.length - 1]; // Return arrival instruction
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

