import express from "express";
import { readJSON, writeJSON } from "../utils/fileUtils.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const REVIEWS_FILE = path.join(__dirname, "../data/reviews.json");

// Initialize reviews file if it doesn't exist
async function initReviewsFile() {
  try {
    await readJSON(REVIEWS_FILE);
  } catch (err) {
    await writeJSON(REVIEWS_FILE, []);
  }
}

// POST /api/reviews/submit - Submit a review after reaching destination
router.post("/submit", async (req, res) => {
  try {
    await initReviewsFile();

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

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId required" });
    }

    // Create review object
    const review = {
      id: `review_${Date.now()}_${userId}`,
      userId: parseInt(userId),
      sessionId: sessionId,
      reviewText: reviewText || "",
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      
      // Proof of safe arrival
      proof: {
        finalLocation: finalLocation || null,
        finalAddress: finalLocation?.address || null,
        arrivedAt: completedAt || new Date().toISOString(),
        coordinates: finalLocation ? {
          latitude: finalLocation.latitude,
          longitude: finalLocation.longitude
        } : null
      },
      
      // Route information
      route: routeUsed ? {
        routeId: routeUsed.id || null,
        distance: routeUsed.distance_km || null,
        duration: routeUsed.duration_min || null,
        safetyScore: routeUsed.aiScore || null,
        safetyReason: routeUsed.reason || null,
        sourceAddress: sourceAddress || null,
        destinationAddress: destinationAddress || null
      } : null,
      
      // Location history
      locationHistory: locationHistory || [],
      totalLocations: locationHistory ? locationHistory.length : 0,
      
      // Journey timeline
      journey: {
        startedAt: startedAt || null,
        completedAt: completedAt || new Date().toISOString(),
        duration: startedAt && completedAt 
          ? Math.round((new Date(completedAt) - new Date(startedAt)) / 1000 / 60) // minutes
          : null
      }
    };

    // Save review
    const reviews = await readJSON(REVIEWS_FILE);
    reviews.push(review);
    await writeJSON(REVIEWS_FILE, reviews);

    console.log(`✅ Review submitted: ${review.id} by user ${userId}`);

    res.json({
      message: "Review submitted successfully",
      reviewId: review.id,
      review: review
    });
  } catch (err) {
    console.error("Error submitting review:", err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// GET /api/reviews/:userId - Get all reviews for a user
router.get("/:userId", async (req, res) => {
  try {
    await initReviewsFile();

    const { userId } = req.params;
    const reviews = await readJSON(REVIEWS_FILE);
    
    const userReviews = reviews.filter(r => r.userId === parseInt(userId));
    
    // Sort by timestamp (newest first)
    userReviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      reviews: userReviews,
      count: userReviews.length
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// GET /api/reviews/session/:sessionId - Get review for a specific session
router.get("/session/:sessionId", async (req, res) => {
  try {
    await initReviewsFile();

    const { sessionId } = req.params;
    const reviews = await readJSON(REVIEWS_FILE);
    
    const review = reviews.find(r => r.sessionId === sessionId);

    if (!review) {
      return res.status(404).json({ error: "Review not found for this session" });
    }

    res.json({ review });
  } catch (err) {
    console.error("Error fetching review:", err);
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

export default router;

