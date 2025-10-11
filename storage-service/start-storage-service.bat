@echo off
echo ========================================
echo Starting Interview Storage Service
echo ========================================
echo.

cd /d "%~dp0"

REM Set API Key
set API_KEY=ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

echo Starting Redis and Storage API...
docker-compose up -d

echo.
echo ========================================
echo Service Status:
echo ========================================
docker-compose ps

echo.
echo ========================================
echo Service is starting...
echo Redis: redis://localhost:6379
echo API: http://localhost:8080
echo ========================================
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
pause
