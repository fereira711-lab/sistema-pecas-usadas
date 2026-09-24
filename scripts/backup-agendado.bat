@echo off
setlocal
rem Chamado pela tarefa agendada "ERP Pecas Usadas - Backup diario".
rem Roda o backup sem interacao e acrescenta o resultado em backups\backup-agendado.log.
set "ROOT=%~dp0.."
if not exist "%ROOT%\backups" mkdir "%ROOT%\backups"
set "LOG=%ROOT%\backups\backup-agendado.log"

echo ==== %date% %time% inicio >> "%LOG%"
powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0backup.ps1" -NaoInterativo >> "%LOG%" 2>&1
set "CODIGO=%errorlevel%"
echo ==== %date% %time% fim, codigo %CODIGO% >> "%LOG%"
exit /b %CODIGO%
