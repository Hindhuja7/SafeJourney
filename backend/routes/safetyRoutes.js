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

// Fetch OSRM routes
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
      crime: Math.floor(Math.random() * 3),
      darkAreas: Math.floor(Math.random() * 2),
      traffic: Math.floor(Math.random() * 3),
    }));
  } catch (err) {
    console.error("OSRM fetch error:", err.message);
    return [];
  }
}

// Gemini or fallback scoring
async function scoreWithGemini(route) {
  try {
    if (aiClient) {
      throw new Error("Gemini not enabled in this demo");
    }
    throw new Error("Use fallback");
  } catch {
    return fallbackScoreFromFeatures(route);
  }
}

// POST /api/routes
router.post("/routes", async (req, res) => {
  try {
    let { sourceAddress, destinationAddress } = req.body;

    if (!sourceAddress || !destinationAddress)
      return res.status(400).json({ error: "sourceAddress and destinationAddress required" });

    // Use TomTom geocoding from src/tomtom.js
    const { geocodeAddress: tomtomGeocode } = await import("../src/tomtom.js");
    const source = await tomtomGeocode(sourceAddress);
    const destination = await tomtomGeocode(destinationAddress);

    if (!source || !destination)
      return res.status(400).json({ error: "Failed to geocode addresses" });

    // Convert to [lat, lon] format for compatibility
    const sourceCoords = [source.lat, source.lon];
    const destinationCoords = [destination.lat, destination.lon];

    // Use routes from src/routes.js which uses TomTom/OSRM
    const { fetchRoutes, fetchIncidents, fetchPOIs, calculateBoundingBox } = await import("../src/tomtom.js");
    const { splitRouteIntoSegments, calculateSegmentRisk, calculateRouteRisk } = await import("../src/scoring.js");

    // Fetch routes using TomTom/OSRM
    const tomtomRoutes = await fetchRoutes(sourceCoords[0], sourceCoords[1], destinationCoords[0], destinationCoords[1]);
    
    if (!tomtomRoutes || tomtomRoutes.length === 0)
      return res.status(500).json({ error: "No routes found" });

    // Collect all route coordinates for bounding box
    const allCoordinates = [];
    for (const route of tomtomRoutes) {
      if (route.points && route.points.length > 0) {
        for (const point of route.points) {
          allCoordinates.push([point.longitude || point.lon, point.latitude || point.lat]);
        }
      }
    }

    // Calculate bounding box and fetch incidents/POIs
    const bbox = calculateBoundingBox(allCoordinates);
    const incidents = await fetchIncidents(bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat);
    const centerLat = (bbox.minLat + bbox.maxLat) / 2;
    const centerLon = (bbox.minLon + bbox.maxLon) / 2;
    const radius = Math.max(
      Math.abs(bbox.maxLat - bbox.minLat) * 111000,
      Math.abs(bbox.maxLon - bbox.minLon) * 111000 * Math.cos(centerLat * Math.PI / 180)
    );
    const pois = await fetchPOIs(centerLat, centerLon, Math.min(radius, 5000));

    // Process and score each route
    const scoredRoutes = [];
    for (let i = 0; i < tomtomRoutes.length; i++) {
      const route = tomtomRoutes[i];
      
      // Extract route points
      const routePoints = [];
      if (route.points && route.points.length > 0) {
        for (const point of route.points) {
          const lat = point.latitude || point.lat;
          const lon = point.longitude || point.lon;
          if (lat !== undefined && lon !== undefined) {
            routePoints.push([lat, lon]);
          }
        }
      }

      if (routePoints.length === 0) continue;

      // Split route into segments
      const segments = splitRouteIntoSegments(routePoints);
      if (segments.length === 0) continue;

      // Calculate risk for each segment
      const enrichedSegments = segments.map(segment => {
        const riskScore = calculateSegmentRisk(segment, incidents, pois, null);
        return {
          ...segment,
          riskScore
        };
      });

      // Calculate overall route risk
      const routeRisk = calculateRouteRisk(enrichedSegments);
      
      // Convert risk (0-1, lower is safer) to safety score (0-5, higher is safer)
      const aiScore = Math.max(0, Math.min(5, (1 - routeRisk) * 5));

      // Get route summary
      const summary = route.summary || {};
      const distance_km = ((summary.lengthInMeters || 0) / 1000).toFixed(2);
      const duration_min = Math.round((summary.travelTimeInSeconds || 0) / 60);

      // Create polyline string for geometry
      const geometry = routePoints.map(p => `${p[0]},${p[1]}`).join('|');

      scoredRoutes.push({
        id: i,
        distance_km: parseFloat(distance_km),
        duration_min,
        aiScore: parseFloat(aiScore.toFixed(2)),
        geometry,
        riskScore: routeRisk,
        label: i === 0 ? "Safest (Recommended)" : i === 1 ? "Moderate" : "Unsafe",
        reason: routeRisk < 0.3 ? "Very safe route" : routeRisk < 0.6 ? "Moderately safe route" : "Route has some safety concerns",
        scoringType: "TomTom Safety Analysis"
      });
    }

    // Sort by safety score (descending - highest score = safest)
    scoredRoutes.sort((a, b) => b.aiScore - a.aiScore);

    // Re-label after sorting
    const labeledRoutes = scoredRoutes.map((route, index) => ({
      ...route,
      label: index === 0 ? "Safest (Recommended)" : index === 1 ? "Moderate" : "Unsafe"
    }));

    const safestRoute = labeledRoutes[0] || null;

    // Return coords in [lat, lon] format for frontend
    res.json({
      coords: { 
        source: sourceCoords, 
        destination: destinationCoords 
      },
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
