@echo off
setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "VALIDATE_SQL=%ROOT%\sql\11_validacao_operacao_v1.sql"
set "DB_HOST=db.dallfhhzoibxwcpgagsl.supabase.co"
set "DB_PORT=5432"
set "DB_NAME=postgres"
set "DB_USER=postgres"
set "PGSSLMODE=require"

set "PSQL="
for /f "delims=" %%I in ('where psql.exe 2^>nul') do if not defined PSQL set "PSQL=%%I"
if not defined PSQL set "PSQL=%LOCALAPPDATA%\Programs\ERP-Database-Tools\postgresql-17\psql.exe"

if not exist "%PSQL%" (
  echo ERRO: psql nao encontrado. Consulte docs\INFRAESTRUTURA.md.
  exit /b 2
)
if not exist "%VALIDATE_SQL%" (
  echo ERRO: SQL de validacao nao encontrado: %VALIDATE_SQL%
  exit /b 2
)

echo Validando a Operacao V1 no projeto Autopp.
echo Informe a senha PostgreSQL quando solicitado.
"%PSQL%" --host "%DB_HOST%" --port "%DB_PORT%" --username "%DB_USER%" --dbname "%DB_NAME%" --password --no-psqlrc --set ON_ERROR_STOP=1 --file "%VALIDATE_SQL%"
if errorlevel 1 (
  echo.
  echo ERRO: validacao falhou. Verifique a mensagem do PostgreSQL.
  exit /b 3
)

echo.
echo Validacao concluida. Confira as contagens exibidas acima.
exit /b 0
