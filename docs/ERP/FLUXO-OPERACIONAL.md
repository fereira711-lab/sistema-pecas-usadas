# Fluxo operacional

## Fluxo principal

1. **Origem** — registrar tipo, descrição, valor pago, data e observações da procedência.
2. **Peça** — selecionar a origem e informar SKU, nome, quantidade, valor atribuído, imagem e observações.
3. **Entrada** — a RPC `criar_peca_com_entrada` cria peça e entrada na mesma transação; o custo unitário é o valor atribuído dividido pela quantidade.
4. **Estoque** — o saldo de cada entrada é `quantidade_total - quantidade_consumida`; o saldo da peça é acompanhado por quantidade e quantidade vendida.
5. **Venda** — selecionar peça, quantidade, valor unitário, data, canal, custos adicionais e observações.
6. **FIFO** — `registrar_venda_fifo` bloqueia peça e entradas, valida saldo e consome entradas por `data_entrada, id`, da mais antiga para a mais nova.
7. **Consumo** — cada parcela consumida gera uma linha em `venda_consumos_estoque` com quantidade, custo unitário e custo total.
8. **Financeiro** — `financeiro-utils.js` combina receita, custo consumido, custos da venda e, conforme a análise, custos da peça.

## Resultado da venda

- Receita: `valor_total` positivo; caso contrário, `quantidade_vendida × valor_unitario`.
- Custo real: soma de `venda_consumos_estoque.custo_total` da venda.
- Custos da venda: soma de `custos_venda.valor`.
- Lucro: receita − custo real − custos da venda.
- Margem: lucro ÷ receita × 100, quando a receita for positiva.
- Se não houver consumo: **Custo não calculado**, com lucro e margem nulos.

## Resultado agregado

Na análise por peça, também são subtraídos os lançamentos de `custos_peca`. Na origem, vendas e custos são associados por entradas e consumos, não diretamente por `origens.valor_pago`. O valor pago da origem serve à distribuição operacional; não substitui o custo consumido da venda.

## Exceções visíveis

Venda sem saldo da peça ou sem saldo suficiente nas entradas é rejeitada. A transação da RPC desfaz venda, consumos e atualizações se ocorrer erro. O tratamento operacional de devolução, cancelamento e estorno é **pendente de confirmação**.
