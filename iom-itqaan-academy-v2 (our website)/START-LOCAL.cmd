@echo off
cd /d "%~dp0"
python tools\local-preview.py start
if errorlevel 1 pause
