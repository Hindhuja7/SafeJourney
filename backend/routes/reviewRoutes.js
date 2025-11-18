import express from "express";
import Review from "../models/Review.js";
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
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(userId);
      if (user) {
        return user._id;
      }
    }

    // Try to find by oldId (numeric ID from JSON migration)
    const UserModel = (await import("../models/User.js")).default;
    const numericId = parseInt(userId, 10);
    if (!isNaN(numericId)) {
      const user = await UserModel.findOne({ oldId: numericId });
      if (user) {
        return user._id;
      }
    }

    // Try to find by phone number as last resort
    const userByPhone = await UserModel.findOne({ phone: userId.toString() });
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

// POST /api/reviews/submit - Submit a review after reaching destination
router.post("/submit", async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      reviewText,
      routeUsed,
      sourceAddress,
      destinationAddress,
      finalLocation,
      locationHistory,
      startedAt,
      completedAt
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    const numericUserId = await toUserId(userId);

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId required" });
    }

    // Extract route information
    const routeLabel = routeUsed?.label || routeUsed?.routeLabel || "Unknown Route";
    const rating = routeUsed?.rating || routeUsed?.safetyScore || 3; // Default rating if not provided
    const comment = reviewText || "";

    // Parse safety incidents if provided
    const safetyIncidents = [];
    if (routeUsed?.reason) {
      safetyIncidents.push(routeUsed.reason);
    }

    // Create review object
    const now = new Date();
    const review = new Review({
      userId: numericUserId,
      sessionId: sessionId,
      reviewText: comment,
      timestamp: now,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      sourceAddress: sourceAddress || "",
      destinationAddress: destinationAddress || "",
      routeLabel: routeLabel,
      rating: rating,
      comment: comment,
      safetyIncidents: safetyIncidents,
      location: finalLocation ? {
        latitude: finalLocation.latitude,
        longitude: finalLocation.longitude
      } : null,
      proof: {
        finalLocation: finalLocation || null,
        finalAddress: finalLocation?.address || null,
        arrivedAt: completedAt || now,
        coordinates: finalLocation ? {
          latitude: finalLocation.latitude,
          longitude: finalLocation.longitude
        } : null
      },
      route: routeUsed ? {
        routeId: routeUsed.id || null,
        distance: routeUsed.distance_km || null,
        duration: routeUsed.duration_min || null,
        safetyScore: routeUsed.aiScore || null,
        safetyReason: routeUsed.reason || null,
        sourceAddress: sourceAddress || null,
        destinationAddress: destinationAddress || null
      } : null,
      locationHistory: locationHistory || [],
      totalLocations: locationHistory ? locationHistory.length : 0,
      journey: {
        startedAt: startedAt || null,
        completedAt: completedAt || now,
        duration: startedAt && completedAt
          ? Math.round((new Date(completedAt) - new Date(startedAt)) / 1000 / 60)
          : null
      }
    });

    await review.save();

    console.log(`✅ Review submitted: ${review._id} by user ${numericUserId}`);

    res.json({
      message: "Review submitted successfully",
      reviewId: review._id.toString(),
      review: review
    });
  } catch (err) {
    console.error("Error submitting review:", err);
    res.status(500).json({
      error: "Failed to submit review",
      details: err.message
    });
  }
});

// GET /api/reviews/:userId - Get all reviews for a user
router.get("/:userId", async (req, res) => {
  try {
    const numericUserId = await toUserId(req.params.userId);

    const reviews = await Review.find({ userId: numericUserId })
      .sort({ timestamp: -1 }) // Sort by newest first
      .exec();

    // Transform reviews to include additional fields for compatibility
    const transformedReviews = reviews.map(review => ({
      id: review._id.toString(),
      userId: review.userId.toString(),
      sessionId: review.sessionId || null,
      reviewText: review.comment || review.reviewText,
      timestamp: review.timestamp,
      date: review.date,
      time: review.time,
      sourceAddress: review.sourceAddress,
      destinationAddress: review.destinationAddress,
      routeLabel: review.routeLabel,
      rating: review.rating,
      comment: review.comment || review.reviewText,
      safetyIncidents: review.safetyIncidents || [],
      location: review.location,
      createdAt: review.timestamp
    }));

    res.json({
      reviews: transformedReviews,
      count: transformedReviews.length
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({
      error: "Failed to fetch reviews",
      details: err.message
    });
  }
});

// GET /api/reviews/session/:sessionId - Get review for a specific session
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const review = await Review.findOne({ sessionId: sessionId });

    if (!review) {
      return res.status(404).json({
        error: "Review not found for this session",
        note: "No review found for the provided session ID."
      });
    }

    res.json({
      review: review
    });
  } catch (err) {
    console.error("Error fetching review:", err);
    res.status(500).json({
      error: "Failed to fetch review",
      details: err.message
    });
  }
});

export default router;
