# Documentacao UX/UI

## Objetivo visual

O objetivo visual e transformar o sistema em um ERP moderno, limpo e profissional, mantendo a simplicidade operacional que o projeto ja possui.

A referencia deve ser de dashboards SaaS/ERP: telas organizadas, leitura rapida, hierarquia clara, tabelas eficientes e componentes consistentes.

O sistema deve evitar telas poluidas, excesso de cards grandes, informacoes repetidas e blocos visuais que dificultem a operacao diaria.

## Tipos de tela

### Telas operacionais

Telas usadas para cadastrar, vender, consultar ou executar acoes do dia a dia.

Regras:

- Priorizar velocidade de acao.
- Usar formularios diretos e objetivos.
- Exibir apenas informacoes necessarias para concluir a tarefa.
- Evitar indicadores financeiros detalhados quando nao forem essenciais.
- Manter botoes principais bem visiveis.

Exemplos: cadastro de origem, cadastro de peca, cadastro de venda, produtos, historico de vendas e entradas de estoque.

### Telas de detalhes

Telas que concentram o contexto completo de uma entidade.

Regras:

- Mostrar dados principais no topo.
- Separar informacoes em secoes claras.
- Concentrar historico, custos, vendas, origem, estoque e resultado.
- Permitir leitura completa sem misturar com fluxos de cadastro.

Exemplos: detalhes da origem, central da peca e detalhes da venda.

### Telas de analise

Telas voltadas para tomada de decisao.

Regras:

- Concentrar indicadores, comparativos, totais e resultados financeiros.
- Permitir filtros por periodo, produto, origem, tipo de custo ou status.
- Usar tabelas, resumos e cards pequenos.
- Evitar misturar analise pesada em telas operacionais.

Exemplos: painel geral, analise por produto, analise por periodo, analise de custos, giro de estoque e alertas.

### Telas administrativas

Telas para configuracoes, apoio e manutencao do sistema.

Regras:

- Serem simples, previsiveis e seguras.
- Mostrar impacto das alteracoes quando houver risco.
- Separar configuracoes do fluxo operacional.
- Evitar duplicidade com telas de operacao.

Exemplos: tipos de custo, login e menu inicial.

## Regras de UX

- Listagens devem ser compactas, rapidas e feitas para escanear.
- Detalhes concentram informacoes completas.
- Financeiro pesado deve ficar em analises e detalhes.
- Telas operacionais priorizam acao rapida e pouca friccao.
- Evitar duplicidade de paginas com o mesmo objetivo.
- Cada tela deve ter um objetivo principal claro.
- Filtros devem ajudar a encontrar dados sem ocupar espaco demais.
- Acoes frequentes devem ficar proximas do contexto onde sao usadas.
- Mensagens de erro e sucesso devem ser claras e indicar o proximo passo.

## Layout base recomendado

### Sidebar lateral

Menu lateral fixo ou recolhivel, organizado por modulos:

- Dashboard
- Origens
- Produtos
- Estoque
- Vendas
- Financeiro
- Configuracoes

A sidebar deve substituir menus muito longos na tela inicial conforme o sistema crescer.

### Topo com busca e acoes rapidas

O topo deve conter:

- Busca global ou busca da tela atual.
- Acoes rapidas como nova venda, nova peca ou nova origem.
- Contexto da tela atual.
- Atalhos discretos para voltar ou abrir detalhes relacionados.

### Conteudo central em cards compactos

O conteudo principal deve usar cards compactos apenas quando eles ajudarem a agrupar informacao.

Evitar:

- Cards grandes sem necessidade.
- Muitos cards empilhados com pouca informacao.
- Repetir o mesmo dado em varias areas da tela.

### Tabelas modernas

Tabelas devem ser o componente principal das listagens.

Padrao recomendado:

- Linhas compactas.
- Cabecalho claro.
- Status visual por badge.
- Acoes no fim da linha.
- Ordenacao e filtros quando fizer sentido.
- Valores monetarios alinhados e formatados.

### Filtros discretos

Filtros devem ficar acima da tabela ou em painel recolhivel.

Usar filtros para:

- Busca por texto.
- Status.
- Periodo.
- Origem.
- Produto.
- Tipo de custo.

## Componentes padrao

### Cards

Usar cards para resumos, agrupamentos e blocos de detalhe.

Regras:

- Tamanho compacto.
- Titulo curto.
- Conteudo objetivo.
- Evitar cards dentro de cards.

### Tabelas

Usar tabelas para listagens operacionais e analiticas.

Regras:

- Colunas essenciais primeiro.
- Acoes padronizadas.
- Status visivel.
- Layout legivel em telas menores.

### Botoes

Padrao recomendado:

- Botao primario para acao principal.
- Botao secundario para navegacao ou apoio.
- Botao de perigo apenas para exclusao ou acao irreversivel.
- Texto curto e direto.

### Badges de status

Usar badges para situacoes como:

- Em estoque.
- Sem estoque.
- Estoque baixo.
- Vendida.
- Lote disponivel.
- Parcialmente consumido.
- Esgotado.

### Filtros

Filtros devem ser consistentes entre telas.

Padrao:

- Campo de busca.
- Select de status.
- Periodo quando houver data.
- Botao limpar filtros.

### Formularios

Formularios devem ser simples e divididos por blocos logicos.

Regras:

- Campos obrigatorios bem definidos.
- Labels claros.
- Mensagens de validacao proximas do campo ou do formulario.
- Botao principal no final do fluxo.

### Paineis expansíveis

Usar paineis expansíveis para informacoes secundarias.

Bons usos:

- Custos detalhados.
- Historico.
- Observacoes.
- Dados tecnicos.
- Informacoes antigas ou de auditoria.

### Acoes rapidas

Acoes rapidas devem reduzir cliques nos fluxos comuns.

Exemplos:

- Nova venda.
- Nova peca.
- Nova origem.
- Lancar custo.
- Ver detalhes.
- Abrir historico.

## Proximas etapas

### Redesenho visual global

- Definir paleta, espacamentos, tipografia e layout base.
- Criar modelo com sidebar, topo e area central.
- Revisar hierarquia visual das telas principais.

### Padronizacao de componentes

- Definir padrao unico para cards, tabelas, botoes, badges, filtros e formularios.
- Criar regras de uso para cada componente.
- Evitar estilos isolados por tela quando o comportamento for comum.

### Aplicacao gradual nas telas

- Comecar pelas telas mais usadas: produtos, cadastro de venda, historico de vendas e painel geral.
- Depois aplicar em detalhes: origem, peca e venda.
- Por fim revisar analises, configuracoes e paginas legadas.
