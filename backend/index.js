import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import safetyRoutes from "./routes/safetyRoutes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:3000'],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// mount API routes under /api
app.use("/api", safetyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
