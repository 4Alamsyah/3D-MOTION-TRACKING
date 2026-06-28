@echo off
chcp 65001 >nul
title Motion Capture 3D
color 0B
cls
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║       Motion Capture 3D Launcher        ║
echo  ║   OpenCV + MediaPipe + Three.js         ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python tidak ditemukan!
    echo  Download dari: https://www.python.org/downloads/
    pause & exit /b 1
)

echo  [1/2] Menginstall dependencies Python...
pip install -r requirements.txt -q --disable-pip-version-check
if %errorlevel% neq 0 (
    echo  [ERROR] Gagal install dependencies!
    pause & exit /b 1
)
echo  [OK] Dependencies siap.
echo.
echo  [2/2] Menjalankan server...
echo.
echo  ┌─────────────────────────────────────────┐
echo  │  Buka browser dan akses:                │
echo  │  http://localhost/3dproject/            │
echo  │                                         │
echo  │  Tekan Q di jendela kamera untuk keluar │
echo  └─────────────────────────────────────────┘
echo.

python server.py
echo.
echo  Server dihentikan.
pause
