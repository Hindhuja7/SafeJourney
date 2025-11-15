import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const USERS_FILE = path.join(__dirname, "../data/users.json");
const SESSIONS_FILE = path.join(__dirname, "../data/sessions.json");

// Helper functions
async function readJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

async function writeJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`Error writing JSON file ${filePath}:`, err);
    throw err;
  }
}

// Generate session token
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// POST /api/auth/register - Register new user
router.post("/register", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email || !password) {
      return res.status(400).json({ error: "Name, phone, email, and password are required" });
    }

    const users = await readJSON(USERS_FILE);

    // Check if user already exists
    if (users.find(u => u.email === email || u.phone === phone)) {
      return res.status(400).json({ error: "User already exists with this email or phone" });
    }

    // Create new user
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password: password, // In production, hash this!
      emergencyContacts: [],
      defaultContacts: [],
      preferences: {
        autoSelectSafest: true,
        batteryMode: "medium"
      },
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeJSON(USERS_FILE, users);

    // Create session
    const sessions = await readJSON(SESSIONS_FILE);
    const token = generateToken();
    const session = {
      token,
      userId: newUser.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };
    sessions.push(session);
    await writeJSON(SESSIONS_FILE, sessions);

    res.json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone
      },
      token
    });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// POST /api/auth/login - Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const users = await readJSON(USERS_FILE);
    const user = users.find(u => u.email === email.trim().toLowerCase());

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create or update session
    const sessions = await readJSON(SESSIONS_FILE);
    let session = sessions.find(s => s.userId === user.id && new Date(s.expiresAt) > new Date());

    if (!session) {
      const token = generateToken();
      session = {
        token,
        userId: user.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      sessions.push(session);
    } else {
      // Update expiration
      session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    await writeJSON(SESSIONS_FILE, sessions);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      token: session.token
    });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

// POST /api/auth/logout - Logout user
router.post("/logout", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const sessions = await readJSON(SESSIONS_FILE);
    const filtered = sessions.filter(s => s.token !== token);
    await writeJSON(SESSIONS_FILE, filtered);

    res.json({ message: "Logout successful" });
  } catch (err) {
    console.error("Error logging out:", err);
    res.status(500).json({ error: "Failed to logout" });
  }
});

// GET /api/auth/verify - Verify token and get user
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token;

    if (!token) {
      return res.status(401).json({ error: "Token is required" });
    }

    const sessions = await readJSON(SESSIONS_FILE);
    const session = sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());

    if (!session) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const users = await readJSON(USERS_FILE);
    const user = users.find(u => u.id === session.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error("Error verifying token:", err);
    res.status(500).json({ error: "Failed to verify token" });
  }
});

export default router;

