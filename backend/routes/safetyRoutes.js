// import express from "express";
// import cors from "cors";
// import axios from "axios";
// import { Models } from "@google/genai"; // Optional Gemini API

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Fallback scoring
// function fallbackScore(route) {
//   let score = 5;
//   const reasons = [];

//   if (route.crime && route.crime > 0) {
//     score -= route.crime * 0.5;
//     reasons.push("High crime area");
//   }
//   if (route.darkAreas && route.darkAreas > 0) {
//     score -= route.darkAreas * 0.3;
//     reasons.push("Poorly lit sections");
//   }
//   if (route.traffic && route.traffic > 0) {
//     score -= route.traffic * 0.2;
//     reasons.push("Heavy traffic");
//   }

//   return {
//     score: Math.max(score, 0),
//     reason: reasons.length > 0 ? reasons.join(", ") : "No major issues",
//   };
// }

// // Fetch routes from OSRM
// async function getRoutesFromOSRM(source, destination) {
//   const url = `http://router.project-osrm.org/route/v1/driving/${source[1]},${source[0]};${destination[1]},${destination[0]}?overview=full&geometries=polyline&alternatives=true`;
//   const res = await axios.get(url);

//   return res.data.routes.map((r, i) => ({
//     id: i + 1,
//     name: `Route ${i + 1}`,
//     distance_km: (r.distance / 1000).toFixed(2),
//     duration_min: (r.duration / 60).toFixed(2),
//     geometry: r.geometry,
//     crime: Math.floor(Math.random() * 3),
//     darkAreas: Math.floor(Math.random() * 2),
//     traffic: Math.floor(Math.random() * 3),
//   }));
// }

// // Routes API
// app.post("/api/routes", async (req, res) => {
//   const { source, destination } = req.body;

//   try {
//     const routes = await getRoutesFromOSRM(source, destination);

//     const scoredRoutes = await Promise.all(
//       routes.map(async (route) => {
//         let scoredRoute = { ...route };

//         try {
//           // Optional Gemini API scoring
          
//           const geminiResponse = await Models.generateContent({
//             model: "gemini-2.5",
//             prompt: `Score the safety of this route and provide reasoning:\n${JSON.stringify(route)}`,
//           });
//           const aiScore = geminiResponse?.content?.score;
//           const aiReason = geminiResponse?.content?.reason;

//           if (aiScore && aiReason) {
//             scoredRoute.score = aiScore;
//             scoredRoute.reason = aiReason;
//             scoredRoute.source = "Gemini API";
//             return scoredRoute;
//           }
          
//         } catch (err) {
//           console.error("Gemini API failed:", err.message);
//         }

//         // Fallback scoring
//         const fallback = fallbackScore(route);
//         scoredRoute.score = fallback.score;
//         scoredRoute.reason = fallback.reason;
//         scoredRoute.source = "Fallback";
//         return scoredRoute;
//       })
//     );

//     // Sort routes by score descending
//     const sorted = scoredRoutes.sort((a, b) => b.score - a.score);

//     // Label top 3 routes
//     const labeled = sorted.map((r, i) => {
//       if (i === 0) r.label = "Safest (Recommended)";
//       else if (i === 1) r.label = "Normal";
//       else r.label = "Unsafe";
//       return r;
//     });

//     res.json({ routes: labeled });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ error: "Failed to fetch routes" });
//   }
// });

// app.listen(5000, () => console.log("🚀 Backend running on http://localhost:5000"));




import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { fetchRoutes, fetchIncidents, fetchTrafficFlow, fetchPOIs, calculateBoundingBox } from "../src/tomtom.js";
import {
  splitRouteIntoSegments,
  calculateSegmentRisk,
  calculateRouteRisk
} from "../src/scoring.js";

dotenv.config();
const router = express.Router();

// Gemini client (optional)
let aiClient = null;
try {
  if (process.env.GEMINI_API_KEY) {
    // aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (e) {
  console.warn("Gemini not initialized:", e.message);
}

// Fallback scoring
function fallbackScoreFromFeatures(route) {
  let score = 5;
  const reasons = [];

  if (route.crime > 0) {
    score -= route.crime * 0.5;
    reasons.push("High crime area");
  }
  if (route.darkAreas > 0) {
    score -= route.darkAreas * 0.3;
    reasons.push("Poorly lit sections");
  }
  if (route.traffic > 0) {
    score -= route.traffic * 0.2;
    reasons.push("Heavy traffic");
  }

  score = Math.max(Math.round(score * 10) / 10, 0);
  return { score, reason: reasons.join(", ") || "No major issues", type: "Fallback" };
}

// Geocode address → [lat, lng]
async function geocodeAddress(address) {
  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { "User-Agent": "SafeJourneyApp" } }
    );

    if (res.data.length > 0) {
      return [parseFloat(res.data[0].lat), parseFloat(res.data[0].lon)];
    }
    return null;
  } catch (err) {
    console.error("Geocoding failed:", err.message);
    return null;
  }
}

// Fetch routes using TomTom integration (uses OSRM internally but returns TomTom format)
async function getRoutesFromTomTom(source, destination) {
  try {
    const [sourceLat, sourceLon] = source;
    const [destLat, destLon] = destination;
    
    const tomtomRoutes = await fetchRoutes(sourceLat, sourceLon, destLat, destLon);
    
    // Convert TomTom format to our expected format
    return tomtomRoutes.map((route, i) => {
      // Extract geometry as polyline string
      let geometry = '';
      if (route.geometry && route.geometry.points) {
        // Convert points to polyline format (we'll use OSRM polyline for now)
        const points = route.geometry.points.map(p => [p.latitude, p.longitude]);
        // For now, we'll fetch from OSRM to get polyline
      }
      
      // Also fetch from OSRM to get polyline geometry
      const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${sourceLon},${sourceLat};${destLon},${destLat}?overview=full&geometries=polyline&alternatives=true`;
      
      return {
        id: i + 1,
        distance_km: ((route.summary?.lengthInMeters || 0) / 1000).toFixed(2),
        duration_min: ((route.summary?.travelTimeInSeconds || 0) / 60).toFixed(2),
        geometry: null, // Will be set from OSRM
        tomtomRoute: route, // Store full TomTom route for scoring
        points: route.geometry?.points || route.points || []
      };
    });
  } catch (err) {
    console.error("TomTom route fetch error:", err.message);
    return [];
  }
}

// Fetch OSRM routes for polyline geometry
async function getRoutesFromOSRM(source, destination) {
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${source[1]},${source[0]};${destination[1]},${destination[0]}?overview=full&geometries=polyline&alternatives=true`;
    const res = await axios.get(url);

    if (!res.data || !res.data.routes) return [];

    return res.data.routes.map((r, i) => ({
      id: i + 1,
      distance_km: (r.distance / 1000).toFixed(2),
      duration_min: (r.duration / 60).toFixed(2),
      geometry: r.geometry,
    }));
  } catch (err) {
    console.error("OSRM fetch error:", err.message);
    return [];
  }
}

// Calculate safety score using TomTom-based comprehensive scoring
async function calculateTomTomSafetyScore(route, incidents, pois, flowDataCache) {
  try {
    if (!route.points || route.points.length === 0) {
      console.warn("Route has no points, using fallback scoring");
      return fallbackScoreFromFeatures({ crime: 0, darkAreas: 0, traffic: 0 });
    }

    // Convert route points to array format for segment splitting
    const routePoints = route.points.map(p => {
      const lat = p.latitude || p.lat;
      const lon = p.longitude || p.lon;
      return [lat, lon];
    });

    // Split route into segments
    const segments = splitRouteIntoSegments(routePoints);
    
    if (segments.length === 0) {
      console.warn("Route has no segments, using fallback scoring");
      return fallbackScoreFromFeatures({ crime: 0, darkAreas: 0, traffic: 0 });
    }

    // Process segments and calculate risk scores
    const enrichedSegments = [];
    
    for (const segment of segments) {
      // Get traffic flow for segment midpoint (use cached data)
      const midLat = (segment.start.lat + segment.end.lat) / 2;
      const midLon = (segment.start.lon + segment.end.lon) / 2;
      
      // Round to 2 decimal places for caching
      const cacheKey = `${Math.round(midLat * 100) / 100},${Math.round(midLon * 100) / 100}`;
      let flowData = flowDataCache.get(cacheKey);
      
      if (!flowData) {
        try {
          flowData = await fetchTrafficFlow(midLat, midLon);
          flowDataCache.set(cacheKey, flowData);
        } catch (e) {
          flowData = null;
        }
      }

      // Calculate segment risk
      const riskScore = calculateSegmentRisk(segment, incidents, pois, flowData);
      
      enrichedSegments.push({
        ...segment,
        riskScore: riskScore || 0.5
      });
    }

    // Calculate route risk (length-weighted average)
    const routeRiskScore = calculateRouteRisk(enrichedSegments);
    
    // Convert risk score (0-1, lower is safer) to safety score (0-5, higher is safer)
    // riskScore 0.0 = safest = safety score 5.0
    // riskScore 1.0 = most dangerous = safety score 0.0
    const safetyScore = (1 - routeRiskScore) * 5;
    
    // Generate reason based on risk factors
    const reasons = [];
    if (routeRiskScore > 0.6) {
      reasons.push("High crime area");
    }
    if (routeRiskScore > 0.5) {
      reasons.push("Poorly lit sections");
    }
    if (routeRiskScore > 0.4) {
      reasons.push("Heavy traffic");
    }
    
    return {
      score: Math.max(0, Math.min(5, Math.round(safetyScore * 10) / 10)),
      reason: reasons.join(", ") || "No major issues",
      type: "TomTom Comprehensive",
      riskScore: routeRiskScore
    };
  } catch (error) {
    console.error("Error calculating TomTom safety score:", error);
    return fallbackScoreFromFeatures({ crime: 0, darkAreas: 0, traffic: 0 });
  }
}

// POST /api/routes
router.post("/routes", async (req, res) => {
  try {
    let { sourceAddress, destinationAddress } = req.body;

    if (!sourceAddress || !destinationAddress)
      return res.status(400).json({ error: "sourceAddress and destinationAddress required" });

    const source = await geocodeAddress(sourceAddress);
    const destination = await geocodeAddress(destinationAddress);

    if (!source || !destination)
      return res.status(400).json({ error: "Failed to geocode addresses" });

    // Fetch routes from both TomTom (for scoring) and OSRM (for geometry)
    const [tomtomRoutes, osrmRoutes] = await Promise.all([
      getRoutesFromTomTom(source, destination),
      getRoutesFromOSRM(source, destination)
    ]);

    if (osrmRoutes.length === 0)
      return res.status(500).json({ error: "No routes found" });

    // Merge OSRM geometry with TomTom routes
    const mergedRoutes = tomtomRoutes.map((tomtomRoute, i) => {
      const osrmRoute = osrmRoutes[i] || osrmRoutes[0];
      return {
        ...tomtomRoute,
        geometry: osrmRoute.geometry,
        distance_km: osrmRoute.distance_km || tomtomRoute.distance_km,
        duration_min: osrmRoute.duration_min || tomtomRoute.duration_min
      };
    });

    // Calculate bounding box for incidents and POIs
    const allCoordinates = [];
    mergedRoutes.forEach(route => {
      if (route.points && route.points.length > 0) {
        route.points.forEach(p => {
          const lat = p.latitude || p.lat;
          const lon = p.longitude || p.lon;
          if (lat && lon) allCoordinates.push([lon, lat]);
        });
      }
    });
    
    if (allCoordinates.length === 0) {
      // Fallback: use source and destination
      allCoordinates.push([source[1], source[0]], [destination[1], destination[0]]);
    }

    const bbox = calculateBoundingBox(allCoordinates);
    
    // Fetch incidents and POIs
    const [incidents, pois] = await Promise.all([
      fetchIncidents(bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat),
      fetchPOIs((bbox.minLat + bbox.maxLat) / 2, (bbox.minLon + bbox.maxLon) / 2, 5000)
    ]);

    console.log(`Found ${incidents.length} incidents and ${pois.length} POIs`);

    // Create flow data cache
    const flowDataCache = new Map();

    // Score each route using TomTom comprehensive scoring
    for (let r of mergedRoutes) {
      const scoreData = await calculateTomTomSafetyScore(r, incidents, pois, flowDataCache);
      r.aiScore = scoreData.score;
      r.reason = scoreData.reason;
      r.scoringType = scoreData.type;
      r.riskScore = scoreData.riskScore;
    }

    // Remove duplicate routes
    const uniqueRoutes = [];
    const seen = new Set();

    for (const r of mergedRoutes) {
      const key = `${r.distance_km}-${r.duration_min}-${r.geometry}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRoutes.push(r);
      }
    }

    // Sort safest → dangerous (descending order by aiScore)
    uniqueRoutes.sort((a, b) => b.aiScore - a.aiScore);

    // Label routes: Safest (Recommended), Moderate, Unsafe
    const labeledRoutes = uniqueRoutes.map((route, index) => {
      let label = "";
      if (index === 0) {
        label = "Safest (Recommended)";
      } else if (index === 1) {
        label = "Moderate";
      } else {
        label = "Unsafe";
      }
      return { ...route, label };
    });

    const safestRoute = labeledRoutes[0] || null;

    // IMPORTANT FIX: RETURN coords for frontend map
    res.json({
      coords: { source, destination },
      routes: labeledRoutes,
      safestRoute,
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// POST /api/routes/store - Store route data for logged-in user
router.post("/routes/store", async (req, res) => {
  try {
    const { userId, sourceAddress, destinationAddress, selectedRoute, timestamp } = req.body;

    if (!userId || !sourceAddress || !destinationAddress) {
      return res.status(400).json({ error: "userId, sourceAddress, and destinationAddress are required" });
    }

    // Store route data in user's history (you can create a routes.json file or add to users.json)
    const routeData = {
      userId: parseInt(userId),
      sourceAddress,
      destinationAddress,
      selectedRoute: selectedRoute || null,
      timestamp: timestamp || new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    // For now, just log it. You can store in a separate routes.json file if needed
    console.log("Route data stored:", routeData);

    res.json({
      message: "Route data stored successfully",
      routeData
    });
  } catch (err) {
    console.error("Error storing route data:", err);
    res.status(500).json({ error: "Failed to store route data" });
  }
});

export default router;
