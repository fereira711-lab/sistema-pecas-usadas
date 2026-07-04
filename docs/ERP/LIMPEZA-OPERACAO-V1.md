# Plano de limpeza para a Operação V1

> Estado: concluído. Operação V1 limpa e novamente em uso, conforme confirmação do operador em 2026-07-04. Projeto Supabase confirmado: `Autopp` (`dallfhhzoibxwcpgagsl`).

## Situação atual

- a limpeza da base já foi executada;
- o ERP voltou a ser usado com a Operação V1;
- não executar novamente `scripts/limpar-operacao-v1.bat` sem uma nova necessidade, backup atual e autorização específica;
- o próximo trabalho é acompanhar o uso real, registrar ocorrências e validar o fluxo operacional de ponta a ponta.

## Plano

1. Interromper gravações no ERP durante a janela de manutenção.
2. Gerar e guardar o backup lógico fora do Supabase.
3. Conferir as contagens antes da limpeza.
4. Executar `scripts/limpar-operacao-v1.bat` somente após confirmação explícita.
5. O script executa `sql/10_limpeza_operacao_v1.sql` e depois `sql/11_validacao_operacao_v1.sql` automaticamente.
6. Fazer um teste controlado do fluxo origem → peça → entrada → estoque → venda → consumo → financeiro.

## Classificação confirmada no banco

| Tabela | Linhas | Classe | Ação |
|---|---:|---|---|
| `origens` | 3 | operacional/teste | limpar |
| `pecas` | 4 | operacional/teste | limpar |
| `entradas_estoque` | 4 | operacional/teste | limpar |
| `vendas` | 3 | operacional/teste | limpar |
| `venda_consumos_estoque` | 3 | operacional/teste | limpar |
| `custos_peca` | 0 | operacional/teste | limpar |
| `custos_venda` | 6 | operacional/teste | limpar |
| `tipos_custo` | 6 | estrutural/configuração | preservar |

Não existem atualmente tabelas públicas chamadas `categorias`, `configuracoes` ou `parametros`. Auth, Storage, funções, views, constraints e políticas não fazem parte da limpeza.

## Ordem de exclusão

1. `venda_consumos_estoque`
2. `custos_venda`
3. `vendas`
4. `custos_peca`
5. `entradas_estoque`
6. `pecas`
7. `origens`

A ordem segue as FKs reais. O script usa `DELETE` explícito dentro de uma transação e não depende de `CASCADE` implícito.

## Preservado

- `tipos_custo` e seus 6 registros;
- RPCs, incluindo `criar_peca_com_entrada` e `registrar_venda_fifo`;
- view `vw_saldos_entradas_estoque`;
- regras, índices, constraints, sequências e schema;
- Supabase Auth e Storage;
- todo o código, inclusive `financeiro-utils.js` e a lógica de venda/FIFO.

## Backup obrigatório

Antes da limpeza, deve existir um backup validado com SQL, SHA-256 e manifesto:

```powershell
.\scripts\backup.bat
```

O script de limpeza localiza o backup SQL mais recente e valida seu SHA-256. Sem backup válido, a execução é bloqueada.

## Executar a limpeza

Fechar o ERP para impedir novas gravações e executar na raiz do repositório:

```powershell
.\scripts\limpar-operacao-v1.bat
```

O operador precisa digitar exatamente `LIMPAR OPERACAO V1` e informar a senha PostgreSQL. O script usa somente `sql/10_limpeza_operacao_v1.sql`; se a limpeza terminar, executa automaticamente `sql/11_validacao_operacao_v1.sql`.

## Executar somente a validação

```powershell
.\scripts\validar-operacao-v1.bat
```

As contagens operacionais devem ser zero. `tipos_custo_preservados` deve continuar maior que zero.

## Em caso de erro

1. Não repetir a limpeza sem ler a mensagem do PostgreSQL.
2. Executar `scripts/validar-operacao-v1.bat` para conferir o estado atual.
3. Se a limpeza tiver sido revertida pela transação, corrigir apenas o problema operacional e tentar novamente com autorização.
4. Se for necessário restaurar, usar o backup validado:

```powershell
.\scripts\restore.bat .\backups\erp-dallfhhzoibxwcpgagsl-AAAAMMDD-HHMMSS.sql
```

O restore exige SHA-256 válido, confirmação `RESTAURAR` e senha PostgreSQL.

## Pendências e riscos

- Confirmar que todos os 3 registros de origem, 4 peças e 3 vendas são realmente dados de teste antes da execução.
- Imagens no bucket `pecas` não serão apagadas. Poderão ficar órfãs; qualquer limpeza de Storage exige inventário e confirmação separados.
- Há RPCs legadas (`realizar_*`, `registrar_*`, `adicionar_*`) que referenciam entidades antigas. Serão preservadas e não afetam a ordem desta limpeza.
- RLS está desabilitada nas 8 tabelas públicas. Isso é risco crítico de acesso, mas corrigir políticas está fora do escopo desta limpeza.
- Durante a execução, bloquear uso do ERP para evitar novas gravações entre backup e validação.
