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
    // Initialize Gemini SDK if installed
    // aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (e) {
  console.warn("Gemini not initialized:", e.message);
}

// Helper: fallback scoring
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

  score = Math.max(Math.round(score * 10) / 10, 0); // round to 0.1
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
      crime: Math.floor(Math.random() * 3),     // mock features
      darkAreas: Math.floor(Math.random() * 2),
      traffic: Math.floor(Math.random() * 3),
    }));
  } catch (err) {
    console.error("OSRM fetch error:", err.message);
    return [];
  }
}

// Score route with Gemini or fallback
async function scoreWithGemini(route) {
  try {
    if (aiClient) {
      // Call Gemini API here if configured
      // return { score, reason, type: "Gemini" };
      throw new Error("Gemini API not used in this demo");
    }
    throw new Error("Fallback");
  } catch {
    return fallbackScoreFromFeatures(route);
  }
}

// POST /api/routes
// Accepts { sourceAddress, destinationAddress }
router.post("/routes", async (req, res) => {
  try {
    let { sourceAddress, destinationAddress } = req.body;
    if (!sourceAddress || !destinationAddress)
      return res.status(400).json({ error: "sourceAddress and destinationAddress required" });

    const source = await geocodeAddress(sourceAddress);
    const destination = await geocodeAddress(destinationAddress);
    if (!source || !destination)
      return res.status(400).json({ error: "Failed to geocode addresses" });

    let osrmData = await getRoutesFromOSRM(source, destination);
    if (osrmData.length === 0) return res.status(500).json({ error: "No routes found" });

    // Score each route
    for (let r of osrmData) {
      const scoreData = await scoreWithGemini(r);
      r.aiScore = scoreData.score;
      r.reason = scoreData.reason;
      r.scoringType = scoreData.type;
    }

    // Remove duplicate OSRM routes (same distance & duration)
    const uniqueRoutes = [];
    for (const r of osrmData) {
      const exists = uniqueRoutes.find(
        u => u.distance_km === r.distance_km && u.duration_min === r.duration_min && u.aiScore === r.aiScore
      );
      if (!exists) uniqueRoutes.push(r);
    }

    // Sort descending by AI score (safest first)
    uniqueRoutes.sort((a, b) => b.aiScore - a.aiScore);

    const safestRoute = uniqueRoutes.length > 0 ? uniqueRoutes[0] : null;

    res.json({ safestRoute, routes: uniqueRoutes });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
