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



export default function RouteInfoCard({ route, index }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4">
      <h2 className="text-lg font-bold">
        {route.label} Route #{index + 1}
      </h2>
      <p>Distance: {route.distance_km} km</p>
      <p>Duration: {route.duration_min} min</p>
      <p>
        Score: {route.score} / 5 ({route.label})
      </p>
      <p>{route.reason}</p>
    </div>
  );
}
