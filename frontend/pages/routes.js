import { useEffect, useState } from "react";

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [safestRoute, setSafestRoute] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/routes")
      .then((res) => res.json())
      .then((data) => {
        setRoutes(data.routes);
        setSafestRoute(data.safestRoute);
      })
      .catch((err) => console.error("Error fetching routes:", err));
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🚦 SafeJourney AI — Route Safety Insights</h1>

      <div style={styles.grid}>
        {routes.map((route) => (
          <div
            key={route.id}
            style={{
              ...styles.card,
              borderColor:
                route.name === safestRoute ? "#4ade80" : "#d8b4fe",
              backgroundColor:
                route.name === safestRoute ? "#ecfdf5" : "#ffffff",
            }}
          >
            <h2 style={styles.routeName}>
              {route.name}
              {route.name === safestRoute && (
                <span style={styles.safestTag}> (Safest ✅)</span>
              )}
            </h2>
            <p>💡 Lighting: <strong>{route.lighting}</strong></p>
            <p>🚨 Crime: <strong>{route.crime}</strong></p>
            <p>👥 Crowd: <strong>{route.crowd}</strong></p>
            <p>⭐ Safety Score: <strong>{route.safetyScore}</strong></p>
            <p style={styles.reason}>{route.reason}</p>
          </div>
        ))}
      </div>

      {safestRoute && (
        <div style={styles.footer}>
          🛣️ Safest Route Overall: <span style={styles.highlight}>{safestRoute}</span>
        </div>
      )}
    </div>
  );
}

// 🎨 Inline Styles
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom right, #f4f0ff, #ffffff)",
    padding: "2rem",
    fontFamily: "sans-serif",
  },
  title: {
    textAlign: "center",
    color: "#6b21a8",
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "2rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    border: "2px solid #d8b4fe",
    borderRadius: "20px",
    padding: "1.5rem",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    transition: "transform 0.2s",
  },
  routeName: {
    color: "#4c1d95",
    fontWeight: "600",
    fontSize: "1.2rem",
    marginBottom: "0.5rem",
  },
  safestTag: {
    color: "#16a34a",
    fontWeight: "bold",
  },
  reason: {
    marginTop: "0.5rem",
    color: "#555",
    fontStyle: "italic",
    fontSize: "0.9rem",
  },
  footer: {
    marginTop: "2rem",
    textAlign: "center",
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#16a34a",
  },
  highlight: {
    textDecoration: "underline",
  },
};
