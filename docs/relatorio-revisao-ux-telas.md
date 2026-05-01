# Relatorio de revisao UX das telas

Data: 2026-04-30

## Objetivo

Separar melhor as telas operacionais, de analise e de detalhes:

- telas operacionais mostram somente informacoes necessarias para a acao;
- telas de analise mantem dinheiro, lucro, custo e resultado;
- telas de detalhes mantem informacao completa.

## Telas operacionais ajustadas

### produtos.html

- Removida a comunicacao de "custos, vendas e lucro" do texto da tela.
- A tela passou a ser apresentada como lista operacional para estoque, venda, custo e detalhes.
- Nenhuma regra de calculo foi alterada.

### lotes.html

- Removida a coluna "Custo unitario" da listagem operacional.
- Mantidos SKU, peca, origem, data, quantidades, saldo, status e alertas.
- O custo unitario continua disponivel nas telas de detalhes.

### historico-vendas.html

- Removido o card "Faturamento total".
- Removidas as colunas "Preco unitario" e "Valor total".
- Mantidos data, produto, ID da peca, quantidade, canal e acoes.
- Valores completos continuam em detalhes da venda e analise por periodo.

### cadastro-venda.html

- Mantido o valor unitario porque ele e necessario para registrar a venda.
- Custos da venda foram agrupados em uma area opcional expansivel.
- Adicionado o campo "Outros custos", que ja era lido pelo JavaScript.
- Nenhuma regra de calculo foi alterada.

### cadastro-custo.html

- O resumo da peca deixou de exibir custo base, custos diversos e custo total.
- O resumo passou a mostrar peca, ID e estoque disponivel.
- A lista de custos cadastrados deixou de exibir a coluna de valor.
- Os valores completos continuam nas telas de detalhes e analises.

### listar-origens.html

- Removido o card "Valor total investido".
- Removidas as colunas "Valor pago" e "Custo unitario".
- Mantidos dados operacionais de tipo, SKU, quantidade, descricao, observacoes e acoes.
- Valores completos continuam em detalhes da origem.

### painel.html

- O painel geral deixou de se apresentar como visao financeira.
- Cards financeiros foram substituidos por cards operacionais.
- A tabela "Resultado por origem" foi removida do painel.
- Criados atalhos para as telas de analise financeira.
- A tabela de ultimas vendas deixou de exibir valor total.

## Telas de analise preservadas

- analise-produto.html
- analise-periodo.html
- analise-custos.html

Essas telas continuam exibindo receita, custos, lucro, totais e percentuais.

## Telas de detalhes preservadas

- detalhes-produto.html
- detalhes-venda.html
- detalhes-origem.html

Essas telas continuam sendo o lugar da informacao completa, incluindo custos, valores e resultados.

## Regras respeitadas

- Banco de dados nao foi alterado.
- Logica de calculo nao foi alterada.
- Dados financeiros nao foram removidos das telas de analise ou detalhes.
- Codigo importante foi preservado.
- As mudancas foram concentradas em exibicao, textos, colunas e organizacao visual.
