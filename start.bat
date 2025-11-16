@echo off
echo Starting SafeJourney...
echo.

echo Starting Backend Server...
start cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5010
echo Frontend: http://localhost:3004
echo.
echo Press any key to exit...
pause >nul

