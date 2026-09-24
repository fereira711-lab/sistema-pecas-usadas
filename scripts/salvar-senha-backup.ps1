[CmdletBinding()]
param(
    [string]$DatabaseHost = 'db.dallfhhzoibxwcpgagsl.supabase.co',
    [string]$DatabaseName = 'postgres',
    [string]$DatabaseUser = 'postgres'
)

# Salva a senha do banco para o backup agendado, criptografada com DPAPI do Windows:
# o arquivo so pode ser lido pelo mesmo usuario, nesta mesma maquina. A senha nunca
# vai para o repositorio. Rodar de novo substitui a senha salva.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$pastaCredencial = Join-Path $env:APPDATA 'ERP-Pecas-Usadas'
$arquivoCredencial = Join-Path $pastaCredencial 'supabase-db-senha.xml'

$senha = Read-Host 'Senha do banco Supabase (sera salva criptografada para este usuario)' -AsSecureString

$psql = Get-Command psql -ErrorAction SilentlyContinue
$psqlPath = if ($psql) { $psql.Source } else { Join-Path $env:LOCALAPPDATA 'Programs\ERP-Database-Tools\postgresql-17\psql.exe' }

if (Test-Path -LiteralPath $psqlPath) {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($senha)
    $previousPassword = $env:PGPASSWORD
    try {
        $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
        $env:PGSSLMODE = 'require'
        & $psqlPath --host $DatabaseHost --port 5432 --username $DatabaseUser --dbname $DatabaseName --no-psqlrc --tuples-only --command 'select 1' | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Não foi possível conectar com essa senha. Nada foi salvo.' }
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
        if ($null -eq $previousPassword) { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue }
        else { $env:PGPASSWORD = $previousPassword }
    }
}
else {
    Write-Warning 'psql não encontrado: a senha será salva sem teste de conexão.'
}

New-Item -ItemType Directory -Force -Path $pastaCredencial | Out-Null
$senha | Export-Clixml -LiteralPath $arquivoCredencial
Write-Host "Senha testada e salva em: $arquivoCredencial"
Write-Host 'O backup agendado passa a funcionar sem digitar senha.'
