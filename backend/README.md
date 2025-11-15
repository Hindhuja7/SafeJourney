# SafeJourney Backend

Backend server for the SafeJourney Safety-Aware Routing System.

## Setup

1. Install dependencies:
```bash
cd backend/src
npm install
```

2. Create a `.env` file in the `backend/src` directory:
```
TOMTOM_API_KEY=YOUR_TOMTOM_API_KEY
PORT=5000
```

3. Start the server:
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### GET /safe-routes
Fetches safe routes between origin and destination.

**Query Parameters:**
- `originLat` - Origin latitude
- `originLon` - Origin longitude
- `destLat` - Destination latitude
- `destLon` - Destination longitude

**Example:**
```
GET /safe-routes?originLat=40.7128&originLon=-74.0060&destLat=40.7589&destLon=-73.9851
```

**Response:**
```json
{
  "safestRouteIndex": 0,
  "routes": [
    {
      "id": 0,
      "riskScore": 0.3,
      "segments": [...],
      "geometry": {...},
      "summary": {...}
    }
  ]
}
```

### GET /health
Health check endpoint.

