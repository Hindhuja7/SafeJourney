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

    const source = await geocodeAddress(sourceAddress);
    const destination = await geocodeAddress(destinationAddress);

    if (!source || !destination)
      return res.status(400).json({ error: "Failed to geocode addresses" });

    let rawRoutes = await getRoutesFromOSRM(source, destination);
    if (rawRoutes.length === 0)
      return res.status(500).json({ error: "No routes found" });

    // Score each route
    for (let r of rawRoutes) {
      const scoreData = await scoreWithGemini(r);
      r.aiScore = scoreData.score;
      r.reason = scoreData.reason;
      r.scoringType = scoreData.type;
    }

    // Remove duplicate OSRM routes → only unique distance+duration+geometry
    const uniqueRoutes = [];
    const seen = new Set();

    for (const r of rawRoutes) {
      const key = `${r.distance_km}-${r.duration_min}-${r.geometry}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRoutes.push(r);
      }
    }

    // Sort safest → dangerous
    uniqueRoutes.sort((a, b) => b.aiScore - a.aiScore);

    const safestRoute = uniqueRoutes[0] || null;

    // IMPORTANT FIX: RETURN coords for frontend map
    res.json({
      coords: { source, destination },
      routes: uniqueRoutes,
      safestRoute,
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
