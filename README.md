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

## Painel Geral

`painel.html` e a entrada oficial do sistema apos login. Funciona como visao inicial operacional, nao como menu principal em cards e nao como analise financeira pesada.

Estrutura:

- cabecalho `Painel Geral`;
- cards de resumo operacional;
- atalhos rapidos;
- alertas importantes;
- ultimas vendas;
- movimentacoes recentes.

Resumo operacional:

- produtos cadastrados;
- estoque baixo;
- vendas recentes;
- origens pendentes;
- alertas importantes.

Alertas importantes:

- produtos sem estoque;
- estoque baixo;
- custo nao calculado;
- distribuicao pendente;
- distribuicao acima do previsto.

Atalhos rapidos:

- Produtos;
- Cadastro de peca;
- Cadastro de venda;
- Custo de peca;
- Historico de vendas;
- Origens cadastradas;
- Analises.

Regras:

- sidebar continua sendo a navegacao principal;
- atalhos do painel sao apoio para rotina;
- `index.html` continua como entrada tecnica/redirecionamento;
- `dashboard.html` continua como legado/redirecionamento, se existir;
- usar `Painel Geral` como nome padrao;
- evitar voltar a usar `Dashboard` na interface principal;
- lucro/margem pesada ficam nas telas de analise;
- Produtos continua operacional;
- Detalhes sao centrais das entidades;
- Analises sao financeiras.

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

## Cadastro de peca

`paginas/cadastro-peca.html` e a tela para cadastrar uma peca vinculada a uma origem. Toda peca cadastrada deve gerar uma entrada de estoque.

Fluxo:

- origem selecionada;
- dados da peca;
- entrada de estoque;
- imagem/observacoes;
- salvar e continuar cadastrando.

Estrutura:

- cabecalho `Cadastro de peca`;
- Etapa 1: Origem vinculada;
- Etapa 2: Dados da peca;
- Etapa 3: Entrada de estoque;
- Etapa 4: Imagem;
- Resumo antes de salvar;
- Acoes finais.

Origem vinculada:

- origem e obrigatoria;
- origem deve permanecer selecionada apos salvar;
- mostrar valor pago, valor distribuido, valor nao distribuido, pecas vinculadas e situacao da distribuicao.

Dados da peca:

- nome da peca;
- SKU / codigo da peca;
- preco de venda, quando existir no fluxo;
- status inicial, quando existir;
- observacao curta.

Entrada de estoque:

- obrigatoria para saldo e custo;
- quantidade;
- custo unitario;
- valor atribuido calculado automaticamente: quantidade x custo_unitario;
- data da entrada usando data local;
- observacao da entrada.

Imagem:

- imagem e operacional/comercial;
- ajuda na conferencia interna e futura apresentacao comercial.

Comportamento apos salvar:

- nao redirecionar automaticamente;
- manter origem selecionada;
- limpar somente campos da peca, entrada e imagem;
- permitir cadastrar varias pecas da mesma origem em sequencia.

Acoes:

- `Salvar peca`;
- `Salvar e cadastrar outra da mesma origem`;
- `Limpar campos da peca`;
- `Voltar para produtos`.

Regras:

- origem nao e peca;
- peca nasce depois da origem;
- entrada de estoque e obrigatoria;
- custo da venda continua vindo do consumo de estoque;
- nao criar calculo financeiro paralelo nessa tela;
- analises financeiras pesadas ficam nas telas de analise.

## Origens cadastradas

`paginas/listar-origens.html` e a tela real de Origens cadastradas. Ela funciona como listagem operacional de origens/lotes para localizar rapidamente lotes, compras avulsas e outras origens. Nao deve virar analise financeira pesada.

Estrutura:

- cabecalho `Origens cadastradas`;
- botao `Nova origem`;
- busca por codigo, descricao ou tipo;
- seletor `Mostrar`;
- botao `Filtros`;
- filtros laterais;
- cards de resumo simples;
- lista compacta de origens.

Cards de resumo:

- Total de origens;
- Origens pendentes;
- Valor total comprado;
- Valor nao distribuido.

Lista de origens:

- codigo da origem;
- tipo;
- descricao curta;
- data da compra;
- valor pago;
- valor distribuido;
- valor nao distribuido;
- pecas vinculadas;
- situacao da distribuicao;
- acao `Ver detalhes`.

Situacao da distribuicao:

- Falta distribuir;
- Distribuida;
- Acima do previsto;
- Sem valor pago.

Regras:

- usar `Valor distribuido`;
- usar `Valor nao distribuido`;
- usar `Situacao da distribuicao`;
- evitar termos tecnicos internos desnecessarios;
- Detalhes da origem e a central completa da origem/lote;
- analises financeiras mais profundas ficam nas telas de analise;
- origem nao e peca;
- origem e agrupador operacional e financeiro;
- peca nasce depois da origem;
- entrada de estoque continua obrigatoria.

## Cadastro de origem

`paginas/cadastro-origem.html` e a tela para cadastrar lote, compra avulsa, carro de desmonte, retorno ou outra origem. A origem e cadastrada antes da peca, funciona como agrupador operacional e financeiro e nao e peca.

Estrutura:

- cabecalho `Cadastro de origem`;
- Etapa 1: Identificacao da origem;
- Etapa 2: Valores e distribuicao;
- Etapa 3: Observacoes;
- Resumo antes de salvar;
- Acoes finais.

Identificacao:

- tipo da origem;
- codigo da origem;
- descricao/nome da origem;
- data da compra/entrada.

Valores e distribuicao:

- valor pago;
- quantidade prevista de pecas, quando existir;
- aviso de que o valor sera distribuido depois nas pecas/entradas vinculadas.

Observacoes:

- fornecedor, se existir;
- documento/referencia, se existir;
- observacoes internas.

Resumo antes de salvar:

- tipo;
- descricao;
- valor pago;
- data;
- status inicial: `Aguardando distribuicao`, `Pronta para vincular pecas` ou `Sem valor pago` somente quando valor for R$ 0,00.

Acoes:

- `Salvar origem`;
- `Limpar`;
- `Salvar e cadastrar peca vinculada`;
- `Voltar para origens`.

Regras:

- nao criar peca dentro da origem;
- a peca nasce depois da origem;
- entrada de estoque continua obrigatoria apos cadastro da peca;
- distribuicao da origem acontece nas pecas/entradas vinculadas;
- analises financeiras pesadas ficam nas telas de analise.

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

## Analises financeiras

As telas de analise sao:

- `paginas/analise-produto.html`;
- `paginas/analise-periodo.html`;
- `paginas/analise-custos.html`.

Elas sao telas financeiras e podem mostrar receita, custo, lucro, margem e totais. Nao devem ser confundidas com telas operacionais como Produtos, Historico de vendas ou Cadastro.

Padrao UX/UI:

- busca principal no topo;
- seletor `Mostrar`;
- botao `Filtros`;
- filtros laterais;
- cards compactos de resumo;
- listas sem rolagem horizontal;
- expansoes para detalhes extras;
- linguagem simples para o usuario.

Analise por produto mostra resultado financeiro agrupado por peca, com busca por SKU/nome, cards de resumo financeiro e lista por produto. Deve exibir custo da peca, custos da venda, lucro e margem. Se nao houver custo calculado, mostrar `Custo nao calculado` e nao inventar lucro/margem.

Analise por periodo mostra resultado financeiro por intervalo de datas, com filtros por data, canal e situacao do custo. A lista de vendas do periodo e o resumo devem mostrar receita, custo das pecas, custos da venda, lucro, margem e quantidade vendida. Os valores devem bater com Detalhes da venda e Analise por produto.

Analise de custos foca custos operacionais. Deve separar custos da peca e custos da venda, mostrar total de custos, maior tipo, quantidade de lancamentos e lista por tipo de custo. Nao deve mostrar lucro/margem.

## Tipos de custo

`paginas/tipos-custo.html` e uma tela administrativa. Ela serve para cadastrar, editar, ativar e inativar tipos de custo. Nao e tela de analise financeira.

Tipos de custo podem ser usados em custos da peca, custos da venda ou ambos.

Categorias:

- Peca;
- Venda;
- Ambos.

Status:

- Ativo;
- Inativo.

Regras:

- impedir duplicidade por diferenca de maiusculas/minusculas;
- impedir duplicidade por espacos extras;
- tratar `Limpeza`, `limpeza` e `LIMPEZA` como o mesmo tipo;
- normalizar o nome para comparacao;
- evitar tipos parecidos que prejudiquem relatorios e analises;
- preferir inativar tipos antigos em vez de apagar;
- nao alterar calculos financeiros nessa tela.

UX/UI:

- busca no topo;
- seletor `Mostrar`;
- botao `Filtros`;
- formulario Novo/editar tipo;
- painel de uso recomendado;
- lista compacta de tipos cadastrados;
- acoes `Editar`, `Inativar` e `Ativar`.

Relacao com outras telas:

- Custo de peca usa tipos com categoria Peca ou Ambos.
- Cadastro de venda usa tipos com categoria Venda ou Ambos.
- Analise de custos depende dos tipos padronizados para agrupar corretamente.

## Regras financeiras

- FIFO e a fonte oficial de custo real.
- `financeiro-utils.js` e a fonte oficial de calculos financeiros.
- Telas operacionais nao devem receber analise financeira pesada.
- O custo real da venda vem de `venda_consumos_estoque`.
- Nao usar custo medio.
- Nao usar `origem.valor_total` como custo da venda.
- Se nao houver consumo registrado, mostrar "Custo nao calculado".
- FIFO continua como regra tecnica interna, mas a interface deve usar termos simples para o usuario final.
