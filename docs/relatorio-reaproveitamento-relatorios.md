# Reaproveitamento de `paginas/relatorios.html`

Data da revisao: 2026-04-30

## Objetivo

Analisar a pagina legada `paginas/relatorios.html` para decidir quais blocos ainda valem ser reaproveitados em paginas oficiais.

Esta revisao nao altera codigo, nao apaga arquivos e nao muda regras de negocio.

## Contexto atual

Agora existem paginas mais focadas:

- `painel.html`: painel financeiro e operacional do negocio.
- `paginas/analise-produto.html`: resultado por produto/peca.
- `paginas/analise-periodo.html`: resultado financeiro filtrado por periodo.
- `paginas/giro-estoque.html`: giro de estoque e pecas paradas.
- `paginas/alertas.html`: pagina oficial de alertas.

Por isso, `paginas/relatorios.html` deve ser tratada como pagina auxiliar/legada ate que seus dados uteis sejam migrados ou descartados.

## Blocos encontrados

| Bloco | O que mostra | Ja existe em outra pagina? | Recomendacao |
|---|---|---|---|
| Resumo geral | Total de produtos, quantidade em estoque, total de origens, valor investido, custos diversos, faturamento, custo das vendas e lucro bruto. | Sim. `painel.html` ja cobre o resumo do negocio com calculos mais atuais e alertas inteligentes. `analise-periodo.html` cobre resultado por data. | Remover futuramente de `relatorios.html` ou manter escondido ate a pagina legada ser aposentada. |
| Resumo do Estoque | Lista produtos com ID, categoria, quantidade total, quantidade vendida, quantidade disponivel, status, custo base, custos diversos, custo total e preco de venda. | Sim. `paginas/produtos.html` e a tela oficial de estoque/produtos. | Remover futuramente de `relatorios.html`. Se faltar alguma coluna em `produtos.html`, migrar a coluna para a tela oficial. |
| Alertas de Estoque | Produtos sem estoque ou com estoque baixo usando criterio simples: quantidade disponivel menor ou igual a 1. | Sim. `paginas/alertas.html` cobre alertas com mais categorias: pecas sem estoque, estoque baixo, sem entrada, lotes, vendas sem custo, lucro negativo e pecas paradas. | Remover futuramente de `relatorios.html`. Nao migrar, pois a nova pagina de alertas ja substitui esse bloco. |
| Resumo de Vendas | Ultimas 5 vendas, data, produto, ID da peca, quantidade, valor total, lucro bruto e link para detalhes. | Parcialmente. `paginas/historico-vendas.html` lista vendas. `analise-periodo.html` mostra vendas do periodo. | Transformar em melhoria futura: criar um bloco "Ultimas vendas" no `painel.html` ou melhorar `historico-vendas.html` com resumo financeiro. |
| Produtos Mais Vendidos | Ranking por peca, quantidade vendida, faturamento e lucro bruto. | Parcialmente. `analise-produto.html` mostra receita, custo, lucro e quantidade por produto, mas nao e exatamente um ranking de mais vendidos. | Migrar como melhoria futura para `analise-produto.html`, com ordenacao por quantidade vendida ou um filtro "mais vendidos". |
| Custos Diversos por Tipo | Total agrupado por tipo de custo. | Nao de forma clara. `cadastro-custo.html` lista custos, mas nao parece ter uma visao consolidada por tipo. | Migrar como melhoria futura para `cadastro-custo.html` ou para uma futura pagina de custos/financeiro. |

## Analise por bloco

### 1. Resumo geral

Esse bloco perdeu forca porque o `painel.html` assumiu o papel de painel principal do negocio.

Ele tambem usa uma logica antiga em `js/relatorios.js`, com `localStorage` como cache/fallback, e calculos que podem divergir dos calculos FIFO mais novos.

Decisao recomendada:

- **Remover futuramente** da pagina legada.
- Nao migrar para outra tela, porque `painel.html` ja cobre o objetivo melhor.

### 2. Resumo do Estoque

Esse bloco e uma tabela de estoque/produtos. A tela oficial para isso ja e `paginas/produtos.html`.

Decisao recomendada:

- **Remover futuramente** de `relatorios.html`.
- Se alguma informacao for util e ainda faltar em `produtos.html`, migrar pontualmente para `produtos.html`.

### 3. Alertas de Estoque

Esse bloco foi substituido pela nova pagina oficial:

- `paginas/alertas.html`
- `js/alertas.js`

A nova pagina e mais completa e usa apenas Supabase.

Decisao recomendada:

- **Remover futuramente** de `relatorios.html`.
- Nao migrar para outra tela.

### 4. Resumo de Vendas

Esse bloco ainda tem algum valor porque mostra as ultimas vendas diretamente em uma tela de acompanhamento.

Mas ele nao deve ficar em `relatorios.html`, porque vendas ja possuem telas mais adequadas:

- `paginas/historico-vendas.html`
- `paginas/analise-periodo.html`

Decisao recomendada:

- **Transformar em melhoria futura**.
- Melhor destino provavel: `painel.html`, como bloco compacto de ultimas vendas.
- Alternativa: melhorar `historico-vendas.html` com cards de resumo e lucro.

### 5. Produtos Mais Vendidos

Esse e o bloco mais interessante para reaproveitar.

Ele nao e totalmente duplicado, porque `analise-produto.html` mostra resultado por produto, mas nao necessariamente uma experiencia de ranking por quantidade vendida.

Decisao recomendada:

- **Migrar como melhoria futura** para `paginas/analise-produto.html`.
- Possivel melhoria:
  - ordenar por quantidade vendida;
  - adicionar filtro "Mais vendidos";
  - destacar top 5 produtos por quantidade;
  - manter receita e lucro junto do ranking.

### 6. Custos Diversos por Tipo

Esse bloco tambem tem valor porque resume custos por categoria/tipo.

Hoje nao parece existir uma pagina oficial com esse agrupamento consolidado. `cadastro-custo.html` e mais operacional, voltada a cadastro/listagem.

Decisao recomendada:

- **Migrar como melhoria futura**.
- Melhor destino provavel: `paginas/cadastro-custo.html`, como resumo superior.
- Alternativa futura: uma pagina financeira/custos dedicada.

## Logica legada observada

`js/relatorios.js` ainda:

- Usa `localStorage` via `buscarLista` e `salvarLista`.
- Salva dados do Supabase no navegador.
- Calcula custos com logica propria antiga.
- Mistura responsabilidades de estoque, vendas, custos, alertas e relatorios.

Isso reforca que a pagina nao deve continuar sendo evoluida como tela principal.

## Recomendacao final sobre `relatorios.html`

Manter `paginas/relatorios.html` no projeto por enquanto, mas sem link principal no menu.

Recomendacao por etapa:

1. **Agora:** manter como pagina auxiliar/legada.
2. **Depois:** migrar "Produtos Mais Vendidos" para `analise-produto.html`.
3. **Depois:** migrar "Custos Diversos por Tipo" para `cadastro-custo.html` ou uma futura tela financeira.
4. **Depois:** decidir se "Ultimas vendas" entra no `painel.html` ou melhora `historico-vendas.html`.
5. **Por fim:** apos migrar os blocos uteis, esconder ou remover `relatorios.html`.

Conclusao curta:

- Nao vale transformar `relatorios.html` em tela oficial.
- Os blocos mais reaproveitaveis sao **Produtos Mais Vendidos** e **Custos Diversos por Tipo**.
- O restante ja esta coberto por paginas oficiais mais novas.
