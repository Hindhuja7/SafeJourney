import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import safetyRoutes from "./routes/safetyRoutes.js";
import liveLocationRoutes from "./routes/liveLocationRoutes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running", timestamp: new Date().toISOString() });
});

// mount API routes under /api
app.use("/api", safetyRoutes);
app.use("/api/live-location", liveLocationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗺️  Routes API: http://localhost:${PORT}/api/routes`);
});
