@echo off
cd /d "%~dp0"
echo Iniciando servidor local...
echo.
node servidor-local.js
echo.
echo O servidor foi encerrado. Se apareceu algum erro acima, copie a mensagem.
pause
