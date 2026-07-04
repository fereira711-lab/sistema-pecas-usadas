# Infraestrutura do banco do ERP

## Estado preparado

- Projeto Supabase: `Autopp` (`dallfhhzoibxwcpgagsl`), PostgreSQL 17.
- Supabase CLI 2.109.0: `%LOCALAPPDATA%\Programs\ERP-Database-Tools\supabase`.
- PostgreSQL Client 17.10 (`pg_dump` e `psql`): `%LOCALAPPDATA%\Programs\ERP-Database-Tools\postgresql-17`.
- Os dois diretórios foram adicionados ao `PATH` do usuário.
- O projeto local foi inicializado em `supabase/`.

O backup oficial do ERP inclui todo o schema `public`: tabelas, dados, sequências, views, funções/RPCs, triggers, índices, constraints e políticas públicas. Auth e Storage são serviços gerenciados separados e não são sobrescritos pelo restore do ERP. Objetos físicos do Storage não fazem parte de arquivos SQL.

## Primeiro vínculo da CLI

O vínculo exige credenciais pessoais e deve ser feito pelo proprietário em um terminal interativo. Tokens e senhas nunca devem ser enviados ao Git nem colocados nos scripts.

```powershell
supabase login --name erp-infra
supabase link --project-ref dallfhhzoibxwcpgagsl
```

O segundo comando solicita a senha do banco. O estado local de vínculo fica em `supabase/.temp/`, já ignorado pelo Supabase CLI.

## Backup oficial

Na raiz do repositório:

```powershell
.\scripts\backup.bat
```

O comando solicita a senha do banco sem exibi-la e gera:

```text
backups/erp-dallfhhzoibxwcpgagsl-AAAAMMDD-HHMMSS.sql
backups/erp-dallfhhzoibxwcpgagsl-AAAAMMDD-HHMMSS.sql.sha256
backups/erp-dallfhhzoibxwcpgagsl-AAAAMMDD-HHMMSS.sql.json
```

O script somente conclui após confirmar tamanho mínimo, marcador final do `pg_dump` e gerar SHA-256. A pasta `backups/` é ignorada pelo Git. Copie o conjunto para armazenamento externo seguro.

Em automação, `SUPABASE_DB_PASSWORD` deve vir do cofre de segredos do executor. Em uso manual, prefira o prompt do próprio script. Não crie `.env` versionado com senha.

## Restore

O restore altera o banco de destino. Verifique projeto, arquivo e hash antes de confirmar:

```powershell
.\scripts\restore.bat .\backups\erp-dallfhhzoibxwcpgagsl-AAAAMMDD-HHMMSS.sql
```

O operador precisa digitar exatamente `RESTAURAR`. O `psql` executa o arquivo em uma única transação com `ON_ERROR_STOP`; qualquer erro cancela a transação.

Para restaurar em outro projeto, execute diretamente o PowerShell com o host correto:

```powershell
.\scripts\restore.ps1 -BackupFile .\backups\arquivo.sql -DatabaseHost db.OUTRO_PROJECT_REF.supabase.co
```

## Verificação das ferramentas

Abra um terminal novo e execute:

```powershell
supabase --version
pg_dump --version
psql --version
supabase status
```

Versões homologadas nesta preparação: Supabase CLI 2.109.0 e PostgreSQL Client 17.10.

## Segurança e limitações

- Nunca versionar senha do banco, Personal Access Token, connection string completa ou dumps.
- O dump cobre o banco do ERP no schema `public`; arquivos do bucket Storage precisam de rotina própria.
- Antes de restaurar produção, criar backup novo e testar o restore em um projeto separado.
- A conexão usa TLS obrigatório (`sslmode=require`).
- O script não altera schema nem dados durante o backup.
