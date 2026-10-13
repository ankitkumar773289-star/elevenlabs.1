@echo off
title ElevenLabs Narration Studio
echo Starting ElevenLabs Narration Studio...
echo.

if not exist ".venv\Scripts\python.exe" (
    echo [INFO] Setting up virtual environment...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

echo [INFO] Launching app at http://localhost:5000
start http://localhost:5000
python app.py
pause
