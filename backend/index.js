import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import safetyRoutes from "./routes/safetyRoutes.js"; // ⚡ Make sure this path is correct

dotenv.config();

const app = express();

// CORS
app.use(cors());

// Parse JSON
app.use(express.json());

// ✅ Register API routes
app.use("/api", safetyRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
