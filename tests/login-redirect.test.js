// Login: o ?redirect= só aceita caminho dentro do próprio sistema (começando com "/");
// qualquer outro valor é recusado e o login abre o Painel (js/auth.js, validarDestinoRetorno).
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarScript } = require("./helpers/carregar-script");

const { validarDestinoRetorno } = carregarScript("js/auth.js").authRetorno;

test("redirect: caminhos do próprio sistema são aceitos como estão", () => {
  const validos = [
    "/painel.html",
    "/paginas/produtos.html",
    "/paginas/detalhes-produto.html?pecaId=188",
    "/paginas/detalhes-produto.html?editar=1&campo=preco#excluir",
    "/paginas/produtos.html?origemId=24&situacao=vendidas"
  ];

  validos.forEach(destino => assert.equal(validarDestinoRetorno(destino), destino, destino));
  assert.equal(validarDestinoRetorno("  /painel.html  "), "/painel.html");
});

test("redirect: outro site, esquema e caminho sem barra são recusados", () => {
  const tab = String.fromCharCode(9);
  const quebraLinha = String.fromCharCode(10);
  const nulo = String.fromCharCode(0);
  const barraInvertida = String.fromCharCode(92);

  const maliciosos = [
    "https://site-externo.com",
    "http://site-externo.com/paginas/produtos.html",
    "//site-externo.com",
    "///site-externo.com",
    "/" + barraInvertida + "site-externo.com",
    barraInvertida + barraInvertida + "site-externo.com",
    "/paginas/" + barraInvertida + "..",
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "/javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "paginas/produtos.html",
    "painel.html",
    "%2F%2Fsite-externo.com",
    "/" + tab + "/site-externo.com",
    "/painel.html" + quebraLinha + "Location: https://site-externo.com",
    "/painel.html" + nulo,
    "",
    "   ",
    null,
    undefined
  ];

  maliciosos.forEach(destino => assert.equal(validarDestinoRetorno(destino), null, JSON.stringify(destino)));
});
