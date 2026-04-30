# Revisao tecnica de `paginas/relatorios.html`

Data da revisao: 2026-04-30

## Objetivo

Revisar a pagina `paginas/relatorios.html` e decidir se ela deve virar a pagina oficial de Alertas do sistema.

Esta revisao nao altera codigo, nao apaga arquivos e nao muda regras de negocio.

## O que `relatorios.html` mostra hoje

A pagina `paginas/relatorios.html` mostra cinco blocos principais:

1. **Resumo geral**
   - Total de produtos cadastrados.
   - Quantidade total em estoque.
   - Total de origens cadastradas.
   - Valor total investido em origens.
   - Total de custos diversos.
   - Faturamento total.
   - Custo total das vendas.
   - Lucro bruto total.

2. **Resumo do Estoque**
   - Produto.
   - ID.
   - Categoria.
   - Quantidade total.
   - Quantidade vendida.
   - Quantidade disponivel.
   - Status.
   - Custo base.
   - Custos diversos.
   - Custo total.
   - Preco de venda.

3. **Alertas de Estoque**
   - Produtos sem estoque.
   - Produtos com estoque baixo.
   - Hoje o criterio e simples: quantidade disponivel menor ou igual a 1.

4. **Resumo de Vendas**
   - Ultimas 5 vendas.
   - Data.
   - Produto.
   - ID da peca.
   - Quantidade.
   - Valor total.
   - Lucro bruto.
   - Link para detalhes da venda.

5. **Produtos Mais Vendidos**
   - Ranking agrupado por peca.
   - Quantidade vendida.
   - Faturamento.
   - Lucro bruto.

6. **Custos Diversos por Tipo**
   - Agrupamento de custos por tipo.
   - Soma total por tipo.

## Scripts ligados a ela

A pagina carrega:

- `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- `../js/supabase-config.js?v=6`
- `../js/supabase-service.js?v=17`
- `../js/relatorios.js?v=5`

O arquivo principal da tela e:

- `js/relatorios.js`

## Uso de Supabase e localStorage

`js/relatorios.js` usa os dois:

- Usa Supabase quando `window.supabaseService.estaConfigurado()` retorna verdadeiro.
- Busca dados com:
  - `listarOrigens()`
  - `listarPecas()`
  - `listarCustosPeca()`
  - `listarVendas()`
  - `listarCustosVenda()`

Mas tambem usa `localStorage`:

- Le dados temporarios com `buscarLista(chave)`.
- Salva dados carregados do Supabase com `salvarLista(chave, lista)`.
- Usa chaves como:
  - `origens`
  - `produtos`
  - `custosDiversos`
  - `vendas`
  - `custosVenda`

Isso indica que a tela ainda tem comportamento antigo/fallback de fase inicial do projeto.

## Dados uteis que ainda existem nela

Sim, a pagina ainda tem dados uteis:

- Alertas simples de estoque.
- Ultimas vendas.
- Produtos mais vendidos.
- Custos agrupados por tipo.
- Resumo geral de indicadores.

O bloco mais alinhado com o menu atual e **Alertas de Estoque**.

## Duplicidades encontradas

### Com `painel.html`

Duplicidade parcial.

`painel.html` ja mostra:

- Resumo do negocio.
- Lucro geral.
- Total vendido.
- Custo da venda.
- Pecas em estoque.
- Pecas vendidas.
- Resultado por origem.
- Alertas inteligentes.

`relatorios.html` tambem mostra resumo geral, faturamento, custos e lucro bruto.

Recomendacao:

- O painel financeiro principal deve continuar sendo `painel.html`.
- `relatorios.html` nao deve continuar sendo a pagina principal de lucro geral.

### Com `analise-produto.html`

Duplicidade parcial.

`analise-produto.html` ja mostra analise por peca/produto:

- Receita.
- Custo.
- Custos adicionais.
- Lucro.
- Quantidade vendida.

`relatorios.html` tambem mostra produtos mais vendidos e lucro bruto por produto no ranking.

Recomendacao:

- Manter analise financeira por produto em `analise-produto.html`.
- Se `relatorios.html` virar Alertas, remover depois o ranking de produtos mais vendidos ou transformar isso em alerta especifico.

### Com `analise-periodo.html`

Duplicidade parcial.

`analise-periodo.html` ja mostra:

- Total vendido.
- Custo dos produtos vendidos.
- Custos de venda.
- Lucro do periodo.
- Quantidade vendida.
- Numero de vendas.

`relatorios.html` mostra resumo geral de vendas sem filtro por periodo.

Recomendacao:

- Manter resultado financeiro por data em `analise-periodo.html`.
- `relatorios.html` nao deve tentar competir com essa tela.

### Com `giro-estoque.html`

Duplicidade parcial.

`giro-estoque.html` ja mostra:

- Pecas rapidas.
- Pecas em atencao.
- Pecas paradas.
- Pecas sem venda.
- Dias sem venda.
- Ultima venda.

`relatorios.html` mostra apenas alerta de quantidade baixa ou zerada.

Recomendacao:

- `giro-estoque.html` deve ser a tela de comportamento/movimento do estoque.
- Uma futura pagina de Alertas pode aproveitar parte da logica de giro, mas nao deve duplicar a tabela completa.

## Ela pode virar pagina oficial de Alertas?

Sim, mas **nao como esta hoje**.

Hoje `relatorios.html` e uma pagina mista: tem alertas, resumo geral, estoque, vendas, ranking e custos. Como o card do menu se chama `Alertas`, o usuario espera uma tela focada em problemas e pontos de atencao.

Para virar pagina oficial de Alertas, ela deveria ser simplificada para algo como:

- Produtos sem estoque.
- Produtos com estoque baixo.
- Lotes esgotados.
- Lotes com estoque baixo.
- Pecas sem entrada FIFO.
- Vendas sem custo FIFO calculado.
- Pecas paradas ou sem venda, reaproveitando conceito de `giro-estoque.html`.
- Talvez alertas financeiros simples, como vendas com lucro negativo.

## Seria melhor criar uma nova `alertas.html`?

Recomendacao tecnica: **sim, criar uma nova `paginas/alertas.html` e manter `relatorios.html` temporariamente**.

Motivos:

- Evita quebrar ou descaracterizar uma pagina existente que ainda possui dados uteis.
- Permite criar uma tela limpa e focada em alertas, sem carregar logica antiga de relatorios.
- Facilita usar apenas Supabase, sem fallback em `localStorage`.
- Permite migrar o card `Alertas` do menu para `paginas/alertas.html` quando a nova tela estiver pronta.
- Depois, `relatorios.html` pode ser escondida, renomeada ou removida com mais seguranca.

## Logica antiga que deve ser removida depois

Pontos antigos em `js/relatorios.js`:

- Uso de `localStorage` como cache/fallback.
- Funcoes genericas `buscarLista` e `salvarLista`.
- Calculo de custo por origem/peca que pode divergir dos calculos FIFO mais novos.
- Resumo geral financeiro duplicado com `painel.html`.
- Ranking de produtos mais vendidos duplicando parte das analises.

Esses pontos nao precisam ser removidos agora, mas devem entrar em uma etapa futura de limpeza.

## Recomendacao final

Nao transformar `relatorios.html` diretamente em pagina oficial de Alertas agora.

Melhor caminho:

1. Criar uma nova pagina `paginas/alertas.html`.
2. Criar um novo JS `js/alertas.js`.
3. Usar apenas Supabase.
4. Reaproveitar criterios de alerta ja existentes em `painel-geral.js`:
   - produtos sem estoque;
   - estoque baixo;
   - produtos sem entrada FIFO;
   - lotes esgotados;
   - lotes com estoque baixo;
   - vendas sem consumo FIFO.
5. Opcionalmente reaproveitar dados do `giro-estoque.js` para alertas de pecas paradas.
6. Depois que `alertas.html` estiver pronta, trocar o card `Alertas` no `index.html` de `paginas/relatorios.html` para `paginas/alertas.html`.
7. Manter `relatorios.html` como pagina antiga/auxiliar ate decidir se ainda ha algum relatorio ali que merece migrar.

Conclusao curta:

- `relatorios.html` tem dados uteis, mas esta muito ampla.
- Ela duplica partes de `painel.html`, `analise-produto.html`, `analise-periodo.html` e `giro-estoque.html`.
- O papel correto do card `Alertas` deve ser uma tela nova e focada: `paginas/alertas.html`.
