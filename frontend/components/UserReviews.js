// components/UserReviews.js
import { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

export default function UserReviews({ userId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId) {
      fetchReviews();
    }
  }, [userId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.reviews.getUserReviews(userId));
      setReviews(response.data.reviews || []);
      setError("");
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to load reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading reviews...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchReviews}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Reviews</h2>
            <p className="text-gray-600 text-sm mt-1">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"} saved
            </p>
          </div>
          <button
            onClick={fetchReviews}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Refresh
          </button>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-gray-600 text-lg font-medium mb-2">No reviews yet</p>
            <p className="text-gray-500 text-sm">
              Complete a journey to submit your first review
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🗺️</span>
                      <h3 className="font-semibold text-gray-800">
                        {review.route?.sourceAddress && review.route?.destinationAddress
                          ? `${review.route.sourceAddress} → ${review.route.destinationAddress}`
                          : "Journey Review"}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500">
                      {review.date} at {review.time}
                    </p>
                  </div>
                </div>

                {/* Review Text */}
                {review.reviewText && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {review.reviewText}
                    </p>
                  </div>
                )}

                {/* Route Details */}
                {review.route && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {review.route.distance && (
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Distance</p>
                        <p className="text-sm font-semibold text-blue-700">
                          {review.route.distance} km
                        </p>
                      </div>
                    )}
                    {review.route.duration && (
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Duration</p>
                        <p className="text-sm font-semibold text-green-700">
                          {Math.round(review.route.duration)} min
                        </p>
                      </div>
                    )}
                    {review.route.safetyScore !== null && review.route.safetyScore !== undefined && (
                      <div className="text-center p-2 bg-purple-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Safety</p>
                        <p className="text-sm font-semibold text-purple-700">
                          {review.route.safetyScore.toFixed(1)}/5.0
                        </p>
                      </div>
                    )}
                    {review.totalLocations > 0 && (
                      <div className="text-center p-2 bg-yellow-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Updates</p>
                        <p className="text-sm font-semibold text-yellow-700">
                          {review.totalLocations}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Journey Timeline */}
                {review.journey && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      {review.journey.startedAt && (
                        <div>
                          <span className="font-medium">Started:</span>{" "}
                          {new Date(review.journey.startedAt).toLocaleString()}
                        </div>
                      )}
                      {review.journey.completedAt && (
                        <div>
                          <span className="font-medium">Completed:</span>{" "}
                          {new Date(review.journey.completedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

