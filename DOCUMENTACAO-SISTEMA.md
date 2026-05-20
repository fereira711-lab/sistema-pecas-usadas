# Documentacao do Sistema

## Visao geral

O sistema e um ERP web simples para gestao de pecas usadas, estoque, origens, custos, vendas e resultado financeiro. Ele foi construido com HTML, CSS, JavaScript e Supabase, com foco em clareza operacional e evolucao gradual.

O contexto do negocio e venda de pecas usadas/seminovas. Por isso, o sistema precisa preservar procedencia, custo real, entrada de estoque, venda, consumo FIFO e lucro.

Fluxo principal:

```text
origem -> peca -> entrada -> venda -> FIFO -> analise
```

A origem registra a procedencia ou compra. A peca representa o item comercial. A entrada formaliza o lote no estoque. A venda consome o estoque. O FIFO define o custo oficial vendido. As analises usam esses dados para mostrar resultado, lucro, margem, giro e custos.

## Estado atual do sistema

O sistema esta organizado em uma cadeia principal:

```text
origem -> peca -> entrada -> venda -> FIFO -> analise
```

Decisoes atuais:

- FIFO real e a fonte oficial de custo das vendas. O custo vendido deve vir de `venda_consumos_estoque`.
- `financeiro-utils.js` e a fonte oficial de calculos financeiros. Telas devem reutilizar essa camada para receita, custo consumido, custos, lucro e margem.
- `painel.html` e a entrada oficial do sistema apos login.
- `index.html` fica como entrada tecnica/compatibilidade e redireciona para `painel.html` quando a sessao esta valida.
- `dashboard.html` e legado e deve redirecionar para `painel.html`, evitando duplicidade entre Dashboard e Painel Geral.
- A sidebar e a navegacao principal atual do sistema.
- `paginas/produtos.html` e a tela operacional principal para estoque/produtos.
- Telas de detalhes funcionam como central da entidade: origem, peca e venda.
- Telas de analise formam a area financeira, separada do fluxo operacional diario.
- O acesso a telas de detalhes deve partir do contexto correto, como lista de produtos, historico de vendas, origem ou tabelas relacionadas, e nao de cards soltos no menu.

## Estrutura atual de pastas

| Pasta | Papel |
| --- | --- |
| `css/` | Estilos globais do sistema, mapa mental e padroes visuais. |
| `docs/` | Documentos auxiliares, mapa mental e relatorios tecnicos. |
| `js/` | Scripts funcionais por tela e servicos compartilhados. |
| `paginas/` | Telas internas do ERP. |
| `previews/` | Prototipos visuais e testes de layout. Nao faz parte do fluxo real. |
| `sql/` | Scripts de banco, estrutura FIFO, RPCs e tabelas auxiliares. |

## Entrada e navegacao

- Login e entrada tecnica devem direcionar o usuario para `painel.html`.
- `painel.html` e o Painel Geral oficial e concentra resumo operacional, alertas, ultimas vendas e atalhos.
- `index.html` nao deve voltar a ser menu de cards; ele existe para compatibilidade e redirecionamento.
- `dashboard.html` permanece apenas como legado/redirecionamento para `painel.html`.
- A sidebar e a navegacao principal do sistema e deve refletir a arquitetura atual.
- A sidebar organiza os modulos oficiais: Painel Geral, Produtos, Vendas, Estoque, Origens, Custos, Analises e Sistema.
- `previews/` nao deve aparecer na navegacao real.
- Paginas de detalhes nao devem aparecer como link direto no menu. Elas devem abrir pelo contexto correto:
  - Produto -> Ver detalhes;
  - Historico de vendas -> Ver detalhes da venda;
  - Origens cadastradas -> Ver detalhes da origem.

Links oficiais por grupo:

| Grupo | Links |
| --- | --- |
| Painel Geral | Painel Geral |
| Produtos | Produtos; Cadastro de peca |
| Vendas | Cadastro de venda; Historico de vendas |
| Estoque | Entradas de estoque; Giro de estoque, se existir; Alertas, se existir |
| Origens | Cadastro de origem; Origens cadastradas |
| Custos | Custo de peca; Tipos de custo |
| Analises | Analise por produto; Analise por periodo; Analise de custos |
| Sistema | Documentacao / mapa mental, se existir; configuracoes futuras, se existirem |

Nao entram como item direto: `detalhes-produto.html`, `detalhes-venda.html` e `detalhes-origem.html`.

Visual da sidebar:

- Tema escuro operacional com fundo azul/cinza escuro.
- Dourado apenas como detalhe discreto em icones, setas e estado ativo.
- Item ativo visivel, mas sem excesso visual.
- Bordas e espacamentos compativeis com os cards do sistema.
- Usuario e botao `Sair` ficam no rodape.
- Atalhos do Painel Geral sao apoio para rotina e nao substituem a sidebar.

## Teste real recente

No teste real recente foram navegados e avaliados estes fluxos:

- produtos;
- custo de peca;
- detalhes da peca;
- detalhes da venda;
- origem;
- analises.

O teste confirmou que o sistema ja possui a estrutura central funcionando, mas tambem mostrou pontos de melhoria nas telas de detalhes e na validacao continua dos custos.

## Pendencias encontradas no teste real

- `detalhes-produto` passou a funcionar como central operacional/comercial da peca, reunindo dados principais, origem, estoque, custos, vendas relacionadas e resumo operacional.
- `detalhes-venda` funciona como extrato completo da venda, mostrando dados da venda, custos, entrada consumida, custo da peca, lucro e margem.
- Custo de peca foi ajustado para editar/excluir, mas deve continuar sendo validado em uso real.
- O acesso as telas de detalhes deve continuar vindo do contexto correto, e nao de cards soltos no menu inicial.

## Modulos do sistema

### Painel Geral

Representado por `painel.html` e `js/painel-geral.js`. E a entrada oficial do sistema apos login e funciona como visao inicial operacional.

O Painel Geral nao deve voltar a ser menu principal em cards e nao deve virar tela de analise financeira pesada. A sidebar continua sendo a navegacao principal; os atalhos do painel sao apenas apoio para a rotina.

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

Regras:

- Usar `Painel Geral` como nome padrao da interface principal.
- Evitar voltar a usar `Dashboard` na interface principal.
- Painel mostra rotina e atencao operacional.
- Lucro/margem pesada ficam nas telas de analise.
- Produtos continua operacional.
- Detalhes continuam como centrais das entidades.
- Analises continuam financeiras.

### Origens

Representado por `paginas/cadastro-origem.html`, `paginas/listar-origens.html`, `paginas/detalhes-origem.html` e seus scripts. Controla procedencia, compra, lote ou contexto de aquisicao das pecas.

`paginas/cadastro-origem.html` e a tela para cadastrar lote, compra avulsa, carro de desmonte, retorno ou outra origem. A origem e cadastrada antes da peca, funciona como agrupador operacional e financeiro e nao deve ser tratada como peca.

Padrao UX do Cadastro de origem:

- Cabecalho `Cadastro de origem`.
- Etapa 1: Identificacao da origem.
- Etapa 2: Valores e distribuicao.
- Etapa 3: Observacoes.
- Resumo antes de salvar.
- Acoes finais.

Identificacao da origem:

- Tipo da origem.
- Codigo da origem.
- Descricao/nome da origem.
- Data da compra/entrada.

Valores e distribuicao:

- Valor pago.
- Quantidade prevista de pecas, quando existir.
- Aviso de que o valor sera distribuido depois nas pecas/entradas vinculadas.

Observacoes:

- Fornecedor, se existir.
- Documento/referencia, se existir.
- Observacoes internas.

Resumo antes de salvar:

- Tipo.
- Descricao.
- Valor pago.
- Data.
- Status inicial: `Aguardando distribuicao`, `Pronta para vincular pecas` ou `Sem valor pago` somente quando o valor for R$ 0,00.

Acoes:

- `Salvar origem`.
- `Limpar`.
- `Salvar e cadastrar peca vinculada`.
- `Voltar para origens`.

Regras:

- Nao criar peca dentro da origem.
- A peca nasce depois da origem.
- Entrada de estoque continua obrigatoria apos cadastro da peca.
- A distribuicao da origem acontece nas pecas/entradas vinculadas.
- Analises financeiras pesadas ficam nas telas de analise.

`paginas/listar-origens.html` e a tela real de Origens cadastradas. Ela funciona como listagem operacional de origens/lotes para localizar rapidamente lotes, compras avulsas e outras origens. Nao deve virar analise financeira pesada.

Padrao UX da listagem:

- Cabecalho `Origens cadastradas`.
- Botao `Nova origem`.
- Busca por codigo, descricao ou tipo.
- Seletor `Mostrar`.
- Botao `Filtros`.
- Filtros laterais.
- Cards de resumo simples.
- Lista compacta de origens.

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

`paginas/detalhes-origem.html` funciona como central operacional da origem/lote. A pagina mostra dados da origem, distribuicao, pecas vinculadas, entradas de estoque, vendas relacionadas e resumo da origem. Ela nao deve virar analise financeira pesada.

Origens cadastradas e a listagem operacional; Detalhes da origem e a central completa da origem/lote. Analises financeiras mais profundas devem ficar nas telas de analise.

### Produtos

Representado por `paginas/cadastro-peca.html`, `paginas/produtos.html`, `paginas/detalhes-produto.html` e scripts relacionados. Controla cadastro, consulta, detalhes e custos da peca.

`paginas/cadastro-peca.html` e a tela para cadastrar uma peca vinculada a uma origem. Toda peca cadastrada deve gerar uma entrada de estoque. A tela segue o fluxo: origem selecionada -> dados da peca -> entrada de estoque -> imagem/observacoes -> salvar e continuar cadastrando.

Padrao UX do Cadastro de peca:

- Cabecalho `Cadastro de peca`.
- Etapa 1: Origem vinculada.
- Etapa 2: Dados da peca.
- Etapa 3: Entrada de estoque.
- Etapa 4: Imagem.
- Resumo antes de salvar.
- Acoes finais.

Origem vinculada:

- Origem e obrigatoria.
- Origem deve permanecer selecionada apos salvar.
- Mostrar resumo da origem: valor pago, valor distribuido, valor nao distribuido, pecas vinculadas e situacao da distribuicao.

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

- A imagem e operacional/comercial.
- Deve ajudar na conferencia interna e futura apresentacao comercial.

Comportamento apos salvar:

- Nao redirecionar automaticamente.
- Manter origem selecionada.
- Limpar somente campos da peca, entrada e imagem.
- Permitir cadastrar varias pecas da mesma origem em sequencia.

Acoes:

- `Salvar peca`.
- `Salvar e cadastrar outra da mesma origem`.
- `Limpar campos da peca`.
- `Voltar para produtos`.

Regras:

- Origem nao e peca.
- Peca nasce depois da origem.
- Entrada de estoque e obrigatoria.
- Custo da venda continua vindo do consumo de estoque.
- Nao criar calculo financeiro paralelo nessa tela.
- Analises financeiras pesadas ficam nas telas de analise.

`paginas/produtos.html` usa como padrao principal uma lista operacional compacta, nao cards grandes. A tela existe para consulta rapida e operacao diaria do estoque, mostrando imagem pequena, SKU, nome da peca, preco de venda, quantidade disponivel, status operacional e acoes.

`paginas/detalhes-produto.html` funciona como central operacional/comercial da peca. A pagina mostra dados principais da peca, origem vinculada, entradas de estoque, custos da peca, vendas relacionadas e resumo operacional. Ela pode exibir preco de venda, estoque atual, total vendido, receita relacionada e custo consumido/custo da peca com linguagem simples, mas nao deve virar uma tela de analise financeira pesada.

### Estoque

Representado por `paginas/produtos.html`, `paginas/lotes.html`, `paginas/giro-estoque.html`, `paginas/alertas.html` e scripts de estoque. Controla saldo, entradas por lote, consumo e disponibilidade.

### Vendas

Representado por `paginas/cadastro-venda.html`, `paginas/historico-vendas.html`, `paginas/detalhes-venda.html` e scripts de venda. Registra vendas e aciona o consumo FIFO via Supabase.

`paginas/cadastro-venda.html` usa fluxo operacional organizado em blocos: Produto vendido, Dados da venda, Custos da venda e Resumo antes de salvar. A tela e focada em registrar venda, custos opcionais da venda e baixa de estoque via FIFO, sem virar analise financeira pesada.

`paginas/detalhes-venda.html` funciona como extrato completo de uma venda especifica. Ela mostra produto vendido, dados da venda, custos da venda, entrada consumida, custo da peca, lucro e margem. Nao e uma tela de analise geral do sistema.

### Financeiro

Representado por `js/financeiro-utils.js`, telas de analise e custos. Centraliza calculos de receita, custo consumido, custos de peca, custos de venda, lucro e margem.

As telas financeiras principais sao:

- `paginas/analise-produto.html`: resultado financeiro agrupado por peca.
- `paginas/analise-periodo.html`: resultado financeiro por intervalo de datas.
- `paginas/analise-custos.html`: leitura dos custos operacionais por tipo e categoria.

Essas telas podem mostrar receita, custo, lucro, margem e totais quando fizer sentido. Elas nao devem ser confundidas com telas operacionais como Produtos, Historico de vendas ou Cadastro.

Padrao aprovado para analises:

- Busca principal no topo.
- Seletor `Mostrar`.
- Botao `Filtros`.
- Filtros laterais.
- Cards compactos de resumo.
- Listas sem rolagem horizontal.
- Expansoes para detalhes extras.
- Linguagem simples para o usuario.

`analise-produto.html` mostra resultado financeiro agrupado por peca, com busca por SKU/nome, cards de resumo financeiro e lista por produto. Deve exibir custo da peca, custos da venda, lucro e margem. Se nao houver custo calculado, deve mostrar "Custo nao calculado" e nao inventar lucro/margem.

`analise-periodo.html` mostra resultado financeiro por intervalo de datas, com filtros por data, canal e situacao do custo. A lista de vendas do periodo deve mostrar receita, custo das pecas, custos da venda, lucro, margem e quantidade vendida. Os valores devem bater com Detalhes da venda e Analise por produto.

`analise-custos.html` tem foco em custos operacionais. Ela separa custos da peca e custos da venda, mostra total de custos, maior tipo, quantidade de lancamentos e lista por tipo de custo, mas nao deve mostrar lucro/margem.

### Configuracoes

Representado por `paginas/tipos-custo.html`, `js/tipos-custo.js` e arquivos de configuracao Supabase. Controla cadastros auxiliares, principalmente tipos de custo.

`tipos-custo.html` e uma tela administrativa. Ela serve para cadastrar, editar, ativar e inativar tipos de custo, sem virar analise financeira.

Os tipos de custo podem ser usados em:

- custos da peca;
- custos da venda;
- ambos.

Categorias oficiais:

- Peca;
- Venda;
- Ambos.

Status oficiais:

- Ativo;
- Inativo.

Regras de duplicidade:

- Impedir duplicidade por diferenca de maiusculas/minusculas.
- Impedir duplicidade por espacos extras.
- Tratar `Limpeza`, `limpeza` e `LIMPEZA` como o mesmo tipo.
- Normalizar o nome para comparacao antes de salvar.
- Evitar tipos parecidos que baguncam relatorios e analises.

Padrao UX/UI:

- Busca no topo.
- Seletor `Mostrar`.
- Botao `Filtros`.
- Formulario Novo/editar tipo.
- Painel de uso recomendado.
- Lista compacta de tipos cadastrados.
- Acoes `Editar`, `Inativar` e `Ativar`.

Relacao com outras telas:

- Custo de peca usa tipos com categoria Peca ou Ambos.
- Cadastro de venda usa tipos com categoria Venda ou Ambos.
- Analise de custos depende dos tipos padronizados para agrupar corretamente.
- Preferir inativar tipos antigos em vez de apagar.
- Esta tela nao altera calculos financeiros.

## Estrutura de telas

| Tela | Arquivo | Objetivo | Tipo |
| --- | --- | --- | --- |
| Entrada tecnica | `index.html` | Compatibilidade e redirecionamento para o painel oficial | Administrativo |
| Dashboard legado | `dashboard.html` | Legado/redirecionamento para `painel.html` | Legado |
| Painel geral | `painel.html` | Entrada oficial, resumo operacional, alertas e atalhos | Operacional |
| Cadastrar origem | `paginas/cadastro-origem.html` | Registrar procedencia/compra/lote | Operacional |
| Origens cadastradas | `paginas/listar-origens.html` | Listar origens e abrir detalhes | Operacional |
| Detalhes da origem | `paginas/detalhes-origem.html` | Ver dados, distribuicao, pecas vinculadas, entradas, vendas relacionadas e resumo da origem | Detalhes |
| Cadastrar peca | `paginas/cadastro-peca.html` | Cadastrar peca vinculada a origem e entrada | Operacional |
| Produtos / Estoque | `paginas/produtos.html` | Listar pecas em lista operacional compacta, com estoque, filtros e acoes rapidas | Operacional |
| Central da peca | `paginas/detalhes-produto.html` | Ver dados principais, origem, estoque, custos, vendas relacionadas e resumo operacional da peca | Detalhes |
| Entradas de estoque | `paginas/lotes.html` | Consultar lotes FIFO, consumo e saldo | Operacional |
| Giro de estoque | `paginas/giro-estoque.html` | Analisar velocidade e situacao das pecas | Analise |
| Alertas | `paginas/alertas.html` | Acompanhar estoque baixo, sem estoque e pontos de atencao | Analise |
| Cadastrar venda | `paginas/cadastro-venda.html` | Registrar venda de peca e custos da venda | Operacional |
| Historico de vendas | `paginas/historico-vendas.html` | Consultar vendas e abrir detalhes | Operacional |
| Extrato da venda | `paginas/detalhes-venda.html` | Ver entrada consumida, custo da peca e composicao financeira da venda | Detalhes |
| Cadastrar custo da peca | `paginas/cadastro-custo.html` | Lancar custos extras da peca | Operacional |
| Analise por produto | `paginas/analise-produto.html` | Comparar receita, custos e lucro por peca | Analise |
| Analise por periodo | `paginas/analise-periodo.html` | Analisar vendas e lucro por data | Analise |
| Analise de custos | `paginas/analise-custos.html` | Agrupar custos por tipo | Analise |
| Relatorios | `paginas/relatorios.html` | Area de relatorios do sistema | Analise |
| Tipos de custo | `paginas/tipos-custo.html` | Gerenciar categorias de custos | Administrativo |
| Login | `paginas/login.html` | Entrada/autenticacao do sistema | Administrativo |

## Estrutura operacional

- Origem nao e peca. Origem e procedencia, compra ou lote; peca e o item controlado no estoque e vendido.
- Origem continua sendo agrupador operacional e financeiro; a peca nasce depois da origem.
- Entrada de estoque e obrigatoria. O controle correto depende de `entradas_estoque`, com quantidade total, quantidade consumida, custo unitario e data.
- FIFO e a fonte oficial de custo. A venda consome lotes em ordem e grava o resultado em `venda_consumos_estoque`.
- `financeiro-utils.js` e a central financeira. As telas devem usar essa camada para calcular receita, custo consumido, custos, lucro e margem.
- O fallback de custo antigo existe apenas para registros antigos sem consumo FIFO.
- Cadastro de venda deve respeitar estoque disponivel e nao alterar FIFO manualmente. O custo real da venda vem de `venda_consumos_estoque`.
- Nao usar custo medio e nao usar `origem.valor_total` como custo da venda.
- Quando nao houver consumo registrado em `venda_consumos_estoque`, a interface deve mostrar "Custo nao calculado".
- FIFO continua sendo a regra tecnica interna, mas a interface deve usar termos naturais: "custo da peca", "custo consumido", "entrada consumida", "custo calculado" e "custo nao calculado".

## Estrutura visual/UX

- Listagens devem ser rapidas, compactas e focadas em consulta.
- Telas de detalhes concentram o contexto completo da entidade.
- Analises ficam separadas do fluxo operacional para evitar excesso de informacao no dia a dia.
- Telas operacionais devem priorizar cadastro, venda, entrada e consulta objetiva.
- Informacoes financeiras detalhadas devem aparecer em detalhes, painel e analises, nao sobrecarregar listagens.
- O padrao visual atual usa tema escuro operacional, cards compactos, badges suaves, dourado como destaque discreto e blocos bem separados.
- Filtros avancados seguem o padrao de painel lateral; a busca principal deve permanecer visivel no topo das listagens.
- Formularios devem ser organizados por blocos logicos.
- Detalhes da origem e a central da origem/lote. A estrutura UX aprovada e: cabecalho com acoes principais, bloco principal da origem, dados da origem, distribuicao da origem, pecas vinculadas, entradas de estoque, vendas relacionadas e resumo da origem.
- As acoes principais em Detalhes da origem sao `Editar origem`, `Voltar para origens`, `Cadastrar peca vinculada`, `Ver produto` e `Ver detalhes da venda`.
- A distribuicao da origem mostra valor total, valor distribuido, valor restante, quantidade prevista quando existir, quantidade distribuida e situacao da distribuicao.
- Pecas vinculadas usam lista compacta sem barra horizontal, mostrando SKU, nome da peca, quantidade, disponivel e acao `Ver produto`.
- Entradas de estoque da origem mostram peca, data, quantidade total, consumida, saldo, custo unitario e valor atribuido.
- Vendas relacionadas da origem mostram data, SKU, peca, quantidade, canal, valor vendido e acao `Ver detalhes da venda`.
- O resumo da origem usa linguagem simples: receita relacionada, custo das pecas vendidas, custos vinculados e resultado resumido. Se nao houver custo calculado, mostrar "Custo nao calculado". Nao destacar termos tecnicos internos.
- Estados vazios em Detalhes da origem devem aparecer apenas quando nao houver dados: "Nenhuma peca vinculada", "Nenhuma entrada registrada" e "Nenhuma venda relacionada".
- Analises financeiras pesadas continuam nas telas de analise.
- A tela de Produtos usa lista operacional compacta com imagem pequena, SKU, nome, preco de venda, quantidade disponivel, status e acoes rapidas. Ela nao deve usar cards grandes como padrao principal.
- Na lista de Produtos, as acoes principais visiveis sao `Detalhes` e `Vender`. O menu de tres pontos concentra acoes secundarias: `Lancar custo`, `Ver origem` e `Trocar imagem`, quando existir. A edicao dos dados da peca deve ficar dentro da central/detalhes do produto.
- Produtos continua sendo tela operacional: pode mostrar preco de venda, mas nao deve mostrar lucro, custo da peca, margem ou resultado financeiro. Analise financeira fica em detalhes, painel e telas de analise.
- Detalhes do produto e a central da peca. A estrutura UX aprovada e: cabecalho com acoes principais, bloco principal da peca, origem vinculada, resumo operacional, entradas de estoque, custos da peca, vendas relacionadas e area futura de marketplace.
- As acoes principais da central da peca sao `Vender`, `Lancar custo`, `Editar dados`, `Trocar imagem` e `Voltar ao estoque`.
- O resumo operacional da central da peca pode mostrar estoque atual, total vendido, preco de venda, receita relacionada e custo consumido/custo da peca. Lucro e margem nao devem receber destaque exagerado nessa tela; analise financeira pesada pertence as telas de Analises.
- A area de marketplace em detalhes do produto pode reservar espaco visual para titulo do anuncio, preco marketplace, status do anuncio e link do anuncio, mas por enquanto nao deve conectar ao banco nem integrar Mercado Livre.
- `paginas/cadastro-custo.html` usa fluxo operacional vertical: Buscar peca, Dados da peca selecionada, Novo custo e Historico de custos cadastrados. A tela e focada em localizar a peca, lancar custo, editar custo e excluir custo, sem virar analise financeira pesada.
- O Historico de custos fica abaixo do formulario, mostra custos do mais recente para o mais antigo, usa lista compacta sem barra horizontal e exibe data, tipo, valor, observacao e acoes `Editar` e `Excluir`.
- Custo de peca pode mostrar os valores de custo lancados, porque e uma tela operacional de custo. Isso nao muda a regra de Produtos: Produtos continua sem mostrar custo, lucro, margem ou resultado financeiro.
- Cadastro de venda deve mostrar, apos selecionar uma peca, SKU, nome, preco de venda, estoque disponivel e alerta de estoque baixo/sem estoque quando aplicavel.
- Custos da venda sao opcionais, podem ser adicionados/removidos antes de salvar, aparecem em lista compacta e nao devem impedir salvar venda sem custo adicional.
- O resumo antes de salvar mostra quantidade vendida, receita prevista, custos da venda e o aviso de que o custo da peca sera calculado automaticamente ao salvar. Ao limpar o formulario, esse resumo deve voltar para zero.
- Detalhes da venda segue a estrutura UX: resumo rapido no topo, produto vendido, dados da venda, custos da venda, entrada consumida, resultado da venda e ajustes permitidos.
- Em Detalhes da venda, data, canal e observacao podem ser editados se essa for a regra atual; quantidade vendida e custo consumido ficam protegidos no extrato.
- Telas operacionais nao devem receber analise financeira pesada.

## Previews visuais

A pasta `previews/` guarda prototipos visuais usados para testar padroes antes de aplicar nas telas reais.

`previews/` funciona como laboratorio visual. O prototipo `produtos-lista-ui-preview` foi usado como base para validar a nova UX/UI de Produtos antes de aplicar a lista operacional compacta na tela real.

Arquivos previstos nessa pasta:

- `previews/preview.html`: prototipo visual de cadastro/produto.
- `previews/preview-mega-menu.html`: prototipo de topbar com mega menu ERP/SaaS.
- `previews/preview-dashboard.html`: prototipo visual legado de dashboard.
- `previews/preview-design-system.html`: pode existir em ambientes locais como laboratorio de design system.

Regras:

- Previews nao fazem parte do fluxo real do sistema.
- Previews nao devem ser usados como destino de sidebar/menu operacional.
- Mudancas aprovadas em preview devem ser aplicadas depois nas paginas reais, com validacao.

## Arquitetura frontend

### HTML

As telas ficam na raiz e em `paginas/`. Cada arquivo HTML representa uma tela independente e carrega os scripts necessarios no final da pagina.

### CSS

Os estilos ficam em `css/style.css` e `css/mapa-mental.css`. O CSS centraliza layout, cards, formularios, tabelas, botoes e estrutura visual das telas.

### JavaScript

Os scripts ficam em `js/`, separados por responsabilidade:

- `app.js`: apoio de navegacao legado e comportamentos simples.
- `sidebar.js`: navegacao principal atual do ERP.
- `supabase-config.js`: configuracao do Supabase.
- `supabase-service.js`: camada de acesso ao Supabase e mapeamento dos dados.
- `financeiro-utils.js`: calculos financeiros centrais.
- `origem.js`, `listar-origens.js`, `detalhes-origem.js`: fluxo de origens.
- `peca.js`, `produtos.js`, `detalhes-produto.js`: fluxo de pecas/produtos.
- `lotes.js`, `estoque.js`, `giro-estoque.js`, `alertas.js`: consultas e analises de estoque.
- `venda.js`, `historico-vendas.js`, `detalhes-venda.js`: fluxo de vendas.
- `custos.js`, `tipos-custo.js`, `analise-custos.js`: custos e tipos de custo.
- `painel-geral.js`, `analise-produto.js`, `analise-periodo.js`, `relatorios.js`: visoes de analise.
- `auth.js`: suporte a autenticacao.
- `dados-teste.js`: geracao de dados para desenvolvimento.

### Integracao Supabase

A integracao com Supabase e centralizada em `js/supabase-service.js`. Esse arquivo cria o cliente, mapeia dados do banco para o formato usado no front e expoe funcoes para listar, buscar, salvar e atualizar entidades.

Estruturas principais no SQL:

- `sql/01_tabelas.sql`: tabelas base.
- `sql/04_fifo.sql`: estrutura de entradas e consumos FIFO.
- `sql/05_fifo_funcoes.sql`: funcao `registrar_venda_fifo`.
- `sql/07_criar_peca_com_entrada.sql`: criacao de peca com entrada.
- `sql/08_tipos_custo.sql`: tipos de custo.

## Proximas evolucoes

### Melhorias criticas

- Manter FIFO como unica fonte oficial de custo das vendas novas.
- Evitar calculos financeiros duplicados fora de `financeiro-utils.js`.
- Garantir que toda peca vendida tenha entrada de estoque rastreavel.
- Revisar telas antigas/redirecionadas para remover confusao operacional no futuro.

### Melhorias importantes

- Documentar contratos de dados entre Supabase e front.
- Padronizar nomes de campos usados no banco e no JavaScript.
- Melhorar filtros compactos em listagens operacionais.
- Ampliar mensagens de erro quando Supabase ou FIFO bloquearem uma venda.

### Melhorias futuras

- Criar permissoes por perfil de usuario.
- Adicionar auditoria para alteracoes de venda, custo, estoque e origem.
- Evoluir relatorios por margem, origem, canal de venda e tipo de custo.
- Integrar exportacao de dados e dashboards mais completos.

### Modulos futuros documentados

- Marketplace/anuncios.
- Geracao de anuncio com IA.
- Painel operacional de anuncios.
- SKU automatico por categoria.
- Multiempresa.
- Usuarios e permissoes.

## Padrao de uso do Codex no projeto

Para manter o trabalho organizado, os pedidos para o Codex devem seguir este padrao:

- comandos curtos;
- objetivo em 1 frase;
- arquivos definidos;
- regras claras;
- informar quando nao deve fazer commit;
- pedir resposta curta quando o foco for execucao.

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
