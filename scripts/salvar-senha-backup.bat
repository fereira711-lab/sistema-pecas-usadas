@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0salvar-senha-backup.ps1" %*
pause
exit /b %errorlevel%
