# Testes automatizados

O projeto usa o test runner nativo do Node (`node:test` + `node:assert`). Nao ha `package.json` nem dependencias para instalar; basta ter Node 20 ou superior.

## Como rodar

Na raiz do projeto:

```bash
node --test tests/
```

Para rodar um arquivo so:

```bash
node --test tests/moeda-utils.test.js
```

Resultado esperado: todas as linhas `ok` e `# fail 0` no final.

## O que esta coberto

| Arquivo | O que testa |
|---|---|
| `tests/moeda-utils.test.js` | Conversao de texto digitado para numero (`parseMoedaBR`): milhar com ponto, centavos, `R$`, vazio/invalido e o caso conhecido `18,740` -> `18.74`. |
| `tests/financeiro-utils.test.js` | Receita, lucro e margem por venda e por peca; regra `Custo nao calculado` sem consumo; agregado das 20 vendas da simulacao (receita R$ 31.848,20, custo R$ 22.822,40, margem 23,3%). |
| `tests/regressao-2026-09-24.test.js` | Bugs corrigidos em 2026-09-24: card e lista de vendas recentes com o mesmo limite (7) e alertas sem dupla contagem entre peca e entrada. |

## Como os testes carregam os scripts

Os arquivos de `js/` foram feitos para o navegador: nao usam `export` e alguns buscam elementos da pagina ao carregar. Para nao mudar esses arquivos so por causa dos testes, `tests/helpers/carregar-script.js` executa cada script num contexto isolado do Node (`node:vm`) com um `window` e um `document` minimos. As funcoes do script ficam acessiveis no objeto retornado:

```js
const { carregarScript } = require("./helpers/carregar-script");
const { parseMoedaBR } = carregarScript("js/moeda-utils.js").moedaUtils;
```

Arrays e objetos criados dentro do script vem de outro contexto; nos testes, compare valores simples (numeros, textos, contagens) em vez de `deepEqual` com arrays.

## Dados de teste

`tests/fixtures/vendas-simulacao-2026-07.json` tem as 20 vendas, 20 consumos e 12 custos de venda do banco `Autopp`, copiados em 2026-09-24. Sao dados da simulacao de rotina de loja, nao operacao real. Se o banco for limpo ou mudar, o fixture continua valido porque os testes nao acessam o banco.
