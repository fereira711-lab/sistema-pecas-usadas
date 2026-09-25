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

- A sidebar e a navegacao principal do sistema (redesenho de 2026-09-24, `js/sidebar.js` + `css/base.css`).
- `painel.html` e a entrada oficial apos login.
- `index.html` pode continuar como entrada tecnica/redirecionamento.
- `dashboard.html` pode continuar como legado/redirecionamento, se existir.
- `previews/` nao deve aparecer na navegacao real.

Secoes e itens oficiais da sidebar (texto sempre visivel):

- Operação: Painel; Produtos; Origens; Vendas; Entradas de estoque; Alertas (com contador).
- Gestão: Análises; Tipos de custo.

Telas sem item proprio, que deixam ativo o item da sua area:

- Produtos: `cadastro-peca.html`, `detalhes-produto.html`, `cadastro-custo.html`.
- Origens: `cadastro-origem.html`, `detalhes-origem.html`.
- Vendas: `cadastro-venda.html`, `detalhes-venda.html`.
- Análises: `analise-produto.html`, `analise-periodo.html`, `analise-custos.html`, `giro-estoque.html`.

Regras:

- Análises e uma pagina com abas: Por produto, Por período, Custos e Giro de estoque. Cada aba reaproveita a tela existente; a barra de abas fica no cabecalho de cada uma.
- Custo de peca nao tem item na sidebar: abre pelo botao `Lançar custo` no detalhe da peca (e no menu de acoes de Produtos).
- Mapa mental e documentacao nao aparecem na navegacao do sistema (documentacao interna).
- Nao colocar como item direto `detalhes-produto.html`, `detalhes-venda.html` e `detalhes-origem.html`.
- Item ativo com `aria-current="page"`.
- Contador de Alertas: quantos tipos de problema existem agora, pelas regras de `js/alertas-regras.js`. O Painel informa o total; nas outras telas a sidebar calcula e guarda em `sessionStorage` por 5 minutos.
- Rodape: avatar com a inicial, nome tirado do e-mail e o e-mail embaixo. Sem papel/perfil (o sistema nao tem cadastro de papeis).
- Marca: nome do sistema e nome da loja ficam em constantes no topo de `js/sidebar.js`; o nome comercial ainda esta pendente.

Visual da sidebar:

- Fundo escuro (`--sidebar-bg`), largura fixa de 240px e 100% da altura.
- Item de 40px com icone Remix de 18px e texto; ativo com fundo `--sidebar-item-active`, texto branco e icone na cor de destaque.
- Em telas ate 860px vira uma barra no topo com botao de menu.

Reforcos:

- Produtos e operacional.
- Detalhes sao centrais das entidades.
- Analises sao financeiras.

## Redesenho da interface (em andamento desde 2026-09-24)

- Especificacao aprovada: `docs/redesenho/pacote-redesenho-erp/ESPECIFICACAO-REDESENHO.md`; telas de referencia em `docs/redesenho/pacote-redesenho-erp/referencia-telas/` (referencia visual, nao copiar o codigo).
- `css/base.css` tem os tokens e os componentes novos. Fora do `:root`, nenhuma cor, raio ou espacamento literal. Ele convive com o `style.css` antigo: so atinge elementos soltos dentro de `body.ui-v2` (telas ja migradas).
- Tela migrada: `body` com a classe `ui-v2`, sem carregar `style.css`; CSS especifico da tela num arquivo proprio em `css/` (ex.: `css/painel.css`).
- Ordem das fases: 1 fundacao; 2 sidebar e Painel; 3 Produtos; 4 Alertas com as regras novas (atualizando os testes); 5 Nova peca (compatibilidade + SKU automatico so quando em branco); 6 Registrar venda (canal fixo e previa do resultado); 7 Detalhes da origem; 8 demais telas; 9 remover do `style.css` o que ficou sem uso.
- Cada fase termina com commit; Rafael aprova visualmente antes da proxima quando pedir.

Decisoes de 2026-09-24:

- Retorno por origem: `recuperado = receita das vendas das pecas da origem - custos dessas vendas`, calculado em `financeiro-utils.calcularResultadoOrigem` (campo `recuperado`). O lucro das pecas vendidas continua `receita - custo consumido - custos da peca - custos da venda` (campo `lucro`); o "Resultado da origem" mostrado em Detalhes da origem e no Painel e `recuperado - valor pago - custos lancados nas pecas da origem` (limpeza, pintura etc.; decisao de Rafael), pela mesma funcao `financeiro-utils.calcularRetornoOrigem`. Custo de peca com mais de uma origem nao entra.
- Valores negativos de moeda e percentual usam o sinal de menos (U+2212), nao hifen. A formatacao centralizada fica em `js/moeda-utils.js` (`formatarMoedaBR`, `formatarPercentualBR`); `parseMoedaBR` aceita os dois sinais. Telas com formatacao local passam a usar o `moeda-utils` quando forem migradas.
- Painel, "Ultimas vendas": coluna `Custos` = custo da peca + custos da venda, para que valor - custos = lucro na mesma linha.
- Regras de atencao do redesenho (secao 8 da especificacao) ficam em `js/alertas-regras.js` (funcoes puras): peca parada ha mais de 90 dias sem venda desde a entrada, venda sem custo calculado, venda com prejuizo, origem com valor a distribuir e distribuicao acima do pago. Na Fase 4 entrou tambem "preco abaixo do custo" (peca com saldo cujo preco cadastrado e menor que o custo da proxima unidade a sair; peca sem preco nao entra).
- Compatibilidade da peca: coluna `pecas.compatibilidade` (texto livre, opcional), migration `sql/14_compatibilidade_pecas.sql`, adiantada da Fase 5 para o conjunto de demonstracao. Ja entra na busca de Produtos; o campo no cadastro/edicao vem na Fase 5. Quantidade 1 e peca recem-cadastrada sem venda nao sao alerta.

## Integracoes futuras

- Mercado Livre (anunciar peca direto do ERP, inclusive a partir do alerta de peca parada) fica para DEPOIS de o sistema de controle estar concluido e em uso real. Nao implementar agora: nem conexao, nem botao "Anunciar". A area de marketplace em Detalhes do produto continua so visual (decisao de 2026-09-24, registrada tambem em `_base-ia/05-projetos/sistema-pecas-usadas.md`).

## Ideias futuras (nao implementar sem pedido)

- Registrar venda com canal Mercado Livre: sugerir automaticamente a linha "Tarifa Mercado Livre" com um percentual configuravel pela loja (ideia de 2026-09-24, registrada tambem no `_base-ia`).
- Botao "Sugerir custo" na Nova peça: ratear o valor da origem entre as pecas proporcionalmente ao preco de venda de cada uma (ideia de 2026-09-24, registrada tambem no `_base-ia`).

## Dados de demonstracao

- Conjunto fixo para as conferencias do redesenho: `sql/90_demo_carregar.sql` e `sql/91_demo_apagar.sql`, ou `scripts\demo-carregar.bat` e `scripts\demo-apagar.bat` (usam a senha salva do backup; o apagar pede `APAGAR DEMO`).
- Conteudo: 3 origens (Onix que ja se pagou, Gol pela metade, lote recem-comprado com R$ 700 a distribuir), 27 pecas com compatibilidade, entradas com datas variadas (6 pecas paradas ha mais de 90 dias), 12 vendas em Mercado Livre, WhatsApp, Balcao e Outro com frete, embalagem e tarifa do Mercado Livre (~11%) nas vendas desse canal, 1 venda com prejuizo (bomba de combustivel), 1 peca com preco abaixo do custo (radiador) e 3 custos de peca (limpeza do painel e pintura da porta do Onix, limpeza do cabecote do Gol; R$ 130). Datas relativas ao dia da carga.
- Precisa dos tipos de custo ativos Frete, Embalagem e Tarifa Mercado Livre (criado pela tela Tipos de custo em 2026-09-24), e Limpeza e Pintura (categoria peca).
- Marcacao: origens com `observacoes` comecando com `[DEMO]` e pecas com SKU `DM-`. O apagar remove so esses registros (e o que estiver ligado as pecas deles) e para sem apagar nada se a marcacao nao bater.
- As vendas passam por `registrar_venda_fifo` com `p_custos`, o mesmo caminho da tela. Os custos de peca entram em `custos_peca` com os mesmos campos que a tela Custo de peca grava.
- Usar esse conjunto em todas as conferencias das proximas fases, em vez de criar dados avulsos.

## Banco de dados e Supabase

- Qualquer mudanca de estrutura no banco (coluna, tabela, funcao/RPC, politica RLS ou de Storage) precisa ser avisada e aprovada por Rafael ANTES de aplicar, mesmo que prevista numa fase ja aprovada (regra de 2026-09-24).

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

- `paginas/produtos.html` e a tela operacional de consulta rapida das pecas. Tela ja migrada para o redesenho (`ui-v2`, `css/produtos.css`).
- Cabecalho: titulo "Produtos", subtitulo com contagens ("N peças cadastradas · M em estoque") e acao principal `Nova peça`.
- Filtros: busca por SKU, peca, veiculo/origem e compatibilidade (cada palavra em qualquer ordem, sem diferenciar acentos), filtro por origem e controle segmentado de situacao com contagem: Todas, Em estoque, Vendidas, Paradas +90 dias.
- Tabela: Peca (miniatura 44px + nome + SKU), Origem, Preco, Custo, Margem, Estoque, Situacao e Acoes. Sem foto: icone de imagem. Paginacao de 20 por pagina.
- Ordem padrao: mais recente primeiro (a ultima entrada ou a ultima venda da peca, o que for mais novo).
- Preco: sem preco cadastrado mostra "Sem preço" na cor de atencao (sem negrito).
- Custo (decisao do redesenho aprovada por Rafael, substitui a regra antiga de nao mostrar custo/margem em Produtos): custo unitario da proxima unidade a sair (entrada mais antiga com saldo, na ordem de consumo), ou da ultima unidade consumida se a peca estiver vendida. Calculado por `financeiro-utils.calcularCustoReferenciaPeca`. Sem custo medio.
- Margem: margem prevista sobre o preco cadastrado, `(preco − custo) / preco`, por `financeiro-utils.calcularMargemPreco`. Sem preco ou sem custo: "—". Lucro e resultado financeiro continuam fora de Produtos.
- Situacao: Em estoque (success), Vendida (neutral), Parada ha N dias (warning, pela regra de `alertas-regras.js`), Preço abaixo do custo (warning, peca com saldo e margem negativa), Sem entrada (neutral). Prioridade da pilula: Preço abaixo do custo > Parada > Em estoque; o filtro "Paradas +90 dias" inclui a peca parada mesmo quando a pilula mostra o preco.
- Acoes: `Vender` quando ha saldo; `Ver venda` quando vendida; os dois no mesmo formato (botao secundario compacto, mesma largura, alinhado a direita). Menu "⋯": `Definir preço` primeiro quando a peca nao tem preco (abre a edicao em `detalhes-produto.html?editar=1&campo=preco`), Ver detalhes, Lançar custo, Ver origem, Trocar imagem e, separado, Excluir peça (a exclusao acontece em `detalhes-produto.html`).
- Aceita filtros pela URL: `?origemId=` e `?situacao=` (todas, estoque, vendidas, paradas), usados pelo "Ver todas" de Detalhes da origem.
- Edicao dos dados da peca continua em `detalhes-produto.html`.

## Padrao da tela Cadastro de peca

- `paginas/cadastro-peca.html` ("Nova peça") cadastra uma peca vinculada a uma origem. Tela ja migrada para o redesenho (`ui-v2`, `css/nova-peca.css`, `js/peca.js`).
- Toda peca cadastrada gera uma entrada de estoque: a peca nasce pela funcao `criar_peca_com_entrada` (peca + entrada juntas).
- Blocos: Origem (select, link `Nova origem` e barra "R$ X distribuídos de R$ Y · Falta distribuir R$ Z"), Peça (nome, SKU, compatibilidade, preco de venda, observacao), Estoque e custo (quantidade, custo por unidade, valor atribuido calculado, data da entrada), Foto (arrastar ou escolher arquivo).
- SKU livre: cada loja usa o padrao que quiser. So quando fica em branco o sistema gera o proximo `P-000123` (sequencial a partir do maior `P-` numero ja usado, `supabaseService.gerarSkuAutomatico`). A checagem de duplicidade continua valendo (sem diferenciar maiusculas).
- Data da entrada (editavel, padrao hoje), preco de venda e compatibilidade (opcional) vao na mesma chamada de `criar_peca_com_entrada` (parametros opcionais `p_data_entrada`, `p_preco_venda`, `p_compatibilidade`, migration `sql/15`): peca, entrada, preco e compatibilidade sao gravados juntos, ou nada. Sem esses parametros a funcao se comporta como antes (data da compra da origem, preco 0, compatibilidade nula).
- O antigo campo "Observação da entrada" saiu porque nao era gravado (a tabela de entradas nao tem essa coluna).
- "Nova entrada" em Detalhes do produto grava direto em `entradas_estoque` com a data escolhida no campo (padrao hoje).
- Resumo lateral: origem, quantidade, custo da peca, preco de venda, margem prevista (`financeiro-utils.calcularMargemPreco`, verde/vermelho), lucro previsto ((preco - custo) x quantidade) e quanto a origem fica a distribuir depois (ou quanto passa do valor pago).
- Rodape: `Cancelar` (volta a Produtos) · `Salvar e cadastrar outra` (fica na tela, mantem a origem, limpa os campos da peca e mostra o SKU gerado) · `Salvar peça` (principal; abre o detalhe da peca salva).
- Origem nao e peca; peca nasce depois da origem. Custo da venda continua vindo do consumo de estoque. Nao criar calculo financeiro paralelo nessa tela.
- Edicao da peca (inclusive compatibilidade) continua em `detalhes-produto.html`, que tambem mostra "Compatível com".

## Padrao da tela Detalhes do produto

- `paginas/detalhes-produto.html` ("Detalhes da peça") e a central operacional/comercial da peca. Tela ja migrada para o redesenho (`ui-v2`, `css/detalhes-produto.css`, `js/detalhes-produto.js`).
- Cabecalho: link `Produtos`, titulo com o nome da peca, subtitulo "SKU · origem". Acoes: `Editar dados` (secundario, abre o formulario na tela), menu "⋯" (Lançar custo, Nova entrada de estoque, Trocar imagem e, separado, Excluir peça) e `Vender` (principal; desabilitado sem estoque).
- Bloco principal: foto, pilula de situacao (mesmas regras e prioridade de Produtos: Vendida; Preço abaixo do custo > Parada ha N dias > Em estoque), "Compatível com", observacao e a lista Preco de venda, Custo da peca, Margem prevista e Origem (link).
- Custo da peca = custo da proxima unidade a sair (ou da ultima vendida), por `financeiro-utils.calcularCustoReferenciaPeca`, como em Produtos. O antigo "Custo medio" saiu (regra do projeto: sem custo medio).
- KPIs: Em estoque (unidades e numero de entradas), Vendidas (unidades e data da ultima venda), Receita das vendas e Custo consumido (`Custo não calculado` quando alguma venda nao tem consumo).
- Entradas de estoque: `Nova entrada` abre o formulario dentro do card (origem, quantidade, custo unitario, data padrao hoje); tabela com Data, Origem (link), Qtd., Consumida, Saldo, Custo unitario, Valor atribuido, `Editar` e `Excluir` (travados quando a entrada ja foi consumida por venda).
- Custos da peca: link `Lançar custo` (abre `cadastro-custo.html?pecaId=`); tabela com Data, Tipo, Descricao (e observacao), Valor, `Editar` (formulario no card) e `Excluir`.
- Vendas: Data, Canal, Qtd., Valor, Lucro da venda (`financeiro-utils.calcularLucroVenda`; `Custo não calculado` sem consumo) e `Ver venda`.
- Anuncio no marketplace: so um aviso de que a integracao com o Mercado Livre vem depois (sem conexao, sem botao).
- Aceita `?editar=1` (abre a edicao; com `&campo=preco` o foco vai para o preco) e `#excluir` (usado pelo menu de Produtos: inicia a exclusao, com as mesmas travas e a confirmacao).
- Exclusao da peca: so sem venda, custo ou consumo; se ainda houver entrada sem consumo, pede para excluir as entradas antes.
- Registros sao ligados a peca so pelo id (o vinculo antigo por nome/SKU misturava pecas com o mesmo nome). Sairam o modo `localStorage`, a lista local de tipos de custo e o campo "Observação" da nova entrada (nao era gravado).
- Nao transformar Detalhes do produto em analise financeira pesada; lucro detalhado fica no extrato da venda e nas Analises. FIFO continua regra tecnica interna.

## Padrao da tela Origens cadastradas

- `paginas/listar-origens.html` ("Origens") e a listagem operacional das origens/lotes. Tela ja migrada para o redesenho (`ui-v2`, `css/origens.css`, `js/listar-origens.js`).
- Cabecalho: titulo "Origens", subtitulo "N origens cadastradas · M com valor a distribuir" e acao principal `Nova origem`.
- KPIs: Origens (com o total de pecas vinculadas), Valor comprado, Distribuido nas pecas e A distribuir (nota em atencao quando ha origem pendente e em perigo quando ha origem acima do pago).
- Filtros: busca por codigo, descricao ou tipo (cada palavra, sem acento), tipo da origem, periodo da compra ("Compra de ... até ...", componente `.filtro-periodo` do `base.css`) e controle segmentado da situacao da distribuicao com contagem: Todas, Falta distribuir, Distribuída, Acima do pago, Sem valor pago.
- Tabela: Origem (descricao com link para `detalhes-origem.html?origemId=` + codigo), Tipo, Compra, Valor pago, Distribuido, A distribuir, Pecas e Situacao (pilula). Mais recente primeiro; 20 por pagina.
- Valor distribuido = soma de quantidade x custo unitario das entradas da origem (a mesma conta de Alertas e da Nova peca).
- Sem analise financeira: o retorno da origem fica em Detalhes da origem.
- Sairam no redesenho: seletor `Mostrar`, painel lateral de filtros e o modo sem Supabase (cache/remocao em `localStorage`). "Acima do previsto" virou "Acima do pago", como em Alertas.
- Origem nao e peca. Origem e agrupador operacional e financeiro. Peca nasce depois da origem. Entrada de estoque continua obrigatoria.

## Padrao da tela Cadastro de origem

- `paginas/cadastro-origem.html` ("Nova origem") cadastra carro para desmonte, lote, compra avulsa ou estoque inicial, antes das pecas. Tela ja migrada para o redesenho (`ui-v2`, so componentes do `base.css`, `js/origem.js`).
- Blocos: Origem (tipo por botoes `.choice`: Carro para desmonte, Lote, Compra avulsa, Estoque inicial; descricao; data da compra, padrao hoje), Valor (valor pago, com a dica de que ele e distribuido depois no custo de cada peca; quantidade prevista opcional) e Observacoes (opcional).
- Resumo lateral: tipo, descricao, data, pecas previstas, valor pago e a situacao inicial ("Sem valor pago" ou "Falta distribuir nas peças").
- Rodape: `Cancelar` (volta a Origens) · `Salvar e cadastrar peça` (abre `cadastro-peca.html?origemId=`) · `Salvar origem` (principal; abre o detalhe da origem salva).
- O codigo (ORI-000123) e gerado ao salvar; o campo de codigo "Gerado automaticamente" e o botao `Limpar` sairam, assim como o cache em `localStorage`.
- Nao criar peca dentro da origem. A distribuicao acontece nas pecas/entradas vinculadas. Analises financeiras ficam nas telas de analise.

## Padrao da tela Detalhes da origem

- `paginas/detalhes-origem.html` e a central da origem/lote. Tela ja migrada para o redesenho (`ui-v2`, `css/detalhes-origem.css`, `js/detalhes-origem.js`), pelo mockup `05-detalhes-origem`.
- Cabecalho: link `Origens`, titulo com a descricao da origem, subtitulo "codigo · tipo · comprado em dd/mm/aaaa" e a observacao da origem (se houver). Acoes: `Editar origem` (secundario, abre o formulario na propria tela) e `Adicionar peça` (principal, `cadastro-peca.html?origemId=`).
- KPIs: Valor pago ("Distribuído em N peças", com "R$ X a distribuir" ou "R$ X acima do pago"); Recuperado em vendas (receita das vendas das pecas da origem menos os custos dessas vendas; nota com pecas vendidas e custos descontados); Resultado da origem (recuperado - valor pago - custos lancados nas pecas; "Já se pagou" ou "Faltam R$ X para se pagar", com "descontados R$ X de custos nas peças" quando houver); Ainda em estoque (unidades, "em N peças" quando difere, e o valor a preco de venda).
- "Retorno da origem": "N% do valor pago já recuperado" ("do valor pago e dos custos nas peças" quando houver custo de peca), barra (verde quando ja se pagou), legenda "R$ 0 · Pago: R$ X" (ou "Pago R$ X + custos nas peças R$ Y = R$ Z") e frase: se ja se pagou (e o lucro ate agora) ou quanto falta, e quanto as pecas em estoque ainda podem render pelos precos cadastrados (se cobre o que falta ou nao). Pecas em estoque sem preco sao avisadas e ficam fora dessa conta.
- "Peças desta origem": controle segmentado Todas / Vendidas / Em estoque com contagem; colunas Peca (nome + SKU, e "N un." quando a entrada tem mais de 1), Custo atribuido (quantidade x custo unitario das entradas desta origem), Preco / vendida por (valor vendido quando a peca acabou; senao o preco cadastrado, com "N vendidas por R$ X" se ja vendeu parte), Situacao e Lucro (vendas da peca menos custo consumido, custos da venda e custos da peca; "—" sem venda; `Custo não calculado` sem consumo). Vendidas primeiro (venda mais recente no topo), depois em estoque (maior custo no topo). Mostra 10; com mais, "Ver todas" abre `produtos.html?origemId=` (e `&situacao=vendidas|estoque` quando o filtro estiver ativo).
- Situacao da peca com as mesmas regras e prioridade de Produtos: Vendida; Preço abaixo do custo > Parada ha N dias (`alertas-regras.js`) > Em estoque.
- Todos os valores vem de `financeiro-utils.calcularRetornoOrigem` (que usa `calcularResultadoOrigem` e `calcularLucroVenda`); a tela nao recalcula custo. Custo da peca so entra no lucro quando a peca tem uma origem so (mesma regra do resultado da origem).
- Sairam no redesenho: blocos Distribuicao, Pecas vinculadas com busca, Entradas de estoque, Vendas relacionadas, Resultado resumido e Historico. A distribuicao ficou na nota do KPI Valor pago; entradas continuam em `entradas-estoque.html` e vendas no detalhe da peca e em Vendas.
- Origem nao e peca; peca nasce depois da origem. Entrada de estoque continua obrigatoria. Analises financeiras pesadas continuam nas telas de analise.

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

- `paginas/historico-vendas.html` ("Vendas") e a listagem operacional das vendas registradas. Tela ja migrada para o redesenho (`ui-v2`, so componentes do `base.css`, `js/historico-vendas.js`).
- Cabecalho: titulo "Vendas", subtitulo "N vendas registradas" e acao principal `Registrar venda`.
- Filtros: busca por SKU, peca, origem, canal ou observacao (cada palavra, sem acento), periodo ("De ... até ...") e controle segmentado de canal com contagem: Todos, Mercado Livre, WhatsApp, Balcão, Outro (canal antigo em texto livre entra em "Outro" no filtro e aparece como foi gravado na tabela).
- Tabela: Data, Peca (nome com link para o extrato + SKU · origem), Canal, Qtd., Valor e `Ver venda`. Mais recente primeiro; 20 por pagina.
- Historico de vendas e operacional; lucro, margem e leitura financeira pertencem ao extrato (`detalhes-venda.html?vendaId=`) e as Analises.
- Sairam no redesenho: seletor `Mostrar`, painel lateral de filtros, "Voltar para o painel" e o modo sem Supabase (`localStorage`, "Remover local").

## Padrao da tela Cadastro de venda

- `paginas/cadastro-venda.html` ("Registrar venda") registra uma venda. Tela ja migrada para o redesenho (`ui-v2`, `css/registrar-venda.css`, `js/venda.js`).
- Blocos: Peça vendida (busca por SKU, nome, compatibilidade ou origem, cada palavra sem acento; a peca escolhida vira cartao com foto, nome, SKU · origem, compatibilidade, estoque e `Trocar peça`), Dados da venda (quantidade, valor unitario ja preenchido com o preco cadastrado, data, canal, observacao) e Custos da venda (linhas tipo + valor + remover, `Adicionar custo`; tipos ativos de categoria Venda ou Ambos).
- Canal por botoes com opcoes fixas: Mercado Livre, WhatsApp, Balcão, Outro (obrigatorio). Componente `.choice-group`/`.choice` do `base.css`: opcao escolhida com fundo escuro (`--text`) e texto branco (`--text-on-dark`); nao usar o controle segmentado, que e dos filtros. Valores antigos em texto livre continuam exibidos como estao nas outras telas.
- Custos da venda: rotulos "Tipo" e "Valor" uma vez so, como cabecalho das colunas (aparece quando existe linha); cada campo tem `aria-label`.
- Aceita `?pecaId=` (botao `Vender` de Produtos e do detalhe da peca). Peca sem estoque aparece desabilitada na busca.
- Resumo lateral "Resultado da venda" ANTES de registrar: receita, custo da peca, custos da venda, lucro e margem (margem na mesma cor do lucro: verde se positivo, vermelho se negativo). O custo da peca e estimado por `financeiro-utils.estimarCustoVendaPeca`: as N proximas unidades na mesma ordem de consumo do banco (data da entrada e depois id); com 1 unidade e o mesmo valor de `calcularCustoReferenciaPeca`. Sem estoque suficiente: `Custo não calculado` e "Falta N un. em estoque", sem inventar lucro/margem. Texto de apoio: "O custo vem da entrada mais antiga desta peça e é confirmado ao registrar."
- `Registrar venda` e a acao principal, no resumo; `Cancelar` volta para Vendas. Depois de registrar: fica na tela, limpa o formulario e mostra "Venda de X registrada · Ver venda".
- O registro continua pela funcao oficial `registrar_venda_fifo` (FIFO no banco). Desde `sql/16`, venda, baixa FIFO, custos da venda (`p_custos`, lista `[{tipo_custo_id, valor}]`) e observacao (`p_observacoes`) vao na mesma chamada: ou grava tudo, ou nada. A funcao recusa custo negativo e tipo inexistente, inativo ou fora da categoria de venda. O custo real vem de `venda_consumos_estoque`; `financeiro-utils.js` continua sendo a fonte oficial.
- Sairam no redesenho: botao "+ Novo tipo" (tipos ficam na tela Tipos de custo), campo de observacao por custo da venda e o fallback em `localStorage` sem Supabase.

## Padrao da tela Detalhes da venda

- `paginas/detalhes-venda.html` e o extrato completo de uma venda. Tela ja migrada para o redesenho (`ui-v2`, `css/detalhes-venda.css`, `js/detalhes-venda.js`).
- Cabecalho: link `Vendas`, titulo "Venda de {peca}", subtitulo "Venda nº N · data · canal". Acoes: `Ver peça` e `Editar venda` (secundarios).
- Blocos: Peça vendida (foto, nome, SKU · origem com link, quantidade, unitario e total), Dados da venda (data, canal, observacao), Custos da venda (tabela Tipo, Data, Observacao, Valor e o total no cabecalho) e Entrada consumida (tabela Entrada, Origem, Data da entrada, Qtd., Custo unitario, Custo total; pilula `Custo calculado` ou `Custo não calculado`).
- Resumo lateral "Resultado da venda": receita, custo da peca, custos da venda, lucro e margem (verde/vermelho), por `financeiro-utils.calcularLucroVenda`. Sem consumo registrado: `Custo não calculado`, sem lucro nem margem.
- `Editar venda` abre um formulario na propria tela so com data e canal (botoes `.choice` com os canais fixos; canal antigo em texto livre e mantido se nao for trocado). Quantidade, valor e custo consumido ficam protegidos.
- O custo real da venda vem de `venda_consumos_estoque`. Sem custo medio e sem `origem.valor_total` como custo. FIFO continua regra tecnica interna, fora da interface.
- Sairam no redesenho: o modo sem Supabase (`localStorage`). Nao transformar o extrato em analise geral.

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

- `paginas/tipos-custo.html` e tela administrativa, nao analise financeira. Tela ja migrada para o redesenho (`ui-v2`, so componentes do `base.css`, `js/tipos-custo.js`).
- Cabecalho: titulo "Tipos de custo", subtitulo "N tipos cadastrados · M ativos" e acao principal `Novo tipo`.
- `Novo tipo` e `Editar` abrem um formulario na propria tela: nome (com a dica de que maiusculas, acentos e espacos nao diferenciam) e "Vale para" por botoes `.choice` (Peça, Venda, Ambos). Status nao fica no formulario: muda pelo `Inativar`/`Ativar` da lista.
- Filtros: busca pelo nome (cada palavra, sem acento), status (ativos e inativos, so ativos, so inativos) e controle segmentado "Vale para" com contagem: Todos, Peça, Venda, Ambos.
- Tabela: Tipo, Vale para, Usos ("N em peças · M em vendas" ou "Sem uso"), Status (pilula Ativo/Inativo) e acoes `Editar` e `Inativar`/`Ativar`. Ativos primeiro, depois por nome.
- Categorias oficiais: `peca`, `venda` e `ambos`. Custo de peca usa tipos Peca ou Ambos; Registrar venda usa Venda ou Ambos.
- Sem exclusao fisica pela interface: tipo antigo e inativado.
- Nome fica como foi digitado (ex.: "Tarifa Mercado Livre"): so tira espacos das pontas e duplicados, sem mudar maiusculas (decisao de 2026-09-24). A duplicidade e barrada sem diferenciar maiusculas, acentos e espacos (`Limpeza` = `LIMPEZA`, `Comissao` = `Comissão`), na tela e de novo no `supabase-service.js`.
- A Analise de custos mostra o nome como cadastrado; so tipos antigos gravados todo em minusculas ("frete") ganham a primeira letra maiuscula.
- Exibicao: cada linha de custo guarda uma copia do nome do tipo do dia do lancamento (`tipo_custo`, e as vezes `descricao`). As telas mostram o nome ATUAL do tipo vinculado (`tipos_custo.nome` via `tipo_custo_id`, no mapeamento do `supabase-service.js`); a copia so aparece em registro antigo sem tipo vinculado. Nos custos da venda, uma `descricao` que so repete o nome copiado nao e observacao e fica vazia na tela (decisao de 2026-09-24, sem mudanca no banco).
- Sairam no redesenho: seletor `Mostrar`, painel lateral de filtros, card "Uso recomendado", campo "Observação curta" (reservado e desabilitado) e o texto "Padrão canônico" em cada linha.
- Nao alterar calculos financeiros nessa tela.

## Entradas de estoque

- `paginas/entradas-estoque.html` e a listagem operacional das entradas que sustentam saldo e custo. Tela ja migrada para o redesenho (`ui-v2`, so componentes do `base.css`, `js/entradas-estoque.js`).
- Cabecalho: titulo, subtitulo "N entradas registradas · M unidades em estoque" e acao principal `Nova peça`.
- KPIs: Entradas (com saldo · parciais), Em estoque (unidades), Consumidas (unidades baixadas pelas vendas) e Custo em estoque (saldo x custo unitario).
- Filtros: busca por codigo da entrada (ENT-000123), SKU, peca ou origem (cada palavra, sem acento), origem, periodo e controle segmentado com contagem: Todas, Com saldo, Parcial, Consumida.
- Tabela: Data, Peca (link para o produto + SKU · codigo da entrada), Origem (link para a origem), Qtd., Consumida, Saldo, Custo unitario, Valor atribuido e Situacao. Mais recente primeiro; 20 por pagina.
- Sairam no redesenho: seletor `Mostrar`, painel lateral de filtros, filtro por produto (a busca cobre) e os botoes `Ver produto`/`Ver origem` (viraram links no nome).

## Giro de estoque

- `paginas/giro-estoque.html` e tela operacional de leitura de giro, nao analise financeira pesada.
- A tela deve mostrar busca por SKU/nome, filtros por periodo/status/origem/ordenacao, resumo de giro e lista com classificacao e acao `Ver detalhes da peca`.

Implementacao atual confirmada:

- `js/giro-estoque.js` consolida pecas, vendas e entradas via Supabase.
- O giro considera quantidade vendida no periodo, ultima venda, dias sem venda e estoque disponivel por peca.
- A origem exibida prioriza a descricao operacional da entrada e so cai para `Origem <id>` quando necessario.

## Alertas

- `paginas/alertas.html` centraliza os pontos de atencao. Tela ja migrada para o redesenho (`ui-v2`, `css/alertas.css`).
- As regras sao as mesmas do Painel e do contador da sidebar: `js/alertas-regras.js`. A tela so agrupa, filtra e mostra (`js/alertas.js`).
- Cabecalho: titulo "Alertas" e subtitulo "N tipos de problema · M ocorrências" (ou "Nada precisa de atenção agora").
- Filtros: busca por SKU, peca, origem ou canal (cada palavra, sem acento) e controle segmentado de gravidade com contagem: Todos, Críticos, Atenção, Informação.
- Um card por tipo, na ordem de gravidade, com icone, titulo com a quantidade, pilula de gravidade (Crítico, Atenção, Informação), resumo e tabela com uma linha por ocorrencia e a acao para resolver:
  - Venda com prejuizo (critico): data, peca, canal, valor, custos, lucro; `Ver venda`.
  - Distribuicao acima do pago (critico): origem, valor pago, distribuido, acima do pago; `Ver origem`.
  - Venda sem custo calculado (atencao): data, peca, canal, valor; `Ver venda`.
  - Preco abaixo do custo (atencao): peca, preco, custo, margem; `Ajustar preço` (abre a edicao com foco no preco).
  - Peca parada ha mais de 90 dias (atencao): peca, origem, dias, estoque, custo parado (saldo x custo unitario da entrada), ordenada pelo maior custo parado; resumo "R$ X de custo parado" (o mesmo texto no Painel); `Ver peça`.
  - Origem com valor a distribuir (informacao): origem, valor pago, distribuido, a distribuir; `Distribuir`.
- Com busca ativa, o titulo mostra o parcial: "2 de 6 peças paradas há mais de 90 dias".
- Cada card tem ancora com o tipo (ex.: `alertas.html#peca-parada`), usada pelos links do Painel.
- Removidos no redesenho: Sem estoque, Estoque baixo, Lote esgotado, Saldo baixo, Sem entrada, Sem venda e Produto parado por 30 dias (nao fazem sentido em desmanche).
- A tela informa o total de tipos ao contador da sidebar, como o Painel.

## Padrao do Painel

- `painel.html` e a entrada oficial do sistema apos login; titulo da tela: "Painel". Tela ja migrada para o redesenho (`ui-v2`, `css/painel.css`).
- Acoes do cabecalho: seletor de periodo (meses com venda + mes atual + "Todo o período"), `Nova peça` (secundario) e `Registrar venda` (principal).
- KPIs do periodo: Receita do mes; Lucro real com margem (mostra `Custo não calculado` se alguma venda do periodo nao tiver custo); Custo das pecas vendidas + custos da venda; Estoque (numero grande em unidades, "22 unidades", e embaixo "em 17 peças · 27 cadastradas").
- "Retorno por origem": barra de quanto do valor pago e dos custos nas pecas ja voltou ("R$ recuperado de R$ pago + custos nas pecas"), com "Já se pagou · lucro de R$ X" ou "Faltam R$ X para se pagar". Mesma funcao de Detalhes da origem (`financeiro-utils.calcularRetornoOrigem`).
- "Precisa de atencao": ate 4 itens pelas regras de `js/alertas-regras.js`; informa o total ao contador da sidebar.
- "Ultimas vendas" (subtitulo "Independente do período"): 7 vendas mais recentes com data, SKU + peca · origem, canal, valor, custos (peca + venda) e lucro (vermelho se negativo).
- Removidos no redesenho: bloco "Ações rápidas" (duplicava a sidebar), bloco de alertas que repetia os contadores e "Movimentações recentes".
- Todos os valores financeiros vem do `financeiro-utils.js`; o Painel nao recalcula FIFO nem custo.

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

## Contexto transversal do Ecossistema

- Estado técnico do ERP: este repositório e seus serviços próprios.
- Autoridade e coordenação institucional: Fundação Hefestos.
- Memória e contexto auxiliar: Base IA.
- Contexto transversal: consultar `REF-ECO-CTX-001 - Referência Transversal Mínima do Ecossistema Hefestos` na Fundação.
- Hefestos ≠ ERP. Esta orientação não cria integração de runtime.
