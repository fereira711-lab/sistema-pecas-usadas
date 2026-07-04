@echo off
setlocal
if "%~1"=="" (
  echo Uso: scripts\restore.bat backups\arquivo.sql
  exit /b 2
)
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0restore.ps1" -BackupFile "%~1"
exit /b %errorlevel%
