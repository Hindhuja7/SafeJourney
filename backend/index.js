import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Initialize Gemini with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🌍 Static route data
const routes = [
  { id: "safest", name: "Main Corridor", lighting: "high", crime: "low", crowd: "high" },
  { id: "normal", name: "Inner Ring Road", lighting: "medium", crime: "moderate", crowd: "medium" },
  { id: "worst", name: "Outer Bypass", lighting: "low", crime: "high", crowd: "low" },
];

// 🧠 Function to call Gemini and get scores
async function generateGeminiScore(route) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are a safety scoring assistant.
Analyze the following route and give a JSON response only.

Route:
- Lighting: ${route.lighting}
- Crime Level: ${route.crime}
- Crowd Density: ${route.crowd}

Respond strictly in JSON:
{
  "score": "X.X",
  "reason": "reason text"
}`;

    const result = await model.generateContent(prompt);
    console.log("🔍 RAW GEMINI RESPONSE START");
    console.log(result.response.text());
    console.log("🔍 RAW GEMINI RESPONSE END\n");

    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    else throw new Error("No valid JSON found");
  } catch (err) {
    console.error("⚠️ Gemini parse error:", err);
    return { score: "7.0", reason: "AI error — fallback value used." };
  }
}

// 🛣️ API endpoint
app.get("/api/routes", async (req, res) => {
  const scoredRoutes = [];
  for (const route of routes) {
    const aiScore = await generateGeminiScore(route);
    scoredRoutes.push({ ...route, safetyScore: aiScore.score, reason: aiScore.reason });
  }

  const safest = scoredRoutes.reduce((a, b) => (parseFloat(a.safetyScore) > parseFloat(b.safetyScore) ? a : b));

  res.json({
    message: "✅ Gemini AI scoring applied to routes",
    safestRoute: safest.name,
    routes: scoredRoutes,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 SafeJourney AI backend running on http://localhost:${PORT}`));
