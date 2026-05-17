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
- Produtos pode mostrar preco de venda, mas nao deve mostrar lucro, custo FIFO, margem ou resultado financeiro.
- Analise financeira deve ficar em detalhes, painel e telas de analise.

## Padrao da tela Custo de peca

- `paginas/cadastro-custo.html` usa fluxo operacional vertical.
- Ordem da tela: Buscar peca, Dados da peca selecionada, Novo custo e Historico de custos cadastrados.
- A tela e focada em localizar peca, lancar custo, editar custo e excluir custo.
- Historico fica abaixo do formulario, em lista compacta sem barra horizontal.
- Cada custo deve mostrar data, tipo, valor, observacao e acoes `Editar` e `Excluir`.
- Exclusao exige confirmacao antes de remover do Supabase.
- Custo de peca pode mostrar valores de custo lancados, mas nao deve virar analise financeira pesada.
- Evitar layout dividido em duas colunas quando apertar o conteudo.

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
