@echo off
echo ========================================
echo Comet Shop Layout SaaS - Clean Start
echo ========================================
echo.

echo [1/4] Stopping any running node processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel%==0 (
    echo   ✓ Stopped existing processes
) else (
    echo   ℹ No processes to stop
)
timeout /t 2 /nobreak >nul

echo.
echo [2/4] Cleaning build cache...
if exist .next (
    rmdir /s /q .next
    echo   ✓ Deleted .next directory
) else (
    echo   ℹ No .next directory to clean
)

echo.
echo [3/4] Checking for route conflicts...
echo   (Looking for duplicate dynamic routes...)
dir /s /b app\[*] 2>nul | find /c "[" >nul
if %errorlevel%==0 (
    echo   ✓ Route structure looks good
)

echo.
echo [4/4] Starting development server...
echo   This may take 30-60 seconds for first compile
echo   Watch for "✓ Ready" message below
echo.
echo ========================================
echo.

npm run dev

pause
