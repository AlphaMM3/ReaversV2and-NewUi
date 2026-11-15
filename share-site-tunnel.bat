@echo off
title IOM Itqaan Academy - 24/7 Live Public Tunnel
color 0A
echo ============================================================
echo   IOM Itqaan Academy - 24 Hours Live Public Share Tunnel
echo ============================================================
echo.
echo [1/3] Checking Frontend server on port 5174...
netstat -ano | findstr ":5174" >nul
if %errorlevel% neq 0 (
    echo [WARNING] Port 5174 is not listening! Starting frontend...
    start /min cmd /c "cd /d \"%~dp0iom-academy-new-ui\" && npm run dev"
    timeout /t 5 >nul
)

echo [2/3] Getting your one-time Tunnel Access Password (IP)...
for /f "tokens=*" %%a in ('curl -s https://loca.lt/mytunnelpassword') do set TUNNEL_PASSWORD=%%a

echo.
echo ============================================================
echo  YOUR TUNNEL ACCESS PASSWORD IS: %TUNNEL_PASSWORD%
echo  (Visitors only need to enter this IP once when prompted)
echo ============================================================
echo.
echo [3/3] Launching Public Tunnel on Port 5174...
echo.
echo Keep this window OPEN to keep the website live 24/7!
echo Press Ctrl+C if you want to stop sharing.
echo ============================================================
echo.
npx --yes localtunnel --port 5174
pause
