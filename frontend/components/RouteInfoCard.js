// export default function RouteInfoCard({ route }) {
//   return (
//     <div className="w-64 bg-white shadow-lg p-4 rounded-2xl m-2">
//       <h2 className="text-lg font-semibold mb-2">{route.label}</h2>
//       <p><b>Name:</b> {route.name}</p>
//       <p><b>Distance:</b> {route.distance_km} km</p>
//       <p><b>Duration:</b> {route.duration_min} min</p>
//       <p><b>AI Score:</b> {route.score}</p>
//       <p className="text-gray-700 mt-1"><b>Reason:</b> {route.reason}</p>
//       <p className="text-gray-500 mt-1"><b>Scoring Method:</b> {route.source}</p>
//     </div>
//   );
// }



export default function RouteInfoCard({ route, index, isSelected, onSelect }) {
  const getLabelColor = () => {
    if (route.label === "Safest (Recommended)") return "bg-green-100 text-green-800 border-green-300";
    if (route.label === "Moderate") return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  return (
    <div 
      className={`route-card p-4 border-2 rounded-lg shadow-lg cursor-pointer transition-all ${
        isSelected 
          ? "border-purple-500 bg-purple-50 ring-2 ring-purple-300" 
          : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-xl"
      }`}
      onClick={() => onSelect && onSelect(route)}
    >
      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${getLabelColor()}`}>
        {route.label || `Route ${index + 1}`}
      </div>
      
      {isSelected && (
        <div className="mb-2 p-2 bg-purple-100 border border-purple-300 rounded text-sm text-purple-800 font-medium">
          ✓ This route selected
        </div>
      )}
      
      <div className="space-y-1 text-sm">
        <p><span className="font-semibold">Distance:</span> {route.distance_km} km</p>
        <p><span className="font-semibold">Duration:</span> {Math.round(route.duration_min)} min</p>
        <p><span className="font-semibold">Safety Score:</span> {route.aiScore?.toFixed(1) || "N/A"}/5.0</p>
        {route.reason && (
          <p className="text-gray-600 mt-2"><span className="font-semibold">Reason:</span> {route.reason}</p>
        )}
      </div>
    </div>
  );
}
