export default function RouteSelector({ routes, onSelect }) {
  return (
    <div className="grid gap-3 mt-4">
      {routes.map((r, i) => (
        <button
          key={i}
          onClick={() => onSelect(r)}
          className={`p-3 rounded-xl text-left shadow border
            ${i === 0 ? "border-green-400 bg-green-50" :
              i === 1 ? "border-yellow-400 bg-yellow-50" :
              "border-red-400 bg-red-50"}`}
        >
          <p className="font-semibold">{r.name}</p>
          <p className="text-sm text-gray-600">
            Route ID: {r.routeId}
          </p>
        </button>
      ))}
    </div>
  );
}

