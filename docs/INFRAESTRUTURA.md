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

Ordem de busca da senha em `backup.ps1`: variável `SUPABASE_DB_PASSWORD`; arquivo criptografado `%APPDATA%\ERP-Pecas-Usadas\supabase-db-senha.xml`; prompt interativo. Com `-NaoInterativo`, o script falha com mensagem clara em vez de pedir a senha.

## Backup automático diário

Tarefa do Agendador de Tarefas do Windows:

| Item | Valor |
|---|---|
| Nome | `ERP Pecas Usadas - Backup diario` |
| Horário | todo dia às 12:30 |
| Se a máquina estiver desligada no horário | roda assim que possível (`StartWhenAvailable`) |
| Condições | só com rede disponível; roda também na bateria; limite de 30 minutos |
| Usuário | o usuário do Windows que criou a tarefa, somente com sessão iniciada |
| Comando | `scripts\backup-agendado.bat` (chama `backup.ps1 -NaoInterativo`) |
| Log | `backups\backup-agendado.log` (uma entrada por execução, com código de saída) |
| Backups | `backups\erp-dallfhhzoibxwcpgagsl-AAAAMMDD-HHMMSS.sql` + `.sha256` + `.json` |

O horário do meio do dia foi escolhido porque a máquina da loja pode não ficar ligada de madrugada. Se o horário for perdido, a tarefa roda quando o Windows voltar a ficar disponível.

### Configuração única da senha

A tarefa só funciona depois que a senha do banco for salva uma vez, pelo próprio usuário do Windows que vai rodar o backup:

```powershell
.\scripts\salvar-senha-backup.bat
```

O script pede a senha sem exibi-la, testa a conexão com `psql` e só salva se a conexão funcionar. A senha fica criptografada com DPAPI em `%APPDATA%\ERP-Pecas-Usadas\supabase-db-senha.xml`: só esse usuário, nesta máquina, consegue lê-la. O arquivo não fica no repositório. Se a senha do banco mudar, rode o comando de novo.

### Como verificar se rodou

```powershell
schtasks /query /tn "ERP Pecas Usadas - Backup diario" /v /fo LIST
Get-Content .\backups\backup-agendado.log -Tail 20
```

`Último resultado` igual a `0` e uma linha `fim, codigo 0` no log indicam sucesso. Código `1` com a mensagem "Senha do banco nao configurada" significa que falta a configuração única acima.

Para rodar a tarefa na hora, do mesmo jeito que o agendamento roda:

```powershell
schtasks /run /tn "ERP Pecas Usadas - Backup diario"
```

Para remover o agendamento:

```powershell
schtasks /delete /tn "ERP Pecas Usadas - Backup diario" /f
```

### Limitações

- Os backups ficam só nesta máquina, em `backups/`. Copie periodicamente para armazenamento externo.
- Não há limpeza automática de backups antigos; cada arquivo tem dezenas de KB.
- O backup cobre o schema `public`. Imagens do bucket Storage `pecas` não entram.
- Se o projeto Supabase estiver pausado, o backup falha e o erro aparece no log.

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
