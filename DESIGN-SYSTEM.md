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
- Custo FIFO.
- Margem.
- Resultado financeiro.

Essas informacoes pertencem a detalhes, painel ou analises.

Regras visuais:

- Busca principal sempre visivel.
- Seletor de quantidade por pagina ao lado da busca.
- Filtros em painel lateral.
- Linhas horizontais compactas no desktop.
- Blocos compactos empilhados no mobile.
- Badges suaves; `Estoque baixo` e `Sem estoque` devem chamar mais atencao que `Em estoque`.
- Dourado apenas como detalhe discreto, principalmente em SKU e pequenos acentos.

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
- O resumo deve exibir o aviso: o custo real da peca sera calculado pelo FIFO apos salvar.
- Ao limpar o formulario, peca, campos, custos e resumo devem voltar ao estado vazio/zero.
- Dourado deve aparecer apenas como destaque discreto.
- A tela nao deve exibir lucro, margem ou analise financeira pesada.

Regras de negocio preservadas:

- Venda deve respeitar estoque disponivel.
- FIFO nao deve ser alterado manualmente pela interface.
- O custo real da venda vem de `venda_consumos_estoque`.
- `financeiro-utils.js` continua sendo a fonte oficial de calculos financeiros.

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
| FIFO disponivel | Verde |
| FIFO parcial | Amarelo |
| FIFO esgotado | Cinza ou vermelho discreto |

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
- Em detalhes da venda, quando nao houver consumo FIFO, indicar que o custo nao esta calculado.

## Pendencias de UX registradas

- `detalhes-produto` deve exibir melhor custos, vendas relacionadas, resumo financeiro e estados sem dados.
- `detalhes-venda` deve funcionar como extrato completo da venda, com dados da venda, custos, consumo FIFO, lucro e margem.
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
