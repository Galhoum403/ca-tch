@echo off
chcp 65001 >nul
cd /d "%~dp0"
title CATCH Online - Godot 4
echo ======================================================
echo 🎴 تشغيل كاتش أونلاين عبر محرك جودوت 4 (CATCH Online)
echo ======================================================

netstat -ano | findstr ":3001" >nul
if %errorlevel% neq 0 (
    echo [INFO] Starting CATCH Server...
    start /min "CATCH Server" cmd /c "node server.js"
    timeout /t 2 /nobreak >nul
)

echo [INFO] Launching Godot Game...
start "" "%~dp0godot\Godot_v4.3-stable_win64.exe" --path "%~dp0godot_project"
exit
