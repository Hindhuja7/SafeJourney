# SafeJourney Frontend

React frontend for the SafeJourney Safety-Aware Routing System.

## Setup

1. Install dependencies:
```bash
cd frontend/src
npm install
```

2. Create a `.env` file in the `frontend/src` directory:
```
VITE_API_URL=http://localhost:5000
VITE_TOMTOM_API_KEY=YOUR_TOMTOM_API_KEY
```

3. Start the development server:
```bash
npm start
```

The app will run on `http://localhost:3000`

## Usage

1. Enter origin coordinates (latitude and longitude)
2. Enter destination coordinates (latitude and longitude)
3. Click "Find Safe Routes"
4. View routes on the map with color-coded segments:
   - Green = Safe (Low Risk)
   - Yellow = Medium Risk
   - Red = Unsafe (High Risk)
5. The safest route is highlighted with a thicker line

