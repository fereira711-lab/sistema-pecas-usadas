[CmdletBinding()]
param(
    [string]$OutputDirectory,
    [string]$ProjectRef = 'dallfhhzoibxwcpgagsl',
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

    $secure = Read-Host 'Senha do banco Supabase (não será salva)' -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

$repositoryRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $repositoryRoot 'backups' }
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$pgDump = Resolve-DatabaseTool 'pg_dump'
$version = (& $pgDump --version) -join ' '
if ($LASTEXITCODE -ne 0 -or $version -notmatch 'PostgreSQL\) 17\.') {
    throw "pg_dump 17 é obrigatório. Encontrado: $version"
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupFile = Join-Path $OutputDirectory "erp-$ProjectRef-$timestamp.sql"
$partialFile = "$backupFile.partial"
$hashFile = "$backupFile.sha256"
$manifestFile = "$backupFile.json"

$password = Read-DatabasePassword
$previousPassword = $env:PGPASSWORD
$previousSslMode = $env:PGSSLMODE

try {
    $env:PGPASSWORD = $password
    $env:PGSSLMODE = 'require'

    $arguments = @(
        '--host', $DatabaseHost,
        '--port', '5432',
        '--username', $DatabaseUser,
        '--dbname', $DatabaseName,
        '--schema', 'public',
        '--format', 'plain',
        '--encoding', 'UTF8',
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-privileges',
        '--file', $partialFile
    )

    & $pgDump @arguments
    if ($LASTEXITCODE -ne 0) { throw "pg_dump falhou com código $LASTEXITCODE." }

    $file = Get-Item -LiteralPath $partialFile
    if ($file.Length -lt 1024) { throw 'Backup inválido: arquivo muito pequeno.' }
    if (-not (Select-String -LiteralPath $partialFile -SimpleMatch 'PostgreSQL database dump complete' -Quiet)) {
        throw 'Backup inválido: marcador de conclusão não encontrado.'
    }

    Move-Item -LiteralPath $partialFile -Destination $backupFile
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $backupFile).Hash.ToLowerInvariant()
    "$hash *$(Split-Path -Leaf $backupFile)" | Set-Content -Encoding ascii -LiteralPath $hashFile

    [ordered]@{
        created_at = (Get-Date).ToString('o')
        project_ref = $ProjectRef
        database_host = $DatabaseHost
        database_name = $DatabaseName
        schema = 'public'
        backup_file = Split-Path -Leaf $backupFile
        size_bytes = (Get-Item -LiteralPath $backupFile).Length
        sha256 = $hash
        pg_dump_version = $version
    } | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath $manifestFile

    Write-Host "Backup concluído e validado: $backupFile"
    Write-Host "SHA-256: $hash"
}
finally {
    $password = $null
    if ($null -eq $previousPassword) { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
    else { $env:PGPASSWORD = $previousPassword }
    if ($null -eq $previousSslMode) { Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue }
    else { $env:PGSSLMODE = $previousSslMode }
    if (Test-Path -LiteralPath $partialFile) { Remove-Item -LiteralPath $partialFile -Force }
}
