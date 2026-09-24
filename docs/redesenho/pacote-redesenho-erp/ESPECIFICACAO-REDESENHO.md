---
tipo: especificacao
status: ativo
ultima_revisao: 2026-09-24
origem: conversa
---

# Especificação do redesenho — sistema-pecas-usadas

Aprovada por Rafael em 2026-09-24 a partir dos mockups da pasta `referencia-telas/`.

Os arquivos `.html` dessa pasta são **referência visual**, não código para copiar. Eles usam um formato de editor de design (`<x-dc>`, `{{...}}`, `<sc-for>`). O que vale é o resultado visual: cores, tamanhos, espaçamentos, hierarquia e textos. A implementação real continua em HTML, CSS e JS puros, como o projeto já é.

## 1. Princípios

- Tema claro no conteúdo, sidebar escura.
- **Um título por tela.** Nada de selo acima do título ("PAINEL GERAL", "ESTOQUE"), nada de card com rótulo repetindo o título ("ESTOQUE OPERACIONAL / Produtos").
- **Uma ação principal por tela**, na cor de destaque. Todo o resto é secundário ou discreto.
- Ações destrutivas ("Excluir") ficam num menu "⋯", nunca ao lado de ações comuns.
- Sem selos decorativos ("Operacional ativo", "Custo protegido", "Sem redirecionamento", "Visual", "Obrigatório" em cada bloco). Campo opcional leva "(opcional)" no rótulo; o resto é obrigatório por padrão.
- **Todos os textos com acentuação correta** (Histórico, Peça, Ações, Preço, Observação, Unitário...).
- Números sempre com `font-variant-numeric: tabular-nums`, alinhados à direita em tabelas.
- Regra de negócio não muda: `financeiro-utils.js` continua a fonte dos cálculos, sem custo médio, "Custo não calculado" quando faltar consumo.

## 2. Fontes

Google Fonts, carregado no `<head>` de todas as páginas:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
```

- Texto: `'IBM Plex Sans', 'Segoe UI', sans-serif`
- SKU e códigos (ORI-000001): `'IBM Plex Mono', monospace`, 12px, cor secundária.

## 3. Tokens (variáveis CSS)

```css
:root {
  /* Superfícies */
  --bg: #F6F5F2;
  --surface: #FFFFFF;
  --surface-muted: #FAF9F6;     /* cabeçalho de tabela, área de upload */
  --surface-sunken: #F1EFEA;    /* miniatura sem foto */
  --surface-readonly: #F6F5F2;  /* campo calculado */
  --segmented-bg: #ECEAE4;

  /* Bordas */
  --border: #E4E2DC;
  --border-strong: #D9D6CE;     /* inputs e botões secundários */
  --divider: #EEEDEA;

  /* Texto */
  --text: #1C1B19;
  --text-2: #3D3B37;
  --text-muted: #5C5A55;
  --text-faint: #8E897F;

  /* Destaque */
  --accent: #E8A93A;            /* botão principal; texto em cima dele é --text */
  --link: #8A5A00;
  --link-hover: #5E3D00;

  /* Sidebar */
  --sidebar-bg: #1C1B19;
  --sidebar-item-active: #2E2C28;
  --sidebar-footer: #262521;
  --sidebar-text: #D6D2C9;
  --sidebar-text-strong: #FFFFFF;
  --sidebar-muted: #B9B4AA;
  --sidebar-section: #8E897F;

  /* Estados (texto sobre fundo) */
  --success: #1F6B45;  --success-bg: #E6F3EC;  --success-bar: #2F8A5B;
  --warning: #8A4B00;  --warning-bg: #FDF0DC;
  --danger:  #A3241B;  --danger-bg:  #FBE9E7;
  --info:    #1F5FA8;  --info-bg:    #E8F0FA;
  --neutral: #4A4843;  --neutral-bg: #EEEDEA;

  /* Forma */
  --radius-sm: 8px;    /* botões, inputs, itens de menu */
  --radius-md: 10px;   /* blocos internos */
  --radius-lg: 12px;   /* cards */
  --radius-pill: 999px;

  /* Espaço */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
}
```

**Regra:** fora do `:root`, nenhuma cor, raio ou espaçamento literal. Tudo por variável.

## 4. Tipografia

| Uso | Tamanho | Peso |
|---|---|---|
| Título da página (h1) | 28px | 700, letter-spacing -0.3px |
| Título de card (h2) | 16px | 600 |
| Valor de KPI | 28px (26px em 4 colunas apertadas) | 600 |
| Texto padrão, células, inputs | 14px | 400–500 |
| Rótulo de campo | 13px | 600, cor `--text-2` |
| Texto secundário, dicas | 13px / 12px | 400, `--text-muted` |
| Cabeçalho de tabela | 12px | 600, maiúsculas, letter-spacing 0.4px, `--text-muted` |
| Seção da sidebar | 11px | 600, maiúsculas, letter-spacing 0.8px |

Só esses tamanhos. Hoje existem 64.

## 5. Layout global

- Sidebar fixa de **240px** à esquerda.
- Área principal: padding `32px 40px`, gap vertical de 24px entre blocos.
- **Título e conteúdo começam na mesma margem esquerda** em todas as telas (hoje o título fica em x=82 e o conteúdo entre 157 e 194).
- Largura: o conteúdo ocupa toda a área principal. Telas de formulário usam duas colunas: formulário (flexível) + coluna de resumo de **340px** à direita.
- Cabeçalho da tela: à esquerda, link de volta (quando for subpágina, ex.: "‹ Produtos"), h1 e uma linha de subtítulo curta; à direita, as ações da tela com a principal por último.

## 6. Componentes

**Sidebar**
- Topo: marca (quadrado 34px na cor de destaque com ícone) + nome do sistema + nome da loja embaixo, 12px.
- Seções "Operação" (Painel, Produtos, Origens, Vendas, Entradas de estoque, Alertas) e "Gestão" (Análises, Tipos de custo).
- Item: altura 40px, ícone 18px + **texto sempre visível**, gap 12px, raio 8px.
- Item ativo: fundo `--sidebar-item-active`, texto branco 600, ícone na cor de destaque. Usar `aria-current="page"`.
- Alertas com contador (pílula na cor de destaque).
- Rodapé: avatar com inicial, nome, papel, botão sair com `aria-label`.
- Continua usando Remix Icon se preferir, mas com o texto ao lado.

**Botões** (altura 40px; compacto 34px dentro de tabelas)
- Principal: fundo `--accent`, texto `--text`, 700. **Um por tela.**
- Secundário: fundo branco, borda `--border-strong`, texto `--text`, 600.
- Discreto (Cancelar): sem fundo e sem borda, texto `--text-2`.
- Ícone só (⋯, sair, remover): 34–40px, sem fundo, com `aria-label`.

**Card**: fundo `--surface`, borda 1px `--border`, raio 12px, padding 24px (KPI: 20px). Sem sombra.

**Campo**: rótulo acima (13px 600), input com altura 40px, borda `--border-strong`, raio 8px. Dica abaixo em 12px `--text-muted`. Campo calculado: fundo `--surface-readonly`, borda `--border`, texto 600.

**Tabela**: dentro de card sem padding lateral; cabeçalho com fundo `--surface-muted`; linhas com padding 12–14px e divisória `--divider`; números à direita. **Nunca rolagem horizontal** dentro do card.

**Pílula de situação**: altura 24px, raio pill, 12px 600. Em estoque = success; Vendida = neutral; Parada há N dias = warning; Prejuízo = danger.

**Controle segmentado** (filtros Todas / Em estoque / Vendidas / Paradas): fundo `--segmented-bg`, padding 3px, item ativo branco com sombra leve, cada item com a contagem.

**Barra de progresso**: altura 8–14px, fundo `--divider`, preenchimento `--success-bar` quando completa, `--accent` quando parcial, `--info` para distribuição.

**Item de alerta**: ícone 32px num quadrado com fundo do estado + título 14px 600 + detalhe 13px + link de ação. Gravidade nunca só por cor: o texto do título já diz o problema.

**Resumo lateral** (formulários): card com linhas "rótulo … valor", divisórias, resultado final em 16px 700 na cor do estado.

## 7. Telas e o que cada uma deve mostrar

**Painel** (`01-painel`)
- Ações: seletor de período, "Nova peça" (secundário), "Registrar venda" (principal).
- 4 KPIs: Receita do mês · Lucro real (com margem) · Custo das peças vendidas (+ fretes) · Peças em estoque.
- "Retorno por origem": cada origem com barra de quanto do valor pago já voltou em vendas; "Já se pagou · lucro de R$ X" ou "Faltam R$ X para se pagar".
- "Precisa de atenção": até 4 itens (regras na seção 8).
- "Últimas vendas": data, peça (SKU + nome · veículo), canal, valor, custo da peça, lucro (vermelho se negativo).
- Remover: bloco "Ações rápidas" (duplica a sidebar) e o bloco de alertas que repetia os contadores do topo.

**Produtos** (`02-produtos`)
- Subtítulo com contagens. Ação principal "Nova peça".
- Busca (SKU, peça, veículo **e compatibilidade**), filtro por origem, controle segmentado por situação.
- Colunas: Peça (miniatura 44px + nome + SKU), Origem, Preço, Custo, Margem, Estoque, Situação, Ações ("Vender" + "⋯").
- Sem foto: ícone de imagem, não a inicial do nome.
- Paginação no rodapé.

**Nova peça** (`03-nova-peca`)
- Blocos: Origem (com barra de distribuição e link "Nova origem"), Peça, Estoque e custo, Foto.
- Resumo lateral com margem e lucro previstos e quanto a origem fica a distribuir depois.
- Rodapé: Cancelar · Salvar e cadastrar outra · **Salvar peça**.

**Registrar venda** (`04-registrar-venda`)
- Peça escolhida aparece como cartão (foto, nome, SKU, origem, estoque).
- Canal por botões (seção 8).
- Custos da venda em linhas tipo + valor + remover.
- Resumo lateral: receita, custo da peça, custos da venda, lucro, margem. Botão principal "Registrar venda" no resumo.

**Detalhes da origem** (`05-detalhes-origem`)
- KPIs: Valor pago · Recuperado em vendas · Resultado da origem · Ainda em estoque (quantidade e valor a preço de venda).
- "Retorno da origem" com barra e frase: se já se pagou, e quanto o estoque restante ainda pode render.
- Tabela "Peças desta origem" com custo atribuído, preço ou valor vendido, situação e lucro por peça.

As demais telas (Histórico de vendas, Origens, Entradas de estoque, Alertas, Análises, Tipos de custo, Detalhes do produto, Detalhes da venda, Login) seguem os mesmos componentes, sem mockup próprio.

## 8. Mudanças funcionais aprovadas

1. **Compatibilidade da peça.** Nova coluna `compatibilidade text null` em `pecas`, campo opcional no cadastro e na edição, exibido no detalhe da peça e incluído na busca de Produtos. Migration versionada em `sql/` (próximo número).
2. **SKU livre.** Continua campo de texto livre; cada loja usa o padrão que quiser. **Só se ficar em branco** o sistema gera um código (ex.: `P-000123`, sequencial), sem quebrar a checagem de duplicidade que já existe.
3. **Canal da venda com opções fixas:** Mercado Livre, WhatsApp, Balcão, Outro. Valores antigos em texto livre continuam sendo exibidos como estão.
4. **Prévia do resultado da venda** antes de salvar: custo da peça estimado pela entrada mais antiga com saldo (mesma lógica do consumo), custos da venda, lucro e margem. O cálculo oficial continua no banco ao registrar. Texto de apoio: "O custo vem da entrada mais antiga desta peça e é confirmado ao registrar."
5. **Alertas pensados para desmanche:**
   - Quantidade 1 **não** é alerta (em peça usada é o normal). Remover "Estoque baixo" baseado em quantidade ≤ 2.
   - "Sem venda" para peça recém-cadastrada deixa de ser alerta.
   - Novo: **peça parada há mais de 90 dias** (sem venda desde a entrada), com o valor total parado.
   - Mantidos: venda sem custo calculado, origem com valor a distribuir, distribuição acima do pago, venda com prejuízo.
   - Os testes de regressão de alertas (`tests/regressao-2026-09-24.test.js`) precisam ser atualizados para as regras novas; a regra de não contar a mesma peça duas vezes continua valendo.

## 9. Pendente, fora deste redesenho

- Nome comercial do sistema (nos mockups aparece `[NOME DO SISTEMA]`). O nome da loja cliente aparece abaixo da marca.
- Tela de Login no novo padrão.

## 10. Decisões tomadas durante a implementação (2026-09-24)

Aprovadas por Rafael depois da Fase 2 (sidebar e Painel):

1. **Análises vira uma página com abas:** Por produto, Por período, Custos e Giro de estoque. Cada aba reaproveita a tela atual como conteúdo; o título passa a ser "Análises" e a barra de abas fica no cabeçalho. O Giro de estoque sai de "Entradas de estoque" e passa para Análises.
2. **Custo de peça** não tem item na sidebar: abre pelo botão "Lançar custo" no detalhe da peça.
3. **Mapa mental e documentação** saem da navegação do sistema (são documentação interna).
4. **Rodapé da sidebar:** nome tirado do e-mail + o e-mail. Sem papel/perfil.
5. **Nova ordem das fases:** 3 Produtos, 4 Alertas (regras da seção 8, atualizando os testes), 5 Nova peça, 6 Registrar venda, 7 Detalhes da origem, 8 demais telas, 9 limpeza do `style.css`.
6. **Retorno por origem:** recuperado = receita das vendas das peças da origem − custos dessas vendas. Calculado em `financeiro-utils.js` (`calcularResultadoOrigem`, campo `recuperado`), com teste. "Já se pagou · lucro de R$ X" usa X = recuperado − valor pago.
7. **Valores negativos** de moeda e percentual com o sinal de menos (U+2212), não hífen, na formatação centralizada (`moeda-utils.js`).
8. **Painel, "Últimas vendas":** a coluna "Custo da peça" vira "Custos" = custo da peça + custos da venda, para que valor − custos = lucro na mesma linha.
9. **Painel:** o card "Retorno por origem" fica alinhado pelo topo, sem esticar até a altura do card vizinho. A sidebar ocupa 100% da altura da janela.

Aprovadas por Rafael depois da Fase 3 (Produtos):

10. **Produtos, preço abaixo do custo:** peça com saldo e margem negativa mostra a pílula de atenção "Preço abaixo do custo" no lugar de "Em estoque". Na Fase 4 isso vira também uma regra de atenção em `alertas-regras.js`.
11. **Produtos, "Sem preço":** na cor de atenção, sem negrito. No menu "⋯" dessa peça, "Definir preço" é a primeira opção.
12. **Produtos, "Ver venda":** mesmo formato e posição de "Vender" (botão secundário compacto, alinhado à direita).
13. **Produtos, ordem padrão:** mais recente primeiro (última entrada ou última venda).
14. **Dados de demonstração fixos** (`sql/90_demo_carregar.sql`, `sql/91_demo_apagar.sql`, `scripts\demo-*.bat`) usados em todas as conferências das fases seguintes. A coluna de compatibilidade (seção 9, item 1) foi criada antes, em `sql/14_compatibilidade_pecas.sql`, para esse conjunto.
