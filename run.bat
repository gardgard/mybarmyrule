@echo off
title MyBarMyRule Server
echo.
echo    🥃 Starting MyBarMyRule...
echo    -----------------------------------
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [!] node_modules not found. Running npm install...
    call npm install
)

:: Set environment variables (Optional fallback)
set PORT=3500

:: Start the application
echo [OK] Server is starting on http://localhost:%PORT%
echo [TIP] Press Ctrl+C to stop the server.
echo.

node src/app.js

pause
