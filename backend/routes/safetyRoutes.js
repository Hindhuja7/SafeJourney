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
import { GoogleGenAI } from "@google/genai";

dotenv.config();
const router = express.Router();

// Initialize Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Utility: fallback labels
function getLabel(score) {
  if (score >= 4.5) return "Safest (Recommended)";
  if (score >= 3) return "Normal";
  return "Unsafe";
}

// Fetch routes from OSRM
async function getRoutesFromOSRM(source, destination) {
  const url = `http://router.project-osrm.org/route/v1/driving/${source[1]},${source[0]};${destination[1]},${destination[0]}?overview=full&geometries=polyline&alternatives=true`;

  const res = await axios.get(url);
  return res.data.routes.map((r, i) => ({
    id: i + 1,
    name: `Route ${i + 1}`,
    distance_km: (r.distance / 1000).toFixed(2),
    duration_min: (r.duration / 60).toFixed(2),
    geometry: r.geometry,
    crime: Math.floor(Math.random() * 3),
    darkAreas: Math.floor(Math.random() * 2),
    traffic: Math.floor(Math.random() * 3),
  }));
}

// Call Gemini API for scoring a route
async function getGeminiScore(route) {
  try {
    const prompt = `
Evaluate the safety of this route based on the following features:
- Crime level: ${route.crime}
- Poorly lit sections: ${route.darkAreas}
- Traffic level: ${route.traffic}

Return ONLY a JSON object like this:
{
  "score": <number between 0-5>,
  "reason": "<short explanation>"
}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // Remove Markdown code block if exists
    let text = response.text.trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```json\s*/, "").replace(/```$/, "");
    }

    const parsed = JSON.parse(text);
    return {
      score: parsed.score,
      reason: parsed.reason,
      scoringMethod: "Gemini",
      label: getLabel(parsed.score),
    };
  } catch (err) {
    console.error("Gemini scoring failed:", err.message);
    // Fallback scoring
    let fallbackScore = 10;
    const reasons = [];
    if (route.crime > 0) {
      fallbackScore -= route.crime * 0.5;
      reasons.push("High crime area");
    }
    if (route.darkAreas > 0) {
      fallbackScore -= route.darkAreas * 0.3;
      reasons.push("Poorly lit sections");
    }
    if (route.traffic > 0) {
      fallbackScore -= route.traffic * 0.2;
      reasons.push("Heavy traffic");
    }
    return {
      score: Math.max(fallbackScore, 0),
      reason: reasons.length ? reasons.join(", ") : "No major issues",
      scoringMethod: "Fallback",
      label: getLabel(Math.max(fallbackScore, 0)),
    };
  }
}

// ✅ POST /api/routes
router.post("/routes", async (req, res) => {
  const { source, destination } = req.body;

  if (!source || !destination) {
    return res.status(400).json({ error: "source and destination required" });
  }

  try {
    const routes = await getRoutesFromOSRM(source, destination);
    const scoredRoutes = await Promise.all(routes.map(getGeminiScore));
    // Attach route info to scores
    const finalRoutes = routes.map((route, i) => ({
      ...route,
      ...scoredRoutes[i],
    }));
    res.json({ routes: finalRoutes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

export default router;
