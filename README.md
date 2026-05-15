# Sistema de Pecas Usadas

ERP web para gestao operacional de pecas usadas, origens, estoque, vendas, custos e analises.

## Entrada do sistema

- `index.html`: entrada tecnica/compatibilidade. Quando ha sessao valida, redireciona para `painel.html`.
- `painel.html`: entrada oficial do sistema apos login. Exibe o Painel Geral operacional.
- `dashboard.html`: legado/redirecionamento para `painel.html`. Nao deve ser usado como segunda versao do painel.

## Estrutura de pastas

- `css/`: estilos globais, padroes visuais e CSS auxiliar.
- `docs/`: documentacao auxiliar, mapa mental e relatorios tecnicos.
- `js/`: scripts por tela, sidebar, autenticacao, Supabase e utilitarios.
- `paginas/`: telas reais do sistema.
- `previews/`: prototipos visuais. Nao fazem parte do fluxo real.
- `sql/`: scripts de banco, FIFO, RPCs e tabelas auxiliares.

## Navegacao

- Login abre direto no `painel.html`.
- A sidebar e a navegacao principal atual.
- O item "Painel Geral" aponta para `painel.html`.
- Paginas de detalhes nao ficam no menu principal:
  - produto abre detalhes a partir de Produtos;
  - venda abre detalhes a partir do Historico de vendas;
  - origem abre detalhes a partir de Origens cadastradas.

## Previews

A pasta `previews/` contem testes visuais, como cadastro, design system, dashboard legado e mega menu.

Regras:

- Nao usar previews como fluxo real do sistema.
- Nao apontar login, sidebar ou menus operacionais para previews.
- Aplicar no sistema real apenas depois de validar o padrao visual.

## Padrao visual atual

- Tema escuro operacional.
- Dourado como destaque discreto.
- Cards compactos.
- Badges suaves.
- Busca principal sempre visivel.
- Filtros avancados em painel lateral.
- Formularios organizados por blocos.

## Produtos

A pagina Produtos e operacional. O card oficial mostra SKU, nome, foto, preco de venda, quantidade e menu de acoes.

Nao mostrar no card de produto:

- lucro;
- custo;
- margem;
- resultado financeiro.

## Regras financeiras

- FIFO e a fonte oficial de custo real.
- `financeiro-utils.js` e a fonte oficial de calculos financeiros.
- Telas operacionais nao devem receber analise financeira pesada.
