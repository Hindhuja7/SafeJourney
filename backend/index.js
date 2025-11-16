import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, mkdirSync } from "fs";
import safetyRoutes from "./routes/safetyRoutes.js";
import liveLocationRoutes from "./routes/liveLocationRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

// Ensure data directory exists for JSON file storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, "data");

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log("✅ Created data directory:", dataDir);
}

const app = express();

// Build allowed origins list - supports both local dev and Render deployment
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3004",
  // Render production URLs (will be set via environment variables)
  process.env.FRONTEND_URL?.includes("onrender.com") ? process.env.FRONTEND_URL : null,
  // Local development URLs
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3004",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3004",
].filter(Boolean); // Remove null values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin) || origin.includes("onrender.com")) {
      callback(null, true);
    } else {
      // In development, allow all origins
      if (process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running", timestamp: new Date().toISOString() });
});

// mount API routes under /api
app.use("/api/auth", authRoutes);
app.use("/api", safetyRoutes);
app.use("/api/live-location", liveLocationRoutes);
app.use("/api/reviews", reviewRoutes);

const PORT = process.env.PORT || 5010;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗺️  Routes API: http://localhost:${PORT}/api/routes`);
});
