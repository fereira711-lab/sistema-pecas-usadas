// Nova peca (Fase 5): SKU automatico so quando em branco e previa do resumo lateral.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarScript } = require("./helpers/carregar-script");

const { supabaseService } = carregarScript("js/supabase-service.js");
const financeiroUtils = carregarScript("js/financeiro-utils.js").financeiroUtils;

// Cliente Supabase falso: guarda as chamadas de rpc e responde as consultas com dados minimos.
// Nao usa rede nem credencial; a URL e a chave sao ficticias.
function carregarServicoComClienteFalso() {
  const contexto = carregarScript("js/supabase-service.js");
  const chamadasRpc = [];

  function consulta(tabela) {
    let unico = false;
    const builder = {
      select: () => builder, eq: () => builder, ilike: () => builder, order: () => builder,
      maybeSingle: () => { unico = true; return builder; },
      single: () => { unico = true; return builder; },
      then: (resolver, rejeitar) => Promise.resolve({
        data: unico ? (tabela === "pecas" ? { id: 1, nome_peca: "Peca", sku: "P-000001" } : { id: 2, peca_id: 1 }) : [],
        error: null
      }).then(resolver, rejeitar)
    };
    return builder;
  }

  contexto.SUPABASE_CONFIG = { url: "https://exemplo-teste.supabase.co", anonKey: "chave-ficticia-de-teste" };
  contexto.supabase = {
    createClient: () => ({
      from: consulta,
      rpc: async (nome, parametros) => {
        chamadasRpc.push({ nome, parametros });
        return { data: [{ peca_id: 1, entrada_id: 2 }], error: null };
      }
    })
  };

  return { servico: contexto.supabaseService, chamadasRpc };
}

test("criarPecaComEntrada: sem os campos novos, manda nulo (a funcao usa data da origem, preco 0 e sem compatibilidade)", async () => {
  const { servico, chamadasRpc } = carregarServicoComClienteFalso();

  await servico.criarPecaComEntrada({ sku: "far-01", nome: "Farol", origemId: 17, quantidade: 1, valorAtribuidoEntrada: 120 });

  assert.equal(chamadasRpc.length, 1);
  assert.equal(chamadasRpc[0].nome, "criar_peca_com_entrada");
  const p = chamadasRpc[0].parametros;
  assert.equal(p.p_sku, "FAR-01");
  assert.equal(p.p_data_entrada, null);
  assert.equal(p.p_preco_venda, null);
  assert.equal(p.p_compatibilidade, null);
});

test("criarPecaComEntrada: data, preco e compatibilidade vao juntos na mesma chamada da funcao", async () => {
  const { servico, chamadasRpc } = carregarServicoComClienteFalso();

  await servico.criarPecaComEntrada({
    sku: "P-000001", nome: "Farol", origemId: 17, quantidade: 2, valorAtribuidoEntrada: 240,
    dataEntrada: "2026-09-22", precoVenda: 260, compatibilidade: "  HB20 2012–2015 "
  });

  assert.equal(chamadasRpc.length, 1);
  const p = chamadasRpc[0].parametros;
  assert.equal(p.p_data_entrada, "2026-09-22");
  assert.equal(p.p_preco_venda, 260);
  assert.equal(p.p_compatibilidade, "HB20 2012–2015");
  assert.equal(p.p_quantidade, 2);
  assert.equal(p.p_valor_atribuido, 240);
});

function carregarTela() {
  const tela = carregarScript("js/peca.js");
  tela.financeiroUtils = financeiroUtils;
  return tela;
}

test("SKU automatico: proximo P-numero depois do maior ja usado, ignorando SKUs livres", () => {
  assert.equal(supabaseService.calcularProximoSkuAutomatico([]), "P-000001");
  assert.equal(supabaseService.calcularProximoSkuAutomatico(["FAR-0232", "p-000007", "P-000003", "P-12X", "DM-ONX-01"]), "P-000008");
});

test("Nova peca: distribuicao da origem soma quantidade x custo das entradas dela", () => {
  const tela = carregarTela();
  const distribuicao = tela.calcularDistribuicaoOrigem({ id: 17, valorPago: 1800 }, [
    { origemId: 17, quantidadeTotal: 3, custoUnitario: 50 },
    { origemId: 17, quantidadeTotal: 1, custoUnitario: 950 },
    { origemId: 16, quantidadeTotal: 1, custoUnitario: 900 }
  ]);

  assert.equal(distribuicao.valorDistribuido, 1100);
  assert.equal(distribuicao.restante, 700);
});

test("Nova peca: previa com margem, lucro previsto e quanto a origem fica a distribuir", () => {
  const tela = carregarTela();
  const distribuicao = { valorPago: 1800, valorDistribuido: 1100, restante: 700 };

  const umaUnidade = tela.calcularPreviaPeca({ quantidade: 1, custoUnitario: 190, preco: 489.9, distribuicao });
  assert.equal(umaUnidade.valorAtribuido, 190);
  assert.equal(Math.round(umaUnidade.margem), 61);
  assert.equal(Number(umaUnidade.lucro.toFixed(2)), 299.9);
  assert.equal(umaUnidade.restanteDepois, 510);

  // Tres unidades: lucro previsto multiplica; passar do valor da origem fica negativo.
  const tres = tela.calcularPreviaPeca({ quantidade: 3, custoUnitario: 300, preco: 250, distribuicao });
  assert.equal(tres.lucro, -150);
  assert.ok(tres.margem < 0);
  assert.equal(tres.restanteDepois, -200);

  // Sem preco: sem margem nem lucro (nao inventa).
  const semPreco = tela.calcularPreviaPeca({ quantidade: 1, custoUnitario: 100, preco: null, distribuicao });
  assert.equal(semPreco.margem, null);
  assert.equal(semPreco.lucro, null);
});
