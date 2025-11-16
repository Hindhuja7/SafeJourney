// components/RouteInfoCard.js
export default function RouteInfoCard({ route, index, isSelected, onSelect, onStartNavigation }) {
  const getLabelColor = () => {
    if (route.label === "Safest (Recommended)") {
      return {
        bg: "bg-green-50",
        text: "text-green-800",
        border: "border-green-400",
        heading: "bg-green-600 text-white",
        badge: "bg-green-100 text-green-800 border-green-300"
      };
    }
    if (route.label === "Moderate") {
      return {
        bg: "bg-yellow-50",
        text: "text-yellow-800",
        border: "border-yellow-400",
        heading: "bg-yellow-600 text-white",
        badge: "bg-yellow-100 text-yellow-800 border-yellow-300"
      };
    }
    return {
      bg: "bg-red-50",
      text: "text-red-800",
      border: "border-red-400",
      heading: "bg-red-600 text-white",
      badge: "bg-red-100 text-red-800 border-red-300"
    };
  };

  const colors = getLabelColor();

  return (
    <div
      className={`route-card p-4 border-2 rounded-lg shadow-lg cursor-pointer transition-all ${isSelected
        ? `${colors.border} ${colors.bg} ring-4 ring-opacity-50 ${colors.border.replace('border-', 'ring-')}`
        : `${colors.border} ${colors.bg} hover:shadow-xl hover:scale-105`
        }`}
      onClick={() => onSelect && onSelect(route)}
    >
      {/* Heading with Color */}
      <div className={`${colors.heading} px-4 py-2 rounded-t-lg -m-4 mb-3 font-bold text-center`}>
        {route.label || `Route ${index + 1}`}
      </div>

      {isSelected && (
        <div className={`mb-3 p-2 ${colors.badge} border-2 rounded text-sm font-medium text-center`}>
          ✓ Selected Route
        </div>
      )}

      <div className={`space-y-2 text-sm ${colors.text}`}>
        <div className="flex justify-between">
          <span className="font-semibold">Distance:</span>
          <span>{route.distance_km} km</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Duration:</span>
          <span>{Math.round(route.duration_min)} min</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Safety Score:</span>
          <span className="font-bold">{route.aiScore?.toFixed(1) || "N/A"}/5.0</span>
        </div>
        {route.reason && (
          <div className="mt-3 pt-3 border-t border-opacity-30">
            <p className="text-xs opacity-90"><span className="font-semibold">Details:</span> {route.reason}</p>
          </div>
        )}
      </div>

      {/* Start Navigation Button - Only show if selected and onStartNavigation is provided */}
      {isSelected && onStartNavigation && (
        <div className="mt-4 pt-4 border-t border-opacity-30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartNavigation(route);
            }}
            className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${colors.heading} hover:opacity-90 flex items-center justify-center gap-2`}
          >
            <span className="text-lg">🧭</span>
            <span>Start Navigation</span>
          </button>
        </div>
      )}
    </div>
  );
}