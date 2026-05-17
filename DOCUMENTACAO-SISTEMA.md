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
- A sidebar organiza os modulos principais: Painel Geral, Produtos, Vendas, Estoque, Origens, Custos, Analises e Sistema.
- Paginas de detalhes nao devem aparecer como link direto no menu. Elas devem abrir pelo contexto correto:
  - Produto -> Ver detalhes;
  - Historico de vendas -> Ver detalhes da venda;
  - Origens cadastradas -> Ver detalhes da origem.

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

- `detalhes-produto` ainda precisa evoluir a exibicao de custos, vendas relacionadas, resumo financeiro e mensagens quando nao houver dados.
- `detalhes-venda` precisa funcionar como extrato completo da venda, mostrando dados da venda, custos, consumo FIFO, lucro e margem.
- Custo de peca foi ajustado para editar/excluir, mas deve continuar sendo validado em uso real.
- O acesso as telas de detalhes deve continuar vindo do contexto correto, e nao de cards soltos no menu inicial.

## Modulos do sistema

### Dashboard

Representado por `painel.html` e `js/painel-geral.js`. Mostra resumo do negocio, alertas, ultimas vendas e links para analises financeiras.

### Origens

Representado por `paginas/cadastro-origem.html`, `paginas/listar-origens.html`, `paginas/detalhes-origem.html` e seus scripts. Controla procedencia, compra, lote ou contexto de aquisicao das pecas.

### Produtos

Representado por `paginas/cadastro-peca.html`, `paginas/produtos.html`, `paginas/detalhes-produto.html` e scripts relacionados. Controla cadastro, consulta, detalhes e custos da peca.

`paginas/produtos.html` usa como padrao principal uma lista operacional compacta, nao cards grandes. A tela existe para consulta rapida e operacao diaria do estoque, mostrando imagem pequena, SKU, nome da peca, preco de venda, quantidade disponivel, status operacional e acoes.

### Estoque

Representado por `paginas/produtos.html`, `paginas/lotes.html`, `paginas/giro-estoque.html`, `paginas/alertas.html` e scripts de estoque. Controla saldo, entradas por lote, consumo e disponibilidade.

### Vendas

Representado por `paginas/cadastro-venda.html`, `paginas/historico-vendas.html`, `paginas/detalhes-venda.html` e scripts de venda. Registra vendas e aciona o consumo FIFO via Supabase.

### Financeiro

Representado por `js/financeiro-utils.js`, telas de analise e custos. Centraliza calculos de receita, custo consumido, custos de peca, custos de venda, lucro e margem.

### Configuracoes

Representado por `paginas/tipos-custo.html`, `js/tipos-custo.js` e arquivos de configuracao Supabase. Controla cadastros auxiliares, principalmente tipos de custo.

## Estrutura de telas

| Tela | Arquivo | Objetivo | Tipo |
| --- | --- | --- | --- |
| Entrada tecnica | `index.html` | Compatibilidade e redirecionamento para o painel oficial | Administrativo |
| Dashboard legado | `dashboard.html` | Legado/redirecionamento para `painel.html` | Legado |
| Painel geral | `painel.html` | Entrada oficial, resumo operacional, alertas e atalhos | Operacional |
| Cadastrar origem | `paginas/cadastro-origem.html` | Registrar procedencia/compra/lote | Operacional |
| Origens cadastradas | `paginas/listar-origens.html` | Listar origens e abrir detalhes | Operacional |
| Detalhes da origem | `paginas/detalhes-origem.html` | Ver contexto completo e resultado da origem | Detalhes |
| Cadastrar peca | `paginas/cadastro-peca.html` | Cadastrar peca vinculada a origem e entrada | Operacional |
| Produtos / Estoque | `paginas/produtos.html` | Listar pecas em lista operacional compacta, com estoque, filtros e acoes rapidas | Operacional |
| Central da peca | `paginas/detalhes-produto.html` | Ver dados completos, custos, vendas e lucro da peca | Detalhes |
| Entradas de estoque | `paginas/lotes.html` | Consultar lotes FIFO, consumo e saldo | Operacional |
| Giro de estoque | `paginas/giro-estoque.html` | Analisar velocidade e situacao das pecas | Analise |
| Alertas | `paginas/alertas.html` | Acompanhar estoque baixo, sem estoque e pontos de atencao | Analise |
| Cadastrar venda | `paginas/cadastro-venda.html` | Registrar venda de peca e custos da venda | Operacional |
| Historico de vendas | `paginas/historico-vendas.html` | Consultar vendas e abrir detalhes | Operacional |
| Extrato da venda | `paginas/detalhes-venda.html` | Ver consumo FIFO e composicao financeira da venda | Detalhes |
| Cadastrar custo da peca | `paginas/cadastro-custo.html` | Lancar custos extras da peca | Operacional |
| Analise por produto | `paginas/analise-produto.html` | Comparar receita, custos e lucro por peca | Analise |
| Analise por periodo | `paginas/analise-periodo.html` | Analisar vendas e lucro por data | Analise |
| Analise de custos | `paginas/analise-custos.html` | Agrupar custos por tipo | Analise |
| Relatorios | `paginas/relatorios.html` | Area de relatorios do sistema | Analise |
| Tipos de custo | `paginas/tipos-custo.html` | Gerenciar categorias de custos | Administrativo |
| Login | `paginas/login.html` | Entrada/autenticacao do sistema | Administrativo |

## Estrutura operacional

- Origem nao e peca. Origem e procedencia, compra ou lote; peca e o item controlado no estoque e vendido.
- Entrada de estoque e obrigatoria. O controle correto depende de `entradas_estoque`, com quantidade total, quantidade consumida, custo unitario e data.
- FIFO e a fonte oficial de custo. A venda consome lotes em ordem e grava o resultado em `venda_consumos_estoque`.
- `financeiro-utils.js` e a central financeira. As telas devem usar essa camada para calcular receita, custo consumido, custos, lucro e margem.
- O fallback de custo antigo existe apenas para registros antigos sem consumo FIFO.

## Estrutura visual/UX

- Listagens devem ser rapidas, compactas e focadas em consulta.
- Telas de detalhes concentram o contexto completo da entidade.
- Analises ficam separadas do fluxo operacional para evitar excesso de informacao no dia a dia.
- Telas operacionais devem priorizar cadastro, venda, entrada e consulta objetiva.
- Informacoes financeiras detalhadas devem aparecer em detalhes, painel e analises, nao sobrecarregar listagens.
- O padrao visual atual usa tema escuro operacional, cards compactos, badges suaves, dourado como destaque discreto e blocos bem separados.
- Filtros avancados seguem o padrao de painel lateral; a busca principal deve permanecer visivel no topo das listagens.
- Formularios devem ser organizados por blocos logicos.
- A tela de Produtos usa lista operacional compacta com imagem pequena, SKU, nome, preco de venda, quantidade disponivel, status e acoes rapidas. Ela nao deve usar cards grandes como padrao principal.
- Na lista de Produtos, as acoes principais visiveis sao `Detalhes` e `Vender`. O menu de tres pontos concentra acoes secundarias: `Lancar custo`, `Ver origem` e `Trocar imagem`, quando existir. A edicao dos dados da peca deve ficar dentro da central/detalhes do produto.
- Produtos continua sendo tela operacional: pode mostrar preco de venda, mas nao deve mostrar lucro, custo FIFO, margem ou resultado financeiro. Analise financeira fica em detalhes, painel e telas de analise.
- `paginas/cadastro-custo.html` usa fluxo operacional vertical: Buscar peca, Dados da peca selecionada, Novo custo e Historico de custos cadastrados. A tela e focada em localizar a peca, lancar custo, editar custo e excluir custo, sem virar analise financeira pesada.
- O Historico de custos fica abaixo do formulario, mostra custos do mais recente para o mais antigo, usa lista compacta sem barra horizontal e exibe data, tipo, valor, observacao e acoes `Editar` e `Excluir`.
- Custo de peca pode mostrar os valores de custo lancados, porque e uma tela operacional de custo. Isso nao muda a regra de Produtos: Produtos continua sem mostrar custo, lucro, margem ou resultado financeiro.
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
