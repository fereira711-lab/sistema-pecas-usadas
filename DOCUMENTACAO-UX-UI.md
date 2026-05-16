# Documentacao UX/UI

## Objetivo visual

O objetivo visual e transformar o sistema em um ERP moderno, limpo e profissional, mantendo a simplicidade operacional que o projeto ja possui.

A referencia deve ser de dashboards SaaS/ERP: telas organizadas, leitura rapida, hierarquia clara, tabelas eficientes e componentes consistentes.

O sistema deve evitar telas poluidas, excesso de cards grandes, informacoes repetidas e blocos visuais que dificultem a operacao diaria.

## Estado atual da UX/UI

O sistema entrou em fase de revisao visual. A direcao e melhorar a experiencia com cuidado, estudando o design antes de aplicar mudancas definitivas.

Decisoes de UX atuais:

- Evitar redesign geral de uma vez.
- Trabalhar pagina por pagina.
- Preservar o funcionamento antes de mexer em aparencia.
- Manter `painel.html` como entrada oficial apos login.
- Usar a sidebar como navegacao principal atual do ERP.
- Manter `index.html` como entrada tecnica/redirecionamento, nao como menu inicial de cards.
- Manter `dashboard.html` apenas como legado/redirecionamento para o Painel Geral.
- Manter `produtos.html` como tela operacional principal.
- Usar telas de detalhes como centrais completas da entidade.
- Usar analises como area financeira, sem sobrecarregar as telas operacionais.
- Usar a pasta `previews/` e o design system como laboratorio visual antes de aplicar mudancas no sistema real.
- Nao exibir paginas de detalhes como links diretos no menu; elas devem abrir pelo contexto correto.

## Padrao visual em validacao

O `cadastro-peca.html` passa a ser a primeira tela real usada como referencia do novo padrao visual do sistema. O preview continua sendo laboratorio, mas o cadastro de peca e a base pratica para validar densidade, contraste, blocos e componentes antes de espalhar o estilo para outras telas.

Regras consolidadas nesta fase:

- Fundo escuro operacional para fluxos de trabalho intensivo.
- Conteudo organizado em cards compactos e blocos bem separados.
- Formularios divididos por etapas logicas, sem textos explicativos repetitivos.
- Dourado/amarelo como destaque discreto de identidade, principalmente em aba ativa, titulo pequeno e acentos suaves.
- Dourado nao deve parecer alerta em campos normais.
- Badges devem ser pequenos, suaves e nao competir com campos ou titulos.
- Filtros avancados devem usar painel lateral padronizado quando houver espaco; a busca principal permanece visivel.
- Listagens devem priorizar densidade, leitura rapida e acoes no contexto.
- Campos calculados ou `readonly` devem ter estilo proprio, com fundo levemente diferente, borda discreta e texto destacado.
- Sidebar e a navegacao principal atual; topbar/mega menu pode ser estudado em preview antes de substituir qualquer fluxo real.

## Navegacao atual

- O login direciona para `painel.html`.
- O item principal da sidebar deve aparecer como "Painel Geral" e apontar para `painel.html`.
- `dashboard.html` nao deve ser mantido como segunda versao do painel; ele e legado/redirecionamento.
- `index.html` deve continuar funcionando como entrada tecnica/compatibilidade.
- Detalhes de produto, venda e origem devem ser acessados a partir das listagens ou cards de contexto, nao pelo menu principal.

## Pasta de previews

A pasta `previews/` concentra testes visuais e nao deve ser tratada como fluxo real do sistema.

Ela tambem serve para validar UX/UI antes de alterar telas reais. O preview `produtos-lista-ui-preview` foi usado como laboratorio para aprovar a lista operacional compacta de Produtos.

Ela pode conter:

- preview de cadastro/produto;
- preview de design system;
- preview de mega menu;
- preview de dashboard antigo.

Regras:

- Nao apontar sidebar, login ou menus operacionais para previews.
- Ajustar caminhos relativos ao mover previews.
- Validar visualmente antes de aplicar um padrao em tela real.

## Teste real recente de UX

Foram testadas as areas:

- produtos;
- custo de peca;
- detalhes da peca;
- detalhes da venda;
- origem;
- analises.

Pendencias percebidas:

- `detalhes-produto` precisa comunicar melhor custos, vendas relacionadas, resumo financeiro e estados sem dados.
- `detalhes-venda` precisa se comportar como extrato completo da venda.
- A edicao/exclusao de custo de peca deve continuar sendo validada.
- Links para detalhes devem nascer do contexto da lista ou da entidade relacionada, nao de cards soltos no menu.

## Tipos de tela

### Telas operacionais

Telas usadas para cadastrar, vender, consultar ou executar acoes do dia a dia.

Regras:

- Priorizar velocidade de acao.
- Usar formularios diretos e objetivos.
- Exibir apenas informacoes necessarias para concluir a tarefa.
- Evitar indicadores financeiros detalhados quando nao forem essenciais.
- Manter botoes principais bem visiveis.
- Nao transformar listagens operacionais em analise financeira pesada.

Exemplos: cadastro de origem, cadastro de peca, cadastro de venda, produtos, historico de vendas e entradas de estoque.

### Produtos

A tela de Produtos e operacional e usa lista compacta como padrao principal. Ela deve ajudar Rafael a encontrar uma peca rapidamente, conferir disponibilidade e executar acoes do dia a dia sem entrar em analise financeira pesada.

Cada linha da lista deve mostrar:

- imagem pequena ou placeholder;
- SKU;
- nome da peca;
- preco de venda;
- quantidade disponivel;
- status operacional;
- acoes principais visiveis: `Detalhes` e `Vender`;
- menu de tres pontos para acoes secundarias: `Lancar custo`, `Ver origem` e `Trocar imagem`, quando existir.

O comando de editar dados deve ficar dentro da central/detalhes do produto, acessada pelo botao `Detalhes`.

A lista de Produtos pode mostrar preco de venda, mas nao deve mostrar lucro, custo FIFO, margem ou resultado financeiro. Essas informacoes pertencem a detalhes, painel ou analises.

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

### Lista operacional compacta

Usar em telas de consulta diaria, especialmente Produtos.

Padrao:

- busca principal sempre visivel;
- seletor de quantidade por pagina;
- filtros avancados em painel lateral;
- linhas horizontais compactas no desktop;
- blocos empilhados compactos no celular;
- imagem pequena e bem enquadrada;
- SKU com leitura forte, nome logo abaixo;
- preco e estoque em colunas curtas;
- badges suaves, com `Estoque baixo` e `Sem estoque` mais visiveis que `Em estoque`;
- acoes rapidas sem poluir a interface.

### Filtros discretos

Filtros devem seguir o padrao atual:

- busca principal sempre visivel;
- botao "Filtros" ao lado da busca;
- filtros avancados em painel lateral direito;
- botoes "Limpar filtros" e "Aplicar/Fechar";
- responsividade basica para virar drawer em telas menores.

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
- Em telas operacionais, reduzir legendas e manter apenas texto que ajude na decisao.
- Separar blocos como origem/lote, dados da entidade, entrada/acao operacional, fotos/anexos e observacoes quando isso reduzir ambiguidade.
- Exibir valores calculados como leitura, nao como campo editavel comum.

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

### Laboratorio visual

- Usar `previews/` para testar ideias visuais antes de aplicar em paginas reais.
- Usar `DESIGN-SYSTEM.md` para registrar padroes aprovados.
- Validar uma tela por vez antes de espalhar o mesmo padrao.
- Evitar transformar testes visuais em regra definitiva sem revisar o impacto operacional.

### Padrao de solicitacao ao Codex

- Comando curto.
- Objetivo em 1 frase.
- Arquivos definidos.
- Regras claras.
- Avisar quando nao deve fazer commit.
- Pedir resposta curta quando a tarefa for objetiva.
