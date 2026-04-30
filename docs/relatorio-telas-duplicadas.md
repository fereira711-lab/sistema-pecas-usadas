# Relatorio de telas duplicadas e paginas parecidas

Data da revisao: 2026-04-30

## Resumo

O menu inicial foi reorganizado em cinco grupos: Cadastros, Operacoes, Estoque, Analises e Administracao / Configuracoes.

Nenhum arquivo foi apagado. Nenhuma regra de negocio, tabela ou funcao Supabase foi alterada nesta revisao.

## Recomendacao geral

- Manter `paginas/produtos.html` como tela principal de estoque/produtos.
- Manter `paginas/lotes.html` como tela principal de entradas/lotes.
- Manter `painel.html` como painel geral do negocio, usando `js/painel-geral.js`.
- Manter `paginas/historico-vendas.html` como lista de vendas.
- Manter `paginas/detalhes-venda.html`, `paginas/detalhes-produto.html` e `paginas/detalhes-origem.html` como paginas secundarias, abertas a partir de listas.
- Revisar depois telas antigas com fallback em `localStorage`, para reduzir duplicidade e dependencia de dados temporarios.

## Tabela de revisao

| Arquivo | Funcao atual | Manter? | Remover? | Pagina secundaria? | Usa localStorage? | Usa Supabase? | Recomendacao |
|---|---|---:|---:|---:|---:|---:|---|
| `paginas/cadastro-custo-peca.html` | Nao existe mais no projeto. Parece ter sido substituida por `paginas/cadastro-custo.html`. | Nao | Nao ha arquivo para remover | Nao | Nao | Nao | Confirmar se algum link externo ainda aponta para ela. |
| `paginas/cadastro-custo.html` | Cadastro e listagem de custos da peca. | Sim | Nao | Nao | Sim, fallback em `js/custos.js` | Sim | Manter por enquanto; futuramente remover fallback local se Supabase for obrigatorio. |
| `paginas/custos.html` | Nao existe mais no projeto. O historico do Git indica renome para `cadastro-custo.html`. | Nao | Nao ha arquivo para remover | Nao | Nao | Nao | Confirmar se README/docs ainda citam esse nome antigo. |
| `paginas/detalhes-venda.html` | Mostra detalhes financeiros e operacionais de uma venda especifica. | Sim | Nao | Sim | Sim, fallback em `js/detalhes-venda.js` | Sim | Manter como secundaria aberta pelo Historico de Vendas. |
| `paginas/historico-vendas.html` | Lista vendas registradas e abre detalhes de cada venda. | Sim | Nao | Nao | Sim, fallback em `js/historico-vendas.js` | Sim | Manter como tela principal de vendas ja realizadas. |
| `painel.html` | Painel geral do negocio e resultado por origem. | Sim | Nao | Nao | Nao | Sim | Manter como painel principal de analises consolidadas. |
| `painel-geral.html` | Nao existe como HTML. Existe apenas `js/painel-geral.js`, usado por `painel.html`. | Nao | Nao ha arquivo para remover | Nao | Nao | Sim, via JS | Nao criar outra pagina; manter `painel.html` como entrada unica. |
| `paginas/estoque.html` | Pagina pequena de redirecionamento para `produtos.html`. | Temporariamente | Depois, talvez | Sim | Nao | Nao | Candidata a remocao futura, depois de confirmar que nao ha links externos usando esta URL. |
| `paginas/produtos.html` | Tela principal de estoque/produtos com custos, vendas, estoque e lucro. | Sim | Nao | Nao | Nao | Sim | Manter como tela oficial de Estoque / Produtos. |
| `paginas/lotes.html` | Lista entradas de estoque/lotes e saldo disponivel. | Sim | Nao | Nao | Nao | Sim | Manter como tela oficial de Entradas / Lotes. |
| `paginas/relatorios.html` | Relatorio geral antigo com estoque, alertas, vendas, ranking e custos por tipo. | Sim, por enquanto | Nao agora | Nao | Sim, fallback em `js/relatorios.js` | Sim | Revisar depois: algumas informacoes agora tambem aparecem em `painel.html`, `analise-periodo.html`, `analise-produto.html` e `giro-estoque.html`. |
| `paginas/analise-produto.html` | Analise financeira agrupada por peca/produto. | Sim | Nao | Nao | Nao | Sim | Manter em Analises. |
| `paginas/analise-periodo.html` | Analise financeira filtrada por data. | Sim | Nao | Nao | Nao | Sim | Manter em Analises. |
| `paginas/giro-estoque.html` | Analise de giro: rapido, atencao, parado e sem venda. | Sim | Nao | Nao | Nao | Sim | Manter em Estoque. |
| `paginas/listar-origens.html` | Lista origens e abre detalhes por origem. | Sim | Nao | Apoio/secundaria | Sim, fallback em `js/listar-origens.js` | Sim | Manter em Administracao / Configuracoes por enquanto. |
| `paginas/detalhes-origem.html` | Resultado e detalhes de uma origem especifica. | Sim | Nao | Sim | Nao | Sim | Manter como secundaria aberta por `listar-origens.html`. |
| `paginas/detalhes-produto.html` | Detalhes, custos e vendas de uma peca especifica. | Sim | Nao | Sim | Sim, fallback em `js/detalhes-produto.js` | Parcial/indireto | Manter como secundaria aberta por Produtos e Detalhes da Venda; revisar uso de localStorage depois. |

## Duplicidades e sobreposicoes encontradas

### Estoque

- `paginas/produtos.html` e `paginas/estoque.html` apontam para a mesma ideia.
- `estoque.html` hoje funciona como entrada/atalho para `produtos.html`.
- Recomendacao: manter `produtos.html`; considerar remover `estoque.html` somente depois de confirmar que nenhum link externo depende dela.

### Relatorios e painel

- `painel.html` e `paginas/relatorios.html` mostram visoes consolidadas.
- `painel.html` parece mais atual para resultado do negocio e resultado por origem.
- `relatorios.html` ainda tem alertas, ultimas vendas, produtos mais vendidos e custos por tipo.
- Recomendacao: manter os dois por enquanto, mas futuramente decidir se `relatorios.html` vira uma tela de alertas/relatorios auxiliares.

### Vendas

- `historico-vendas.html` lista vendas.
- `detalhes-venda.html` detalha uma venda especifica.
- Nao e duplicidade real: sao tela principal e tela secundaria.
- Recomendacao: manter as duas.

### Custos

- `cadastro-custo.html` e o sucessor aparente de `custos.html` / `cadastro-custo-peca.html`.
- Os nomes antigos nao existem no projeto atual.
- Recomendacao: manter `cadastro-custo.html` e limpar referencias antigas em docs futuramente.

## Pontos para revisar depois

- Reduzir fallback em `localStorage` nas telas que ja usam Supabase.
- Padronizar nomes: usar sempre "Peca", "Produto" ou os dois juntos com criterio.
- Avaliar se `relatorios.html` deve virar apenas "Alertas e relatorios auxiliares".
- Confirmar se `estoque.html` ainda e necessario.
