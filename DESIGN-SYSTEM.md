# Design System do ERP de Pecas Usadas

## Objetivo do design system

O design system tem como objetivo padronizar o visual e a experiencia do ERP de pecas usadas.

Ele deve:

- Reduzir inconsistencias entre telas.
- Facilitar o crescimento do sistema.
- Criar uma aparencia profissional no estilo ERP/SaaS.
- Manter o foco em operacao rapida, leitura clara e produtividade.
- Servir como base antes da criacao de CSS global ou componentes reutilizaveis.
- Servir junto com a pasta `previews/` como laboratorio visual antes de mudancas definitivas.

## Momento atual do design

O sistema esta em fase de revisao visual. O design deve ser estudado antes de ser aplicado no sistema inteiro.

Decisoes atuais:

- Nao fazer redesign geral de uma vez.
- Trabalhar pagina por pagina.
- Validar primeiro em `previews/` ou em uma tela controlada.
- Manter o padrao visual atual enquanto a nova direcao e estudada.
- Evitar mudancas que alterem regra de negocio, FIFO ou calculos financeiros.
- Registrar decisoes novas antes de espalhar padroes para outras telas.
- A lista operacional compacta de Produtos foi validada primeiro em `previews/produtos-lista-ui-preview` antes de ser aplicada em `paginas/produtos.html`.
- A central da peca em `paginas/detalhes-produto.html` foi validada primeiro em `previews/detalhes-produto-ui-preview` antes de ser aplicada na tela real.
- Manter `painel.html` como entrada oficial apos login.
- Manter a sidebar como navegacao principal atual.
- Manter `index.html` como entrada tecnica/redirecionamento.
- Manter `dashboard.html` como legado/redirecionamento para `painel.html`.

## Referencia visual aprovada em campo

O `cadastro-peca.html` e a primeira referencia visual aplicada em uma tela real do novo padrao do ERP. Ele deve orientar a evolucao das proximas telas operacionais, sem obrigar copia literal de todos os detalhes.

Diretrizes extraidas dessa tela:

- Fundo escuro operacional, com contraste suficiente para uso diario.
- Cards compactos com bordas visiveis, sem excesso de sombra.
- Blocos de formulario bem separados por etapa.
- Layout denso, mas com respiro suficiente entre grupos.
- Abas visuais podem indicar areas futuras; apenas a area funcional deve parecer ativa.
- Dourado/amarelo e cor de identidade e destaque discreto, nao cor dominante.
- Badges como "Obrigatorio" devem ser pequenos, suaves e de baixa competicao visual.
- Campos calculados/readonly usam estilo proprio: fundo sutil, borda neutra/fria e texto destacado.
- Sidebar e a estrutura global atual, mantendo a area central focada na tarefa.
- Topbar com mega menu pode ser estudada em `previews/preview-mega-menu.html`, sem substituir a sidebar ate ser aprovada.

## Textos em telas operacionais

Telas operacionais devem ser compactas e profissionais. Elas nao devem parecer tutorial nem explicar o obvio quando o titulo da secao, o label do campo ou o contexto da tela ja resolvem a compreensao.

Manter:

- Titulos das secoes.
- Labels dos campos.
- Badges de obrigatorio.
- Mensagens de erro e validacao.
- Avisos de regra do sistema.

Remover ou reduzir:

- Frases que repetem o titulo da secao.
- Explicacoes obvias como "Use este campo para...".
- Textos longos dentro de formularios.
- Subtitulos que ocupam espaco sem orientar uma acao real.
- Descricoes que repetem o proprio campo.

Exemplos de textos removiveis:

- "Informe o tipo, codigo e nome usado para localizar..."
- "Use este campo para..."
- "Selecione o produto, informe os dados..."
- Qualquer descricao que apenas repita o titulo ou o label.

Avisos que devem permanecer:

- "A entrada de estoque e obrigatoria."
- "O valor sera distribuido depois nas pecas/entradas vinculadas."
- "Custo nao calculado."
- Mensagens de validacao e erro.

Aplicar em:

- Cadastro de origem.
- Cadastro de peca.
- Cadastro de venda.
- Custo de peca.
- Futuras telas operacionais.

Regra geral:

- Operacional deve ser rapido, compacto e claro.
- Detalhes concentram contexto completo.
- Analises concentram financeiro pesado.

## Arquitetura e linguagem oficial

- Origem nao e peca; origem e o agrupador operacional/financeiro.
- Peca nasce depois da origem.
- Toda peca cadastrada deve gerar entrada de estoque.
- Venda consome estoque.
- O custo real da venda vem do consumo de estoque.
- FIFO continua sendo regra tecnica interna de custo.
- `financeiro-utils.js` continua sendo a fonte oficial dos calculos financeiros.
- Nao usar custo medio.
- Nao usar `origem.valor_total` como custo direto da venda.
- Se nao houver consumo/custo calculado, mostrar `Custo nao calculado`.
- Nao inventar lucro/margem quando faltar custo calculado.

Separacao de telas:

- Produtos = operacional.
- Cadastros = fluxo de trabalho.
- Detalhes = central da entidade.
- Analises = financeiro.
- Painel Geral = visao inicial operacional.
- Sidebar = navegacao principal.

Linguagem de interface:

- Usar `Custo da peca`, `Custo calculado`, `Custo nao calculado` e `Entrada consumida`.
- Evitar destacar termos tecnicos internos.
- Nao destacar `FIFO` na interface; manter o termo para documentacao tecnica e regras internas.

## Organizacao funcional atual

- Produtos e a tela operacional principal para estoque/produtos.
- Detalhes sao centrais da entidade: origem, peca e venda.
- Analises sao a area financeira do sistema.
- FIFO real e a fonte oficial de custo.
- `financeiro-utils.js` e a fonte oficial de calculos financeiros.
- `painel.html` e a entrada oficial do sistema apos login.
- `index.html` e entrada tecnica/compatibilidade.
- `dashboard.html` e legado/redirecionamento.
- Paginas de detalhes nao entram como link direto no menu principal.

## Padrao da sidebar

A sidebar e a navegacao principal do sistema e deve refletir a arquitetura atual do ERP. `painel.html` e a entrada oficial apos login. `index.html` continua como entrada tecnica/redirecionamento e `dashboard.html` pode continuar como legado/redirecionamento.

Grupos oficiais:

- Painel Geral.
- Produtos.
- Vendas.
- Estoque.
- Origens.
- Custos.
- Analises.
- Sistema.

Links por grupo:

- Painel Geral: Painel Geral.
- Produtos: Produtos; Cadastro de peca.
- Vendas: Cadastro de venda; Historico de vendas.
- Estoque: Entradas de estoque; Giro de estoque, se existir; Alertas, se existir.
- Origens: Cadastro de origem; Origens cadastradas.
- Custos: Custo de peca; Tipos de custo.
- Analises: Analise por produto; Analise por periodo; Analise de custos.
- Sistema: Documentacao / mapa mental, se existir; configuracoes futuras, se existirem.

Nao devem aparecer na sidebar:

- `previews/`.
- `detalhes-produto.html`.
- `detalhes-venda.html`.
- `detalhes-origem.html`.

Padrao visual:

- Tema escuro operacional.
- Fundo azul/cinza escuro.
- Dourado apenas como detalhe discreto em icones, setas e estado ativo.
- Item ativo visivel, sem competir com o conteudo da tela.
- Bordas e espacamentos alinhados aos cards do sistema.
- Usuario e botao `Sair` no rodape.

Regras de arquitetura:

- Atalhos do Painel Geral sao apoio, nao substituem a sidebar.
- Produtos e operacional.
- Detalhes sao centrais das entidades.
- Analises sao financeiras.
- Sistema/Admin deve conter documentacao, configuracoes ou recursos administrativos.

## Padrao do Painel Geral

`painel.html` e a entrada oficial apos login e deve usar o nome `Painel Geral` na interface principal. Evitar voltar a chamar a tela de `Dashboard`.

Funcao:

- Visao inicial operacional.
- Rotina e pontos de atencao.
- Atalhos de apoio.
- Nao ser menu principal em cards.
- Nao ser analise financeira pesada.

Estrutura visual:

- Cabecalho `Painel Geral`.
- Cards compactos de resumo operacional.
- Atalhos rapidos.
- Alertas importantes.
- Ultimas vendas.
- Movimentacoes recentes.

Resumo operacional:

- Produtos cadastrados.
- Estoque baixo.
- Vendas recentes.
- Origens pendentes.
- Alertas importantes.

Alertas importantes:

- Produtos sem estoque.
- Estoque baixo.
- Custo nao calculado.
- Distribuicao pendente.
- Distribuicao acima do previsto.

Atalhos rapidos:

- Produtos.
- Cadastro de peca.
- Cadastro de venda.
- Custo de peca.
- Historico de vendas.
- Origens cadastradas.
- Analises.

Regras:

- Sidebar continua sendo a navegacao principal.
- Atalhos do painel nao substituem a sidebar.
- `index.html` continua como entrada tecnica/redirecionamento.
- `dashboard.html` continua como legado/redirecionamento quando existir.
- Lucro/margem pesada ficam nas telas de analise.
- Produtos continua operacional.
- Detalhes continuam como centrais das entidades.
- Analises continuam financeiras.

## Padrao das telas de analise financeira

As telas `analise-produto.html`, `analise-periodo.html` e `analise-custos.html` pertencem ao grupo financeiro. Elas podem mostrar receita, custo, lucro, margem e totais quando fizer sentido, sem competir com telas operacionais como Produtos, Historico ou Cadastro.

Padrao visual:

- Busca principal no topo.
- Seletor `Mostrar`.
- Botao `Filtros`.
- Filtros laterais.
- Cards compactos de resumo.
- Listas sem rolagem horizontal.
- Expansoes para detalhes extras.
- Linguagem simples para custo e resultado.

Regras por tela:

- `analise-produto.html`: resultado financeiro agrupado por peca, busca por SKU/nome, cards de resumo financeiro e lista por produto com custo da peca, custos da venda, lucro e margem. Se faltar custo calculado, mostrar `Custo nao calculado` e nao inventar lucro/margem.
- `analise-periodo.html`: resultado financeiro por intervalo de datas, filtros por data, canal e situacao do custo, lista de vendas do periodo e resumo com receita, custo das pecas, custos da venda, lucro, margem e quantidade vendida. Os valores devem bater com Detalhes da venda e Analise por produto.
- `analise-custos.html`: foco em custos operacionais, separando custos da peca e custos da venda. Deve mostrar total de custos, maior tipo, quantidade de lancamentos e lista por tipo de custo, sem lucro/margem.

Regras financeiras:

- FIFO continua sendo regra tecnica interna.
- A interface deve usar `Custo da peca`, `Custo calculado` e `Custo nao calculado`.
- O custo real da venda vem de `venda_consumos_estoque`.
- `financeiro-utils.js` continua sendo a fonte oficial de calculos.
- Nao usar custo medio.
- Nao usar `origem.valor_total` como custo da venda.

## Estrutura de projeto considerada no design

- `css/`: estilos globais, tokens visuais e CSS do mapa mental.
- `docs/`: documentacao auxiliar e relatorios tecnicos.
- `js/`: scripts por tela e utilitarios compartilhados.
- `paginas/`: telas reais do sistema.
- `previews/`: prototipos visuais sem funcao operacional.
- `sql/`: estrutura de banco, FIFO e RPCs.

## Identidade visual

O sistema deve ter estilo moderno, limpo e profissional, com foco em produtividade.

Diretrizes:

- Alta legibilidade.
- Visual compacto.
- Interface objetiva.
- Pouca decoracao.
- Baixo uso de sombras.
- Bordas discretas.
- Efeitos visuais sutis.
- Hierarquia clara entre operacao, detalhes e analises.

Evitar:

- Cards grandes demais.
- Telas muito espacadas.
- Excesso de cores.
- Sombras pesadas.
- Elementos decorativos sem funcao.
- Informacao financeira pesada em telas operacionais.

## Paleta de cores

O padrao visual atual e escuro operacional. A tabela abaixo registra a referencia historica clara, mas as telas recentes devem priorizar fundo escuro, bordas suaves, cards compactos e dourado como destaque discreto.

| Uso | Cor sugerida | Observacao |
| --- | --- | --- |
| Fundo principal | `#F5F7FA` | Fundo claro e neutro |
| Cards | `#FFFFFF` | Areas de conteudo |
| Bordas | `#E2E8F0` | Separacao discreta |
| Texto principal | `#111827` | Alta legibilidade |
| Texto secundario | `#64748B` | Apoio, descricoes e metadados |
| Azul principal | `#2563EB` | Acoes principais e item ativo |
| Verde sucesso | `#16A34A` | Sucesso, estoque disponivel, positivo |
| Vermelho alerta | `#DC2626` | Erros, perigo, sem estoque |
| Amarelo aviso | `#F59E0B` | Atencao, estoque baixo, pendencias |

Regras:

- Dourado/amarelo e a cor de identidade no padrao atual, mas deve aparecer apenas como destaque discreto.
- Azul pode ser usado em estados informativos ou links, sem competir com a identidade principal.
- Verde deve indicar sucesso ou situacao positiva.
- Vermelho deve indicar erro, risco ou acao destrutiva.
- Amarelo deve indicar aviso, atencao ou pendencia.
- Cores fortes devem aparecer em pontos especificos, nao dominar a tela.
- No novo padrao escuro, dourado/amarelo tambem pode representar identidade visual, desde que discreto e concentrado em aba ativa, pequenas chamadas e acentos.
- Evitar usar dourado forte em bordas de campos normais, porque isso compete com titulos, botoes e estados de validacao.

## Tipografia

Fonte principal recomendada:

- `Inter`, `Segoe UI`, `Arial`, sans-serif.

Tamanhos padrao:

| Elemento | Tamanho |
| --- | --- |
| Texto base | `14px` |
| Texto secundario | `12px` a `13px` |
| Titulo de pagina | `24px` a `28px` |
| Titulo de secao | `18px` a `20px` |
| Titulo de card | `14px` a `16px` |
| Tabela | `13px` a `14px` |

Pesos:

- Regular: `400`.
- Medio: `500`.
- Semibold: `600`.
- Bold: `700` apenas para titulos ou indicadores importantes.

Padrao de leitura para ERP:

- Titulos objetivos.
- Textos curtos.
- Numeros bem alinhados.
- Pouca narrativa dentro da interface.
- Hierarquia visual baseada em tamanho, peso e espacamento.

## Espacamento

Padrao recomendado:

- Padding de tela: `24px`.
- Padding de card: `16px` a `20px`.
- Distancia entre secoes: `20px` a `24px`.
- Distancia entre campos: `12px` a `16px`.
- Distancia entre linhas de tabela: compacta, sem exagero vertical.
- Grid base: multiplos de `4px` ou `8px`.
- Largura maxima de conteudo: `1200px` a `1440px`, conforme a tela.

Regras:

- Telas operacionais devem ser mais compactas.
- Telas de detalhes podem ter mais respiro entre secoes.
- Analises devem priorizar comparacao e leitura rapida.

## Layout global

### Sidebar lateral

Menu lateral com modulos principais do ERP.

Modulos atuais:

- Painel Geral.
- Produtos.
- Vendas.
- Estoque.
- Origens.
- Custos.
- Analises.
- Sistema.

Paginas de detalhes nao devem aparecer como link direto; devem abrir pelo contexto da listagem ou entidade relacionada.

### Topo/header

Area superior com contexto da pagina, busca, acoes rapidas e usuario.

### Area principal

Conteudo central da tela, com tabelas, cards, formularios ou detalhes.

### Containers

Containers devem organizar conteudo sem criar excesso de caixas.

### Comportamento responsivo

No desktop, usar sidebar e conteudo amplo. Em telas menores, a sidebar pode recolher ou virar menu.

## Sidebar

Padrao recomendado:

- Largura aberta: `240px` a `280px`.
- Largura recolhida: `64px` a `72px`.
- Fundo escuro/neutro, coerente com o tema operacional atual.
- Bordas discretas.
- Item ativo com destaque discreto, preferencialmente dourado suave ou borda/acento sutil.
- Hover com fundo suave.
- Icones simples ao lado dos textos.

Agrupamento de modulos atual:

- Painel Geral.
- Produtos: Consultar estoque, Cadastrar peca.
- Vendas: Registrar venda, Historico de vendas.
- Estoque: Entradas/Lotes, Giro de estoque, Alertas.
- Origens: Cadastrar origem, Origens cadastradas.
- Custos: Custo de peca, Tipos de custo.
- Analises: Analise por produto, Analise por periodo, Analise de custos.
- Sistema: Mapa mental e documentacao quando houver link.

Estrutura hierarquica:

- Modulo principal sempre visivel.
- Subitens quando houver telas relacionadas.
- Evitar menus profundos demais.

## Header/topbar

O header deve conter:

- Titulo ou contexto da pagina.
- Breadcrumbs quando a tela for secundaria.
- Busca global ou busca da tela.
- Acoes rapidas.
- Area do usuario.

Acoes rapidas recomendadas:

- Nova origem.
- Nova peca.
- Nova venda.
- Lancar custo.

Regras:

- Nao sobrecarregar o topo com muitos botoes.
- A acao principal da tela deve ser clara.
- Breadcrumbs ajudam em detalhes e telas secundarias.

## Cards

Uso correto:

- Resumos.
- Indicadores.
- Agrupamentos de detalhes.
- Blocos de formulario.
- Alertas ou informacoes de apoio.

Padrao visual:

- Fundo escuro/neutro nas telas atuais.
- Borda discreta.
- Raio pequeno: `6px` a `8px`.
- Sombra leve ou nenhuma.
- Titulo curto.
- Conteudo objetivo.
- Padding consistente.

Quando evitar cards:

- Listagens grandes.
- Tabelas completas.
- Cada pequena informacao isolada.
- Cards dentro de cards.
- Telas operacionais que precisam ser rapidas e densas.

### Lista operacional de produto oficial

A pagina Produtos nao usa mais cards grandes como padrao principal. O padrao oficial e lista operacional compacta, feita para consulta rapida de estoque e acao diaria.

Cada linha deve exibir:

- Imagem pequena ou placeholder.
- SKU.
- Nome da peca.
- Preco de venda.
- Quantidade disponivel.
- Status operacional.
- Acoes principais visiveis: `Detalhes` e `Vender`.
- Menu de tres pontos para acoes secundarias: `Lancar custo`, `Ver origem` e `Trocar imagem`, quando existir.

Editar dados deve ficar dentro da tela de detalhes do produto, para evitar duplicidade entre `Detalhes` e `Editar` na listagem.

Nao exibir na lista:

- Lucro.
- Custo da peca.
- Margem.
- Resultado financeiro.

Analise financeira pesada pertence as telas de analise. Detalhes mostram apenas o contexto da entidade, e o painel mostra resumo operacional.

Regras visuais:

- Busca principal sempre visivel.
- Seletor de quantidade por pagina ao lado da busca.
- Filtros em painel lateral.
- Linhas horizontais compactas no desktop.
- Blocos compactos empilhados no mobile.
- Badges suaves; `Estoque baixo` e `Sem estoque` devem chamar mais atencao que `Em estoque`.
- Dourado apenas como detalhe discreto, principalmente em SKU e pequenos acentos.

### Cadastro operacional de peca

`cadastro-peca.html` e a tela para cadastrar uma peca vinculada a uma origem. Toda peca cadastrada deve gerar uma entrada de estoque. O fluxo correto e: origem selecionada -> dados da peca -> entrada de estoque -> imagem/observacoes -> salvar e continuar cadastrando.

Estrutura visual:

- Cabecalho `Cadastro de peca`.
- Etapa 1: Origem vinculada.
- Etapa 2: Dados da peca.
- Etapa 3: Entrada de estoque.
- Etapa 4: Imagem.
- Resumo antes de salvar.
- Acoes finais.

Origem vinculada:

- Origem e obrigatoria.
- A origem deve permanecer selecionada apos salvar.
- O resumo da origem mostra valor pago, valor distribuido, valor nao distribuido, pecas vinculadas e situacao da distribuicao.

Dados da peca:

- Nome da peca.
- SKU / codigo da peca.
- Preco de venda, quando existir no fluxo.
- Status inicial, quando existir.
- Observacao curta.

Entrada de estoque:

- Obrigatoria para saldo e custo.
- Quantidade.
- Custo unitario.
- Valor atribuido calculado automaticamente: quantidade x custo_unitario.
- Data da entrada usando data local.
- Observacao da entrada.

Imagem:

- Imagem e operacional/comercial.
- Deve ajudar na conferencia interna e futura apresentacao comercial.

Comportamento:

- Nao redirecionar automaticamente apos salvar.
- Manter origem selecionada.
- Limpar somente campos da peca, entrada e imagem.
- Permitir cadastro em sequencia de varias pecas da mesma origem.

Acoes:

- `Salvar peca`.
- `Salvar e cadastrar outra da mesma origem`.
- `Limpar campos da peca`.
- `Voltar para produtos`.

Regras:

- Origem nao e peca; peca nasce depois da origem.
- Entrada de estoque e obrigatoria.
- Custo da venda continua vindo do consumo de estoque.
- Nao criar calculo financeiro paralelo nessa tela.
- Analises financeiras pesadas ficam nas telas de Analises.

### Listagem operacional de origens

`listar-origens.html` e a tela real de Origens cadastradas. Ela e uma listagem operacional de origens/lotes, nao uma analise financeira pesada.

Estrutura visual:

- Cabecalho `Origens cadastradas`.
- Botao `Nova origem`.
- Busca por codigo, descricao ou tipo.
- Seletor `Mostrar`.
- Botao `Filtros`.
- Filtros laterais.
- Cards de resumo simples.
- Lista compacta sem rolagem horizontal.

Cards de resumo:

- Total de origens.
- Origens pendentes.
- Valor total comprado.
- Valor nao distribuido.

Linha da lista:

- Codigo da origem.
- Tipo.
- Descricao curta.
- Data da compra.
- Valor pago.
- Valor distribuido.
- Valor nao distribuido.
- Pecas vinculadas.
- Situacao da distribuicao.
- Acao `Ver detalhes`.

Situacao da distribuicao:

- Falta distribuir.
- Distribuida.
- Acima do previsto.
- Sem valor pago.

Linguagem:

- Usar `Valor distribuido`.
- Usar `Valor nao distribuido`.
- Usar `Situacao da distribuicao`.
- Evitar termos tecnicos internos desnecessarios.

Regras:

- Origens cadastradas e listagem operacional.
- Detalhes da origem e a central completa da origem/lote.
- Analises financeiras mais profundas ficam nas telas de analise.
- Origem nao e peca; origem e agrupador operacional e financeiro.
- Peca nasce depois da origem.
- Entrada de estoque continua obrigatoria.

### Cadastro operacional de origem

`cadastro-origem.html` e a tela para cadastrar lote, compra avulsa, carro de desmonte, retorno ou outra origem. Ela deve deixar claro que origem vem antes da peca, funciona como agrupador operacional e financeiro e nao e peca.

Estrutura visual:

- Cabecalho `Cadastro de origem`.
- Etapa 1: Identificacao da origem.
- Etapa 2: Valores e distribuicao.
- Etapa 3: Observacoes.
- Resumo antes de salvar.
- Acoes finais.

Campos principais:

- Tipo da origem.
- Codigo da origem.
- Descricao/nome da origem.
- Data da compra/entrada.
- Valor pago.
- Quantidade prevista de pecas, quando existir.
- Observacoes internas.

Padroes:

- O bloco de valores deve avisar que o valor sera distribuido depois nas pecas/entradas vinculadas.
- O resumo antes de salvar mostra tipo, descricao, valor pago, data e status inicial.
- Status inicial pode ser `Aguardando distribuicao`, `Pronta para vincular pecas` ou `Sem valor pago` somente quando o valor for R$ 0,00.
- Acoes: `Salvar origem`, `Limpar`, `Salvar e cadastrar peca vinculada` e `Voltar para origens`.
- Nao criar peca dentro da origem.
- A peca nasce depois da origem.
- Entrada de estoque continua obrigatoria apos cadastro da peca.
- Analises financeiras pesadas ficam nas telas de analise.

### Central operacional da origem/lote

`detalhes-origem.html` funciona como central operacional da origem/lote. A tela mostra dados da origem, distribuicao, pecas vinculadas, entradas de estoque, vendas relacionadas e resumo da origem.

Estrutura visual:

- Cabecalho com acoes principais.
- Bloco principal da origem.
- Dados da origem.
- Distribuicao da origem.
- Pecas vinculadas.
- Entradas de estoque.
- Vendas relacionadas.
- Resumo da origem.

Acoes principais:

- `Editar origem`.
- `Voltar para origens`.
- `Cadastrar peca vinculada`.
- `Ver produto`.
- `Ver detalhes da venda`.

Padroes da tela:

- Distribuicao mostra valor total, valor distribuido, valor restante, quantidade prevista quando existir, quantidade distribuida e situacao da distribuicao.
- Pecas vinculadas usam lista compacta sem barra horizontal, com SKU, nome da peca, quantidade, disponivel e acao `Ver produto`.
- Entradas mostram peca, data, quantidade total, consumida, saldo, custo unitario e valor atribuido.
- Vendas relacionadas mostram data, SKU, peca, quantidade, canal, valor vendido e acao `Ver detalhes da venda`.
- Resumo da origem usa linguagem simples: receita relacionada, custo das pecas vendidas, custos vinculados e resultado resumido.
- Se nao houver custo calculado, mostrar "Custo nao calculado".
- Nao destacar termos tecnicos internos.

Regras:

- Origem continua sendo agrupador operacional e financeiro.
- Origem nao e peca; peca nasce depois da origem.
- Entrada de estoque continua obrigatoria.
- Detalhes da origem nao deve virar analise financeira pesada.
- Analises financeiras pesadas continuam nas telas de Analises.

### Central operacional/comercial da peca

`detalhes-produto.html` e a central da peca. Ela deve reunir informacoes operacionais e comerciais do item sem virar uma analise financeira pesada.

Estrutura visual:

- Cabecalho com acoes principais.
- Bloco principal da peca com imagem, SKU, nome, preco de venda, quantidade disponivel, total vendido, status e observacao curta.
- Origem vinculada com codigo/nome, tipo, descricao e botao `Ver origem`.
- Resumo operacional.
- Entradas de estoque.
- Custos da peca.
- Vendas relacionadas.
- Area futura de marketplace.

Acoes principais:

- `Vender`.
- `Lancar custo`.
- `Editar dados`.
- `Trocar imagem`.
- `Voltar ao estoque`.

Resumo operacional:

- Pode mostrar estoque atual, total vendido, preco de venda, receita relacionada e custo consumido/custo da peca.
- Usar linguagem simples para custo.
- Evitar destaque exagerado para lucro e margem; analise financeira pesada fica nas telas de Analises.

Marketplace futuro:

- Pode reservar bloco visual para titulo do anuncio, preco marketplace, status do anuncio e link do anuncio.
- Deve aparecer como area em desenvolvimento.
- Nao conectar ao banco e nao integrar Mercado Livre ate a funcionalidade ser planejada.

Regras:

- Produtos continua como tela operacional de lista.
- Detalhes do produto e a central da peca.
- FIFO continua interno como regra tecnica.
- `financeiro-utils.js` continua sendo a fonte oficial quando houver calculo financeiro.

### Tela operacional de custo de peca

`cadastro-custo.html` segue fluxo vertical para evitar layout apertado:

1. Buscar peca.
2. Dados da peca selecionada.
3. Novo custo.
4. Historico de custos cadastrados.

Padroes:

- Blocos verticais bem separados.
- Formulario compacto, com campos alinhados em duas colunas quando houver espaco.
- Historico abaixo do formulario.
- Lista compacta sem barra horizontal.
- Cada custo mostra data, tipo, valor, observacao e acoes.
- Acoes por item: `Editar` e `Excluir`.
- Exclusao deve pedir confirmacao antes de remover do Supabase.
- Dourado apenas como destaque discreto.
- Evitar layout dividido em duas colunas quando apertar o conteudo.

Custo de peca pode exibir valores de custo lancados. Isso e diferente de Produtos, que continua sem exibir custo, lucro, margem ou resultado financeiro.

### Tela administrativa de tipos de custo

`tipos-custo.html` e uma tela administrativa para cadastrar, editar, ativar e inativar tipos de custo. Ela nao e tela de analise financeira.

Padrao visual:

- Busca no topo.
- Seletor `Mostrar`.
- Botao `Filtros`.
- Formulario Novo/editar tipo.
- Painel de uso recomendado.
- Lista compacta de tipos cadastrados.
- Acoes `Editar`, `Inativar` e `Ativar`.

Categorias:

- Peca.
- Venda.
- Ambos.

Status:

- Ativo.
- Inativo.

Regras:

- Custos de peca usam tipos Peca ou Ambos.
- Custos da venda usam tipos Venda ou Ambos.
- Analise de custos depende dos tipos padronizados para agrupar corretamente.
- Impedir duplicidade por maiusculas/minusculas e espacos extras.
- Tratar `Limpeza`, `limpeza` e `LIMPEZA` como o mesmo tipo.
- Normalizar o nome para comparacao antes de salvar.
- Preferir inativar tipos antigos em vez de apagar.
- Nao alterar calculos financeiros nessa tela.

### Tela operacional de cadastro de venda

`cadastro-venda.html` segue fluxo operacional em blocos para registrar venda com rapidez e seguranca:

1. Produto vendido.
2. Dados da venda.
3. Custos da venda.
4. Resumo antes de salvar.

Padroes:

- Produto vendido deve manter a busca no topo e, apos selecao, mostrar SKU, nome da peca, preco de venda, estoque disponivel e alerta de estoque baixo/sem estoque quando aplicavel.
- Custos da venda sao opcionais e nao devem impedir salvar uma venda sem custo adicional.
- Custos adicionados/removidos antes de salvar aparecem em lista compacta.
- Resumo antes de salvar mostra quantidade vendida, receita prevista e custos da venda.
- O resumo deve exibir o aviso: o custo da peca sera calculado automaticamente ao salvar.
- Ao limpar o formulario, peca, campos, custos e resumo devem voltar ao estado vazio/zero.
- Dourado deve aparecer apenas como destaque discreto.
- A tela nao deve exibir lucro, margem ou analise financeira pesada.

Regras de negocio preservadas:

- Venda deve respeitar estoque disponivel.
- FIFO nao deve ser alterado manualmente pela interface.
- O custo real da venda vem de `venda_consumos_estoque`.
- `financeiro-utils.js` continua sendo a fonte oficial de calculos financeiros.
- FIFO continua sendo a regra tecnica interna de custo.
- Na interface, usar linguagem simples para o usuario: "custo da peca", "custo consumido" e "entrada consumida".

### Tela de detalhes da venda

`detalhes-venda.html` deve funcionar como extrato completo da venda, sem parecer uma analise geral do sistema.

Estrutura visual:

- Resumo rapido no topo.
- Produto vendido.
- Dados da venda.
- Custos da venda.
- Entrada consumida.
- Resultado da venda.
- Ajustes permitidos.

Linguagem de interface:

- Evitar destacar o termo FIFO para o usuario final.
- Usar "Custo da peca".
- Usar "Custo consumido".
- Usar "Entrada consumida".
- Usar "Custo calculado".
- Usar "Custo nao calculado".

Regra tecnica:

- FIFO continua sendo a regra interna oficial de custo.
- O custo real da venda continua vindo de `venda_consumos_estoque`.
- Nao usar custo medio.
- Nao usar `origem.valor_total` como custo da venda.
- Se nao houver consumo registrado, mostrar "Custo nao calculado".

Ajustes permitidos:

- Data, canal e observacao podem ser editados se essa for a regra atual.
- Quantidade vendida e custo consumido ficam protegidos no extrato.

## Tabelas

Padrao:

- Cabecalho com fundo levemente diferente.
- Linhas compactas.
- Separadores discretos.
- Hover suave na linha.
- Acoes alinhadas a direita.
- Valores monetarios alinhados a direita.
- Datas e status bem visiveis.

Filtros:

- Busca principal sempre visivel.
- Botao "Filtros" ao lado da busca.
- Painel lateral direito para filtros avancados.
- Devem ser discretos e compactos.
- Devem permitir limpar filtros rapidamente.
- Devem ter botoes "Limpar filtros" e "Aplicar/Fechar".

Paginacao:

- Usar quando a lista crescer.
- Mostrar quantidade de registros.
- Evitar carregar informacao demais em uma tela.

Responsividade:

- Priorizar colunas essenciais.
- Ocultar colunas secundarias em telas pequenas.
- Permitir rolagem horizontal quando necessario.

## Botoes

### Primario

Uso:

- Acao principal da tela.
- Salvar.
- Registrar venda.
- Criar novo item.

Visual:

- Fundo azul principal.
- Texto branco.
- Hover com azul mais escuro.

### Secundario

Uso:

- Voltar.
- Ver detalhes.
- Abrir historico.
- Acoes de apoio.

Visual:

- Fundo branco ou neutro.
- Borda discreta.
- Texto escuro ou azul.

### Perigo

Uso:

- Excluir.
- Desativar.
- Acoes irreversiveis.

Visual:

- Vermelho.
- Deve ser usado com moderacao.

### Ghost

Uso:

- Acoes discretas.
- Icones.
- Links internos.

Visual:

- Sem fundo forte.
- Hover suave.

Tamanhos:

- Pequeno: tabelas e acoes por linha.
- Medio: formularios e topo.
- Grande: evitar, usar apenas quando houver necessidade real.

Estados:

- Hover: mudanca suave de fundo ou borda.
- Disabled: baixa opacidade e sem interacao.
- Loading: bloquear clique repetido.

## Badges

Badges devem indicar status de forma rapida.

Padroes:

| Status | Cor |
| --- | --- |
| Em estoque | Verde |
| Vendido | Cinza ou azul discreto |
| Sem estoque | Vermelho |
| Estoque baixo | Amarelo |
| Alerta | Amarelo ou vermelho conforme gravidade |
| Sucesso | Verde |
| Custo calculado | Verde |
| Custo pendente | Amarelo |
| Custo nao calculado | Cinza ou vermelho discreto |

Regras:

- Texto curto.
- Cor consistente.
- Nao usar badge para textos longos.
- Nao depender apenas da cor quando o texto puder esclarecer.
- Badges auxiliares, como "Obrigatorio", devem ser menores e menos brilhantes que badges de status operacional.
- Badges nao devem chamar mais atencao que o campo ou acao principal do bloco.

## Formularios

Padrao:

- Labels acima dos campos.
- Campos com altura consistente.
- Borda clara.
- Foco com borda azul.
- Selects com mesma altura dos inputs.
- Agrupamento por blocos logicos.
- Em formularios operacionais, usar blocos compactos por etapa: origem/lote, entidade, entrada operacional, fotos/anexos e observacoes.
- Campos calculados devem parecer leitura automatica, com `readonly`, fundo levemente diferente e dica curta como "Calculado automaticamente.".
- Evitar legendas repetitivas dentro dos blocos quando o titulo e o label ja explicam a funcao.

Largura:

- Campos curtos para datas, quantidades e valores.
- Campos longos para descricao e observacoes.
- Evitar inputs muito largos quando o dado e pequeno.

Validacao:

- Mensagem clara.
- Indicar campo com problema.
- Manter dados preenchidos quando houver erro.

Botoes de acao:

- Acao principal no final do formulario.
- Cancelar/voltar como secundaria.
- Evitar multiplas acoes principais no mesmo bloco.

## Modais

Uso correto:

- Confirmacoes simples.
- Edicoes pequenas.
- Acoes rapidas.
- Escolhas curtas.

Quando usar pagina:

- Cadastro longo.
- Fluxo com muitas etapas.
- Informacao financeira detalhada.
- Detalhes completos de origem, peca ou venda.

Padrao visual:

- Overlay discreto.
- Modal centralizado.
- Largura pequena ou media.
- Titulo claro.
- Acoes no rodape.
- Botao principal e botao secundario.

## Paineis expansíveis

Uso:

- Historicos.
- Custos detalhados.
- Observacoes.
- Dados tecnicos.
- Informacoes secundarias.

Padrao visual:

- Cabecalho clicavel.
- Icone de abrir/fechar.
- Borda discreta.
- Animacao curta e suave.
- Conteudo com padding consistente.

Regras:

- Nao esconder informacao essencial para concluir uma tarefa.
- Usar para reduzir excesso visual em detalhes e analises.

## Feedback visual

### Loading

- Mostrar carregamento em tabelas, botoes e areas de dados.
- Evitar tela vazia sem explicacao.

### Erro

- Mensagem clara.
- Informar o que falhou.
- Quando possivel, indicar proximo passo.

### Sucesso

- Confirmar a acao realizada.
- Evitar mensagens longas.

### Alertas

- Usar amarelo para atencao.
- Usar vermelho para risco ou bloqueio.
- Alertas devem ser objetivos.

### Estados vazios

- Explicar que nao ha dados.
- Indicar a acao recomendada.
- Evitar tabelas vazias sem mensagem.
- Em detalhes da peca, usar mensagens claras como "Nenhum custo cadastrado" e "Nenhuma venda registrada".
- Em detalhes da peca, manter linguagem simples para custo e evitar transformar o resumo operacional em analise financeira pesada.
- Em detalhes da venda, quando nao houver custo consumido, indicar que o custo nao esta calculado.

## Pendencias de UX registradas

- `detalhes-produto` deve seguir o padrao de central operacional/comercial da peca, com origem, estoque, custos, vendas relacionadas, resumo operacional e marketplace futuro apenas visual.
- `detalhes-venda` deve funcionar como extrato completo da venda, com dados da venda, custos, entrada consumida, custo da peca, lucro e margem.
- Custo de peca foi ajustado para editar/excluir, mas precisa continuar sendo validado.
- Acesso a detalhes deve vir do contexto correto da entidade, nao de cards soltos no menu.

## Modulos futuros que precisarao seguir o design system

- Marketplace/anuncios.
- Geracao de anuncio com IA.
- Painel operacional de anuncios.
- SKU automatico por categoria.
- Multiempresa.
- Usuarios e permissoes.

## Responsividade

### Desktop

- Sidebar aberta.
- Tabelas completas.
- Filtros visiveis.
- Melhor experiencia operacional.

### Notebook

- Sidebar pode ser mais compacta.
- Tabelas com colunas essenciais.
- Cards em grid reduzido.

### Tablet

- Sidebar recolhida ou menu.
- Filtros em painel.
- Acoes principais mais evidentes.

### Mobile

- Prioridade para consulta e acoes essenciais.
- Tabelas podem virar lista compacta ou usar rolagem horizontal.
- Evitar fluxos longos quando possivel.

Prioridade operacional:

- Cadastro, venda e consulta devem continuar usaveis antes de qualquer sofisticacao visual.

## Regras importantes

- Operacional deve ser rapido.
- Detalhes concentram contexto completo.
- Analises ficam separadas das telas operacionais.
- Telas operacionais nao devem receber analise financeira pesada.
- FIFO continua sendo a fonte oficial de custo real.
- `financeiro-utils.js` continua sendo a fonte oficial de calculos financeiros.
- Evitar excesso de informacao visual.
- Evitar componentes duplicados.
- Nao criar estilos isolados para casos que podem ser padronizados.
- Nao transformar toda informacao em card.
- Nao misturar configuracao, operacao e analise na mesma tela.

## Proximas etapas

### Criacao do CSS global

- Criar variaveis de cor, fonte, borda, sombra e espacamento.
- Padronizar layout, botoes, cards, tabelas, formularios e badges.

### Criacao de componentes reutilizaveis

- Definir blocos reutilizaveis em HTML/CSS/JS simples.
- Evitar framework nesta etapa.
- Reaproveitar padroes nas telas existentes.

### Redesign gradual das telas

- Comecar por `produtos.html`, `cadastro-venda.html`, `historico-vendas.html` e `painel.html`.
- Depois aplicar em detalhes de origem, peca e venda.
- Por fim revisar analises e configuracoes.

### Padronizacao visual completa

- Revisar duplicidades.
- Remover estilos antigos quando houver substituto global.
- Garantir consistencia entre modulos.
- Documentar decisoes novas conforme o sistema evoluir.
