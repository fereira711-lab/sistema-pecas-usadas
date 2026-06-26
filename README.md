# Sistema de Pecas Usadas

ERP web para gestao operacional de pecas usadas, origens, estoque, vendas, custos e analises.

## Arquitetura atual

- Origem nao e peca; origem e o agrupador operacional/financeiro.
- `Estoque Inicial` e apenas mais um tipo de origem; nao altera FIFO nem cria fluxo paralelo.
- Peca nasce depois da origem.
- Toda peca deve gerar entrada de estoque.
- Venda consome estoque.
- O custo real da venda vem do consumo de estoque registrado.
- FIFO continua sendo regra tecnica interna.
- Analises financeiras usam `financeiro-utils.js`.
- Nao usar custo medio.
- Nao usar `origem.valor_total` como custo direto da venda.
- Se nao houver consumo/custo calculado, mostrar `Custo nao calculado` e nao inventar lucro/margem.

Separacao de telas:

- Produtos = operacional.
- Cadastros = fluxo de trabalho.
- Detalhes = central da entidade.
- Analises = financeiro.
- Painel Geral = visao inicial operacional.
- Sidebar = navegacao principal.

Linguagem da interface:

- Usar `Custo da peca`, `Custo calculado`, `Custo nao calculado` e `Entrada consumida`.
- Evitar destacar termos tecnicos internos.
- Nao destacar `FIFO` na interface, mantendo FIFO como regra tecnica interna.

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

## Superficie real identificada

Paginas principais:

- `painel.html`
- `paginas/produtos.html`
- `paginas/cadastro-peca.html`
- `paginas/cadastro-venda.html`
- `paginas/cadastro-origem.html`
- `paginas/entradas-estoque.html`
- `paginas/historico-vendas.html`
- `paginas/listar-origens.html`
- `paginas/analise-produto.html`
- `paginas/analise-periodo.html`
- `paginas/analise-custos.html`
- `paginas/alertas.html`
- `paginas/giro-estoque.html`

Scripts criticos:

- `js/supabase-config.js`
- `js/supabase-service.js`
- `js/financeiro-utils.js`
- `js/sidebar.js`
- `js/painel-geral.js`
- `js/produtos.js`
- `js/peca.js`
- `js/venda.js`
- `js/origem.js`
- `js/entradas-estoque.js`
- `js/analise-produto.js`
- `js/analise-periodo.js`
- `js/analise-custos.js`

Leitura tecnica atual:

- `js/supabase-config.js` expõe URL e chave anônima pública do Supabase para o front;
- `js/supabase-service.js` é a camada principal de leitura/escrita e mapeamento entre banco e interface;
- `js/financeiro-utils.js` é a fonte oficial dos cálculos de receita, custo consumido, lucro e margem;
- a chave sensível não deve existir no front; apenas a chave anônima pública pode aparecer nessa camada.

## Navegacao

- Login abre direto no `painel.html`.
- A sidebar e a navegacao principal atual e deve refletir a arquitetura do sistema.
- O item "Painel Geral" aponta para `painel.html`.
- `previews/` nao deve aparecer na navegacao real.
- Paginas de detalhes nao ficam no menu principal:
  - produto abre detalhes a partir de Produtos;
  - venda abre detalhes a partir do Historico de vendas;
  - origem abre detalhes a partir de Origens cadastradas.

Grupos oficiais da sidebar:

- Painel Geral: Painel Geral.
- Produtos: Produtos; Cadastro de peca.
- Vendas: Cadastro de venda; Historico de vendas.
- Estoque: Entradas de estoque; Giro de estoque, se existir; Alertas, se existir.
- Origens: Cadastro de origem; Origens cadastradas.
- Custos: Custo de peca; Tipos de custo.
- Analises: Analise por produto; Analise por periodo; Analise de custos.
- Sistema: Documentacao / mapa mental, se existir; configuracoes futuras, se existirem.

Nao entram como item direto:

- `detalhes-produto.html`;
- `detalhes-venda.html`;
- `detalhes-origem.html`.

Implementacao atual confirmada:

- `index.html` valida sessao e redireciona para `painel.html`;
- `dashboard.html` e apenas redirecionamento/compatibilidade para `painel.html`;
- `js/sidebar.js` implementa hoje os grupos oficiais `Painel Geral`, `Produtos`, `Vendas`, `Estoque`, `Origens`, `Custos`, `Analises` e `Sistema`;
- o grupo `Sistema` aponta atualmente para `docs/mapa-mental.html` e `DOCUMENTACAO-SISTEMA.md`.

Padrao visual da sidebar:

- tema escuro operacional;
- fundo azul/cinza escuro;
- dourado apenas como detalhe discreto;
- item ativo visivel, sem excesso visual;
- bordas e espacamentos compativeis com os cards;
- usuario e botao `Sair` no rodape.

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

Implementacao atual confirmada:

- `js/painel-geral.js` carrega origens, pecas, vendas, consumos, entradas e custos via `supabase-service.js`;
- os atalhos atuais batem com a proposta operacional: Produtos, Cadastro de peca, Cadastro de venda, Custo de peca, Historico de vendas, Origens cadastradas e Analises;
- os alertas atuais batem com a regra documental: produtos sem estoque, estoque baixo, custo nao calculado, distribuicao pendente e distribuicao acima do previsto;
- as movimentacoes recentes agora ordenam entradas, custos e pecas por data antes de montar o bloco final, evitando perder registros novos por corte prematuro;
- custos ligados a venda levam ao extrato da venda, e custos ligados a peca continuam levando ao detalhe da peca;
- o painel usa custos para alertas e movimentacoes recentes, mas nao vira tela de analise financeira pesada.

## Previews

A pasta `previews/` contem testes visuais, como cadastro, design system, dashboard legado e mega menu.

Tambem funciona como laboratorio visual para validar UX/UI antes de alterar telas reais. O preview `produtos-lista-ui-preview` foi usado como base para a nova lista operacional compacta de Produtos.

Regras:

- Nao usar previews como fluxo real do sistema.
- Nao apontar login, sidebar ou menus operacionais para previews.
- Aplicar no sistema real apenas depois de validar o padrao visual.

## Arquivos legados e compatibilidade

- `index.html`: entrada tecnica protegida. Se houver sessao valida, redireciona para `painel.html`; sem sessao, segue o fluxo atual de login.
- `dashboard.html`: legado/redirecionamento para `painel.html`. Nao deve aparecer na sidebar nem funcionar como segunda versao do Painel Geral.
- `painel.html`: entrada oficial apos login. Nao deve ter cards/calculos duplicados por outra tela de dashboard.
- `paginas/origens.html`: nao existe mais neste checkout. A tela oficial e `paginas/listar-origens.html`.
- `paginas/estoque.html`: nao existe mais neste checkout. A tela oficial de estoque operacional e `paginas/produtos.html`, com apoio de `paginas/entradas-estoque.html`.
- `paginas/lotes.html`: ainda existe como compatibilidade/legado de entradas/lotes. A navegacao principal deve apontar para `paginas/entradas-estoque.html`.
- `paginas/relatorios.html`: legado/redirecionamento para as analises oficiais. O atalho principal deve apontar para `paginas/analise-produto.html`.

Links antigos encontrados:

- A sidebar nao aponta para `dashboard.html`, `previews/`, paginas de detalhes, `paginas/origens.html` ou `paginas/estoque.html`.
- Movimentacoes do Painel Geral devem usar `paginas/entradas-estoque.html` como destino quando uma entrada nao tiver produto vinculado. `paginas/lotes.html` fica apenas como compatibilidade/legado.
- O atalho `Analises` do Painel Geral deve apontar para `paginas/analise-produto.html`, nao para `paginas/relatorios.html`.

Podem ser avaliados futuramente, sem remover agora:

- `dashboard.html`, mantendo redirecionamento enquanto houver compatibilidade externa.
- `paginas/lotes.html`, depois de confirmar que `paginas/entradas-estoque.html` cobre todos os acessos.
- `paginas/relatorios.html`, depois de confirmar que as analises oficiais cobrem todos os acessos.

## Padrao visual atual

- Tema escuro operacional.
- Dourado como destaque discreto.
- Cards compactos.
- Badges suaves.
- Busca principal sempre visivel.
- Filtros avancados em painel lateral.
- Formularios organizados por blocos.

## Textos operacionais compactos

Telas operacionais nao devem parecer tutorial. O texto deve ser curto e existir apenas quando ajudar a acao do usuario ou registrar regra importante do sistema.

Manter:

- titulos das secoes;
- labels dos campos;
- badges de obrigatorio;
- mensagens de erro/validacao;
- avisos importantes de regra do sistema.

Remover ou reduzir:

- frases que repetem o titulo da secao;
- explicacoes obvias;
- textos longos em formularios;
- subtitulos que ocupam espaco sem orientar acao real;
- descricoes que repetem o proprio campo.

Exemplos removiveis:

- "Informe o tipo, codigo e nome usado para localizar...";
- "Use este campo para...";
- "Selecione o produto, informe os dados...";
- descricoes que repetem o titulo ou label.

Avisos que devem permanecer:

- "A entrada de estoque e obrigatoria.";
- "O valor sera distribuido depois nas pecas/entradas vinculadas.";
- "Custo nao calculado";
- mensagens de validacao e erro.

Aplicacao:

- cadastro de origem;
- cadastro de peca;
- cadastro de venda;
- custo de peca;
- futuras telas operacionais.

Reforco:

- operacional deve ser rapido, compacto e claro;
- detalhes concentram contexto completo;
- analises concentram financeiro pesado.

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

Analise financeira pesada deve ficar nas telas de analise. Detalhes mostram a central da entidade, e o Painel Geral mostra apenas resumo operacional.

Implementacao atual confirmada:

- `js/produtos.js` mantem foco em busca, filtros, estoque, status e acoes operacionais;
- as acoes principais continuam `Detalhes` e `Vender`;
- `Lancar custo` permanece como acao secundaria;
- a listagem continua sem expor lucro, margem ou analise financeira pesada.

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

`paginas/listar-origens.html` e a tela real de Origens cadastradas. Ela funciona como listagem operacional de origens para localizar rapidamente lotes, compras avulsas, estoque inicial e outras origens. Nao deve virar analise financeira pesada.

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

Implementacao atual confirmada:

- `js/listar-origens.js` tenta carregar origens, entradas e pecas pelo Supabase e usa fallback local com aviso quando necessario;
- a listagem atual usa busca por codigo, descricao ou tipo, seletor `Mostrar` e filtros por tipo, situacao da distribuicao e periodo;
- os cards de resumo atuais mostram total de origens, origens pendentes, valor total comprado e valor nao distribuido;
- a lista principal exibe codigo, tipo, descricao, data, valor pago, valor distribuido, valor nao distribuido, pecas vinculadas, situacao e acao `Ver detalhes`;
- a situacao operacional atual segue `Falta distribuir`, `Distribuida`, `Acima do previsto` e `Sem valor pago`;
- quando a origem veio apenas do armazenamento local, o script ainda preserva a possibilidade de remocao local.

## Cadastro de origem

`paginas/cadastro-origem.html` e a tela para cadastrar lote, compra avulsa, carro de desmonte, estoque inicial, retorno ou outra origem. A origem e cadastrada antes da peca, funciona como agrupador operacional e financeiro e nao e peca.

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

Implementacao atual confirmada:

- `js/origem.js` gera resumo em tempo real antes do salvamento, incluindo tipo, descricao, valor, data e status inicial;
- o status inicial atual segue `Sem valor pago`, `Pronta para vincular pecas` ou `Aguardando distribuicao`, conforme valor pago e quantidade prevista;
- o salvamento prioriza Supabase e mantem cache local sincronizado quando a origem e criada;
- a acao `Salvar e cadastrar peca vinculada` redireciona para `cadastro-peca.html?origemId=...` usando a origem salva;
- o codigo da origem continua sendo exibido como gerado automaticamente ate o registro ser persistido.

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

Implementacao atual confirmada:

- `js/detalhes-origem.js` carrega origem, entradas, pecas, vendas, consumos de estoque, custos da peca e custos da venda vinculados ao contexto da origem;
- o bloco principal atual destaca codigo da origem, descricao, status da distribuicao, tipo, data, valor pago, valor restante e pecas vinculadas;
- a distribuicao atual mostra valor total, valor distribuido, valor restante, quantidade prevista, quantidade distribuida e situacao da distribuicao;
- pecas vinculadas permanecem operacionais, com busca por SKU/nome e acao `Ver produto`;
- vendas relacionadas permanecem operacionais e mostram data, SKU, peca, quantidade, canal, valor vendido e acao `Ver detalhes da venda`;
- o resumo da origem ficou enxuto: receita relacionada, custo das pecas vendidas, custos vinculados e resultado resumido;
- nesta rodada foi removido um bloco legado duplicado do script, mantendo apenas a implementacao final usada em runtime.

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

Implementacao atual confirmada:

- `js/detalhes-produto.js` monta a tela com produto, origem vinculada, entradas, custos da peca, vendas relacionadas e consumos de estoque;
- as acoes principais atuais abrem `cadastro-venda.html?pecaId=...`, `cadastro-custo.html?pecaId=...`, edicao inline da peca e upload de imagem quando o Supabase esta configurado;
- o resumo operacional final foi mantido enxuto: estoque atual, total vendido, receita relacionada, custo consumido e estado `Custo calculado` ou `Custo nao calculado`;
- vendas relacionadas mostram leitura operacional compacta e levam ao extrato em `detalhes-venda.html?vendaId=...`;
- a area de marketplace continua apenas visual, sem integracao com banco ou Mercado Livre.

## Custo de peca

A pagina `paginas/cadastro-custo.html` usa fluxo operacional vertical:

- Buscar peca.
- Dados da peca selecionada.
- Novo custo.
- Historico de custos cadastrados.

Ela serve para localizar uma peca, lancar custo, editar custo e excluir custo. O historico fica abaixo do formulario, em lista compacta sem barra horizontal, mostrando data, tipo, valor, observacao e acoes `Editar` e `Excluir`.

Custo de peca pode mostrar valores de custo lancados. Produtos continua sem mostrar custo, lucro, margem ou resultado financeiro.

Implementacao atual confirmada:

- `js/custos.js` carrega pecas, origens, custos da peca e tipos de custo, priorizando Supabase e mantendo fallback local quando necessario;
- a tela suporta abrir uma peca preselecionada por `?pecaId=...`, mostrando resumo operacional da peca antes do lancamento;
- os tipos de custo atuais aceitam categoria `peca`, `venda` ou `ambos`, mas a tela filtra para uso de custos de peca;
- o historico atual suporta busca textual, filtro por periodo e filtro por tipo;
- cada linha do historico permite `Editar`, `Excluir` com confirmacao em duas etapas e `Ver detalhes` da peca vinculada;
- exclusao real de custo depende de Supabase configurado; sem isso a tela nao promete exclusao persistente.

## Historico de vendas

`paginas/historico-vendas.html` funciona como listagem operacional das vendas registradas.

A tela mostra:

- busca rapida por SKU ou nome da peca;
- filtros por data inicial, data final e canal;
- seletor `Mostrar`;
- lista compacta com data, SKU, peca, quantidade, canal e acao `Ver detalhes`.

Nao e tela de analise financeira pesada. O papel dela e localizar a venda correta e abrir o extrato completo em `paginas/detalhes-venda.html`.

Implementacao atual confirmada:

- `js/historico-vendas.js` tenta carregar vendas e pecas pelo Supabase e, se falhar, exibe fallback temporario do navegador;
- a ordenacao atual prioriza data da venda mais recente e depois ID mais alto;
- a busca rapida trabalha em cima de SKU e nome da peca, enquanto os filtros avancados cobrem data e canal;
- a acao principal atual e `Ver detalhes`, levando para `detalhes-venda.html?vendaId=...`.

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

Implementacao atual confirmada:

- `js/venda.js` monta a venda com `pecaId`, quantidade, valor unitario, canal, observacoes, data e custos opcionais da venda;
- a tela valida estoque disponivel antes de salvar e impede quantidade maior que o saldo atual;
- quando `window.supabaseService` esta configurado, a venda e salva no banco e a peca em cache e atualizada com o retorno real;
- a persistencia no Supabase agora inclui `observacoes` da venda, e a leitura de `vendas` devolve esse campo para o extrato;
- o resultado financeiro salvo para consulta usa `window.financeiroUtils.calcularLucroVenda(...)` com consumos reais; sem consumo registrado, permanece `Custo nao calculado`;
- quando o Supabase nao esta configurado, ainda existe fallback para armazenamento temporario em `localStorage`, com aviso explicito na interface;
- o resumo operacional mostra quantidade, valor unitario, total e custos da venda, mas nao transforma a tela em analise financeira.

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

Implementacao atual confirmada:

- `js/detalhes-venda.js` busca a venda, carrega produto, origens, custos da venda, consumos de estoque e entradas para montar o extrato completo;
- o custo real e recalculado com `window.financeiroUtils.calcularLucroVenda(...)`, usando `contextoVenda.consumosFifo` e os custos vinculados a venda;
- se nao houver consumo registrado, a tela bloqueia lucro e margem com a mensagem `Custo nao calculado`;
- o extrato mostra receita, custo da peca, custos da venda, lucro e margem, mas preserva quantidade vendida e custo consumido como campos protegidos;
- a edicao atual fica restrita a data, canal e custos da venda quando o Supabase esta configurado.

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

Implementacao atual confirmada:

- `js/analise-produto.js` depende de Supabase configurado; sem isso a tela informa que nao consegue carregar a analise;
- a tela carrega pecas, vendas, consumos de estoque, custos da peca, custos da venda e entradas de estoque, consolidando tudo com `financeiro-utils.js`;
- o resumo superior mostra receita total, custo das pecas vendidas, custos da venda, lucro total e margem media;
- a lista principal usa busca por SKU/nome, seletor `Mostrar`, filtros por periodo, canal, situacao do custo e resultado, alem de ordenacao por receita, lucro, margem, quantidade ou nome;
- cada produto pode expandir `Detalhes` para exibir vendas relacionadas, entradas consumidas, custos vinculados e resumo simples do calculo;
- quando existir venda sem custo real calculado, lucro e margem ficam como `Custo nao calculado` ou `Pendente`, sem inventar resultado.

Analise por periodo mostra resultado financeiro por intervalo de datas, com filtros por data, canal e situacao do custo. A lista de vendas do periodo e o resumo devem mostrar receita, custo das pecas, custos da venda, lucro, margem e quantidade vendida. Os valores devem bater com Detalhes da venda e Analise por produto.

Implementacao atual confirmada:

- `js/analise-periodo.js` depende de Supabase configurado; sem isso a tela informa que nao consegue carregar a analise;
- o periodo padrao atual abre no mes corrente, com suporte a `Hoje`, `Ultimos 7 dias`, `Ultimos 30 dias` e `Personalizado`;
- a tela consolida vendas, consumos de estoque e custos da venda com `financeiro-utils.js` para recalcular custo da peca, custos da venda, lucro e margem por venda;
- o resumo superior mostra receita total, custo das pecas, custos da venda, lucro total, margem media e quantidade vendida;
- a lista usa busca por SKU, nome da peca ou canal, filtro por canal e situacao do custo, alem do seletor `Mostrar`;
- cada venda pode expandir `Detalhes` para exibir entradas consumidas, custos da venda e um resumo textual simples do calculo;
- quando faltar custo real em alguma venda, a tela mostra `Custo nao calculado` e evita inventar lucro ou margem no agregado.

Analise de custos foca custos operacionais. Deve separar custos da peca e custos da venda, mostrar total de custos, maior tipo, quantidade de lancamentos e lista por tipo de custo. Nao deve mostrar lucro/margem.

Implementacao atual confirmada:

- `js/analise-custos.js` depende de Supabase configurado para carregar custos da peca, custos da venda, pecas e vendas;
- a tela transforma os lancamentos em uma base unificada com categoria `peca` ou `venda`, tipo normalizado, referencia e observacao;
- o resumo superior atual mostra total de custos, custos da peca, custos da venda, maior tipo e quantidade de lancamentos;
- os filtros cobrem periodo, tipo de custo, categoria, origem do custo e busca textual por tipo, peca, SKU ou observacao;
- a lista principal agrupa por tipo de custo, exibindo categoria principal, quantidade, total, percentual do total e origem principal;
- cada tipo pode expandir `Detalhes` para mostrar ultimos lancamentos, pecas relacionadas, vendas relacionadas e observacoes consolidadas;
- a tela permanece sem lucro ou margem, focada apenas em leitura operacional dos custos.

## Tipos de custo

`paginas/tipos-custo.html` e uma tela administrativa. Ela serve para cadastrar, editar, ativar e inativar tipos de custo. Nao e tela de analise financeira.

Tipos de custo podem ser usados em custos da peca, custos da venda ou ambos.

Categorias:

- Peca;
- Venda;
- Ambos.

Status:

- Ativo;

Implementacao atual confirmada:

- `js/tipos-custo.js` depende de Supabase configurado para carregar e administrar os tipos de custo;
- a tela atual lista nome, categoria, status e quantidade de usos por tipo;
- a busca e os filtros atuais cobrem nome, categoria e status, com seletor `Mostrar`;
- a validacao de duplicidade usa normalizacao por acento, espacos e caixa, tratando nomes equivalentes como o mesmo tipo;
- o fluxo atual permite `Editar` e `Ativar/Inativar`, sem exclusao fisica pela interface;
- a tela consulta uso do tipo antes de renderizar, reforcando a regra de inativar em vez de duplicar.
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

## Entradas de estoque

`paginas/entradas-estoque.html` funciona como listagem operacional das entradas que sustentam saldo e custo.

A tela mostra:

- busca por codigo, SKU, peca e origem;
- seletor `Mostrar`;
- filtros por origem, produto, status e periodo;
- resumo simples de entradas, saldo e quantidade consumida;
- lista compacta com acoes `Ver produto` e `Ver origem`.

Implementacao atual confirmada:

- `js/entradas-estoque.js` exige Supabase configurado para carregar as entradas reais;
- a listagem usa quantidade total, quantidade consumida, saldo disponivel, custo unitario e valor atribuido por entrada;
- os status atuais sao `Com saldo`, `Parcial` e `Consumida`;
- a ordenacao atual prioriza entradas mais recentes por data e depois por ID mais alto.

## Giro de estoque

`paginas/giro-estoque.html` e tela operacional de leitura de giro, sem virar analise financeira pesada.

A tela mostra:

- busca por SKU/nome;
- filtros por periodo, status, origem e ordenacao;
- resumo de maior giro, produtos parados, estoque baixo, sem estoque e quantidade vendida;
- lista com ultima venda, tempo parado, classificacao e acao `Ver detalhes da peca`.

Implementacao atual confirmada:

- `js/giro-estoque.js` consolida pecas, vendas e entradas via Supabase;
- o giro considera quantidade vendida no periodo, ultima venda, dias sem venda e estoque disponivel por peca;
- a origem exibida no giro prioriza a descricao operacional da entrada e so cai para `Origem <id>` quando necessario.

## Alertas

`paginas/alertas.html` centraliza pontos de atencao operacionais.

A tela mostra:

- busca textual;
- filtros por tipo, gravidade e status;
- resumo por criticidade;
- lista com tipo, descricao, entidade relacionada, gravidade e acao operacional.

Implementacao atual confirmada:

- `js/alertas.js` consolida alertas de pecas, entradas/lotes, vendas e origens via Supabase;
- os alertas atuais cobrem sem estoque, estoque baixo, sem entrada, sem venda, venda sem custo calculado, saldo parado e distribuicao de origem fora do esperado;
- vendas sem consumo FIFO continuam aparecendo como `Venda sem custo calculado`.

## Regras financeiras

- FIFO e a fonte oficial de custo real.
- `financeiro-utils.js` e a fonte oficial de calculos financeiros.
- Telas operacionais nao devem receber analise financeira pesada.
- O custo real da venda vem de `venda_consumos_estoque`.
- Nao usar custo medio.
- Nao usar `origem.valor_total` como custo da venda.
- Se nao houver consumo registrado, mostrar "Custo nao calculado".
- FIFO continua como regra tecnica interna, mas a interface deve usar termos simples para o usuario final.

## Checklist de validação pós-refatoração UX/UI

### Autenticacao e entrada

- [ ] Abrir `index.html`.
- [ ] Confirmar que login valido redireciona para `painel.html`.
- [ ] Confirmar que login invalido mostra erro discreto.
- [ ] Confirmar que `dashboard.html` redireciona para `painel.html`.

### Navegacao

- [ ] Confirmar que a sidebar abre corretamente.
- [ ] Confirmar que os grupos aparecem organizados: Painel Geral, Produtos, Vendas, Estoque, Origens, Custos, Analises e Sistema.
- [ ] Confirmar que os links principais funcionam.
- [ ] Confirmar que `previews/` nao aparece no menu.
- [ ] Confirmar que paginas de detalhes nao aparecem como link direto.

### Fluxo principal

- [ ] Cadastrar origem.
- [ ] Cadastrar peca vinculada a origem.
- [ ] Gerar entrada de estoque.
- [ ] Visualizar produto em Produtos.
- [ ] Vender produto.
- [ ] Gerar consumo/custo da peca.
- [ ] Visualizar venda no Historico de vendas.
- [ ] Abrir Detalhes da venda.
- [ ] Conferir Analise por produto.
- [ ] Conferir Analise por periodo.

### Telas operacionais

- [ ] Produtos.
- [ ] Cadastro de peca.
- [ ] Cadastro de venda.
- [ ] Custo de peca.
- [ ] Historico de vendas.
- [ ] Origens cadastradas.
- [ ] Entradas de estoque.

### Telas de detalhes

- [ ] Detalhes do produto.
- [ ] Detalhes da venda.
- [ ] Detalhes da origem.

### Analises

- [ ] Analise por produto.
- [ ] Analise por periodo.
- [ ] Analise de custos.

### Regras financeiras

- [ ] Confirmar que o custo da venda vem do consumo de estoque.
- [ ] Confirmar que venda sem custo calculado mostra "Custo nao calculado".
- [ ] Confirmar que o sistema nao inventa custo medio.
- [ ] Confirmar que `origem.valor_total` nao e usado como custo direto da venda.
- [ ] Conferir se os numeros batem entre Detalhes da venda, Analise por produto e Analise por periodo.

### UX/UI

- [ ] Filtros laterais funcionam.
- [ ] Listas nao tem rolagem horizontal.
- [ ] Botoes principais funcionam.
- [ ] Menu de tres pontos funciona.
- [ ] Textos evitam termos tecnicos internos em excesso.
- [ ] Tema visual esta consistente.

### Arquivos legados

- [ ] `dashboard.html` continua como legado/redirecionamento.
- [ ] `paginas/lotes.html` continua como legado/compatibilidade.
- [ ] `previews/` continua apenas como laboratorio visual.
