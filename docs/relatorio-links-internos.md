# Relatorio de links internos para paginas antigas

Data da revisao: 2026-04-30

## Objetivo

Verificar se alguma pagina do projeto ainda aponta para:

- `estoque.html`
- `custos.html`
- `cadastro-custo-peca.html`
- `relatorios.html`
- `painel-geral.html`

Nenhum arquivo foi apagado ou alterado nesta verificacao, alem da criacao deste relatorio.

## Resultado rapido

| Pagina procurada | Ha link interno apontando para ela? | Onde aparece | Recomendacao |
|---|---:|---|---|
| `estoque.html` | Nao | Apenas mencoes no relatorio anterior e a propria pagina `paginas/estoque.html` aponta para `produtos.html`. | Se for esconder/remover depois, trocar qualquer referencia futura para `paginas/produtos.html`. |
| `custos.html` | Nao | Apenas mencao em `docs/relatorio-telas-duplicadas.md`. | Usar `paginas/cadastro-custo.html` como pagina atual. |
| `cadastro-custo-peca.html` | Nao | Apenas mencao em `docs/relatorio-telas-duplicadas.md`. | Usar `paginas/cadastro-custo.html` como pagina atual. |
| `relatorios.html` | Sim | `index.html` linhas 129 e 173; mencoes em `docs/relatorio-telas-duplicadas.md`. | Avaliar se cada card deve continuar apontando para `paginas/relatorios.html` ou migrar para telas mais especificas. |
| `painel-geral.html` | Nao | Apenas mencao em `docs/relatorio-telas-duplicadas.md`. | Usar `painel.html` como pagina atual. |

## Ocorrencias encontradas

### `estoque.html`

Nao encontrei link interno apontando para `paginas/estoque.html`.

Ocorrencias relacionadas:

- `paginas/estoque.html` existe, mas ela mesma encaminha o usuario para `produtos.html`.
- `docs/relatorio-telas-duplicadas.md` menciona `paginas/estoque.html` como pagina antiga/atalho.

Recomendacao:

- Manter `paginas/produtos.html` como destino atual para estoque.
- Se algum link novo for criado, usar `paginas/produtos.html`, nao `paginas/estoque.html`.

### `custos.html`

Nao encontrei link interno apontando para `custos.html`.

Ocorrencias relacionadas:

- `docs/relatorio-telas-duplicadas.md` menciona `paginas/custos.html` como nome antigo que nao existe mais.

Recomendacao:

- Usar `paginas/cadastro-custo.html`.

### `cadastro-custo-peca.html`

Nao encontrei link interno apontando para `cadastro-custo-peca.html`.

Ocorrencias relacionadas:

- `docs/relatorio-telas-duplicadas.md` menciona `paginas/cadastro-custo-peca.html` como nome antigo que nao existe mais.

Recomendacao:

- Usar `paginas/cadastro-custo.html`.

### `relatorios.html`

Encontrei links internos reais apontando para `paginas/relatorios.html`:

| Arquivo | Linha | Uso atual | Recomendacao |
|---|---:|---|---|
| `index.html` | 129 | Card `Alertas`, no grupo `Estoque`. | Pode continuar usando `paginas/relatorios.html` enquanto nao existir uma tela exclusiva de alertas. No futuro, criar `paginas/alertas.html` ou apontar para uma secao/tela especifica. |
| `index.html` | 173 | Card `Lucro Geral`, no grupo `Analises`. | Avaliar troca para `painel.html` se o objetivo for resultado consolidado do negocio. Manter `relatorios.html` se a intencao for relatorio detalhado com tabelas. |

Ocorrencias documentais:

- `docs/relatorio-telas-duplicadas.md` menciona `paginas/relatorios.html` em varias recomendacoes.

Recomendacao:

- Nao remover nem esconder `paginas/relatorios.html` agora, porque ela ainda e acessada pelo menu inicial.
- Antes de esconder, trocar:
  - `Alertas` para uma tela atual de alertas, se criada.
  - `Lucro Geral` para `painel.html`, se `painel.html` for definido como painel financeiro principal.

### `painel-geral.html`

Nao encontrei link interno apontando para `painel-geral.html`.

Ocorrencias relacionadas:

- `docs/relatorio-telas-duplicadas.md` menciona que `painel-geral.html` nao existe como HTML.
- Existe `js/painel-geral.js`, mas ele e script usado por `painel.html`, nao uma pagina duplicada.

Recomendacao:

- Usar `painel.html` como pagina atual.
- Nao criar link para `painel-geral.html`.

## Conclusao

As paginas antigas `estoque.html`, `custos.html`, `cadastro-custo-peca.html` e `painel-geral.html` nao recebem links internos reais no menu ou nas telas principais.

O unico alvo da lista ainda usado como link real e `paginas/relatorios.html`, com dois acessos no `index.html`.

Antes de remover ou esconder `relatorios.html`, decidir se:

- `Alertas` continua nela ou ganha uma tela propria.
- `Lucro Geral` deve ir para `painel.html`.
