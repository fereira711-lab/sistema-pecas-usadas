@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0demo.ps1" -Acao carregar
exit /b %errorlevel%
