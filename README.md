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

Tambem funciona como laboratorio visual para validar UX/UI antes de alterar telas reais. O preview `produtos-lista-ui-preview` foi usado como base para a nova lista operacional compacta de Produtos.

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

A pagina Produtos e operacional. O padrao principal agora e uma lista operacional compacta, feita para consulta rapida e uso diario do estoque.

Cada linha mostra:

- imagem pequena;
- SKU;
- nome da peca;
- preco de venda;
- quantidade disponivel;
- status operacional;
- acoes visiveis `Detalhes` e `Vender`;
- menu de tres pontos para acoes secundarias: `Lancar custo`, `Ver origem` e `Trocar imagem`, quando existir.

Nao mostrar na lista de Produtos:

- lucro;
- custo da peca;
- margem;
- resultado financeiro.

Analise financeira deve ficar em detalhes, painel e telas de analise.

## Detalhes da origem

`paginas/detalhes-origem.html` funciona como central operacional da origem/lote.

A tela mostra:

- cabecalho com acoes principais;
- bloco principal da origem;
- dados da origem;
- distribuicao da origem;
- pecas vinculadas;
- entradas de estoque;
- vendas relacionadas;
- resumo da origem.

Acoes principais:

- `Editar origem`;
- `Voltar para origens`;
- `Cadastrar peca vinculada`;
- `Ver produto`;
- `Ver detalhes da venda`.

Distribuicao da origem deve mostrar valor total, valor distribuido, valor restante, quantidade prevista quando existir, quantidade distribuida e situacao da distribuicao.

Pecas vinculadas usam lista compacta sem barra horizontal, mostrando SKU, nome da peca, quantidade, disponivel e acao `Ver produto`.

Entradas de estoque mostram peca, data, quantidade total, consumida, saldo, custo unitario e valor atribuido. Vendas relacionadas mostram data, SKU, peca, quantidade, canal, valor vendido e acao `Ver detalhes da venda`.

O resumo da origem usa linguagem simples: receita relacionada, custo das pecas vendidas, custos vinculados e resultado resumido. Se nao houver custo calculado, mostrar "Custo nao calculado". A tela nao deve destacar termos tecnicos internos nem virar analise financeira pesada.

Origem continua sendo agrupador operacional e financeiro. Origem nao e peca; peca nasce depois da origem. Entrada de estoque continua obrigatoria.

## Detalhes do produto

`paginas/detalhes-produto.html` funciona como central operacional/comercial da peca.

A tela mostra:

- cabecalho com acoes principais;
- bloco principal da peca;
- origem vinculada;
- resumo operacional;
- entradas de estoque;
- custos da peca;
- vendas relacionadas;
- area futura de marketplace.

Acoes principais:

- `Vender`;
- `Lancar custo`;
- `Editar dados`;
- `Trocar imagem`;
- `Voltar ao estoque`.

O resumo operacional pode mostrar estoque atual, total vendido, preco de venda, receita relacionada e custo consumido/custo da peca com linguagem simples. A tela nao deve destacar lucro e margem como uma analise pesada; esse papel fica nas telas de Analises.

A area de marketplace pode reservar espaco visual para titulo do anuncio, preco marketplace, status do anuncio e link do anuncio. Por enquanto, nao deve conectar ao banco nem integrar Mercado Livre.

## Custo de peca

A pagina `paginas/cadastro-custo.html` usa fluxo operacional vertical:

- Buscar peca.
- Dados da peca selecionada.
- Novo custo.
- Historico de custos cadastrados.

Ela serve para localizar uma peca, lancar custo, editar custo e excluir custo. O historico fica abaixo do formulario, em lista compacta sem barra horizontal, mostrando data, tipo, valor, observacao e acoes `Editar` e `Excluir`.

Custo de peca pode mostrar valores de custo lancados. Produtos continua sem mostrar custo, lucro, margem ou resultado financeiro.

## Cadastro de venda

A pagina `paginas/cadastro-venda.html` usa fluxo operacional organizado em blocos:

- Produto vendido.
- Dados da venda.
- Custos da venda.
- Resumo antes de salvar.

Ela serve para registrar venda, custos opcionais da venda e baixa de estoque automatica. Nao e tela de analise financeira pesada.

Produto vendido deve mostrar, apos selecao da peca, SKU, nome, preco de venda, estoque disponivel e alerta de estoque baixo/sem estoque quando aplicavel.

Custos da venda sao opcionais, podem ser adicionados/removidos antes de salvar e aparecem em lista compacta. A venda deve poder ser salva sem custo adicional.

O resumo antes de salvar mostra quantidade vendida, receita prevista, custos da venda e o aviso de que o custo da peca sera calculado automaticamente ao salvar. Ao limpar o formulario, o resumo deve voltar para zero.

## Detalhes da venda

`paginas/detalhes-venda.html` funciona como extrato completo de uma venda especifica.

A tela mostra:

- resumo rapido no topo;
- produto vendido;
- dados da venda;
- custos da venda;
- entrada consumida;
- custo da peca;
- lucro;
- margem;
- resultado da venda;
- ajustes permitidos.

Nao e uma tela de analise geral do sistema.

Linguagem da interface:

- evitar destacar o termo FIFO para o usuario final;
- usar "Custo da peca";
- usar "Custo consumido";
- usar "Entrada consumida";
- usar "Custo calculado";
- usar "Custo nao calculado".

Ajustes permitidos:

- data, canal e observacao podem ser editados se essa for a regra atual;
- quantidade vendida e custo consumido ficam protegidos no extrato.

## Regras financeiras

- FIFO e a fonte oficial de custo real.
- `financeiro-utils.js` e a fonte oficial de calculos financeiros.
- Telas operacionais nao devem receber analise financeira pesada.
- O custo real da venda vem de `venda_consumos_estoque`.
- Nao usar custo medio.
- Nao usar `origem.valor_total` como custo da venda.
- Se nao houver consumo registrado, mostrar "Custo nao calculado".
- FIFO continua como regra tecnica interna, mas a interface deve usar termos simples para o usuario final.
