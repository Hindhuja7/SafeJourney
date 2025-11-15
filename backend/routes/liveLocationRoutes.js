import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { sendLocationToContacts, sendEmergencyAlert } from "../services/smsService.js";
import { findNearbyPoliceStations } from "../services/policeStationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Path to data files
const USERS_FILE = path.join(__dirname, "../data/users.json");
const LIVE_SESSIONS_FILE = path.join(__dirname, "../data/liveSessions.json");

// Helper functions to read/write JSON files
async function readJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      // File doesn't exist, return default
      if (filePath === LIVE_SESSIONS_FILE) return [];
      return [];
    }
    throw err;
  }
}

async function writeJSON(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

// GET /api/live-location/contacts/:userId - Get user's contacts
router.get("/contacts/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const users = await readJSON(USERS_FILE);
    const user = users.find((u) => u.id === parseInt(userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      emergencyContacts: user.emergencyContacts || [],
      defaultContacts: user.defaultContacts || user.emergencyContacts || [],
    });
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// POST /api/live-location/contacts/:userId - Update user's default contacts
router.post("/contacts/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { defaultContacts } = req.body;

    if (!defaultContacts || !Array.isArray(defaultContacts) || defaultContacts.length < 1) {
      return res.status(400).json({ error: "At least 1 default contact required" });
    }

    const users = await readJSON(USERS_FILE);
    const userIndex = users.findIndex((u) => u.id === parseInt(userId));

    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    users[userIndex].defaultContacts = defaultContacts;
    await writeJSON(USERS_FILE, users);

    res.json({ message: "Default contacts updated", defaultContacts });
  } catch (err) {
    console.error("Error updating contacts:", err);
    res.status(500).json({ error: "Failed to update contacts" });
  }
});

// POST /api/live-location/start - Start live location sharing
router.post("/start", async (req, res) => {
  try {
    const { userId, selectedContacts, updateIntervalMinutes, batteryPercent } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    // Validate minimum 1 contact
    if (!selectedContacts || selectedContacts.length < 1) {
      return res.status(400).json({ error: "Minimum 1 contact required" });
    }

    if (!updateIntervalMinutes || updateIntervalMinutes < 1) {
      return res.status(400).json({ error: "Valid update interval required (minimum 1 minute)" });
    }

    const users = await readJSON(USERS_FILE);
    const user = users.find((u) => u.id === parseInt(userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get default contacts if none selected
    const contactsToUse = selectedContacts.length >= 1 
      ? selectedContacts 
      : (user.defaultContacts || user.emergencyContacts || []).slice(0, 1);

    if (contactsToUse.length < 1) {
      return res.status(400).json({ error: "Insufficient contacts. Please add at least 1 contact." });
    }

    // Check if there's an existing session
    const sessions = await readJSON(LIVE_SESSIONS_FILE);
    const existingSessionIndex = sessions.findIndex((s) => s.userId === parseInt(userId) && s.isActive);

    const session = {
      sessionId: existingSessionIndex >= 0 
        ? sessions[existingSessionIndex].sessionId 
        : `session_${Date.now()}_${userId}`,
      userId: parseInt(userId),
      selectedContacts: contactsToUse,
      updateIntervalMinutes: parseInt(updateIntervalMinutes),
      batteryPercent: batteryPercent || null,
      isActive: true,
      startedAt: existingSessionIndex >= 0 
        ? sessions[existingSessionIndex].startedAt 
        : new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      locations: existingSessionIndex >= 0 
        ? sessions[existingSessionIndex].locations 
        : [],
    };

    if (existingSessionIndex >= 0) {
      sessions[existingSessionIndex] = session;
    } else {
      sessions.push(session);
    }

    await writeJSON(LIVE_SESSIONS_FILE, sessions);

    // Send initial notification to contacts
    try {
      const userName = user?.name || "User";
      const initialMessage = `📍 SafeJourney: ${userName} has started sharing their live location with you. You will receive location updates every ${updateIntervalMinutes} minutes.`;
      
      // Send to all selected contacts
      const smsResults = await sendLocationToContacts(
        contactsToUse,
        { latitude: null, longitude: null, address: null },
        userName,
        initialMessage
      );
      // Log SMS results (only if there are failures)
      const failedSMS = smsResults.filter(r => !r.success);
      if (failedSMS.length > 0) {
        console.error("❌ Failed to send SMS to some contacts:", failedSMS);
      } else {
        console.log("✅ Initial SMS sent to contacts");
      }
      
      // Check if SMS service is configured (only warn once)
      const hasSmsService = smsResults.some(r => r.success && !r.warning);
      if (!hasSmsService && smsResults.length > 0 && !process.env._SMS_ROUTE_WARNING_SHOWN) {
        console.warn("⚠️  SMS service not configured. Messages are only being logged to console.");
        console.warn("   See backend/FREE_SMS_SETUP.md for FREE SMS setup instructions.");
        process.env._SMS_ROUTE_WARNING_SHOWN = 'true';
      }
    } catch (err) {
      console.error("Error sending initial SMS:", err);
      // Don't fail the request if SMS fails
    }

    res.json({
      message: "Live location sharing started",
      sessionId: session.sessionId,
      selectedContacts: session.selectedContacts,
      updateIntervalMinutes: session.updateIntervalMinutes,
    });
  } catch (err) {
    console.error("Error starting live location:", err);
    res.status(500).json({ error: "Failed to start live location sharing" });
  }
});

// POST /api/live-location/update - Update current location
router.post("/update", async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;

    if (!userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "userId, latitude, and longitude required" });
    }

    const sessions = await readJSON(LIVE_SESSIONS_FILE);
    const sessionIndex = sessions.findIndex(
      (s) => s.userId === parseInt(userId) && s.isActive
    );

    if (sessionIndex === -1) {
      return res.status(404).json({ error: "No active live location session found" });
    }

    const location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date().toISOString(),
    };

    sessions[sessionIndex].locations.push(location);
    sessions[sessionIndex].lastUpdated = new Date().toISOString();

    await writeJSON(LIVE_SESSIONS_FILE, sessions);

    // Send location to selected contacts via SMS
    const session = sessions[sessionIndex];
    if (session.selectedContacts && session.selectedContacts.length > 0) {
      // Get user info for personalized message
      const users = await readJSON(USERS_FILE);
      const user = users.find((u) => u.id === session.userId);
      const userName = user?.name || "User";

      // Reverse geocode to get address
      let address = null;
      try {
        const axios = (await import("axios")).default;
        const geoRes = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { "User-Agent": "SafeJourneyApp" } }
        );
        if (geoRes.data && geoRes.data.display_name) {
          address = geoRes.data.display_name;
        }
      } catch (err) {
        console.error("Geocoding error:", err);
      }

      // Send SMS to all selected contacts
      const smsResults = await sendLocationToContacts(
        session.selectedContacts,
        { latitude, longitude, address },
        userName
      );

      // Log SMS results (only if there are failures)
      const failedSMS = smsResults.filter(r => !r.success);
      if (failedSMS.length > 0) {
        console.error(`❌ Failed to send ${failedSMS.length} SMS message(s):`, failedSMS);
      }
      // Success messages are logged by SMS service itself
    }

    res.json({
      message: "Location updated",
      location,
      sessionId: sessions[sessionIndex].sessionId,
    });
  } catch (err) {
    console.error("Error updating location:", err);
    res.status(500).json({ error: "Failed to update location" });
  }
});

// POST /api/live-location/stop - Stop live location sharing
router.post("/stop", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const sessions = await readJSON(LIVE_SESSIONS_FILE);
    const sessionIndex = sessions.findIndex(
      (s) => s.userId === parseInt(userId) && s.isActive
    );

    if (sessionIndex === -1) {
      return res.status(404).json({ error: "No active live location session found" });
    }

    sessions[sessionIndex].isActive = false;
    sessions[sessionIndex].stoppedAt = new Date().toISOString();

    await writeJSON(LIVE_SESSIONS_FILE, sessions);

    res.json({
      message: "Live location sharing stopped",
      sessionId: sessions[sessionIndex].sessionId,
    });
  } catch (err) {
    console.error("Error stopping live location:", err);
    res.status(500).json({ error: "Failed to stop live location sharing" });
  }
});

// GET /api/live-location/status/:userId - Get current live location status
router.get("/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await readJSON(LIVE_SESSIONS_FILE);
    const session = sessions.find(
      (s) => s.userId === parseInt(userId) && s.isActive
    );

    if (!session) {
      return res.json({ isActive: false });
    }

    res.json({
      isActive: true,
      sessionId: session.sessionId,
      selectedContacts: session.selectedContacts,
      updateIntervalMinutes: session.updateIntervalMinutes,
      batteryPercent: session.batteryPercent,
      startedAt: session.startedAt,
      lastUpdated: session.lastUpdated,
      currentLocation: session.locations.length > 0 
        ? session.locations[session.locations.length - 1] 
        : null,
    });
  } catch (err) {
    console.error("Error fetching status:", err);
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// SOS Alert Routes

// POST /api/live-location/sos/start - Start SOS alert system
router.post("/sos/start", async (req, res) => {
  try {
    const { userId, checkInIntervalMinutes } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    if (!checkInIntervalMinutes || ![5, 10, 20].includes(parseInt(checkInIntervalMinutes))) {
      return res.status(400).json({ error: "checkInIntervalMinutes must be 5, 10, or 20" });
    }

    const sessions = await readJSON(LIVE_SESSIONS_FILE);
    const sessionIndex = sessions.findIndex(
      (s) => s.userId === parseInt(userId) && s.isActive
    );

    if (sessionIndex === -1) {
      return res.status(404).json({ error: "No active live location session found" });
    }

    const session = sessions[sessionIndex];
    
    // Initialize SOS alert system
    session.sosAlert = {
      isActive: true,
      checkInIntervalMinutes: parseInt(checkInIntervalMinutes),
      nextCheckIn: new Date(Date.now() + parseInt(checkInIntervalMinutes) * 60 * 1000).toISOString(),
      lastCheckIn: null,
      checkInHistory: [],
      emergencyTriggered: false
    };

    await writeJSON(LIVE_SESSIONS_FILE, sessions);

    res.json({
      message: "SOS alert system started",
      checkInIntervalMinutes: session.sosAlert.checkInIntervalMinutes,
      nextCheckIn: session.sosAlert.nextCheckIn
    });
  } catch (err) {
    console.error("Error starting SOS alert:", err);
    res.status(500).json({ error: "Failed to start SOS alert system" });
  }
});

// POST /api/live-location/sos/checkin - User checks in (safe or not safe)
router.post("/sos/checkin", async (req, res) => {
  try {
    const { userId, isSafe } = req.body;

    if (!userId || typeof isSafe !== "boolean") {
      return res.status(400).json({ error: "userId and isSafe (boolean) required" });
    }

    const sessions = await readJSON(LIVE_SESSIONS_FILE);
    const sessionIndex = sessions.findIndex(
      (s) => s.userId === parseInt(userId) && s.isActive
    );

    if (sessionIndex === -1) {
      return res.status(404).json({ error: "No active live location session found" });
    }

    const session = sessions[sessionIndex];

    if (!session.sosAlert || !session.sosAlert.isActive) {
      return res.status(400).json({ error: "SOS alert system not active" });
    }

    // Record check-in
    const checkIn = {
      timestamp: new Date().toISOString(),
      isSafe: isSafe,
      location: session.locations.length > 0 
        ? session.locations[session.locations.length - 1] 
        : null
    };

    session.sosAlert.checkInHistory.push(checkIn);
    session.sosAlert.lastCheckIn = new Date().toISOString();
    session.sosAlert.nextCheckIn = new Date(
      Date.now() + session.sosAlert.checkInIntervalMinutes * 60 * 1000
    ).toISOString();

    // If user is NOT safe, trigger emergency alert
    if (!isSafe) {
      session.sosAlert.emergencyTriggered = true;
      session.sosAlert.isActive = false; // Stop further check-ins

      // Get current location
      const currentLocation = session.locations.length > 0 
        ? session.locations[session.locations.length - 1] 
        : null;

      if (currentLocation && session.selectedContacts && session.selectedContacts.length > 0) {
        try {
          // Find nearby police stations
          let policeStations = [];
          try {
            policeStations = await findNearbyPoliceStations(
              currentLocation.latitude,
              currentLocation.longitude
            );
          } catch (policeErr) {
            console.error("Error finding police stations:", policeErr);
            // Continue without police stations
          }

          // Get user info
          const users = await readJSON(USERS_FILE);
          const user = users.find((u) => u.id === session.userId);
          const userName = user?.name || "User";

          // Reverse geocode to get address
          let address = null;
          try {
            const axios = (await import("axios")).default;
            const geoRes = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?lat=${currentLocation.latitude}&lon=${currentLocation.longitude}&format=json`,
              { headers: { "User-Agent": "SafeJourneyApp" } }
            );
            if (geoRes.data && geoRes.data.display_name) {
              address = geoRes.data.display_name;
            }
          } catch (err) {
            console.error("Geocoding error:", err);
            // Continue without address
          }

          // Send emergency alert
          const emergencyResults = await sendEmergencyAlert(
            session.selectedContacts,
            {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              address: address
            },
            userName,
            policeStations
          );

          console.log("🚨 Emergency alert sent:", emergencyResults);
        } catch (alertErr) {
          console.error("❌ Error sending emergency alert:", alertErr);
          // Don't fail the request, but log the error
        }
      } else {
        console.error("❌ Cannot send emergency alert: Missing location or contacts");
        if (!currentLocation) {
          console.error("   - No current location available");
        }
        if (!session.selectedContacts || session.selectedContacts.length === 0) {
          console.error("   - No contacts available");
        }
      }
    }

    await writeJSON(LIVE_SESSIONS_FILE, sessions);

    res.json({
      message: isSafe ? "Check-in recorded: You are safe" : "EMERGENCY ALERT TRIGGERED",
      checkIn: checkIn,
      emergencyTriggered: !isSafe,
      nextCheckIn: session.sosAlert.nextCheckIn
    });
  } catch (err) {
    console.error("Error processing SOS check-in:", err);
    res.status(500).json({ error: "Failed to process SOS check-in" });
  }
});

// POST /api/live-location/sos/emergency - Manually trigger emergency (no response timeout)
router.post("/sos/emergency", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const sessions = await readJSON(LIVE_SESSIONS_FILE);
    const sessionIndex = sessions.findIndex(
      (s) => s.userId === parseInt(userId) && s.isActive
    );

    if (sessionIndex === -1) {
      return res.status(404).json({ error: "No active live location session found" });
    }

    const session = sessions[sessionIndex];

    if (!session.sosAlert || !session.sosAlert.isActive) {
      return res.status(400).json({ error: "SOS alert system not active" });
    }

    // Mark emergency as triggered
    session.sosAlert.emergencyTriggered = true;
    session.sosAlert.isActive = false;

    // Get current location
    const currentLocation = session.locations.length > 0 
      ? session.locations[session.locations.length - 1] 
      : null;

    if (currentLocation && session.selectedContacts && session.selectedContacts.length > 0) {
      try {
        // Find nearby police stations
        let policeStations = [];
        try {
          policeStations = await findNearbyPoliceStations(
            currentLocation.latitude,
            currentLocation.longitude
          );
        } catch (policeErr) {
          console.error("Error finding police stations:", policeErr);
          // Continue without police stations
        }

        // Get user info
        const users = await readJSON(USERS_FILE);
        const user = users.find((u) => u.id === session.userId);
        const userName = user?.name || "User";

        // Reverse geocode to get address
        let address = null;
        try {
          const axios = (await import("axios")).default;
          const geoRes = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${currentLocation.latitude}&lon=${currentLocation.longitude}&format=json`,
            { headers: { "User-Agent": "SafeJourneyApp" } }
          );
          if (geoRes.data && geoRes.data.display_name) {
            address = geoRes.data.display_name;
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          // Continue without address
        }

        // Send emergency alert
        const emergencyResults = await sendEmergencyAlert(
          session.selectedContacts,
          {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            address: address
          },
          userName,
          policeStations
        );

        console.log("🚨 Emergency alert sent (no response):", emergencyResults);
      } catch (alertErr) {
        console.error("❌ Error sending emergency alert:", alertErr);
        // Don't fail the request, but log the error
      }
    } else {
      console.error("❌ Cannot send emergency alert: Missing location or contacts");
      if (!currentLocation) {
        console.error("   - No current location available");
      }
      if (!session.selectedContacts || session.selectedContacts.length === 0) {
        console.error("   - No contacts available");
      }
    }

    await writeJSON(LIVE_SESSIONS_FILE, sessions);

    res.json({
      message: "EMERGENCY ALERT TRIGGERED - No response detected",
      emergencyTriggered: true
    });
  } catch (err) {
    console.error("Error triggering emergency:", err);
    res.status(500).json({ error: "Failed to trigger emergency alert" });
  }
});

// GET /api/live-location/sos/status/:userId - Get SOS alert status
router.get("/sos/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await readJSON(LIVE_SESSIONS_FILE);
    const session = sessions.find(
      (s) => s.userId === parseInt(userId) && s.isActive
    );

    if (!session || !session.sosAlert) {
      return res.json({ 
        isActive: false,
        sosAlert: null
      });
    }

    res.json({
      isActive: session.sosAlert.isActive,
      checkInIntervalMinutes: session.sosAlert.checkInIntervalMinutes,
      nextCheckIn: session.sosAlert.nextCheckIn,
      lastCheckIn: session.sosAlert.lastCheckIn,
      emergencyTriggered: session.sosAlert.emergencyTriggered || false,
      checkInHistory: session.sosAlert.checkInHistory || []
    });
  } catch (err) {
    console.error("Error fetching SOS status:", err);
    res.status(500).json({ error: "Failed to fetch SOS status" });
  }
});

export default router;

