const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarScript } = require("./helpers/carregar-script");

const { parseMoedaBR, formatarEntradaMoedaBR } = carregarScript("js/moeda-utils.js").moedaUtils;

test("parseMoedaBR: ponto como milhar no padrao brasileiro", () => {
  assert.equal(parseMoedaBR("18.740,00"), 18740);
  assert.equal(parseMoedaBR("18.740"), 18740);
  assert.equal(parseMoedaBR("1.234.567,89"), 1234567.89);
});

test("parseMoedaBR: valor sem separador de milhar", () => {
  assert.equal(parseMoedaBR("18740,00"), 18740);
  assert.equal(parseMoedaBR("18740"), 18740);
});

test("parseMoedaBR: prefixo R$ e espacos", () => {
  assert.equal(parseMoedaBR("R$ 18.740,00"), 18740);
  assert.equal(parseMoedaBR("  R$18.740,00  "), 18740);
});

test("parseMoedaBR: centavos", () => {
  assert.equal(parseMoedaBR("0,50"), 0.5);
  assert.equal(parseMoedaBR("18,74"), 18.74);
  assert.equal(parseMoedaBR("18.74"), 18.74);
  assert.equal(parseMoedaBR("1.089,90"), 1089.9);
});

test("parseMoedaBR: vazio, invalido e numero ja convertido", () => {
  assert.equal(parseMoedaBR(""), 0);
  assert.equal(parseMoedaBR(null), 0);
  assert.equal(parseMoedaBR("abc"), 0);
  assert.equal(parseMoedaBR(18740), 18740);
  assert.equal(parseMoedaBR(Number.NaN), 0);
});

test("parseMoedaBR: negativo", () => {
  assert.equal(parseMoedaBR("-1.500,25"), -1500.25);
});

// Caso conhecido de baixa prioridade (investigacao de 2026-09-24): virgula usada como
// separador de milhar no padrao americano e lida como decimal. Este teste documenta o
// comportamento atual; se a regra mudar de proposito, atualize a expectativa.
test("parseMoedaBR: caso conhecido - '18,740' vira 18.74 (virgula lida como decimal)", () => {
  assert.equal(parseMoedaBR("18,740"), 18.74);
});

test("formatarEntradaMoedaBR: devolve o texto no padrao brasileiro", () => {
  assert.equal(formatarEntradaMoedaBR("18740"), "18.740,00");
  assert.equal(formatarEntradaMoedaBR("R$ 1.089,9"), "1.089,90");
});
