# Instrucoes para o Codex

Projeto: sistema web de gestao de estoque, compras e vendas de pecas usadas.

Objetivo: evoluir o sistema de forma didatica, pratica e organizada, ajudando Rafael a aprender enquanto o projeto cresce.

## Tecnologias

- HTML, CSS e JavaScript
- Supabase e PostgreSQL
- Git e GitHub

## Regras principais

- Trabalhar em etapas pequenas e evitar grandes refatoracoes sem avisar.
- Explicar de forma simples antes de alterar arquivos importantes.
- Nao apagar arquivos sem explicar o motivo.
- Nao mexer em chaves, senhas, tokens ou dados sensiveis.
- Nao fazer commit automaticamente sem autorizacao.
- Ao final de mudancas, explicar resumidamente o que mudou e por que.

## Organizacao

- Manter HTML em arquivos de tela, CSS em `css/` e JavaScript em `js/`.
- Evitar misturar HTML, CSS e JavaScript no mesmo arquivo, exceto em testes simples.
- Usar nomes de arquivos claros e codigo simples, legivel e organizado.

## Arquitetura oficial do projeto

- Origem nao e peca. Origem e o agrupador operacional/financeiro de procedencia, compra, lote ou retorno.
- A peca nasce depois da origem e deve ficar vinculada a ela quando houver procedencia.
- Toda peca cadastrada deve gerar entrada de estoque para existir saldo e custo operacional.
- Venda consome estoque; o custo real da venda vem do consumo registrado em `venda_consumos_estoque`.
- FIFO continua sendo a regra tecnica interna de custo, mas a interface deve usar linguagem simples.
- `financeiro-utils.js` e a fonte oficial dos calculos financeiros.
- Nao usar custo medio e nao usar `origem.valor_total` como custo direto da venda.
- Se nao houver consumo/custo calculado, mostrar `Custo nao calculado` e nao inventar lucro/margem.

Separacao de telas:

- Produtos = operacional.
- Cadastros = fluxo de trabalho.
- Detalhes = central da entidade.
- Analises = financeiro.
- Painel Geral = visao inicial operacional.
- Sidebar = navegacao principal.

Linguagem de interface:

- Evitar destacar termos tecnicos internos para o usuario final.
- Usar `Custo da peca`, `Custo calculado`, `Custo nao calculado` e `Entrada consumida`.
- Nao destacar `FIFO` na interface, mantendo FIFO apenas como regra tecnica/documental.

## Padrao da sidebar e navegacao

- A sidebar e a navegacao principal do sistema.
- `painel.html` e a entrada oficial apos login.
- `index.html` pode continuar como entrada tecnica/redirecionamento.
- `dashboard.html` pode continuar como legado/redirecionamento, se existir.
- `previews/` nao deve aparecer na navegacao real.
- Atalhos do Painel Geral sao apoio para rotina e nao substituem a sidebar.

Grupos oficiais da sidebar:

- Painel Geral.
- Produtos.
- Vendas.
- Estoque.
- Origens.
- Custos.
- Analises.
- Sistema.

Links oficiais:

- Painel Geral: Painel Geral.
- Produtos: Produtos; Cadastro de peca.
- Vendas: Cadastro de venda; Historico de vendas.
- Estoque: Entradas de estoque; Giro de estoque, se existir; Alertas, se existir.
- Origens: Cadastro de origem; Origens cadastradas.
- Custos: Custo de peca; Tipos de custo.
- Analises: Analise por produto; Analise por periodo; Analise de custos.
- Sistema: Documentacao / mapa mental, se existir; configuracoes futuras, se existirem.

Nao colocar como item direto:

- `detalhes-produto.html`.
- `detalhes-venda.html`.
- `detalhes-origem.html`.

Implementacao atual confirmada:

- `index.html` valida sessao e redireciona para `painel.html`;
- `dashboard.html` e apenas redirecionamento/compatibilidade para `painel.html`;
- `js/sidebar.js` implementa os grupos oficiais e mantem a sidebar como navegacao principal;
- o grupo `Sistema` aponta hoje para `docs/mapa-mental.html` e `DOCUMENTACAO-SISTEMA.md`.

Essas paginas abrem pelo contexto correto: Produtos, Historico de vendas e Origens cadastradas.

Visual da sidebar:

- Tema escuro operacional.
- Fundo azul/cinza escuro.
- Dourado apenas como detalhe discreto.
- Item ativo visivel, sem excesso visual.
- Bordas e espacamentos compativeis com os cards.
- Usuario e botao `Sair` no rodape.

Reforcos:

- Produtos e operacional.
- Detalhes sao centrais das entidades.
- Analises sao financeiras.
- Sistema/Admin deve conter apenas configuracoes, documentacao ou recursos administrativos.

## Banco de dados e Supabase

- Antes de sugerir ou fazer mudancas no banco, explicar a logica.
- Nao alterar regras importantes de estoque, venda, compra ou custo sem explicar o impacto.
- Preservar a integridade dos dados.
- Sempre verificar `error` nas respostas do Supabase.

## Superficie real identificada

Paginas operacionais e analiticas principais:

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

## Leitura de risco atual

- `js/supabase-config.js`: camada pública do front com URL e chave anônima do Supabase;
- `js/supabase-service.js`: ponto crítico de contrato com o banco e de mapeamento entre tabelas e interface;
- `js/financeiro-utils.js`: fonte oficial dos cálculos financeiros; alterar sem critério quebra análises e telas de detalhe;
- qualquer segredo de banco ou chave com privilégio elevado deve ficar fora do front.

## Front-end e JavaScript

- Criar telas simples, funcionais e faceis de entender.
- Priorizar clareza antes de aparencia avancada.
- Usar CSS limpo e evitar excesso de bibliotecas externas.
- Separar responsabilidades no JavaScript e evitar funcoes muito grandes.
- Tratar erros de forma clara para o usuario.

## Textos operacionais compactos

- Telas operacionais nao devem parecer tutorial.
- Evitar excesso de legendas, subtitulos explicativos e textos longos.
- Manter a interface compacta, direta e profissional.
- Manter titulos das secoes, labels dos campos, badges de obrigatorio, mensagens de erro/validacao e avisos importantes de regra do sistema.
- Remover ou reduzir frases que repetem o titulo da secao, explicacoes obvias e descricoes que repetem o proprio campo.
- Exemplos removiveis: `Informe o tipo, codigo e nome usado para localizar...`, `Use este campo para...`, `Selecione o produto, informe os dados...`.
- Exemplos que devem permanecer: `A entrada de estoque e obrigatoria.`, `O valor sera distribuido depois nas pecas/entradas vinculadas.`, `Custo nao calculado` e mensagens de validacao/erro.
- Aplicar em Cadastro de origem, Cadastro de peca, Cadastro de venda, Custo de peca e futuras telas operacionais.
- Operacional deve ser rapido, compacto e claro.
- Detalhes concentram contexto completo.
- Analises concentram financeiro pesado.

## Padrao da tela Produtos

- `paginas/produtos.html` e uma tela operacional de consulta rapida.
- O padrao principal e lista operacional compacta, nao cards grandes.
- Cada item deve priorizar imagem pequena, SKU, nome, preco de venda, quantidade disponivel, status e acoes.
- Acoes principais visiveis: `Detalhes` e `Vender`.
- Menu de tres pontos apenas para acoes secundarias: `Lancar custo`, `Ver origem` e `Trocar imagem`, quando existir.
- Edicao dos dados da peca deve ficar dentro de `detalhes-produto.html`.
- Produtos pode mostrar preco de venda, mas nao deve mostrar lucro, custo da peca, margem ou resultado financeiro.
- Analise financeira pesada deve ficar nas telas de analise. Detalhes mostram apenas o contexto completo da entidade.

Implementacao atual confirmada:

- `js/produtos.js` mantem foco em busca, filtros, estoque, status e acoes operacionais;
- as acoes principais continuam `Detalhes` e `Vender`;
- `Lancar custo` permanece como acao secundaria;
- a listagem continua sem expor lucro, margem ou analise financeira pesada.

## Padrao da tela Cadastro de peca

- `paginas/cadastro-peca.html` e a tela para cadastrar uma peca vinculada a uma origem.
- Toda peca cadastrada deve gerar uma entrada de estoque.
- Fluxo correto: origem selecionada -> dados da peca -> entrada de estoque -> imagem/observacoes -> salvar e continuar cadastrando.
- Estrutura UX: cabecalho `Cadastro de peca`, Etapa 1 Origem vinculada, Etapa 2 Dados da peca, Etapa 3 Entrada de estoque, Etapa 4 Imagem, Resumo antes de salvar e Acoes finais.
- Origem e obrigatoria e deve permanecer selecionada apos salvar.
- Resumo da origem: valor pago, valor distribuido, valor nao distribuido, pecas vinculadas e situacao da distribuicao.
- Dados da peca: nome, SKU/codigo, preco de venda quando existir, status inicial quando existir e observacao curta.
- Entrada de estoque: quantidade, custo unitario, valor atribuido calculado por quantidade x custo_unitario, data local da entrada e observacao da entrada.
- Imagem e operacional/comercial e ajuda na conferencia interna e futura apresentacao comercial.
- Apos salvar: nao redirecionar automaticamente, manter origem selecionada, limpar somente campos da peca, entrada e imagem.
- Permitir cadastrar varias pecas da mesma origem em sequencia.
- Acoes: `Salvar peca`, `Salvar e cadastrar outra da mesma origem`, `Limpar campos da peca` e `Voltar para produtos`.
- Origem nao e peca; peca nasce depois da origem.
- Entrada de estoque e obrigatoria.
- Custo da venda continua vindo do consumo de estoque.
- Nao criar calculo financeiro paralelo nessa tela.
- Analises financeiras pesadas ficam nas telas de analise.

## Padrao da tela Detalhes do produto

- `paginas/detalhes-produto.html` funciona como central operacional/comercial da peca.
- A tela deve mostrar dados principais da peca, origem vinculada, estoque, custos da peca, vendas relacionadas e resumo operacional.
- Nao transformar Detalhes do produto em analise financeira pesada.
- Estrutura UX: cabecalho com acoes principais, bloco principal da peca, origem vinculada, resumo operacional, entradas de estoque, custos da peca, vendas relacionadas e area futura de marketplace.
- Acoes principais: `Vender`, `Lancar custo`, `Editar dados`, `Trocar imagem` e `Voltar ao estoque`.
- O bloco principal deve mostrar imagem, SKU, nome da peca, preco de venda, quantidade disponivel, total vendido, status e observacao curta.
- O resumo operacional pode mostrar estoque atual, total vendido, preco de venda, receita relacionada e custo consumido/custo da peca com linguagem simples.
- Evitar destaque exagerado para lucro e margem nessa tela; analise financeira pesada fica nas telas de Analises.
- A area de marketplace pode reservar espaco visual para titulo do anuncio, preco marketplace, status do anuncio e link do anuncio.
- Marketplace futuro nao deve conectar ao banco nem integrar Mercado Livre ate ser planejado.
- FIFO continua sendo regra tecnica interna; a interface deve usar linguagem simples para custo.

Implementacao atual confirmada:

- `js/detalhes-produto.js` carrega produto, origem, entradas, custos da peca, vendas relacionadas e consumos de estoque para compor a central da peca.
- As acoes principais atuais levam para venda, lancamento de custo, edicao inline da peca e upload de imagem.
- O resumo operacional final ficou enxuto: estoque atual, total vendido, receita relacionada, custo consumido e estado `Custo calculado` ou `Custo nao calculado`.
- Vendas relacionadas permanecem operacionais e levam ao extrato `detalhes-venda.html?vendaId=...`.
- Nesta rodada foi removido um bloco legado duplicado do script, mantendo apenas a implementacao final usada em runtime.
- A area de marketplace continua visual apenas, sem integracao real.

## Padrao da tela Origens cadastradas

- `paginas/listar-origens.html` e a tela real de Origens cadastradas.
- Funciona como listagem operacional de origens/lotes.
- Serve para localizar rapidamente lotes, compras avulsas e outras origens.
- Nao transformar em analise financeira pesada.
- Estrutura UX: cabecalho `Origens cadastradas`, botao `Nova origem`, busca por codigo/descricao/tipo, seletor `Mostrar`, botao `Filtros`, filtros laterais, cards de resumo simples e lista compacta.
- Cards de resumo: Total de origens, Origens pendentes, Valor total comprado e Valor nao distribuido.
- Lista: codigo da origem, tipo, descricao curta, data da compra, valor pago, valor distribuido, valor nao distribuido, pecas vinculadas, situacao da distribuicao e acao `Ver detalhes`.
- Situacoes: `Falta distribuir`, `Distribuida`, `Acima do previsto` e `Sem valor pago`.
- Linguagem: usar `Valor distribuido`, `Valor nao distribuido` e `Situacao da distribuicao`.
- Evitar termos tecnicos internos desnecessarios.
- Origens cadastradas e listagem operacional.
- Detalhes da origem e a central completa da origem/lote.
- Analises financeiras mais profundas ficam nas telas de analise.
- Origem nao e peca.
- Origem e agrupador operacional e financeiro.
- Peca nasce depois da origem.
- Entrada de estoque continua obrigatoria.

Implementacao atual confirmada:

- `js/listar-origens.js` tenta carregar origens, entradas e pecas via Supabase e usa fallback local com aviso quando necessario.
- A listagem atual suporta busca por codigo/descricao/tipo, seletor `Mostrar` e filtros por tipo, situacao da distribuicao e periodo.
- Os cards atuais mostram total de origens, origens pendentes, valor total comprado e valor nao distribuido.
- A lista atual exibe codigo, tipo, descricao, data, valor pago, valor distribuido, valor nao distribuido, pecas vinculadas, situacao e `Ver detalhes`.
- A situacao atual segue `Falta distribuir`, `Distribuida`, `Acima do previsto` e `Sem valor pago`.
- Origens somente locais ainda podem ser removidas do armazenamento local.

## Padrao da tela Cadastro de origem

- `paginas/cadastro-origem.html` e a tela para cadastrar lote, compra avulsa, carro de desmonte, retorno ou outra origem.
- Origem e cadastrada antes da peca.
- Origem funciona como agrupador operacional e financeiro.
- Origem nao e peca.
- Estrutura UX: cabecalho `Cadastro de origem`, Etapa 1 Identificacao da origem, Etapa 2 Valores e distribuicao, Etapa 3 Observacoes, Resumo antes de salvar e Acoes finais.
- Identificacao: tipo da origem, codigo da origem, descricao/nome da origem e data da compra/entrada.
- Valores e distribuicao: valor pago, quantidade prevista de pecas quando existir e aviso de que o valor sera distribuido depois nas pecas/entradas vinculadas.
- Observacoes: fornecedor se existir, documento/referencia se existir e observacoes internas.
- Resumo antes de salvar: tipo, descricao, valor pago, data e status inicial.
- Status inicial: `Aguardando distribuicao`, `Pronta para vincular pecas` ou `Sem valor pago` somente quando valor for R$ 0,00.
- Acoes: `Salvar origem`, `Limpar`, `Salvar e cadastrar peca vinculada` e `Voltar para origens`.
- Nao criar peca dentro da origem.
- A peca nasce depois da origem.
- Entrada de estoque continua obrigatoria apos cadastro da peca.
- Distribuicao da origem acontece nas pecas/entradas vinculadas.
- Analises financeiras pesadas ficam nas telas de analise.

Implementacao atual confirmada:

- `js/origem.js` atualiza o resumo em tempo real antes do salvamento.
- O status inicial atual segue `Sem valor pago`, `Pronta para vincular pecas` ou `Aguardando distribuicao`, conforme valor pago e quantidade prevista.
- O salvamento prioriza Supabase e sincroniza o cache local da origem.
- A acao `Salvar e cadastrar peca vinculada` redireciona para `cadastro-peca.html?origemId=...` usando a origem salva.
- O codigo da origem permanece como gerado automaticamente ate a persistencia.

## Padrao da tela Detalhes da origem

- `paginas/detalhes-origem.html` funciona como central operacional da origem/lote.
- A tela mostra dados da origem, distribuicao, pecas vinculadas, entradas de estoque, vendas relacionadas e resumo da origem.
- Nao transformar Detalhes da origem em analise financeira pesada.
- Estrutura UX: cabecalho com acoes principais, bloco principal da origem, dados da origem, distribuicao da origem, pecas vinculadas, entradas de estoque, vendas relacionadas e resumo da origem.
- Acoes principais: `Editar origem`, `Voltar para origens`, `Cadastrar peca vinculada`, `Ver produto` e `Ver detalhes da venda`.
- Distribuicao mostra valor total, valor distribuido, valor restante, quantidade prevista quando existir, quantidade distribuida e situacao da distribuicao.
- Pecas vinculadas usam lista compacta sem barra horizontal, com SKU, nome da peca, quantidade, disponivel e acao `Ver produto`.
- Entradas mostram peca, data, quantidade total, consumida, saldo, custo unitario e valor atribuido.
- Vendas relacionadas mostram data, SKU, peca, quantidade, canal, valor vendido e acao `Ver detalhes da venda`.
- Resumo da origem usa linguagem simples: receita relacionada, custo das pecas vendidas, custos vinculados e resultado resumido.
- Se nao houver custo calculado, mostrar `Custo nao calculado`.
- Nao destacar termos tecnicos internos na interface.
- Estados vazios aparecem somente quando nao houver dados: `Nenhuma peca vinculada`, `Nenhuma entrada registrada` e `Nenhuma venda relacionada`.
- Origem continua sendo agrupador operacional e financeiro.
- Origem nao e peca; peca nasce depois da origem.
- Entrada de estoque continua obrigatoria.
- Analises financeiras pesadas continuam nas telas de analise.

Implementacao atual confirmada:

- `js/detalhes-origem.js` carrega origem, entradas, pecas, vendas, consumos de estoque, custos da peca e custos da venda ligados ao contexto da origem.
- O bloco principal atual destaca codigo da origem, descricao, status da distribuicao, tipo, data, valor pago, valor restante e pecas vinculadas.
- A distribuicao atual mostra valor total, valor distribuido, valor restante, quantidade prevista, quantidade distribuida e situacao da distribuicao.
- Pecas vinculadas continuam operacionais, com busca por SKU/nome e acao `Ver produto`.
- Vendas relacionadas continuam operacionais e levam a `detalhes-venda.html?vendaId=...`.
- O resumo da origem atual ficou enxuto: receita relacionada, custo das pecas vendidas, custos vinculados e resultado resumido.

## Padrao da tela Custo de peca

- `paginas/cadastro-custo.html` usa fluxo operacional vertical.
- Ordem da tela: Buscar peca, Dados da peca selecionada, Novo custo e Historico de custos cadastrados.
- A tela e focada em localizar peca, lancar custo, editar custo e excluir custo.
- Historico fica abaixo do formulario, em lista compacta sem barra horizontal.
- Cada custo deve mostrar data, tipo, valor, observacao e acoes `Editar` e `Excluir`.
- Exclusao exige confirmacao antes de remover do Supabase.
- Custo de peca pode mostrar valores de custo lancados, mas nao deve virar analise financeira pesada.
- Evitar layout dividido em duas colunas quando apertar o conteudo.

Implementacao atual confirmada:

- `js/custos.js` carrega pecas, origens, custos da peca e tipos de custo, priorizando Supabase e mantendo fallback local quando necessario.
- A tela atual aceita `?pecaId=...` para abrir uma peca ja selecionada no formulario.
- Tipos de custo de categoria `peca` e `ambos` aparecem para selecao nesta tela.
- O historico atual suporta busca textual, filtro por periodo e filtro por tipo.
- Cada linha do historico permite `Editar`, `Excluir` com confirmacao em duas etapas e `Ver detalhes` da peca vinculada.
- Nesta rodada foram removidas funcoes mortas que ainda calculavam custo por origem dentro da tela de custos.
- Exclusao persistente de custo depende de Supabase configurado.

## Padrao da tela Historico de vendas

- `paginas/historico-vendas.html` funciona como listagem operacional das vendas registradas.
- A tela deve priorizar localizacao rapida da venda e acesso ao extrato, sem virar analise financeira pesada.
- Estrutura UX: busca rapida por SKU/nome, seletor `Mostrar`, botao `Filtros`, filtros por data inicial, data final e canal, e lista compacta.
- Lista atual: data, SKU, peca, quantidade, canal e acao `Ver detalhes`.
- A acao principal deve abrir `paginas/detalhes-venda.html` com o `vendaId` correto.
- Historico de vendas e operacional; lucro, margem e leitura financeira detalhada pertencem ao extrato e as telas de analise.

Implementacao atual confirmada:

- `js/historico-vendas.js` tenta carregar vendas e pecas via Supabase e usa fallback temporario no navegador quando necessario.
- A ordenacao atual prioriza venda mais recente por data e depois por ID.
- A busca rapida atual usa SKU e nome da peca; os filtros avancados atuais cobrem data e canal.
- A acao principal atual e `Ver detalhes`.

## Padrao da tela Cadastro de venda

- `paginas/cadastro-venda.html` usa fluxo operacional organizado em blocos.
- Ordem da tela: Produto vendido, Dados da venda, Custos da venda e Resumo antes de salvar.
- A tela e focada em registrar venda, custos opcionais da venda e baixa de estoque via FIFO.
- Nao transformar Cadastro de venda em tela de analise financeira pesada.
- Ao selecionar uma peca, mostrar SKU, nome, preco de venda, estoque disponivel e alerta de estoque baixo/sem estoque quando aplicavel.
- Custos da venda sao opcionais, podem ser adicionados/removidos antes de salvar e devem aparecer em lista compacta.
- A venda deve poder ser salva sem custo adicional.
- O resumo antes de salvar deve mostrar quantidade vendida, receita prevista, custos da venda e aviso de que o custo da peca sera calculado automaticamente ao salvar.
- Ao limpar o formulario, peca, campos, custos e resumo devem voltar ao estado vazio/zero.
- Venda deve respeitar estoque disponivel.
- Nao alterar FIFO manualmente; o custo real da venda vem de `venda_consumos_estoque`.
- `financeiro-utils.js` continua sendo a fonte oficial de calculo financeiro.
- FIFO continua sendo a regra tecnica interna de custo, mas a interface deve preferir termos simples para o usuario: `custo da peca`, `custo consumido` e `entrada consumida`.

Implementacao atual confirmada:

- `js/venda.js` registra `pecaId`, quantidade, valor unitario, canal, observacoes, data e custos opcionais da venda.
- A validacao atual bloqueia quantidade maior que o estoque disponivel.
- Com Supabase configurado, a persistencia usa `window.supabaseService.salvarVenda(...)`.
- A persistencia no Supabase agora inclui `observacoes` da venda, e a leitura de `vendas` devolve esse campo para o extrato.
- O resultado financeiro salvo usa `window.financeiroUtils.calcularLucroVenda(...)` com consumos reais; sem consumo registrado, permanece `Custo nao calculado`.
- Sem Supabase configurado, ainda existe fallback temporario em `localStorage`, com mensagem de aviso ao usuario.
- O resumo continua operacional: quantidade, valor unitario, total e custos da venda.

## Padrao da tela Detalhes da venda

- `paginas/detalhes-venda.html` funciona como extrato completo de uma venda especifica.
- A tela mostra produto vendido, dados da venda, custos da venda, entrada consumida, custo da peca, lucro e margem.
- Nao transformar Detalhes da venda em analise geral do sistema.
- Evitar destacar o termo FIFO para o usuario final.
- Usar linguagem de interface simples: `Custo da peca`, `Custo consumido`, `Entrada consumida`, `Custo calculado` e `Custo nao calculado`.
- FIFO continua sendo a regra tecnica interna oficial de custo.
- O custo real da venda vem de `venda_consumos_estoque`.
- Nao usar custo medio.
- Nao usar `origem.valor_total` como custo da venda.
- Se nao houver consumo registrado, mostrar `Custo nao calculado`.
- Data, canal e observacao podem ser editados se essa for a regra atual da tela.
- Quantidade vendida e custo consumido ficam protegidos no extrato.

Implementacao atual confirmada:

- `js/detalhes-venda.js` monta o contexto da venda com produto, origens, entradas, custos da venda e consumos reais de estoque.
- O resultado financeiro atual e recalculado com `window.financeiroUtils.calcularLucroVenda(...)`.
- Lucro e margem so aparecem quando existe custo consumido calculado; caso contrario a tela mostra `Custo nao calculado`.
- A tela mostra receita, custo da peca, custos da venda, lucro e margem no extrato, sem virar analise geral.
- A edicao atual fica restrita a data, canal e custos da venda quando o Supabase esta configurado.

## Padrao das telas de analise financeira

- `paginas/analise-produto.html`, `paginas/analise-periodo.html` e `paginas/analise-custos.html` sao telas financeiras.
- Elas podem mostrar receita, custo, lucro, margem e totais quando fizer sentido.
- Nao confundir com telas operacionais como Produtos, Historico de vendas ou Cadastro.
- UX padrao: busca principal no topo, seletor `Mostrar`, botao `Filtros`, filtros laterais, cards compactos de resumo, listas sem rolagem horizontal e expansoes para detalhes extras.
- `analise-produto.html` mostra resultado financeiro agrupado por peca, com busca por SKU/nome, cards de resumo e lista por produto.
- Em Analise por produto, mostrar custo da peca, custos da venda, lucro e margem; se faltar custo calculado, mostrar `Custo nao calculado` e nao inventar lucro/margem.

Implementacao atual confirmada:

- `js/analise-produto.js` exige Supabase configurado para carregar a analise consolidada.
- A tela consolida pecas, vendas, consumos de estoque, custos da peca, custos da venda e entradas, usando `financeiro-utils.js` como fonte oficial do calculo.
- O topo atual mostra receita total, custo das pecas vendidas, custos da venda, lucro total e margem media.
- A lista atual suporta busca, `Mostrar`, filtros por periodo/canal/situacao do custo/resultado, ordenacao e expansao `Detalhes` por produto.
- Na expansao, a tela mostra vendas relacionadas, entradas consumidas, custos vinculados e resumo simples do calculo.
- Quando houver custo pendente, o card agregado de lucro total permanece neutro em vez de sinalizar perda.
- Se houver venda sem custo real, lucro e margem ficam como `Custo nao calculado` ou `Pendente`.

- `analise-periodo.html` mostra resultado financeiro por intervalo de datas, com filtros por data, canal e situacao do custo.
- Em Analise por periodo, a lista de vendas e o resumo devem bater com Detalhes da venda e Analise por produto.

Implementacao atual confirmada:

- `js/analise-periodo.js` exige Supabase configurado para carregar a analise.
- O periodo padrao atual abre no mes corrente, com atalhos para Hoje, Ultimos 7 dias, Ultimos 30 dias e Personalizado.
- A tela recalcula por venda custo da peca, custos da venda, lucro e margem usando `financeiro-utils.js`.
- O topo atual mostra receita total, custo das pecas, custos da venda, lucro total, margem media e quantidade vendida.
- A lista atual suporta busca por SKU/nome/canal, filtro por canal e situacao do custo, seletor `Mostrar` e expansao `Detalhes` por venda.
- Se faltar custo real em alguma venda, o agregado e a linha correspondente mostram `Custo nao calculado`.

- `analise-custos.html` tem foco em custos operacionais, separando custos da peca e custos da venda.
- Analise de custos mostra total de custos, maior tipo, quantidade de lancamentos e lista por tipo de custo; nao mostrar lucro/margem nessa tela.

Implementacao atual confirmada:

- `js/analise-custos.js` exige Supabase configurado para consolidar custos da peca, custos da venda, pecas e vendas.
- A base atual e unificada por tipo normalizado, categoria, referencia e observacao.
- O topo atual mostra total de custos, custos da peca, custos da venda, maior tipo e quantidade de lancamentos.
- A lista atual agrupa por tipo e suporta filtros por periodo, tipo, categoria, origem do custo e busca textual.
- Na expansao, a tela mostra ultimos lancamentos, pecas relacionadas, vendas relacionadas e observacoes.
- Analise de custos continua sem lucro ou margem.
- FIFO continua sendo regra tecnica interna.
- A interface deve usar `Custo da peca`, `Custo calculado` e `Custo nao calculado`.
- O custo real da venda vem de `venda_consumos_estoque`.
- `financeiro-utils.js` continua sendo a fonte oficial de calculo.
- Nao usar custo medio.
- Nao usar `origem.valor_total` como custo da venda.

## Padrao da tela Tipos de custo

- `paginas/tipos-custo.html` e tela administrativa, nao analise financeira.
- Serve para cadastrar, editar, ativar e inativar tipos de custo.
- Tipos podem valer para custos da peca, custos da venda ou ambos.
- Categorias oficiais: `Peca`, `Venda` e `Ambos`.
- Status oficiais: `Ativo` e `Inativo`.
- Impedir duplicidade por diferenca de maiusculas/minusculas e espacos extras.

Implementacao atual confirmada:

- `js/tipos-custo.js` exige Supabase configurado para administrar os tipos de custo.
- A tela atual lista nome, categoria, status e quantidade de usos por tipo.
- A busca e os filtros atuais cobrem nome, categoria e status, com seletor `Mostrar`.
- A duplicidade atual e barrada por normalizacao de acento, espacos e caixa.
- O fluxo atual permite `Editar` e `Ativar/Inativar`, sem exclusao fisica pela interface.
- O uso do tipo e consultado antes da renderizacao, reforcando a regra de inativar em vez de duplicar.
- `Limpeza`, `limpeza` e `LIMPEZA` devem ser tratados como o mesmo tipo.
- Normalizar o nome para comparacao antes de salvar.
- Evitar tipos parecidos que baguncam relatorios e analises.
- UX padrao: busca no topo, seletor `Mostrar`, botao `Filtros`, formulario Novo/editar tipo, painel de uso recomendado e lista compacta.
- Acoes da lista: `Editar`, `Inativar` e `Ativar`.
- Custo de peca usa tipos com categoria Peca ou Ambos.
- Cadastro de venda usa tipos com categoria Venda ou Ambos.
- Analise de custos depende dos tipos padronizados para agrupar corretamente.
- Preferir inativar tipos antigos em vez de apagar.
- Nao alterar calculos financeiros nessa tela.

## Entradas de estoque

- `paginas/entradas-estoque.html` funciona como listagem operacional das entradas que sustentam saldo e custo.
- A tela deve mostrar busca, seletor `Mostrar`, filtros por origem/produto/status/periodo, resumo simples e lista compacta.
- A lista atual deve exibir codigo, data, SKU/peca, origem, quantidade total, entrada consumida, saldo disponivel, custo unitario, valor atribuido e acoes `Ver produto` e `Ver origem`.

Implementacao atual confirmada:

- `js/entradas-estoque.js` exige Supabase configurado para carregar entradas reais.
- A tela usa `quantidadeTotal`, `quantidadeConsumida`, saldo disponivel, custo unitario e valor atribuido por entrada.
- Os status atuais sao `Com saldo`, `Parcial` e `Consumida`.
- A ordenacao atual prioriza entradas mais recentes por data e depois por ID.

## Giro de estoque

- `paginas/giro-estoque.html` e tela operacional de leitura de giro, nao analise financeira pesada.
- A tela deve mostrar busca por SKU/nome, filtros por periodo/status/origem/ordenacao, resumo de giro e lista com classificacao e acao `Ver detalhes da peca`.

Implementacao atual confirmada:

- `js/giro-estoque.js` consolida pecas, vendas e entradas via Supabase.
- O giro considera quantidade vendida no periodo, ultima venda, dias sem venda e estoque disponivel por peca.
- A origem exibida prioriza a descricao operacional da entrada e so cai para `Origem <id>` quando necessario.

## Alertas

- `paginas/alertas.html` centraliza pontos de atencao operacionais.
- A tela deve mostrar busca textual, filtros por tipo/gravidade/status, resumo por criticidade e lista com acao operacional.

Implementacao atual confirmada:

- `js/alertas.js` consolida alertas de pecas, entradas/lotes, vendas e origens via Supabase.
- Os alertas atuais cobrem sem estoque, estoque baixo, sem entrada, sem venda, venda sem custo calculado, saldo parado e distribuicao de origem fora do esperado.
- Vendas sem consumo FIFO continuam aparecendo como `Venda sem custo calculado`.

## Padrao do Painel Geral

- `painel.html` e a entrada oficial do sistema apos login.
- Usar `Painel Geral` como nome padrao da interface principal.
- Evitar voltar a usar `Dashboard` na interface principal.
- Painel Geral e visao inicial operacional, nao menu principal em cards e nao analise financeira pesada.
- Estrutura UX: cabecalho, cards de resumo operacional, atalhos rapidos, alertas importantes, ultimas vendas e movimentacoes recentes.
- Resumo operacional: produtos cadastrados, estoque baixo, vendas recentes, origens pendentes e alertas importantes.
- Alertas: produtos sem estoque, estoque baixo, custo nao calculado, distribuicao pendente e distribuicao acima do previsto.
- Atalhos rapidos: Produtos, Cadastro de peca, Cadastro de venda, Custo de peca, Historico de vendas, Origens cadastradas e Analises.
- Sidebar continua sendo a navegacao principal.
- Atalhos do painel sao apoio para rotina, nao menu completo duplicado.
- `index.html` continua como entrada tecnica/redirecionamento.
- `dashboard.html` continua como legado/redirecionamento, se existir.
- Painel deve mostrar rotina e atencao operacional.
- Lucro/margem pesada ficam nas telas de analise.
- Produtos continua operacional.
- Detalhes sao centrais das entidades.
- Analises sao financeiras.

Implementacao atual confirmada:

- `js/painel-geral.js` carrega origens, pecas, vendas, consumos, entradas e custos via `supabase-service.js`;
- os atalhos atuais batem com a proposta operacional: Produtos, Cadastro de peca, Cadastro de venda, Custo de peca, Historico de vendas, Origens cadastradas e Analises;
- os alertas atuais batem com a regra documental: produtos sem estoque, estoque baixo, custo nao calculado, distribuicao pendente e distribuicao acima do previsto;
- as movimentacoes recentes agora ordenam entradas, custos e pecas por data antes de montar o bloco final;
- custos ligados a venda levam ao extrato da venda, e custos ligados a peca continuam levando ao detalhe da peca;
- o painel usa custos para alertas e movimentacoes recentes, mas nao vira tela de analise financeira pesada.

## Tarefas grandes

Antes de executar uma tarefa grande:

1. Analisar a estrutura atual.
2. Explicar o que ja existe.
3. Criar um plano simples.
4. Informar os arquivos que serao criados ou alterados.
5. Executar somente a etapa combinada.
6. Revisar e explicar o resultado.

## Git

Apos alteracoes, sugerir quando fizer sentido:

- `git status`
- `git diff`
- `git add .`
- `git commit -m "mensagem"`
- `git push`

## Estilo

- Responder em linguagem simples, como professor.
- Ser direto, mas explicar o motivo das decisoes importantes.
- Ajudar Rafael a entender o sistema, nao apenas copiar codigo.

## Processo de UX/UI com preview

Mudanças grandes de interface não devem ser aplicadas diretamente nas telas reais.

Fluxo recomendado:
1. analisar a tela
2. criar protótipo em previews/
3. validar visualmente
4. ajustar
5. aplicar na tela real somente depois de aprovado
6. testar e documentar o padrao aplicado

Observacao: o preview `produtos-lista-ui-preview` foi usado como base para validar a UX/UI da lista operacional compacta antes de aplicar em `paginas/produtos.html`.

A pasta previews/ é usada como laboratório visual e não faz parte do fluxo operacional real do sistema.
