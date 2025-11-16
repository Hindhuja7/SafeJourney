import { useState } from "react";
import LiveLocationShare from "./LiveLocationShare";

export default function SafetyDashboard({ user }) {
  const [isLocationSharing, setIsLocationSharing] = useState(false);

  return (
    <div className="space-y-6 bg-white dark:bg-purple-50/5 p-4 rounded-lg min-h-screen">
      {/* Quick Stats */}
      <div className="bg-purple-100/80 dark:bg-purple-100/40 rounded-3xl shadow-md border border-purple-200/50 dark:border-purple-200/20 p-6 hover:shadow-lg hover:shadow-purple-300/30 dark:hover:shadow-green-400/20 transition-all duration-300">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Overview</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-purple-200/60 dark:bg-purple-200/30 rounded-2xl border border-purple-300/50 dark:border-purple-200/20 hover:shadow-md hover:scale-105 transition-all duration-300">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-sm font-medium text-gray-700 dark:text-white">Active</p>
          </div>
          
          <div className="text-center p-4 bg-purple-200/60 dark:bg-purple-200/30 rounded-2xl border border-purple-300/50 dark:border-purple-200/20 hover:shadow-md hover:scale-105 transition-all duration-300">
            <div className="text-2xl mb-2">📍</div>
            <p className="text-sm font-medium text-gray-700 dark:text-white">
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