# Estrutura de entidades

## Núcleo

| Entidade | Papel | Relacionamentos confirmados |
|---|---|---|
| Origem | Procedência e agrupador operacional/financeiro | Tem peças e entradas por `origem_id` |
| Peça | Item comercial e de estoque | Pertence à origem; tem entradas, vendas e custos |
| Entrada de estoque | Lote quantitativo e de custo da peça | Pertence à peça e pode apontar para origem; é consumida por vendas |
| Venda | Evento comercial de saída | Pertence à peça; tem consumos FIFO e custos de venda |
| Consumo de estoque | Elo auditável entre venda e entrada | Registra quantidade e custo real consumidos |

## Entidades auxiliares

| Entidade | Papel |
|---|---|
| Custo da peça | Despesa vinculada à preparação/manutenção da peça |
| Custo da venda | Despesa vinculada à operação de venda |
| Tipo de custo | Catálogo ativo/inativo, classificado como `peca`, `venda` ou `ambos` |
| Usuário Supabase Auth | Sessão usada para liberar o acesso às páginas; perfis e papéis são **pendentes de confirmação** |

## Cardinalidades observadas

- Uma origem possui zero ou muitas peças.
- Uma peça possui uma ou mais entradas no fluxo oficial; dados legados fora dessa regra são possíveis.
- Uma peça possui zero ou muitas vendas.
- Uma venda possui um ou muitos consumos quando o custo foi calculado; ausência de consumo representa pendência.
- Uma entrada pode alimentar muitas vendas até seu saldo terminar.
- Peça e venda podem possuir muitos lançamentos de custo.

## Chaves de ligação

As relações operacionais usam IDs: `origem_id`, `peca_id`, `venda_id` e `entrada_estoque_id`. SKU é identificador de consulta/apresentação, não substitui as chaves relacionais. `produto_id`, `cliente_id` e `fornecedor_id` aparecem no esquema, mas seu uso funcional atual é **pendente de confirmação**.
