import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

// Fallback scoring
function fallbackScore(route) {
  let score = 5;
  const reasons = [];

  if (route.crime && route.crime > 0) {
    score -= route.crime * 0.5;
    reasons.push("High crime area");
  }
  if (route.darkAreas && route.darkAreas > 0) {
    score -= route.darkAreas * 0.3;
    reasons.push("Poorly lit sections");
  }
  if (route.traffic && route.traffic > 0) {
    score -= route.traffic * 0.2;
    reasons.push("Heavy traffic");
  }

  return { score: Math.max(score, 0), reason: reasons.length ? reasons.join(", ") : "No major issues" };
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

// Routes API
app.post("/api/routes", async (req, res) => {
  const { source, destination } = req.body;

  try {
    const routes = await getRoutesFromOSRM(source, destination);
    const scoredRoutes = routes.map(route => {
      const fallback = fallbackScore(route);
      return { ...route, score: fallback.score, reason: fallback.reason };
    });
    res.json({ routes: scoredRoutes });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

app.listen(5000, () => console.log("🚀 Backend running on http://localhost:5000"));
