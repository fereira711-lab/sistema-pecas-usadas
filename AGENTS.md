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

## Banco de dados e Supabase

- Antes de sugerir ou fazer mudancas no banco, explicar a logica.
- Nao alterar regras importantes de estoque, venda, compra ou custo sem explicar o impacto.
- Preservar a integridade dos dados.
- Sempre verificar `error` nas respostas do Supabase.

## Front-end e JavaScript

- Criar telas simples, funcionais e faceis de entender.
- Priorizar clareza antes de aparencia avancada.
- Usar CSS limpo e evitar excesso de bibliotecas externas.
- Separar responsabilidades no JavaScript e evitar funcoes muito grandes.
- Tratar erros de forma clara para o usuario.

## Padrao da tela Produtos

- `paginas/produtos.html` e uma tela operacional de consulta rapida.
- O padrao principal e lista operacional compacta, nao cards grandes.
- Cada item deve priorizar imagem pequena, SKU, nome, preco de venda, quantidade disponivel, status e acoes.
- Acoes principais visiveis: `Detalhes` e `Vender`.
- Menu de tres pontos apenas para acoes secundarias: `Lancar custo`, `Ver origem` e `Trocar imagem`, quando existir.
- Edicao dos dados da peca deve ficar dentro de `detalhes-produto.html`.
- Produtos pode mostrar preco de venda, mas nao deve mostrar lucro, custo da peca, margem ou resultado financeiro.
- Analise financeira deve ficar em detalhes, painel e telas de analise.

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

## Padrao da tela Custo de peca

- `paginas/cadastro-custo.html` usa fluxo operacional vertical.
- Ordem da tela: Buscar peca, Dados da peca selecionada, Novo custo e Historico de custos cadastrados.
- A tela e focada em localizar peca, lancar custo, editar custo e excluir custo.
- Historico fica abaixo do formulario, em lista compacta sem barra horizontal.
- Cada custo deve mostrar data, tipo, valor, observacao e acoes `Editar` e `Excluir`.
- Exclusao exige confirmacao antes de remover do Supabase.
- Custo de peca pode mostrar valores de custo lancados, mas nao deve virar analise financeira pesada.
- Evitar layout dividido em duas colunas quando apertar o conteudo.

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
