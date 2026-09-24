// Nome do tipo de custo: fica como foi digitado; duplicidade ignora maiusculas, acentos e espacos.
const test = require("node:test");
const assert = require("node:assert/strict");

const { carregarScript } = require("./helpers/carregar-script");

// Cliente Supabase falso (sem rede nem credencial) com uma tabela tipos_custo em memoria.
function carregarServicoComTipos(tiposExistentes) {
  const contexto = carregarScript("js/supabase-service.js");
  const escritas = [];

  function consulta(tabela) {
    let unico = false;
    let dadosEscritos = null;
    const builder = {
      select: () => builder, eq: () => builder, order: () => builder,
      insert: dados => { dadosEscritos = dados; escritas.push({ tabela, acao: "insert", dados }); return builder; },
      update: dados => { dadosEscritos = dados; escritas.push({ tabela, acao: "update", dados }); return builder; },
      single: () => { unico = true; return builder; },
      then: (resolver, rejeitar) => Promise.resolve({
        data: unico ? { id: 50, ...dadosEscritos } : tiposExistentes,
        error: null
      }).then(resolver, rejeitar)
    };
    return builder;
  }

  contexto.SUPABASE_CONFIG = { url: "https://exemplo-teste.supabase.co", anonKey: "chave-ficticia-de-teste" };
  contexto.supabase = { createClient: () => ({ from: consulta }) };

  return { servico: contexto.supabaseService, escritas };
}

const tiposBase = [
  { id: 1, nome: "Frete", categoria: "venda", ativo: true },
  { id: 2, nome: "Comissão", categoria: "venda", ativo: true },
  { id: 9, nome: "Tarifa mercado livre", categoria: "venda", ativo: true }
];

test("padronizarNomeTipoCusto mantem maiusculas e so tira espacos extras", () => {
  const { servico } = carregarServicoComTipos([]);

  assert.equal(servico.padronizarNomeTipoCusto("  Tarifa   Mercado Livre "), "Tarifa Mercado Livre");
  assert.equal(servico.padronizarNomeTipoCusto("frete"), "frete");
  assert.equal(servico.padronizarNomeTipoCusto(""), "");
});

test("chaveNomeTipoCusto ignora maiusculas, acentos e espacos", () => {
  const { servico } = carregarServicoComTipos([]);

  assert.equal(servico.chaveNomeTipoCusto(" COMISSAO "), servico.chaveNomeTipoCusto("Comissão"));
  assert.equal(servico.chaveNomeTipoCusto("Tarifa  Mercado Livre"), servico.chaveNomeTipoCusto("tarifa mercado livre"));
});

test("criarTipoCusto grava o nome como digitado", async () => {
  const { servico, escritas } = carregarServicoComTipos(tiposBase);
  const tipo = await servico.criarTipoCusto(" Taxa  Shopee ", "venda");

  assert.equal(escritas[0].dados.nome, "Taxa Shopee");
  assert.equal(tipo.nome, "Taxa Shopee");
});

test("criarTipoCusto recusa duplicado com outra caixa ou sem acento", async () => {
  const { servico, escritas } = carregarServicoComTipos(tiposBase);

  await assert.rejects(() => servico.criarTipoCusto("FRETE", "venda"), /Ja existe/);
  await assert.rejects(() => servico.criarTipoCusto("comissao", "venda"), /Ja existe/);
  assert.equal(escritas.length, 0);
});

test("atualizarTipoCusto corrige so a caixa do proprio tipo (nao conta como duplicado)", async () => {
  const { servico, escritas } = carregarServicoComTipos(tiposBase);
  const tipo = await servico.atualizarTipoCusto({ id: 9, nome: "Tarifa Mercado Livre", categoria: "venda", ativo: true });

  assert.equal(escritas[0].dados.nome, "Tarifa Mercado Livre");
  assert.equal(tipo.nome, "Tarifa Mercado Livre");
  await assert.rejects(
    () => servico.atualizarTipoCusto({ id: 9, nome: "frete", categoria: "venda", ativo: true }),
    /Ja existe/
  );
});

test("Analise de custos: nome cadastrado aparece como digitado; tipo antigo em minusculas ganha maiuscula", () => {
  const tela = carregarScript("js/analise-custos.js");

  assert.equal(tela.formatarNomeTipoCusto("Tarifa Mercado Livre"), "Tarifa Mercado Livre");
  assert.equal(tela.formatarNomeTipoCusto("Custo de frete"), "Custo de frete");
  assert.equal(tela.formatarNomeTipoCusto("frete"), "Frete");
  assert.equal(tela.formatarNomeTipoCusto(""), "Sem tipo");
});
