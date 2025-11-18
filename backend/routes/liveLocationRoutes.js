import express from "express";
import { sendLocationToContacts, sendEmergencyAlert } from "../services/smsService.js";
import { findNearbyPoliceStations } from "../services/policeStationService.js";
import axios from "axios";
import User from "../models/User.js";
import LiveSession from "../models/LiveSession.js";
import mongoose from "mongoose";

const router = express.Router();

// Convert userId to MongoDB ObjectId (handles both ObjectId string and numeric string for backward compatibility)
async function toUserId(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }
  
  // If it's a valid MongoDB ObjectId (24 hex characters)
  if (typeof userId === 'string' && userId.length === 24 && /^[0-9a-fA-F]{24}$/.test(userId)) {
    return new mongoose.Types.ObjectId(userId);
  }
  
  // Try to find user by old numeric ID (for backward compatibility during migration)
  try {
    // First try to find by _id if it's a valid ObjectId string
    if (mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);
      if (user) {
        return user._id;
      }
    }
    
    // Try to find by oldId (numeric ID from JSON migration)
    const numericId = parseInt(userId, 10);
    if (!isNaN(numericId)) {
      const user = await User.findOne({ oldId: numericId });
      if (user) {
        return user._id;
      }
    }
    
    // Try to find by phone number as last resort
    const userByPhone = await User.findOne({ phone: userId.toString() });
    if (userByPhone) {
      return userByPhone._id;
    }
    
    // If all lookups fail, throw error with helpful message
    throw new Error(`User not found with ID: ${userId}. If you're using a numeric ID from the old system, please run 'npm run migrate' or 'npm run add-old-ids' to update user records.`);
  } catch (err) {
    if (err.message.includes('User not found')) {
      throw err;
    }
    throw new Error(`Invalid userId format: ${userId}. ${err.message}`);
  }
}

// GET /api/live-location/contacts/:userId - Get user's contacts
router.get("/contacts/:userId", async (req, res) => {
  try {
    const userId = await toUserId(req.params.userId);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      emergencyContacts: user.emergencyContacts || user.contacts || [],
      defaultContacts: user.defaultContacts || user.contacts || [],
    });
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ 
      error: "Failed to fetch contacts",
      details: err.message 
    });
  }
});

// POST /api/live-location/contacts/:userId - Update user's default contacts
router.post("/contacts/:userId", async (req, res) => {
  try {
    const userId = await toUserId(req.params.userId);
    const { defaultContacts } = req.body;

    if (!defaultContacts || !Array.isArray(defaultContacts) || defaultContacts.length < 1) {
      return res.status(400).json({ error: "At least 1 default contact required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.defaultContacts = defaultContacts;
    user.contacts = defaultContacts; // Also update contacts field for compatibility
    await user.save();

    res.json({ message: "Default contacts updated", defaultContacts });
  } catch (err) {
    console.error("Error updating contacts:", err);
    res.status(500).json({ 
      error: "Failed to update contacts",
      details: err.message 
    });
  }
});

// POST /api/live-location/start - Start live location sharing
router.post("/start", async (req, res) => {
  try {
    const { userId, selectedContacts, updateIntervalMinutes, batteryPercent } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const numericUserId = await toUserId(userId);

    if (!updateIntervalMinutes || updateIntervalMinutes < 1) {
      return res.status(400).json({ error: "Valid update interval required (minimum 1 minute)" });
    }

    const user = await User.findById(numericUserId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get default contacts if none selected
    let contactsToUse = [];
    const normalizedSelectedContacts = selectedContacts && Array.isArray(selectedContacts) ? selectedContacts : [];
    
    if (normalizedSelectedContacts.length >= 1) {
      contactsToUse = normalizedSelectedContacts;
    } else if (user.defaultContacts && user.defaultContacts.length >= 1) {
      contactsToUse = user.defaultContacts.slice(0, 1);
    } else if (user.contacts && user.contacts.length >= 1) {
      contactsToUse = user.contacts.slice(0, 1);
    } else if (process.env.TWILIO_PHONE_NUMBER) {
      contactsToUse = [{
        name: "Emergency Contact",
        phone: process.env.TWILIO_PHONE_NUMBER
      }];
      console.log(`✅ Using TWILIO_PHONE_NUMBER as default contact: ${process.env.TWILIO_PHONE_NUMBER}`);
    } else {
      return res.status(400).json({ error: "No contacts selected and no default contact available. Please select at least 1 contact or configure TWILIO_PHONE_NUMBER in .env" });
    }

    if (contactsToUse.length < 1) {
      return res.status(400).json({ error: "Insufficient contacts. Please add at least 1 contact." });
    }

    // Check if there's an existing active session
    let session = await LiveSession.findOne({ 
      userId: numericUserId, 
      isActive: true 
    });

    const sessionId = `session_${Date.now()}_${numericUserId}`;
    const now = new Date();

    if (session) {
      // Update existing session
      session.selectedContacts = contactsToUse;
      session.updateIntervalMinutes = parseInt(updateIntervalMinutes);
      session.batteryPercent = batteryPercent || null;
      session.startedAt = session.startedAt || now;
      session.lastUpdated = now;
      
      await session.save();
    } else {
      // Create new session
      session = new LiveSession({
        sessionId: sessionId,
        userId: numericUserId,
        selectedContacts: contactsToUse,
        updateIntervalMinutes: parseInt(updateIntervalMinutes),
        batteryPercent: batteryPercent || null,
        isActive: true,
        startedAt: now,
        lastUpdated: now,
        locations: [],
        currentLocation: null,
        sosAlert: null,
        lastSmsSent: null
      });
      await session.save();
    }

    // Send initial notification to contacts
    try {
      const userName = user?.name || "User";
      const initialMessage = `📍 SafeJourney: ${userName} has started sharing their live location with you. You will receive location updates every ${updateIntervalMinutes} minutes.`;
      
      const smsResults = await sendLocationToContacts(
        contactsToUse,
        { latitude: null, longitude: null, address: null },
        userName,
        initialMessage
      );
      
      const failedSMS = smsResults.filter(r => !r.success);
      if (failedSMS.length > 0) {
        console.error("❌ Failed to send SMS to some contacts:", failedSMS);
      } else {
        console.log("✅ Initial SMS sent to contacts");
      }
      
      const hasSmsService = smsResults.some(r => r.success && !r.warning);
      if (!hasSmsService && smsResults.length > 0 && !process.env._SMS_ROUTE_WARNING_SHOWN) {
        console.warn("⚠️  SMS service not configured. Messages are only being logged to console.");
        process.env._SMS_ROUTE_WARNING_SHOWN = 'true';
      }
    } catch (err) {
      console.error("Error sending initial SMS:", err);
    }

    res.json({
      message: "Live location sharing started",
      sessionId: session.sessionId,
      selectedContacts: session.selectedContacts,
      updateIntervalMinutes: session.updateIntervalMinutes,
    });
  } catch (err) {
    console.error("Error starting live location:", err);
    res.status(500).json({ 
      error: "Failed to start live location sharing",
      details: err.message 
    });
  }
});

// POST /api/live-location/update - Update current location
router.post("/update", async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;

    if (!userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "userId, latitude, and longitude required" });
    }

    const numericUserId = await toUserId(userId);

    const session = await LiveSession.findOne({ 
      userId: numericUserId, 
      isActive: true 
    });

    if (!session) {
      return res.status(404).json({ error: "No active live location session found" });
    }

    const location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date()
    };

    if (!Array.isArray(session.locations)) {
      session.locations = [];
    }
    session.locations.push(location);
    session.currentLocation = location;
    session.lastUpdated = new Date();

    // Send location to selected contacts via SMS (only at intervals)
    if (session.selectedContacts && session.selectedContacts.length > 0) {
      const lastSmsTime = session.lastSmsSent ? new Date(session.lastSmsSent).getTime() : 0;
      const timeSinceLastSms = Date.now() - lastSmsTime;
      const minIntervalMs = (session.updateIntervalMinutes || 5) * 60 * 1000;
      
      if (timeSinceLastSms >= minIntervalMs) {
        const user = await User.findById(numericUserId);
        const userName = user?.name || "User";

        // Reverse geocode to get address
        let address = null;
        try {
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

        const smsResults = await sendLocationToContacts(
          session.selectedContacts,
          { latitude, longitude, address },
          userName
        );

        session.lastSmsSent = new Date();

        const failedSMS = smsResults.filter(r => !r.success);
        if (failedSMS.length > 0) {
          console.error(`❌ Failed to send ${failedSMS.length} SMS message(s):`, failedSMS);
        } else {
          console.log(`✅ Location SMS sent to ${session.selectedContacts.length} contact(s) (interval: ${session.updateIntervalMinutes} min)`);
        }
      } else {
        const remainingSeconds = Math.ceil((minIntervalMs - timeSinceLastSms) / 1000);
        console.log(`⏭️  Skipping SMS - ${remainingSeconds}s remaining until next interval (${session.updateIntervalMinutes} min)`);
      }
    }

    await session.save();

    res.json({
      message: "Location updated",
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp
      },
      sessionId: session.sessionId,
    });
  } catch (err) {
    console.error("Error updating location:", err);
    res.status(500).json({ 
      error: "Failed to update location",
      details: err.message 
    });
  }
});

// POST /api/live-location/stop - Stop live location sharing
router.post("/stop", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const numericUserId = await toUserId(userId);

    const session = await LiveSession.findOne({ 
      userId: numericUserId, 
      isActive: true 
    });

    if (!session) {
      return res.status(404).json({ error: "No active live location session found" });
    }

    session.isActive = false;
    session.stoppedAt = new Date();
    session.lastUpdated = new Date();

    // Get final location
    const finalLocation = session.locations && session.locations.length > 0
      ? session.locations[session.locations.length - 1]
      : null;

    // Reverse geocode final location
    let finalAddress = null;
    if (finalLocation) {
      try {
        const geoRes = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?lat=${finalLocation.latitude}&lon=${finalLocation.longitude}&format=json`,
          { headers: { "User-Agent": "SafeJourneyApp" } }
        );
        if (geoRes.data && geoRes.data.display_name) {
          finalAddress = geoRes.data.display_name;
        }
      } catch (err) {
        console.error("Geocoding error:", err);
      }
    }

    await session.save();

    res.json({
      message: "Live location sharing stopped",
      sessionId: session.sessionId,
      sessionData: {
        sessionId: session.sessionId,
        userId: session.userId.toString(),
        startedAt: session.startedAt,
        completedAt: session.stoppedAt,
        finalLocation: finalLocation ? {
          latitude: finalLocation.latitude,
          longitude: finalLocation.longitude,
          timestamp: finalLocation.timestamp,
          address: finalAddress
        } : null,
        locationHistory: (session.locations || []).map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          timestamp: loc.timestamp
        })),
        selectedContacts: session.selectedContacts || [],
        updateIntervalMinutes: session.updateIntervalMinutes
      }
    });
  } catch (err) {
    console.error("Error stopping live location:", err);
    res.status(500).json({ 
      error: "Failed to stop live location sharing",
      details: err.message 
    });
  }
});

// GET /api/live-location/status/:userId - Get current live location status
router.get("/status/:userId", async (req, res) => {
  try {
    const numericUserId = await toUserId(req.params.userId);
    const session = await LiveSession.findOne({ 
      userId: numericUserId, 
      isActive: true 
    });

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
      currentLocation: session.currentLocation ? {
        latitude: session.currentLocation.latitude,
        longitude: session.currentLocation.longitude,
        timestamp: session.currentLocation.timestamp
      } : null,
    });
  } catch (err) {
    console.error("Error fetching status:", err);
    res.status(500).json({ 
      error: "Failed to fetch status",
      details: err.message 
    });
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

    const numericUserId = await toUserId(userId);

    if (!checkInIntervalMinutes || ![2, 5, 10, 20].includes(parseInt(checkInIntervalMinutes))) {
      return res.status(400).json({ error: "checkInIntervalMinutes must be 2, 5, 10, or 20" });
    }

    const session = await LiveSession.findOne({ 
      userId: numericUserId, 
      isActive: true 
    });

    if (!session) {
      return res.status(404).json({ error: "No active live location session found" });
    }
    
    // Initialize SOS alert system
    session.sosAlert = {
      isActive: true,
      checkInIntervalMinutes: parseInt(checkInIntervalMinutes),
      nextCheckIn: new Date(Date.now() + parseInt(checkInIntervalMinutes) * 60 * 1000),
      lastCheckIn: null,
      checkInHistory: [],
      emergencyTriggered: false
    };

    await session.save();

    res.json({
      message: "SOS alert system started",
      checkInIntervalMinutes: session.sosAlert.checkInIntervalMinutes,
      nextCheckIn: session.sosAlert.nextCheckIn
    });
  } catch (err) {
    console.error("Error starting SOS alert:", err);
    res.status(500).json({ 
      error: "Failed to start SOS alert system",
      details: err.message 
    });
  }
});

// POST /api/live-location/sos/checkin - User checks in (safe or not safe)
router.post("/sos/checkin", async (req, res) => {
  try {
    const { userId, isSafe } = req.body;

    if (!userId || typeof isSafe !== "boolean") {
      return res.status(400).json({ error: "userId and isSafe (boolean) required" });
    }

    const numericUserId = await toUserId(userId);

    const session = await LiveSession.findOne({ 
      userId: numericUserId, 
      isActive: true 
    });

    if (!session) {
      return res.status(404).json({ error: "No active live location session found" });
    }

    if (!session.sosAlert || !session.sosAlert.isActive) {
      return res.status(400).json({ error: "SOS alert system not active" });
    }

    // Record check-in
    const currentLocation = session.locations && session.locations.length > 0 
      ? session.locations[session.locations.length - 1]
      : null;

    const checkIn = {
      timestamp: new Date(),
      isSafe: isSafe,
      location: currentLocation || null
    };

    if (!Array.isArray(session.sosAlert.checkInHistory)) {
      session.sosAlert.checkInHistory = [];
    }

    session.sosAlert.checkInHistory.push(checkIn);
    session.sosAlert.lastCheckIn = new Date();
    session.sosAlert.nextCheckIn = new Date(
      Date.now() + session.sosAlert.checkInIntervalMinutes * 60 * 1000
    );

    let emergencyResults = [];
    let policeAlertResults = [];

    // If user is NOT safe, trigger emergency alert
    if (!isSafe) {
      session.sosAlert.emergencyTriggered = true;
      session.sosAlert.isActive = false;
      session.sosAlert.emergencyTriggeredAt = new Date();

      if (currentLocation && session.selectedContacts && session.selectedContacts.length > 0) {
        try {
          let policeStations = [];
          try {
            policeStations = await findNearbyPoliceStations(
              currentLocation.latitude,
              currentLocation.longitude
            );
          } catch (policeErr) {
            console.error("Error finding police stations:", policeErr);
          }

          const user = await User.findById(numericUserId);
          const userName = user?.name || "User";

          // Reverse geocode to get address
          let address = null;
          try {
            const geoRes = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?lat=${currentLocation.latitude}&lon=${currentLocation.longitude}&format=json`,
              { headers: { "User-Agent": "SafeJourneyApp" } }
            );
            if (geoRes.data && geoRes.data.display_name) {
              address = geoRes.data.display_name;
            }
          } catch (err) {
            console.error("Geocoding error:", err);
          }

          emergencyResults = await sendEmergencyAlert(
            session.selectedContacts,
            {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              address: address
            },
            userName,
            policeStations
          );

          console.log("🚨 Emergency alert sent to contacts:", emergencyResults);

          if (policeStations.length > 0) {
            try {
              const { getEmergencyContacts } = await import("../services/policeStationService.js");
              const emergencyContacts = getEmergencyContacts();
              const policeHelpline = emergencyContacts.india.police;
              
              console.log(`🚔 Police alert prepared for helpline ${policeHelpline}`);
              policeAlertResults = [{
                contact: "Police Helpline",
                phone: policeHelpline,
                success: true,
                method: "Emergency Helpline",
                note: "Alert prepared for police dispatch"
              }];
            } catch (policeAlertErr) {
              console.error("Error preparing police alert:", policeAlertErr);
            }
          }
        } catch (alertErr) {
          console.error("❌ Error sending emergency alert:", alertErr);
        }
      } else {
        console.error("❌ Cannot send emergency alert: Missing location or contacts");
      }
    }

    await session.save();

    res.json({
      message: isSafe ? "Check-in recorded: You are safe" : "EMERGENCY ALERT TRIGGERED",
      checkIn: {
        timestamp: checkIn.timestamp,
        isSafe: checkIn.isSafe,
        location: checkIn.location
      },
      emergencyTriggered: !isSafe,
      nextCheckIn: session.sosAlert.nextCheckIn,
      alertResults: !isSafe ? {
        contacts: emergencyResults || [],
        policeStations: policeAlertResults || []
      } : null
    });
  } catch (err) {
    console.error("Error processing SOS check-in:", err);
    res.status(500).json({ 
      error: "Failed to process SOS check-in",
      details: err.message 
    });
  }
});

// POST /api/live-location/sos/emergency - Manually trigger emergency
router.post("/sos/emergency", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const numericUserId = await toUserId(userId);

    const session = await LiveSession.findOne({ 
      userId: numericUserId, 
      isActive: true 
    });

    if (!session) {
      return res.status(404).json({ error: "No active live location session found" });
    }

    if (!session.sosAlert || !session.sosAlert.isActive) {
      return res.status(400).json({ error: "SOS alert system not active" });
    }

    session.sosAlert.emergencyTriggered = true;
    session.sosAlert.isActive = false;
    session.sosAlert.emergencyTriggeredAt = new Date();

    const currentLocation = session.locations && session.locations.length > 0 
      ? session.locations[session.locations.length - 1]
      : null;

    let emergencyResults = [];
    let policeAlertResults = [];

    if (currentLocation && session.selectedContacts && session.selectedContacts.length > 0) {
      try {
        let policeStations = [];
        try {
          policeStations = await findNearbyPoliceStations(
            currentLocation.latitude,
            currentLocation.longitude
          );
        } catch (policeErr) {
          console.error("Error finding police stations:", policeErr);
        }

        const user = await User.findById(numericUserId);
        const userName = user?.name || "User";

        let address = null;
        try {
          const geoRes = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${currentLocation.latitude}&lon=${currentLocation.longitude}&format=json`,
            { headers: { "User-Agent": "SafeJourneyApp" } }
          );
          if (geoRes.data && geoRes.data.display_name) {
            address = geoRes.data.display_name;
          }
        } catch (err) {
          console.error("Geocoding error:", err);
        }

        emergencyResults = await sendEmergencyAlert(
          session.selectedContacts,
          {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            address: address
          },
          userName,
          policeStations
        );

        console.log("🚨 Emergency alert sent to contacts (no response):", emergencyResults);

        if (policeStations.length > 0) {
          try {
            const { getEmergencyContacts } = await import("../services/policeStationService.js");
            const emergencyContacts = getEmergencyContacts();
            const policeHelpline = emergencyContacts.india.police;
            
            console.log(`🚔 Police alert prepared for helpline ${policeHelpline}`);
            policeAlertResults = [{
              contact: "Police Helpline",
              phone: policeHelpline,
              success: true,
              method: "Emergency Helpline",
              note: "Alert prepared for police dispatch"
            }];
          } catch (policeAlertErr) {
            console.error("Error preparing police alert:", policeAlertErr);
          }
        }
      } catch (alertErr) {
        console.error("❌ Error sending emergency alert:", alertErr);
      }
    } else {
      console.error("❌ Cannot send emergency alert: Missing location or contacts");
    }

    await session.save();

    res.json({
      message: "EMERGENCY ALERT TRIGGERED - No response detected",
      emergencyTriggered: true,
      alertResults: {
        contacts: emergencyResults || [],
        policeStations: policeAlertResults || []
      }
    });
  } catch (err) {
    console.error("Error triggering emergency:", err);
    res.status(500).json({ 
      error: "Failed to trigger emergency alert",
      details: err.message 
    });
  }
});

// GET /api/live-location/sos/status/:userId - Get SOS alert status
router.get("/sos/status/:userId", async (req, res) => {
  try {
    const numericUserId = await toUserId(req.params.userId);
    const session = await LiveSession.findOne({ 
      userId: numericUserId, 
      isActive: true 
    });

    if (!session || !session.sosAlert) {
      return res.json({ 
        isActive: false,
        sosAlert: null
      });
    }

    res.json({
      isActive: session.sosAlert.isActive,
      checkInIntervalMinutes: session.sosAlert.checkInIntervalMinutes,
      nextCheckIn: session.sosAlert.nextCheckIn || null,
      lastCheckIn: session.sosAlert.lastCheckIn || null,
      emergencyTriggered: session.sosAlert.emergencyTriggered || false,
      checkInHistory: session.sosAlert.checkInHistory || []
    });
  } catch (err) {
    console.error("Error fetching SOS status:", err);
    res.status(500).json({ 
      error: "Failed to fetch SOS status",
      details: err.message 
    });
  }
});

export default router;
