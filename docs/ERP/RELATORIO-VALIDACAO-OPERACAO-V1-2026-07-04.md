# Relatório de validação da Operação V1 — 2026-07-04

## Escopo

Validação somente leitura do estado da Operação V1 e dos contratos do fluxo origem → peça → entrada → estoque → venda → FIFO → financeiro.

Nenhum registro foi criado, alterado ou removido durante esta validação.

## Estado remoto observado

| Entidade | Total |
|---|---:|
| Origens | 1 |
| Peças | 3 |
| Entradas de estoque | 3 |
| Vendas | 0 |
| Consumos FIFO | 0 |
| Custos de peça | 0 |
| Custos de venda | 0 |
| Tipos de custo | 6 |

## Resultado

- a Operação V1 está ativa e possui dados reais após a limpeza;
- origem, peça e entrada possuem evidência remota de uso;
- o catálogo estrutural de tipos de custo permanece preservado;
- venda, consumo FIFO e resultado financeiro ainda não possuem evidência operacional na V1;
- os contratos de código para criação transacional de peça/entrada e venda/FIFO estão presentes no repositório.

## Próxima validação

Após a primeira venda real:

1. confirmar a criação da venda;
2. confirmar o consumo em `venda_consumos_estoque`;
3. conferir a atualização de `quantidade_vendida` e do saldo da entrada;
4. conferir custo consumido, lucro e margem nas análises;
5. registrar qualquer divergência como ocorrência, sem corrigir dados silenciosamente.

