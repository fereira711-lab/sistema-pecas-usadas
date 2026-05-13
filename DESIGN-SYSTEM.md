# Design System do ERP de Pecas Usadas

## Objetivo do design system

O design system tem como objetivo padronizar o visual e a experiencia do ERP de pecas usadas.

Ele deve:

- Reduzir inconsistencias entre telas.
- Facilitar o crescimento do sistema.
- Criar uma aparencia profissional no estilo ERP/SaaS.
- Manter o foco em operacao rapida, leitura clara e produtividade.
- Servir como base antes da criacao de CSS global ou componentes reutilizaveis.
- Servir junto com `preview.html` como laboratorio visual antes de mudancas definitivas.

## Momento atual do design

O sistema esta em fase de revisao visual. O design deve ser estudado antes de ser aplicado no sistema inteiro.

Decisoes atuais:

- Nao fazer redesign geral de uma vez.
- Trabalhar pagina por pagina.
- Validar primeiro em `preview.html` ou em uma tela controlada.
- Manter o padrao visual atual enquanto a nova direcao e estudada.
- Evitar mudancas que alterem regra de negocio, FIFO ou calculos financeiros.
- Registrar decisoes novas antes de espalhar padroes para outras telas.

## Organizacao funcional atual

- Produtos e a tela operacional principal para estoque/produtos.
- Detalhes sao centrais da entidade: origem, peca e venda.
- Analises sao a area financeira do sistema.
- FIFO real e a fonte oficial de custo.
- `financeiro-utils.js` e a fonte oficial de calculos financeiros.

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

Sugestao inicial para padronizacao:

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

- Azul deve ser usado para acao principal e navegacao ativa.
- Verde deve indicar sucesso ou situacao positiva.
- Vermelho deve indicar erro, risco ou acao destrutiva.
- Amarelo deve indicar aviso, atencao ou pendencia.
- Cores fortes devem aparecer em pontos especificos, nao dominar a tela.

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
- Fundo neutro ou branco.
- Bordas discretas.
- Item ativo com destaque azul.
- Hover com fundo suave.
- Icones simples ao lado dos textos.

Agrupamento de modulos:

- Dashboard
- Origens
- Produtos
- Estoque
- Vendas
- Financeiro
- Configuracoes

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

- Fundo branco.
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

- Devem ficar acima da tabela.
- Devem ser discretos e compactos.
- Devem permitir limpar filtros rapidamente.

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

## Formularios

Padrao:

- Labels acima dos campos.
- Campos com altura consistente.
- Borda clara.
- Foco com borda azul.
- Selects com mesma altura dos inputs.
- Agrupamento por blocos logicos.

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
