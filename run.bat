@echo off
REM ===========================
REM Insurance Management System - Run Backend + Cloudflare Tunnel
REM ===========================

setlocal enabledelayedexpansion

REM Set the directory where cloudflared should be stored
set CLOUDFLARED_DIR=%~dp0cloudflared
set CLOUDFLARED_EXE=%CLOUDFLARED_DIR%\cloudflared.exe
set CLOUDFLARED_VERSION=2024.12.2

REM Colors for output (Windows 10+)
REM Using PowerShell for color output since cmd is limited

echo.
echo ================================================================================
echo  Insurance Management System - Startup Script
echo ================================================================================
echo.

REM Check if cloudflared exists
if not exist "%CLOUDFLARED_EXE%" (
    echo [*] Cloudflared not found. Downloading...
    
    REM Create cloudflared directory if it doesn't exist
    if not exist "%CLOUDFLARED_DIR%" (
        mkdir "%CLOUDFLARED_DIR%"
        echo [+] Created cloudflared directory at %CLOUDFLARED_DIR%
    )
    
    REM Download cloudflared for Windows (AMD64)
    echo [*] Downloading cloudflared version %CLOUDFLARED_VERSION%...
    powershell -Command "& { [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocol]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/download/%CLOUDFLARED_VERSION%/cloudflared-windows-amd64.exe' -OutFile '%CLOUDFLARED_EXE%' }" 2>nul
    
    if exist "%CLOUDFLARED_EXE%" (
        echo [+] Cloudflared downloaded successfully!
    ) else (
        echo [-] Failed to download cloudflared. Ensure you have internet connection.
        echo [-] You can manually download from: https://github.com/cloudflare/cloudflared/releases
        pause
        exit /b 1
    )
) else (
    echo [+] Cloudflared found at %CLOUDFLARED_EXE%
)

echo.
echo [*] Starting services...
echo.

REM Change to backend directory and start backend
echo [*] Checking backend dependencies...
if not exist "backend\node_modules" (
    echo [-] Backend dependencies not installed. Installing...
    cd backend
    call npm install
    cd ..
)

echo.
echo [*] Starting backend server on port 5000...
start "Insurance Backend" /D "backend" cmd /k "npm run dev"

REM Wait a moment for backend to start
timeout /t 2 /nobreak

echo.
echo [*] Starting Cloudflare tunnel...
echo [*] Tunnel URL will be displayed below. Use this to access the frontend.
echo.

REM Start cloudflared tunnel pointing to frontend on localhost:3000
REM The tunnel will expose http://localhost:3000 to the internet
start "Cloudflare Tunnel" /D "%CLOUDFLARED_DIR%" cmd /k "cloudflared.exe tunnel --url http://localhost:3000"

REM Wait for tunnel to start
timeout /t 3 /nobreak

echo.
echo ================================================================================
echo  Services Started!
echo ================================================================================
echo.
echo [+] Backend:       Running on http://localhost:5000
echo [+] Frontend:      http://localhost:3000 (start manually with 'npm run dev' in frontend folder)
echo [+] Tunnel:        Started - check tunnel window for public URL
echo.
echo [*] To access your application:
echo     1. Get the tunnel URL from the Cloudflare Tunnel window
echo     2. Or use http://localhost:3000 locally
echo.
echo [*] Credentials:
echo     Admin:  admin@example.com / admin@123
echo     Agent:  agent@example.com / (seeded password)
echo.
echo [*] To stop services: Close the command windows or press Ctrl+C
echo.
echo ================================================================================
echo.

REM Keep this window open
pause
