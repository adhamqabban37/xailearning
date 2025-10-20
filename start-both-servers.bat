@echo off
echo Starting AI Learning Platform...
echo.

echo Starting Backend Server on port 8002...
start "Backend Server" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8002"

timeout /t 5 /nobreak

echo Starting Frontend Server on port 3001...
start "Frontend Server" cmd /k "cd /d "%~dp0frontend" && npx next dev -p 3001"

echo.
echo ========================================
echo Both servers are starting...
echo Backend: http://127.0.0.1:8002
echo Frontend: http://localhost:3001
echo ========================================
echo.
echo Press any key to close this window (servers will keep running)
pause
