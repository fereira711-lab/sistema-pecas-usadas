# Banco Supabase

Esta referência descreve o contrato encontrado em `js/supabase-service.js` e nos arquivos `sql/`. Ela não confirma o estado do banco remoto; divergências entre scripts e ambiente implantado são **pendentes de confirmação**.

## Tabelas usadas

| Tabela | Campos usados ou definidos no fluxo atual |
|---|---|
| `origens` | `id`, `tipo_origem`, `tipo`, `descricao`, `produto_sku`, `quantidade_total`, `custo_total`, `custo_tipo`, `valor_pago`, `data_compra`, `observacoes`, `fornecedor_id`, `data_entrada`, timestamps |
| `pecas` | `id`, `origem_id`, `nome_peca`, `sku`, `quantidade`, `quantidade_vendida`, `status`, `custo_total`, `custo`, `custo_atribuido`, `tipo_custo_atribuido`, `preco_sugerido`, `imagem_url`, `preparada`, `observacoes`, timestamps |
| `entradas_estoque` | `id`, `peca_id`, `origem_id`, `quantidade_total`, `quantidade_consumida`, `custo_unitario`, `data_entrada`, `created_at` |
| `vendas` | `id`, `peca_id`, `quantidade_vendida`, `valor_unitario`, `valor_total`, `canal_venda`, `data_venda`, `observacoes`, `cliente_id`, `created_at` |
| `venda_consumos_estoque` | `id`, `venda_id`, `entrada_estoque_id`, `quantidade_consumida`, `custo_unitario`, `custo_total`, `created_at` |
| `custos_peca` | `id`, `peca_id`, `tipo_custo`, `tipo_custo_id`, `descricao`, `observacoes`, `valor`, `data_custo`, `created_at` |
| `custos_venda` | `id`, `venda_id`, `tipo_custo`, `tipo_custo_id`, `descricao`, `observacoes`, `valor`, `data_custo`, `created_at` |
| `tipos_custo` | `id`, `nome`, `categoria`, `ativo`, `created_at` |

## RPCs

- `criar_peca_com_entrada(p_sku, p_nome, p_origem_id, p_quantidade, p_valor_atribuido, p_imagem_url, p_observacoes)`: cria peça e entrada atomicamente e retorna `peca_id` e `entrada_id`.
- `registrar_venda_fifo(p_peca_id, p_quantidade, p_valor_unitario, p_canal_venda, p_data_venda, p_custo_embalagem, p_custo_comissao, p_custo_frete, p_custo_outros)`: registra venda e consome entradas FIFO atomicamente.
- `registrar_venda(...)`: função anterior sem consumo FIFO; existe nos scripts, mas o front-end atual chama `registrar_venda_fifo`.

## View e armazenamento

- `vw_saldos_entradas_estoque`: expõe quantidade disponível por entrada. Não foi encontrada chamada dessa view no JavaScript atual.
- Bucket Storage `pecas`: recebe imagens e retorna URL pública.

## Integridade observada

Há FKs entre as entidades centrais, checks de quantidades/custos não negativos, índices FIFO por `(peca_id, data_entrada, id)` e índices dos consumos. O front-end verifica erros das chamadas principais.

## Pendências de confirmação

- RLS, grants, políticas do bucket, migrations efetivamente aplicadas e esquema remoto atual.
- Uso ativo de `produto_id`, `cliente_id`, `fornecedor_id`, `created_at` versus `criado_em`.
- Garantia de unicidade do SKU no banco.
- Existência de `imagem_url` depende de `sql/06_imagens_pecas.sql`, separado do esquema inicial.
