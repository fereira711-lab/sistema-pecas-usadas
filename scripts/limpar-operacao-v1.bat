@echo off
setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "CLEAN_SQL=%ROOT%\sql\10_limpeza_operacao_v1.sql"
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
if not exist "%CLEAN_SQL%" (
  echo ERRO: SQL de limpeza nao encontrado: %CLEAN_SQL%
  exit /b 2
)
if not exist "%VALIDATE_SQL%" (
  echo ERRO: SQL de validacao nao encontrado: %VALIDATE_SQL%
  exit /b 2
)

set "LATEST_BACKUP="
for /f "delims=" %%F in ('dir /b /a-d /o-d "%ROOT%\backups\*.sql" 2^>nul') do if not defined LATEST_BACKUP set "LATEST_BACKUP=%ROOT%\backups\%%F"
if not defined LATEST_BACKUP (
  echo ERRO: nenhum backup SQL foi encontrado. Limpeza cancelada.
  exit /b 3
)
if not exist "%LATEST_BACKUP%.sha256" (
  echo ERRO: hash do backup nao encontrado. Limpeza cancelada.
  exit /b 3
)

powershell.exe -NoLogo -NoProfile -Command "$f=$env:LATEST_BACKUP; $h=((Get-Content -Raw -LiteralPath ($f+'.sha256')).Trim() -split '\s+')[0]; $s=[IO.File]::OpenRead($f); try{$a=([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($s))).Replace('-','').ToLowerInvariant()}finally{$s.Dispose()}; if($a -ne $h.ToLowerInvariant()){exit 1}"
if errorlevel 1 (
  echo ERRO: o backup mais recente falhou na validacao SHA-256. Limpeza cancelada.
  exit /b 3
)

echo.
echo ATENCAO: esta operacao apagara todos os dados operacionais de teste.
echo Backup validado: %LATEST_BACKUP%
echo Projeto: Autopp ^(dallfhhzoibxwcpgagsl^)
echo Preservados: tipos_custo, Auth, Storage, views, funcoes/RPCs e configuracoes.
echo.
set /p "CONFIRM=Digite LIMPAR OPERACAO V1 para continuar: "
if /I not "%CONFIRM%"=="LIMPAR OPERACAO V1" (
  echo Limpeza cancelada. Nenhum SQL foi executado.
  exit /b 4
)

echo.
echo Executando limpeza. Informe a senha PostgreSQL quando solicitado.
"%PSQL%" --host "%DB_HOST%" --port "%DB_PORT%" --username "%DB_USER%" --dbname "%DB_NAME%" --password --no-psqlrc --set ON_ERROR_STOP=1 --file "%CLEAN_SQL%"
if errorlevel 1 (
  echo.
  echo ERRO: a limpeza falhou. Verifique a mensagem do PostgreSQL. Validacao nao executada.
  exit /b 5
)

echo.
echo Limpeza concluida. Executando validacao automatica.
echo Informe novamente a senha PostgreSQL quando solicitado.
"%PSQL%" --host "%DB_HOST%" --port "%DB_PORT%" --username "%DB_USER%" --dbname "%DB_NAME%" --password --no-psqlrc --set ON_ERROR_STOP=1 --file "%VALIDATE_SQL%"
if errorlevel 1 (
  echo.
  echo ERRO: a limpeza terminou, mas a validacao falhou. Execute scripts\validar-operacao-v1.bat.
  exit /b 6
)

echo.
echo OPERACAO V1: limpeza e validacao concluidas sem erros.
echo Confira acima: dados operacionais devem estar em zero e tipos_custo preservados.
exit /b 0
