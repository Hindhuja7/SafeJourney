import { useState } from "react";
import LiveLocationShare from "./LiveLocationShare";

export default function SafetyDashboard({ user }) {
  const [isLocationSharing, setIsLocationSharing] = useState(false);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Overview</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-2xl">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-sm font-medium text-gray-700">Active</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-2xl">
            <div className="text-2xl mb-2">📍</div>
            <p className="text-sm font-medium text-gray-700">
              {isLocationSharing ? "Tracking" : "Ready"}
            </p>
          </div>
        </div>
      </div>

      {/* Live Location Sharing */}
      <LiveLocationShare 
        userId={user.id} 
        onSharingChange={setIsLocationSharing}
      />
    </div>
  );
}