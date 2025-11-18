import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import Session from "../models/Session.js";

const router = express.Router();

// Generate session token
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Helper function to convert userId (handles both ObjectId and numeric string)
function toUserId(userId) {
  if (!userId) return null;
  // If it's already an ObjectId or string that looks like ObjectId, return as is
  if (typeof userId === 'string' && userId.length === 24 && /^[0-9a-fA-F]{24}$/.test(userId)) {
    return userId;
  }
  // If it's a number or numeric string, we'll need to find the user by old numeric ID
  // For now, return as string and let MongoDB handle it
  return userId.toString();
}

// POST /api/auth/register - Register new user
router.post("/register", async (req, res) => {
  try {
    console.log("Registration attempt:", { 
      name: req.body.name, 
      email: req.body.email, 
      phone: req.body.phone 
    });

    const { name, phone, email, password } = req.body;

    // Validation
    if (!name || !phone || !email || !password) {
      return res.status(400).json({ 
        error: "All fields are required: name, phone, email, and password" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: "Password must be at least 6 characters long" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.trim().toLowerCase() },
        { phone: phone.trim() }
      ]
    });

    if (existingUser) {
      console.log("User already exists:", existingUser.email);
      return res.status(400).json({ 
        error: "User already exists with this email or phone number" 
      });
    }

    // Create new user
    const newUser = new User({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password: password, // In production, hash this!
      emergencyContacts: [],
      defaultContacts: [],
      preferences: {
        autoSelectSafest: true,
        batteryMode: "medium"
      }
    });

    await newUser.save();
    console.log("User registered successfully:", newUser.email);

    // Create session
    const token = generateToken();
    const session = new Session({
      token,
      userId: newUser._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    await session.save();

    res.json({
      message: "User registered successfully",
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone
      },
      token
    });

  } catch (err) {
    console.error("Error registering user:", err);
    
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ 
        error: `User already exists with this ${field}` 
      });
    }
    
    res.status(500).json({ 
      error: "Failed to register user",
      details: err.message 
    });
  }
});

// POST /api/auth/login - Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // In production, use proper password hashing!
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Find existing active session or create new one
    let session = await Session.findOne({ 
      userId: user._id,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      const token = generateToken();
      session = new Session({
        token,
        userId: user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      await session.save();
    } else {
      // Update expiration
      session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await session.save();
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      token: session.token
    });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Failed to login", details: err.message });
  }
});

// POST /api/auth/logout - Logout user
router.post("/logout", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    await Session.deleteOne({ token });

    res.json({ message: "Logout successful" });
  } catch (err) {
    console.error("Error logging out:", err);
    res.status(500).json({ error: "Failed to logout", details: err.message });
  }
});

// GET /api/auth/verify - Verify token and get user
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token;

    if (!token) {
      return res.status(401).json({ error: "Token is required" });
    }

    const session = await Session.findOne({ 
      token,
      expiresAt: { $gt: new Date() }
    }).populate('userId', 'name email phone');

    if (!session) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await User.findById(session.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error("Error verifying token:", err);
    res.status(500).json({ error: "Failed to verify token", details: err.message });
  }
});

export default router;
