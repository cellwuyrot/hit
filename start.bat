@echo off
cd /d "%~dp0"
chcp 65001 >nul 2>&1
title TopHitStore

echo ============================================
echo   TopHitStore
echo   Avtomaticheskaya ustanovka i zapusk
echo ============================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js ne najden!
    echo Skachajte: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/6] Node.js najden:
node --version
echo.

:: Install deps
echo [2/6] Ustanovka zavisimostej (npm install)...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install ne udalos.
    pause
    exit /b 1
)
echo.

:: Create .env
if not exist ".env" (
    echo [3/6] Sozdanie .env...
    copy .env.example .env >nul
) else (
    echo [3/6] .env uzhe sushchestvuet.
)
echo.

:: Prisma generate
echo [4/6] Generaciya Prisma klienta...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Prisma generate ne udalos.
    pause
    exit /b 1
)
echo.

:: DB migrate
echo [5/6] Sozdanie bazy dannyh...
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo [WARNING] Migraciya ne udalas, probuyem db push...
    call npx prisma db push
)
echo.

:: Seed
echo [6/6] Zapolnenie bazy testovymi dannymi...
call npm run seed
echo.

echo ============================================
echo   Ustanovka zavershena!
echo   Zapusk servera...
echo.
echo   Sajt:         http://localhost:3000
echo   Admin-panel:  http://localhost:3000/admin
echo   Login: admin
echo   Password: admin123
echo ============================================
echo.
echo Dlya ostanovki nazmite Ctrl+C
echo.

:: Start dev server
call npm run dev

pause
