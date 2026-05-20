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

## Painel Geral

`painel.html` e a entrada oficial do sistema apos login. A tela funciona como visao inicial operacional, nao como menu principal em cards e nao como analise financeira pesada.

Estrutura UX:

- Cabecalho `Painel Geral`.
- Cards de resumo operacional.
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

Regras de navegacao e linguagem:

- Sidebar continua sendo a navegacao principal.
- Atalhos do painel sao apoio para rotina, nao menu completo duplicado.
- `index.html` continua como entrada tecnica/redirecionamento.
- `dashboard.html` continua como legado/redirecionamento, se existir.
- Usar `Painel Geral` como nome padrao.
- Evitar voltar a usar `Dashboard` na interface principal.
- Painel deve mostrar rotina e atencao operacional.
- Lucro/margem pesada ficam nas telas de analise.

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

- `detalhes-produto` foi definido como central operacional/comercial da peca, com dados principais, origem, estoque, custos, vendas relacionadas e resumo operacional.
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

### Origens cadastradas

`listar-origens.html` e a tela real de Origens cadastradas. Ela funciona como listagem operacional de origens/lotes para localizar rapidamente lotes, compras avulsas e outras origens.

Regras:

- Nao virar analise financeira pesada.
- Usar cabecalho `Origens cadastradas`.
- Manter botao `Nova origem`.
- Ter busca por codigo, descricao ou tipo.
- Usar seletor `Mostrar`.
- Usar botao `Filtros`.
- Usar filtros laterais.
- Usar cards de resumo simples.
- Usar lista compacta de origens sem rolagem horizontal.

Cards de resumo:

- Total de origens.
- Origens pendentes.
- Valor total comprado.
- Valor nao distribuido.

Lista de origens:

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

Relacao com Detalhes da origem:

- Origens cadastradas e listagem operacional.
- Detalhes da origem e a central completa da origem/lote.
- Analises financeiras mais profundas ficam nas telas de analise.
- Origem nao e peca.
- Origem e agrupador operacional e financeiro.
- Peca nasce depois da origem.
- Entrada de estoque continua obrigatoria.

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

A lista de Produtos pode mostrar preco de venda, mas nao deve mostrar lucro, custo da peca, margem ou resultado financeiro. Essas informacoes pertencem a detalhes, painel ou analises.

### Detalhes do produto

`detalhes-produto.html` funciona como central operacional/comercial da peca. A tela deve permitir entender rapidamente a situacao da peca sem parecer uma analise financeira pesada.

Estrutura UX aprovada:

- Cabecalho com acoes principais.
- Bloco principal da peca.
- Origem vinculada.
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

Conteudo esperado:

- imagem;
- SKU;
- nome da peca;
- preco de venda;
- quantidade disponivel;
- total vendido;
- status;
- observacao curta;
- origem, estoque, custos e vendas relacionadas.

Resumo operacional:

- Pode mostrar estoque atual, total vendido, preco de venda e receita relacionada quando existir.
- Pode mostrar custo consumido/custo da peca com linguagem simples.
- Deve evitar destaque exagerado para lucro e margem. Analise financeira pesada pertence as telas de Analises.

Marketplace futuro:

- Pode reservar area visual para titulo do anuncio, preco marketplace, status do anuncio e link do anuncio.
- Deve aparecer como "em desenvolvimento".
- Nao conectar ao banco e nao integrar Mercado Livre por enquanto.

Regras:

- Produtos continua sendo tela operacional de lista.
- Detalhes do produto e a central da peca.
- FIFO continua sendo regra tecnica interna.
- A interface deve usar linguagem simples para custo.

### Custo de peca

A tela `cadastro-custo.html` e operacional. Ela pode mostrar valores de custo lancados, porque sua funcao e registrar, editar e excluir custos vinculados a uma peca.

Fluxo UX aprovado:

- Buscar peca.
- Dados da peca selecionada.
- Novo custo.
- Historico de custos cadastrados.

Regras:

- Usar fluxo vertical, evitando duas colunas grandes quando isso apertar o conteudo.
- Manter formulario compacto e com campos alinhados.
- Historico sempre abaixo do formulario.
- Historico em lista compacta sem barra horizontal.
- Custos ordenados do mais recente para o mais antigo.
- Cada item mostra data, tipo, valor, observacao curta, `Editar` e `Excluir`.
- Exclusao exige confirmacao visual antes de remover do Supabase.
- Nao transformar a tela em analise financeira pesada.

### Cadastro de venda

A tela `cadastro-venda.html` e operacional. Ela deve registrar venda, custos opcionais da venda e baixa de estoque via FIFO, sem virar tela de analise financeira pesada.

Fluxo UX aprovado:

- Produto vendido.
- Dados da venda.
- Custos da venda.
- Resumo antes de salvar.

No bloco Produto vendido, depois da selecao da peca, mostrar contexto suficiente para vender com seguranca:

- SKU.
- Nome da peca.
- Preco de venda.
- Estoque disponivel.
- Alerta de estoque baixo ou sem estoque quando aplicavel.

Custos da venda sao opcionais. Eles podem ser adicionados/removidos antes de salvar, devem aparecer em lista compacta e nao podem bloquear uma venda sem custo adicional.

O resumo antes de salvar mostra quantidade vendida, receita prevista e custos da venda. Tambem deve exibir o aviso de que o custo da peca sera calculado automaticamente ao salvar. Ao limpar o formulario, o resumo deve zerar corretamente.

Regras:

- Venda deve respeitar estoque disponivel.
- Nao alterar FIFO manualmente.
- O custo real da venda vem de `venda_consumos_estoque`.
- `financeiro-utils.js` continua sendo a fonte oficial de calculo financeiro.
- FIFO continua sendo a regra tecnica interna de custo.
- Na interface para o usuario final, preferir termos simples: "custo da peca", "custo consumido" e "entrada consumida".

### Telas de detalhes

Telas que concentram o contexto completo de uma entidade.

Regras:

- Mostrar dados principais no topo.
- Separar informacoes em secoes claras.
- Concentrar historico, custos, vendas, origem, estoque e resultado.
- Permitir leitura completa sem misturar com fluxos de cadastro.

Exemplos: detalhes da origem, central da peca e detalhes da venda.

### Detalhes da origem

`detalhes-origem.html` funciona como central operacional da origem/lote. A tela deve permitir entender rapidamente a origem, sua distribuicao, pecas vinculadas, entradas de estoque, vendas relacionadas e resumo da origem, sem virar analise financeira pesada.

Estrutura UX aprovada:

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

Distribuicao da origem:

- Mostrar valor total, valor distribuido, valor restante, quantidade prevista quando existir, quantidade distribuida e situacao da distribuicao.

Pecas vinculadas:

- Usar lista compacta sem barra horizontal.
- Mostrar SKU, nome da peca, quantidade, disponivel e acao `Ver produto`.

Entradas e vendas:

- Entradas mostram peca, data, quantidade total, consumida, saldo, custo unitario e valor atribuido.
- Vendas relacionadas mostram data, SKU, peca, quantidade, canal, valor vendido e acao `Ver detalhes da venda`.

Resumo da origem:

- Usar linguagem simples.
- Mostrar receita relacionada, custo das pecas vendidas, custos vinculados e resultado resumido.
- Se nao houver custo calculado, mostrar "Custo nao calculado".
- Nao destacar termos tecnicos internos.

Estados vazios:

- Mostrar "Nenhuma peca vinculada" somente quando nao houver pecas.
- Mostrar "Nenhuma entrada registrada" somente quando nao houver entradas.
- Mostrar "Nenhuma venda relacionada" somente quando nao houver vendas.

Regras:

- Origem continua sendo agrupador operacional e financeiro.
- Origem nao e peca.
- Peca nasce depois da origem.
- Entrada de estoque continua obrigatoria.
- Analises financeiras pesadas continuam nas telas de analise.

### Detalhes da venda

`detalhes-venda.html` deve parecer um extrato normal de venda, nao uma tela de analise geral do sistema.

Estrutura UX aprovada:

- Resumo rapido no topo.
- Produto vendido.
- Dados da venda.
- Custos da venda.
- Entrada consumida.
- Resultado da venda.
- Ajustes permitidos.

Conteudo esperado:

- produto vendido;
- data operacional da venda;
- canal;
- observacao;
- custos vinculados a venda;
- entrada consumida;
- custo da peca;
- lucro;
- margem.

Linguagem da interface:

- Evitar destacar o termo FIFO para o usuario final.
- Usar "Custo da peca" no lugar de termos tecnicos de custo.
- Usar "Custo consumido" quando a tela falar do custo protegido no extrato.
- Usar "Entrada consumida" para a origem operacional do custo da peca.
- Usar "Custo calculado" quando houver consumo registrado.
- Usar "Custo nao calculado" quando nao houver consumo registrado.

Regra tecnica preservada:

- FIFO continua sendo a regra interna oficial de custo.
- O custo real da venda continua vindo de `venda_consumos_estoque`.
- Nao usar custo medio.
- Nao usar `origem.valor_total` como custo da venda.
- `financeiro-utils.js` continua sendo a fonte oficial de calculos financeiros.

Ajustes permitidos:

- Data, canal e observacao podem ser editados se essa for a regra atual da tela.
- Quantidade vendida e custo consumido ficam protegidos no extrato.

### Telas de analise

Telas voltadas para tomada de decisao.

Regras:

- Concentrar indicadores, comparativos, totais e resultados financeiros.
- Permitir filtros por periodo, produto, origem, tipo de custo ou status.
- Usar tabelas, resumos e cards pequenos.
- Evitar misturar analise pesada em telas operacionais.

Exemplos: painel geral, analise por produto, analise por periodo, analise de custos, giro de estoque e alertas.

#### Analises financeiras

As telas `analise-produto.html`, `analise-periodo.html` e `analise-custos.html` formam a area financeira do sistema. Elas podem mostrar receita, custo, lucro, margem e totais, mas nao devem ser confundidas com telas operacionais como Produtos, Historico de vendas ou Cadastro.

Padrao UX/UI:

- Busca principal sempre visivel no topo.
- Seletor `Mostrar`.
- Botao `Filtros`.
- Filtros avancados em painel lateral.
- Cards compactos de resumo.
- Listas sem rolagem horizontal.
- Expansoes para detalhes extras.
- Linguagem simples para o usuario.

`analise-produto.html` mostra resultado financeiro agrupado por peca. Deve ter busca por SKU/nome, cards de resumo financeiro, lista por produto, custo da peca, custos da venda, lucro e margem. Se nao houver custo calculado, mostrar `Custo nao calculado` e nao inventar lucro/margem.

`analise-periodo.html` mostra resultado financeiro por intervalo de datas. Deve ter filtros por data, canal e situacao do custo, lista de vendas do periodo e resumo com receita, custo das pecas, custos da venda, lucro, margem e quantidade vendida. Os valores devem bater com Detalhes da venda e Analise por produto.

`analise-custos.html` tem foco em custos operacionais. Deve separar custos da peca e custos da venda, mostrar total de custos, maior tipo, quantidade de lancamentos e lista por tipo de custo. Nao deve mostrar lucro/margem.

Regras financeiras:

- FIFO continua sendo regra tecnica interna.
- A interface deve usar `Custo da peca`, `Custo calculado` e `Custo nao calculado`.
- O custo real da venda vem de `venda_consumos_estoque`.
- `financeiro-utils.js` continua sendo a fonte oficial de calculo.
- Nao usar custo medio.
- Nao usar `origem.valor_total` como custo da venda.

### Telas administrativas

Telas para configuracoes, apoio e manutencao do sistema.

Regras:

- Serem simples, previsiveis e seguras.
- Mostrar impacto das alteracoes quando houver risco.
- Separar configuracoes do fluxo operacional.
- Evitar duplicidade com telas de operacao.

Exemplos: tipos de custo, login e menu inicial.

#### Tipos de custo

`tipos-custo.html` e uma tela administrativa do sistema. Ela serve para cadastrar, editar, ativar e inativar tipos de custo, sem se comportar como analise financeira.

Uso dos tipos:

- Custos da peca.
- Custos da venda.
- Ambos.

Categorias:

- Peca.
- Venda.
- Ambos.

Status:

- Ativo.
- Inativo.

Regras de duplicidade:

- Impedir duplicidade por diferenca de maiusculas/minusculas.
- Impedir duplicidade por espacos extras.
- `Limpeza`, `limpeza` e `LIMPEZA` devem ser tratados como o mesmo tipo.
- O sistema deve normalizar o nome para comparacao.
- Nao criar tipos parecidos que prejudiquem relatorios e analises.

Padrao UX/UI:

- Busca no topo.
- Seletor `Mostrar`.
- Botao `Filtros`.
- Formulario Novo/editar tipo.
- Painel de uso recomendado.
- Lista compacta de tipos cadastrados.
- Acoes `Editar`, `Inativar` e `Ativar`.

Relacao com outras telas:

- Custo de peca usa categorias Peca ou Ambos.
- Cadastro de venda usa categorias Venda ou Ambos.
- Analise de custos depende de tipos padronizados para agrupar corretamente.
- Preferir inativar tipos antigos em vez de apagar.
- Nao alterar calculos financeiros nessa tela.

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
- Para mudancas grandes de tela: criar prototipo visual, avaliar UX/UI, aplicar na tela real, testar e documentar.
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
