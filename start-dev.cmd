@echo off
REM ============================================================
REM  CIVPRO Nexus website - local dev server launcher
REM  Double-click this file to start the site.
REM    -> http://localhost:5173  (browser opens automatically)
REM  Press Ctrl+C in this window to stop the server.
REM ============================================================

REM Run from this file's own folder, whatever drive it lives on
cd /d "%~dp0"

REM First-time only: install dependencies if they're missing
if not exist "node_modules" (
  echo Dependencies not found - installing once, this may take a minute...
  echo.
  call npm install
  echo.
)

echo Starting the CIVPRO Nexus website...
echo    Local:  http://localhost:5173
echo    Stop:   Ctrl+C
echo.

REM --open tells Vite to open the browser once the server is actually ready
call npm run dev -- --open

echo.
echo Dev server stopped.
pause
