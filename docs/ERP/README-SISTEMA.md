# DWDW ERP — visão do sistema

## Objetivo

Sistema web para controlar a procedência, o cadastro, o estoque, os custos e as vendas de peças usadas. A aplicação atual é um front-end em HTML, CSS e JavaScript que acessa PostgreSQL pelo cliente Supabase.

## Princípios estruturais

- Origem é o agrupador operacional e financeiro da procedência; não é uma peça.
- A peça é vinculada a uma origem e deve nascer com uma entrada de estoque.
- A venda reduz o estoque por FIFO.
- O custo real vendido é a soma dos consumos em `venda_consumos_estoque`.
- `js/financeiro-utils.js` é a fonte oficial dos cálculos financeiros.
- Sem consumo registrado, lucro e margem não são estimados: o estado é **Custo não calculado**.

## Módulos atuais

- Painel Geral: resumo operacional e alertas.
- Produtos: consulta rápida de peças e saldo.
- Cadastros: origem, peça com entrada, venda e custo de peça.
- Estoque: entradas, giro e alertas.
- Vendas: cadastro, histórico e detalhes.
- Origens: cadastro, listagem e detalhes.
- Custos: lançamentos por peça e tipos de custo.
- Análises: produto, período e custos.
- Sistema: autenticação, navegação e documentação.

## Entradas e tecnologia

`index.html` valida a sessão e encaminha para `painel.html`, a entrada operacional oficial. `dashboard.html`, `paginas/lotes.html` e `paginas/relatorios.html` são compatibilidades legadas. A navegação principal é construída por `js/sidebar.js`. O contrato de persistência do front-end está concentrado em `js/supabase-service.js`.

## Limites confirmados

O diretório `previews/` não integra a navegação real. A área de marketplace em detalhes do produto é somente visual. Políticas RLS, papéis de usuário, ambiente de produção, rotinas de backup e processo comercial são **pendentes de confirmação**.
