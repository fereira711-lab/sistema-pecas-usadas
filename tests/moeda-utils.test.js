const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarScript } = require("./helpers/carregar-script");

const { parseMoedaBR, formatarEntradaMoedaBR, formatarMoedaBR, formatarPercentualBR } = carregarScript("js/moeda-utils.js").moedaUtils;
const MENOS = "−";
const semEspacoFixo = texto => texto.replace(/ /g, " ");

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

test("formatarMoedaBR: negativo usa o sinal de menos (U+2212), nao hifen", () => {
  assert.equal(semEspacoFixo(formatarMoedaBR(-30)), `${MENOS}R$ 30,00`);
  assert.equal(semEspacoFixo(formatarMoedaBR(1725.3 * -1)), `${MENOS}R$ 1.725,30`);
  assert.equal(semEspacoFixo(formatarMoedaBR(18740)), "R$ 18.740,00");
  assert.ok(!formatarMoedaBR(-1).includes("-"));
});

test("parseMoedaBR: le de volta o valor formatado com o sinal de menos", () => {
  assert.equal(parseMoedaBR(formatarMoedaBR(-1500.25)), -1500.25);
  assert.equal(parseMoedaBR(`${MENOS}R$ 30,00`), -30);
});

test("formatarPercentualBR: casas decimais e sinal de menos", () => {
  assert.equal(formatarPercentualBR(36.2857), "36,3%");
  assert.equal(formatarPercentualBR(-109.2), `${MENOS}109,2%`);
  assert.equal(formatarPercentualBR(-6.6667), `${MENOS}6,7%`);
  assert.equal(formatarPercentualBR(0), "0,0%");
});

test("formatarEntradaMoedaBR: devolve o texto no padrao brasileiro", () => {
  assert.equal(formatarEntradaMoedaBR("18740"), "18.740,00");
  assert.equal(formatarEntradaMoedaBR("R$ 1.089,9"), "1.089,90");
});
