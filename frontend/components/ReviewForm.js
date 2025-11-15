import { useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

export default function ReviewForm({ userId, sessionData, routeUsed, sourceAddress, destinationAddress, onReviewSubmitted, onCancel }) {
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await axios.post(API_ENDPOINTS.reviews.submit, {
        userId,
        sessionId: sessionData?.sessionId,
        reviewText: reviewText.trim(),
        routeUsed: routeUsed || null,
        sourceAddress: sourceAddress || null,
        destinationAddress: destinationAddress || null,
        finalLocation: sessionData?.finalLocation || null,
        locationHistory: sessionData?.locationHistory || [],
        startedAt: sessionData?.startedAt || null,
        completedAt: sessionData?.completedAt || null
      });

      setSuccess(true);
      
      // Call callback after a short delay
      setTimeout(() => {
        if (onReviewSubmitted) {
          onReviewSubmitted(response.data.review);
        }
      }, 1500);
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(err.response?.data?.error || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border-2 border-green-400 rounded-2xl shadow-lg p-6 mb-6">
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Review Submitted Successfully!</h2>
          <p className="text-green-700">
            Thank you for your feedback. Your safe arrival has been recorded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-purple-400 rounded-2xl shadow-lg p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">📝 Journey Review</h2>
        <p className="text-gray-600 text-sm">
          Please share your experience and confirm you reached safely
        </p>
      </div>

      {/* Proof of Safe Arrival */}
      {sessionData?.finalLocation && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">✅ Proof of Safe Arrival</h3>
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>Final Location:</strong> {sessionData.finalLocation.address || `${sessionData.finalLocation.latitude}, ${sessionData.finalLocation.longitude}`}</p>
            <p><strong>Arrived At:</strong> {new Date(sessionData.completedAt || Date.now()).toLocaleString()}</p>
            {sessionData.locationHistory && sessionData.locationHistory.length > 0 && (
              <p><strong>Location Updates:</strong> {sessionData.locationHistory.length} updates recorded</p>
            )}
          </div>
        </div>
      )}

      {/* Route Information */}
      {routeUsed && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">🗺️ Route Used</h3>
          <div className="text-sm text-blue-700 space-y-1">
            {sourceAddress && destinationAddress && (
              <>
                <p><strong>From:</strong> {sourceAddress}</p>
                <p><strong>To:</strong> {destinationAddress}</p>
              </>
            )}
            {routeUsed.distance_km && (
              <p><strong>Distance:</strong> {routeUsed.distance_km} km</p>
            )}
            {routeUsed.duration_min && (
              <p><strong>Duration:</strong> {Math.round(routeUsed.duration_min)} minutes</p>
            )}
            {routeUsed.aiScore !== undefined && (
              <p><strong>Safety Score:</strong> {routeUsed.aiScore.toFixed(1)}/5.0</p>
            )}
            {routeUsed.reason && (
              <p><strong>Safety Reason:</strong> {routeUsed.reason}</p>
            )}
          </div>
        </div>
      )}

      {/* Journey Timeline */}
      {sessionData?.startedAt && sessionData?.completedAt && (
        <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">⏰ Journey Timeline</h3>
          <div className="text-sm text-purple-700 space-y-1">
            <p><strong>Started:</strong> {new Date(sessionData.startedAt).toLocaleString()}</p>
            <p><strong>Completed:</strong> {new Date(sessionData.completedAt).toLocaleString()}</p>
            {(() => {
              const duration = Math.round((new Date(sessionData.completedAt) - new Date(sessionData.startedAt)) / 1000 / 60);
              return <p><strong>Total Duration:</strong> {duration} minutes</p>;
            })()}
          </div>
        </div>
      )}

      {/* Review Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="reviewText" className="block text-sm font-medium text-gray-700 mb-2">
            Your Review (Optional)
          </label>
          <textarea
            id="reviewText"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience, any issues encountered, or feedback about the route..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your review will be saved along with proof of safe arrival, route details, and location history.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Skip
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

