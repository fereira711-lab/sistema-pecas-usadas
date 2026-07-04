@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0backup.ps1" %*
exit /b %errorlevel%
