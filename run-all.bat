@echo off
REM ===========================
REM Insurance Management System - Full Startup (Backend + Frontend + Tunnel)
REM ===========================

setlocal enabledelayedexpansion

REM Set the directory where cloudflared should be stored
set CLOUDFLARED_DIR=%~dp0cloudflared
set CLOUDFLARED_EXE=%CLOUDFLARED_DIR%\cloudflared.exe
set CLOUDFLARED_VERSION=2024.12.2

echo.
echo ================================================================================
echo  Insurance Management System - Full Startup
echo ================================================================================
echo.

REM Check if cloudflared exists, download if not
if not exist "%CLOUDFLARED_EXE%" (
    echo [*] Cloudflared not found. Downloading...
    
    if not exist "%CLOUDFLARED_DIR%" (
        mkdir "%CLOUDFLARED_DIR%"
        echo [+] Created cloudflared directory
    )
    
    echo [*] Downloading cloudflared...
    powershell -Command "& { [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocol]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/download/%CLOUDFLARED_VERSION%/cloudflared-windows-amd64.exe' -OutFile '%CLOUDFLARED_EXE%' }" 2>nul
    
    if exist "%CLOUDFLARED_EXE%" (
        echo [+] Cloudflared downloaded successfully!
    ) else (
        echo [-] Failed to download cloudflared. Check internet connection.
        pause
        exit /b 1
    )
) else (
    echo [+] Cloudflared found
)

echo.
echo [*] Starting all services...
echo.

REM Check backend dependencies
if not exist "backend\node_modules" (
    echo [*] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

REM Check frontend dependencies
if not exist "frontend\node_modules" (
    echo [*] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo [*] Launching services in separate windows...
echo.

REM Start backend
echo [*] Starting Backend (port 5000)...
start "Insurance Backend" /D "backend" cmd /k "npm run dev"

REM Start frontend
echo [*] Starting Frontend (port 3000)...
start "Insurance Frontend" /D "frontend" cmd /k "npm run dev"

REM Wait for services to start
timeout /t 3 /nobreak

REM Start cloudflared tunnel
echo [*] Starting Cloudflare Tunnel...
start "Cloudflare Tunnel" /D "%CLOUDFLARED_DIR%" cmd /k "cloudflared.exe tunnel --url http://localhost:3000"

echo.
echo ================================================================================
echo  All Services Started!
echo ================================================================================
echo.
echo [+] Backend:       http://localhost:5000
echo [+] Frontend:      http://localhost:3000
echo [+] Tunnel:        (Check Cloudflare Tunnel window for public URL)
echo.
echo [*] Default Credentials:
echo     Admin:  admin@example.com / admin@123
echo     Agent:  agent@example.com / (check seed.sql for password)
echo.
echo [*] Troubleshooting:
echo     - If ports are in use, close existing services
echo     - Check firewall settings for port 5000 and 3000
echo     - Ensure MySQL is running on port 3306
echo.
echo ================================================================================
echo.

pause
