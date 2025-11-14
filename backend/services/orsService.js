import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const ORS_BASE_URL = "https://api.openrouteservice.org/v2/directions/driving-car";

export async function getRoutesFromORS(start, end) {
  try {
    const response = await axios.post(
      ORS_BASE_URL,
      {
        coordinates: [
          [start.lng, start.lat],
          [end.lng, end.lat],
        ],
      },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.routes.map((r, i) => ({
      id: `route_${i + 1}`,
      summary: {
        distance: r.summary.distance,
        duration: r.summary.duration,
      },
      geometry: r.geometry, // for map drawing later
    }));
  } catch (err) {
    console.error("❌ ORS Fetch Error:", err.message);
    return [];
  }
}
