# Mapa mental do sistema de pecas usadas

Este mapa mostra o sistema como se fosse uma visao de cima. A ideia e ajudar a entender como as telas, os dados e os calculos se conectam.

```mermaid
mindmap
  root((Sistema de pecas usadas))
    Objetivo
      Controlar compras
      Controlar estoque
      Controlar custos
      Controlar vendas
      Calcular lucro

    Cadastros
      Origem
        Representa uma compra ou lote
        Guarda valor pago
        Exemplo: lote de pecas comprado por R$ 500
      Peca
        Pertence a uma origem
        Tem quantidade total
        Tem quantidade vendida
        Tem preco de venda
      Custo da peca
        Limpeza
        Conserto
        Embalagem
        Outros custos antes da venda
      Venda
        Escolhe uma peca
        Informa quantidade vendida
        Informa valor unitario
        Pode ter custos da venda

    Telas
      Inicio
        Atalhos para as areas principais
      Cadastro de origem
        Cria uma origem
        Salva valor pago
      Cadastro de peca
        Cria peca vinculada a origem
        Define quantidade
      Produtos
        Lista pecas
        Mostra estoque
        Mostra custo unitario
        Mostra custo vendido
        Mostra lucro
      Detalhes da origem
        Mostra pecas da origem
        Mostra rateio
        Mostra investimento
        Mostra total vendido
        Mostra lucro atual
        Mostra status financeiro
        Mostra faturamento
        Mostra resultado da origem
      Detalhes da peca
        Mostra dados completos
        Mostra custos
        Mostra vendas
        Mostra lucro da peca
      Cadastro de venda
        Registra venda
        Baixa quantidade disponivel
      Historico de vendas
        Lista vendas feitas
      Relatorios
        Resumo geral do sistema

    Banco de dados
      Supabase
        Guarda os dados online
        Usa PostgreSQL
      Tabelas principais
        origens
          id
          descricao
          valor pago
          data da compra
        pecas
          id
          origem id
          nome
          quantidade
          quantidade vendida
          preco venda
        custos peca
          peca id
          tipo
          descricao
          valor
        vendas
          peca id
          quantidade vendida
          valor unitario
          valor total
        custos venda
          venda id
          tipo
          valor

    Logica de estoque
      Quantidade total
        Quantas unidades existem da peca
      Quantidade vendida
        Quantas unidades ja sairam
      Quantidade disponivel
        quantidade total menos quantidade vendida
      Status
        Em estoque
        Vendida

    Logica de custo base
      Origem tem valor pago
      Pecas pertencem a origem
      Cada peca tem quantidade
      Total de unidades
        Soma das quantidades das pecas da origem
      Custo unitario
        valor pago da origem dividido pelo total de unidades
      Custo vendido
        quantidade vendida vezes custo unitario

    Logica de lucro
      Receita
        quantidade vendida vezes valor unitario de venda
      Resultado da origem
        investimento igual valor pago da origem
        total vendido igual vendas das pecas da origem
        lucro atual igual receita menos custos
        status mostra se deu lucro ou ainda nao pagou
      Custos da peca
        limpeza
        conserto
        preparo
        outros
      Custos da venda
        embalagem
        comissao
        frete
        outros
      Formula
        lucro igual receita menos custo vendido menos custos da peca menos custos da venda

    Fluxo principal
      Cadastrar origem
        Informa valor pago
      Cadastrar pecas
        Vincula cada peca a origem
        Informa quantidade
      Sistema calcula rateio
        Divide valor da origem pelo total de unidades
      Lancar custos
        Adiciona gastos extras da peca
      Vender peca
        Informa quantidade e valor
        Sistema atualiza quantidade vendida
      Conferir resultado
        Produtos
        Detalhes
        Relatorios

    Arquivos do projeto
      paginas
        Arquivos HTML das telas
      css
        style.css
        Visual do sistema
      js
        Regras e interacoes do front-end
        Conexao com Supabase
      sql
        Tabelas e funcoes do banco
      docs
        Documentacao para estudo
```

## Explicacao simples do sistema

O sistema comeca por uma **origem**. A origem representa uma compra, um lote ou uma entrada de pecas. Ela tem um valor pago.

Depois voce cadastra as **pecas** dessa origem. Cada peca tem uma quantidade. O sistema usa essas quantidades para descobrir o custo base real de cada unidade.

Exemplo:

```text
Origem: lote comprado por R$ 500

Pecas da origem:
- Peca A: quantidade 2
- Peca B: quantidade 3

Total de unidades = 2 + 3 = 5
Custo unitario = 500 / 5 = R$ 100
```

Se vender 2 unidades, o custo base vendido sera:

```text
2 x R$ 100 = R$ 200
```

O lucro aparece depois que o sistema compara o dinheiro que entrou com os custos:

```text
lucro = receita - custo vendido - custos da peca - custos da venda
```

## Como pensar no projeto

Pense no sistema em quatro partes:

1. **Entrada**
   Origem e pecas entram no estoque.

2. **Preparacao**
   Custos extras podem ser adicionados na peca.

3. **Saida**
   A venda registra quantas unidades foram vendidas e por quanto.

4. **Resultado**
   Produtos, detalhes e relatorios mostram estoque, custo e lucro.

## Onde olhar quando tiver duvida

- Para entender telas: veja a pasta `paginas`.
- Para entender visual: veja `css/style.css`.
- Para entender regras do front-end: veja a pasta `js`.
- Para entender banco de dados: veja a pasta `sql`.
- Para estudar o sistema: veja a pasta `docs`.
