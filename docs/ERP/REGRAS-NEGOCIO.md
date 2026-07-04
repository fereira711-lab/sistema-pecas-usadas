# Regras de negócio oficiais

## Origem e peça

- Origem é procedência/agrupador; origem não é peça.
- A origem é cadastrada antes da peça no fluxo oficial.
- A peça deve ser vinculada a uma origem e criada com entrada de estoque.
- O código visual da origem é derivado do ID no formato `ORI-000000`.
- O SKU identifica a peça na operação, mas relacionamentos usam IDs.

## Entrada e estoque

- Quantidade da entrada deve ser maior que zero.
- Custo unitário da criação transacional é `valor atribuído ÷ quantidade`, arredondado para duas casas.
- Saldo da entrada é quantidade total menos quantidade consumida.
- Quantidade consumida não pode superar a total.

## Venda e FIFO

- Quantidade vendida deve ser positiva; valor unitário não pode ser negativo.
- A venda exige saldo suficiente na peça e nas entradas.
- FIFO consome entradas por `data_entrada` e depois por `id`.
- Venda, consumos e atualização de saldo/status ocorrem na mesma transação.
- Peça fica `vendida` quando a quantidade vendida alcança a quantidade; caso contrário, `em_estoque`.
- O custo real da venda vem exclusivamente de `venda_consumos_estoque`.

## Financeiro

- `js/financeiro-utils.js` é a fonte oficial de cálculo.
- Receita usa `valor_total` quando positivo; senão usa quantidade × valor unitário.
- Lucro da venda = receita − custo consumido − custos da venda.
- Lucro da peça = receitas − custos consumidos − custos da peça − custos das vendas.
- Resultado da origem liga vendas a entradas por consumos FIFO e subtrai custos consumidos, da peça e da venda.
- `origem.valor_pago`/`custo_total` não é custo direto da venda.
- Sem consumo da venda, lucro e margem permanecem nulos e a interface mostra **Custo não calculado**.

## Estados operacionais observados

- Peça: `em_estoque` e `vendida` no fluxo transacional.
- Distribuição da origem: `Falta distribuir`, `Distribuída`, `Acima do previsto` e `Sem valor pago`, calculados na interface.
- Tipo de custo: ativo/inativo; categoria `peca`, `venda` ou `ambos`.

## Pendente de confirmação

Regras de cancelamento, estorno, devolução, exclusão de venda, edição de quantidade/preço após consumo, transferência entre origens, inventário, impostos, clientes, fornecedores e permissões por papel não estão claras no código atual.
