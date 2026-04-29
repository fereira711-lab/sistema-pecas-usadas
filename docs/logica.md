# Logica atual de estoque, FIFO e lucro real

O fluxo principal do sistema agora e:

```text
entrada por lote -> venda consome FIFO -> lucro real por venda
```

Isso significa que cada compra/entrada gera um lote de estoque. Quando acontece uma venda, o sistema baixa primeiro os lotes mais antigos e registra exatamente quanto custou aquela venda.

## Entrada de estoque

A origem agora representa uma entrada real de estoque.

Cada entrada deve ter:

- SKU do produto
- quantidade total da entrada
- valor total da entrada
- data da compra

O SKU liga a entrada ao produto ja cadastrado. Assim, o mesmo produto pode receber varias entradas sem criar produto duplicado.

## Atualizacao do estoque

Ao cadastrar uma origem:

1. O sistema procura uma peca com o mesmo SKU.
2. Se encontrar, usa essa peca existente.
3. Se nao encontrar, cria uma nova peca com o SKU e nome informados.
4. Depois disso, o vinculo interno passa a ser por `peca_id`.
5. Soma a `quantidade_total` da origem na quantidade atual da peca.

Na tela de origem, ao digitar o SKU ou o nome da peca, o sistema sugere produtos ja cadastrados.
Quando uma sugestao e selecionada, os campos de SKU e nome sao preenchidos automaticamente.
Essa selecao ajuda o cadastro a reutilizar a peca existente em vez de criar produto duplicado.

## Custo base atual

A regra principal de custo agora vem do FIFO.

Cada origem cria uma entrada em `entradas_estoque` com:

- quantidade total
- quantidade consumida
- custo unitario
- data da entrada

O custo unitario da entrada e:

```text
custo_unitario = valor_total da origem / quantidade_total da origem
```

Quando uma venda acontece, a funcao FIFO grava em `venda_consumos_estoque` quais lotes foram consumidos.
Esse registro passa a ser a fonte principal do custo real.

## Lucro da peca

```text
lucro = receita - custo_fifo_consumido - custos_peca - custos_venda
```

Onde:

- `receita` = soma de `vendas.valor_unitario x vendas.quantidade_vendida`
- `custo_fifo_consumido` = soma de `venda_consumos_estoque.custo_total`
- `custos_peca` = custos extras da peca
- `custos_venda` = embalagem, comissao, frete e outros custos da venda

## Fallback temporario

O custo medio/rateio nao e mais a regra principal.
Ele fica apenas como fallback temporario para vendas antigas que ainda nao possuem registro em `venda_consumos_estoque`.

Fallback:

```text
custo_fallback = quantidade_vendida x custo_medio_ou_rateio
```

Assim, as telas continuam mostrando lucro mesmo para registros antigos, sem quebrar o sistema.

## Etapa 1 FIFO: banco

Foi criada a base SQL para o FIFO em `sql/04_fifo.sql`.

Novas estruturas:

- `entradas_estoque`
  Guarda cada entrada/lote real de estoque.

- `venda_consumos_estoque`
  Guarda quais entradas/lotes foram consumidos por cada venda.

- `vw_saldos_entradas_estoque`
  Mostra o saldo de cada entrada:

```text
quantidade_disponivel = quantidade_total - quantidade_consumida
```

Essa estrutura e a base do controle por lote. O custo medio/rateio ficou apenas como fallback para registros antigos.

Antes de testar o cadastro de origem no Supabase, execute `sql/04_fifo.sql` no SQL Editor. Esse arquivo tambem garante os campos:

- `origens.produto_sku`
- `origens.quantidade_total`
- `pecas.sku`

Ele tambem define `origens.custo_tipo` como `compra` quando esse campo estiver vazio, porque alguns bancos antigos estao com essa coluna obrigatoria.

Se existir o constraint antigo `origens_custo_tipo_check`, o SQL recria essa regra aceitando:

- `compra`
- `frete`
- `outro`
- `real`
- `rateado`
- `simbolico`

O arquivo tambem recria as regras antigas `origens_tipo_origem_check` e `origens_tipo_check`.
Isso evita erro ao salvar origem quando o front envia os tipos usados nas telas:

- `Compra avulsa`
- `Carro para desmonte`
- `Lote`

No final, ele executa:

```sql
notify pgrst, 'reload schema';
```

Isso ajuda o Supabase a atualizar o cache da API depois das alteracoes de tabela.

## Etapa 2 FIFO: criar entrada ao cadastrar origem

Ao cadastrar uma origem, o front agora tambem cria um registro em `entradas_estoque`.

Fluxo:

1. Buscar a peca pelo SKU informado na origem.
2. Se a peca nao existir, ela sera criada a partir dos dados do formulario.
3. Salvar a origem.
4. Calcular:

```text
custo_unitario = valor_total / quantidade_total
```

5. Inserir em `entradas_estoque`:

- `peca_id`
- `origem_id`
- `quantidade_total`
- `quantidade_consumida = 0`
- `custo_unitario`
- `data_entrada`

6. Manter o fluxo atual de estoque:

```text
pecas.quantidade = pecas.quantidade + quantidade_total da origem
```

A venda ja usa FIFO no fluxo atual do sistema.

O SKU e usado apenas para encontrar ou criar a peca no cadastro. A entrada FIFO fica vinculada internamente pelo `peca_id`.

Na listagem principal de produtos, o sistema mostra `Estoque` como saldo real:

```text
estoque = quantidade total - quantidade vendida
```

A quantidade total continua existindo no banco, mas nao aparece como coluna principal para evitar confusao visual.

## Etapa 3 FIFO: funcao de venda

Foi criada a funcao SQL `registrar_venda_fifo` em `sql/05_fifo_funcoes.sql`.

No front, o cadastro de venda ja chama `registrar_venda_fifo` pelo `supabase-service.js`.
A funcao antiga `registrar_venda` continua existindo no banco apenas como referencia/seguranca durante a evolucao do sistema.

Fluxo da funcao FIFO:

1. Recebe a peca, quantidade vendida, valor unitario, canal de venda e custos opcionais.
2. Confere se a peca existe.
3. Confere se existe estoque suficiente na peca.
4. Confere se existe saldo suficiente nas entradas FIFO.
5. Cria a venda em `vendas`.
6. Busca as entradas da peca em ordem:

```text
data_entrada, id
```

7. Consome primeiro a entrada mais antiga.
8. Se a venda precisar de mais de um lote, divide o consumo entre os lotes.
9. Atualiza `entradas_estoque.quantidade_consumida`.
10. Registra cada consumo em `venda_consumos_estoque`.
11. Registra custos opcionais em `custos_venda`.
12. Atualiza `pecas.quantidade_vendida`.

Se nao houver estoque FIFO suficiente, a funcao bloqueia a venda com erro.

Como a funcao roda dentro do PostgreSQL, tudo acontece em uma transacao:

```text
ou salva tudo
ou nao salva nada
```

## Etapa 4 FIFO: lucro real nas telas

As telas financeiras usam `venda_consumos_estoque` como fonte principal do custo vendido.

### Produtos

```text
lucro da peca = receita da peca - custo FIFO consumido - custos_peca - custos_venda
```

A listagem de produtos tambem mostra o estoque real:

```text
estoque = quantidade total - quantidade vendida
```

### Detalhes da origem

A origem representa uma entrada/lote.
No lucro da origem, o sistema considera apenas o custo ja consumido por vendas FIFO.

Receita da origem:

```text
soma(consumo.quantidade_consumida x venda.valor_unitario)
```

Custo da origem:

```text
soma(consumo.custo_total) dos lotes ligados a origem
```

Lucro da origem:

```text
receita da origem - custo FIFO consumido da origem - custos_peca - custos_venda
```

Importante:
o sistema nao desconta `valor_total` da origem de novo, porque esse custo ja entra aos poucos conforme os lotes sao consumidos.
Descontar o investimento total e tambem o FIFO consumido duplicaria o custo.

### Painel geral

```text
total vendido - custo FIFO consumido - custos_peca - custos_venda
```

O painel tambem mostra o custo FIFO vendido para deixar claro quanto do estoque comprado ja virou custo real de venda.

Fallback temporario:

Se uma venda antiga ainda nao tiver registro em `venda_consumos_estoque`, o front usa o calculo antigo por custo medio/rateio apenas para essa venda.

## Tela de lotes FIFO

Foi criada a tela `paginas/lotes.html` com o script `js/lotes.js`.

Ela mostra as entradas reais de estoque:

- SKU da peca
- nome da peca
- origem
- data da entrada
- quantidade total
- quantidade consumida
- saldo disponivel
- custo unitario
- status do lote

Status possiveis:

- `disponivel`
- `parcialmente consumido`
- `esgotado`

Essa tela e apenas uma consulta. Ela nao altera venda, estoque ou FIFO.

## Detalhamento FIFO por venda

A tela `paginas/detalhes-venda.html` mostra o custo FIFO detalhado da venda.

Para cada registro em `venda_consumos_estoque`, o sistema exibe:

- lote consumido
- origem do lote
- quantidade consumida
- custo unitario
- custo total

Exemplo visual:

```text
Custo detalhado:
2x Lote 1 -> R$ 100,00
1x Lote 2 -> R$ 180,00
```

O resumo financeiro da venda usa o custo FIFO quando a venda possui consumos registrados.
Se a venda ainda nao tiver consumo FIFO, a tela mostra uma mensagem e usa o fallback temporario.

## Arquivos principais da logica atual

- `sql/04_fifo.sql`
  Cria a estrutura de entradas, consumos e saldo dos lotes.

- `sql/05_fifo_funcoes.sql`
  Cria a funcao `registrar_venda_fifo`, que registra a venda e consome os lotes em ordem FIFO.

- `js/supabase-service.js`
  Centraliza as chamadas ao Supabase, incluindo venda FIFO, entradas de estoque e consumos FIFO.

- `js/produtos.js`
  Calcula lucro da peca usando FIFO e fallback temporario.

- `js/detalhes-origem.js`
  Calcula resultado da origem sem duplicar o investimento.

- `js/painel-geral.js`
  Calcula lucro geral usando custo FIFO consumido.

- `js/lotes.js`
  Lista entradas/lotes e seus saldos.

- `js/detalhes-venda.js`
  Mostra o detalhamento do custo FIFO por venda.
