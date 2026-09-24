# Carrega ou apaga o conjunto fixo de dados de demonstracao (sql/90_demo_carregar.sql e sql/91_demo_apagar.sql).
# Usa a mesma senha salva pelo backup (scripts/salvar-senha-backup.bat); sem ela, pede a senha na hora.
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][ValidateSet('carregar', 'apagar')][string]$Acao,
    [string]$DatabaseHost = 'db.dallfhhzoibxwcpgagsl.supabase.co',
    [string]$DatabaseName = 'postgres',
    [string]$DatabaseUser = 'postgres'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Resolve-DatabaseTool([string]$Name) {
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }

    $fallback = Join-Path $env:LOCALAPPDATA "Programs\ERP-Database-Tools\postgresql-17\$Name.exe"
    if (Test-Path -LiteralPath $fallback) { return $fallback }

    throw "$Name não encontrado. Consulte docs/INFRAESTRUTURA.md."
}

function ConvertFrom-SecurePassword([securestring]$Secure) {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

function Read-DatabasePassword {
    if ($env:SUPABASE_DB_PASSWORD) { return $env:SUPABASE_DB_PASSWORD }

    $credentialFile = Join-Path $env:APPDATA 'ERP-Pecas-Usadas\supabase-db-senha.xml'
    if (Test-Path -LiteralPath $credentialFile) {
        return ConvertFrom-SecurePassword (Import-Clixml -LiteralPath $credentialFile)
    }

    return ConvertFrom-SecurePassword (Read-Host 'Senha do banco Supabase (não será salva)' -AsSecureString)
}

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$sqlFile = if ($Acao -eq 'carregar') { '90_demo_carregar.sql' } else { '91_demo_apagar.sql' }
$sqlPath = Join-Path $repositoryRoot "sql\$sqlFile"
if (-not (Test-Path -LiteralPath $sqlPath)) { throw "SQL não encontrado: $sqlPath" }

if ($Acao -eq 'apagar') {
    Write-Host ''
    Write-Host 'Apaga SOMENTE os dados de demonstração (origens [DEMO] e peças DM-).'
    Write-Host 'Dados reais e tipos de custo não são tocados; se algo não bater, nada é apagado.'
    $confirmacao = Read-Host 'Digite APAGAR DEMO para continuar'
    if ($confirmacao -cne 'APAGAR DEMO') {
        Write-Host 'Cancelado. Nenhum SQL foi executado.'
        exit 4
    }
}

$psql = Resolve-DatabaseTool 'psql'
$previousPassword = $env:PGPASSWORD
$previousSslMode = $env:PGSSLMODE

try {
    $env:PGPASSWORD = Read-DatabasePassword
    $env:PGSSLMODE = 'require'

    & $psql --host $DatabaseHost --port 5432 --username $DatabaseUser --dbname $DatabaseName `
        --no-psqlrc --set ON_ERROR_STOP=1 --file $sqlPath
    if ($LASTEXITCODE -ne 0) { throw "psql terminou com código $LASTEXITCODE. Nada foi gravado (a transação foi desfeita)." }

    Write-Host ''
    Write-Host "Demonstração: '$Acao' concluído."
}
finally {
    if ($null -eq $previousPassword) { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
    else { $env:PGPASSWORD = $previousPassword }
    if ($null -eq $previousSslMode) { Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue }
    else { $env:PGSSLMODE = $previousSslMode }
}
