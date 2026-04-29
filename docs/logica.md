# Logica atual de estoque e custo medio

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

## Custo medio temporario

Por enquanto, o sistema usa custo medio:

```text
custo_medio = soma(valor_total das entradas do SKU) / soma(quantidade_total das entradas do SKU)
```

Esse custo medio e usado nos calculos de lucro.

## Lucro da peca

```text
lucro = receita - (quantidade_vendida x custo_medio) - custos_peca - custos_venda
```

## Observacao importante

Essa e uma regra temporaria. No futuro, se for necessario controlar exatamente qual lote saiu primeiro, o sistema pode evoluir para FIFO ou custo por lote.

## Etapa 1 FIFO: banco

Foi criada a base SQL para o FIFO em `sql/04_fifo.sql`.

Novas estruturas:

- `entradas_estoque`
  Guarda cada entrada/lote real de estoque.

- `venda_consumos_estoque`
  Guardara, no futuro, quais entradas foram consumidas por cada venda.

- `vw_saldos_entradas_estoque`
  Mostra o saldo de cada entrada:

```text
quantidade_disponivel = quantidade_total - quantidade_consumida
```

Nesta etapa ainda nao alteramos a venda. O sistema atual continua funcionando com custo medio/rateio enquanto preparamos a funcao FIFO.

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

A venda ainda nao foi alterada nesta etapa.

O SKU e usado apenas para encontrar ou criar a peca no cadastro. A entrada FIFO fica vinculada internamente pelo `peca_id`.

Na listagem principal de produtos, o sistema mostra `Estoque` como saldo real:

```text
estoque = quantidade total - quantidade vendida
```

A quantidade total continua existindo no banco, mas nao aparece como coluna principal para evitar confusao visual.

## Etapa 3 FIFO: funcao de venda

Foi criada a funcao SQL `registrar_venda_fifo` em `sql/05_fifo_funcoes.sql`.

Ela ainda nao substitui a funcao antiga `registrar_venda`.
No front, o cadastro de venda ja chama `registrar_venda_fifo` pelo `supabase-service.js`.
A funcao antiga continua existindo apenas como referencia/seguranca durante a evolucao do sistema.

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
