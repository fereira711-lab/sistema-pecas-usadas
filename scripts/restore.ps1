[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
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

function Read-DatabasePassword {
    if ($env:SUPABASE_DB_PASSWORD) { return $env:SUPABASE_DB_PASSWORD }
    $secure = Read-Host 'Senha do banco de destino (não será salva)' -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

$BackupFile = [IO.Path]::GetFullPath($BackupFile)
if (-not (Test-Path -LiteralPath $BackupFile -PathType Leaf)) { throw "Backup não encontrado: $BackupFile" }

$hashFile = "$BackupFile.sha256"
if (-not (Test-Path -LiteralPath $hashFile -PathType Leaf)) { throw "Hash não encontrado: $hashFile" }
$expectedHash = ((Get-Content -Raw -LiteralPath $hashFile).Trim() -split '\s+')[0]
$actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $BackupFile).Hash.ToLowerInvariant()
if ($actualHash -ne $expectedHash.ToLowerInvariant()) { throw 'SHA-256 inválido. Restore cancelado.' }

$confirmation = Read-Host "Digite RESTAURAR para aplicar $(Split-Path -Leaf $BackupFile) em $DatabaseHost/$DatabaseName"
if ($confirmation -cne 'RESTAURAR') { throw 'Restore cancelado pelo operador.' }

$psql = Resolve-DatabaseTool 'psql'
$password = Read-DatabasePassword
$previousPassword = $env:PGPASSWORD
$previousSslMode = $env:PGSSLMODE

try {
    $env:PGPASSWORD = $password
    $env:PGSSLMODE = 'require'
    & $psql --host $DatabaseHost --port 5432 --username $DatabaseUser --dbname $DatabaseName --no-psqlrc --single-transaction --set ON_ERROR_STOP=1 --file $BackupFile
    if ($LASTEXITCODE -ne 0) { throw "psql falhou com código $LASTEXITCODE." }
    Write-Host 'Restore concluído sem erros.'
}
finally {
    $password = $null
    if ($null -eq $previousPassword) { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
    else { $env:PGPASSWORD = $previousPassword }
    if ($null -eq $previousSslMode) { Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue }
    else { $env:PGSSLMODE = $previousSslMode }
}
