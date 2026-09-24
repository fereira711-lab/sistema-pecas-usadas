// Registrar venda (Fase 6): previa do resultado antes de registrar, com o custo da peca
// estimado na mesma ordem de consumo do banco (data da entrada e depois id).
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregarScript } = require("./helpers/carregar-script");

const financeiroUtils = carregarScript("js/financeiro-utils.js").financeiroUtils;

const entradas = [
  { id: 20, pecaId: 1, quantidadeTotal: 2, quantidadeConsumida: 0, custoUnitario: 90, dataEntrada: "2026-08-01" },
  { id: 10, pecaId: 1, quantidadeTotal: 3, quantidadeConsumida: 2, custoUnitario: 80, dataEntrada: "2026-07-01" },
  { id: 30, pecaId: 1, quantidadeTotal: 1, quantidadeConsumida: 0, custoUnitario: 70, dataEntrada: "2026-08-01" },
  { id: 40, pecaId: 2, quantidadeTotal: 5, quantidadeConsumida: 0, custoUnitario: 999, dataEntrada: "2026-01-01" }
];

test("estimarCustoVendaPeca: com 1 unidade e o mesmo custo de calcularCustoReferenciaPeca", () => {
  const referencia = financeiroUtils.calcularCustoReferenciaPeca(1, entradas, []);
  const estimativa = financeiroUtils.estimarCustoVendaPeca(1, 1, entradas);

  assert.equal(referencia.valor, 80);
  assert.equal(estimativa.valor, referencia.valor);
  assert.equal(estimativa.calculado, true);
});

test("estimarCustoVendaPeca: varias unidades seguem a ordem de consumo (data, depois id)", () => {
  // Saldo: entrada 10 (1 un. a 80), depois 20 (2 un. a 90, mesma data que a 30 mas id menor), depois 30 (1 un. a 70).
  const tres = financeiroUtils.estimarCustoVendaPeca(1, 3, entradas);
  assert.equal(tres.valor, 80 + 90 + 90);
  assert.deepEqual(Array.from(tres.partes, parte => [parte.entradaId, parte.quantidade]), [[10, 1], [20, 2]]);

  const quatro = financeiroUtils.estimarCustoVendaPeca(1, 4, entradas);
  assert.equal(quatro.valor, 80 + 90 + 90 + 70);
});

test("estimarCustoVendaPeca: sem estoque suficiente nao calcula (nao inventa custo)", () => {
  const cinco = financeiroUtils.estimarCustoVendaPeca(1, 5, entradas);
  assert.equal(cinco.calculado, false);
  assert.equal(cinco.valor, null);
  assert.equal(cinco.quantidadeSemEstoque, 1);
});

test("Registrar venda: previa com receita, custo da peca, custos da venda, lucro e margem", () => {
  const tela = carregarScript("js/venda.js");
  tela.financeiroUtils = financeiroUtils;

  const previa = tela.calcularPreviaVenda({
    pecaId: 1, quantidade: 1, valorUnitario: 200, custosVenda: [{ valor: 25 }, { valor: 10 }], entradas
  });
  assert.equal(previa.receita, 200);
  assert.equal(previa.custoPeca, 80);
  assert.equal(previa.custosVenda, 35);
  assert.equal(previa.lucro, 85);
  assert.equal(previa.margem, 42.5);

  // Prejuizo aparece negativo; sem estoque, lucro e margem ficam em branco.
  assert.equal(tela.calcularPreviaVenda({ pecaId: 1, quantidade: 1, valorUnitario: 60, custosVenda: [], entradas }).lucro, -20);
  const semEstoque = tela.calcularPreviaVenda({ pecaId: 1, quantidade: 9, valorUnitario: 100, custosVenda: [], entradas });
  assert.equal(semEstoque.custoPeca, null);
  assert.equal(semEstoque.lucro, null);
  assert.equal(semEstoque.quantidadeSemEstoque, 5);
});

// Cliente Supabase falso (sem rede nem credencial): guarda as chamadas de rpc e as escritas diretas.
function carregarServicoComClienteFalso() {
  const contexto = carregarScript("js/supabase-service.js");
  const chamadas = { rpc: [], escritas: [] };

  function consulta(tabela) {
    let unico = false;
    const builder = {
      select: () => builder, eq: () => builder, ilike: () => builder, order: () => builder, in: () => builder,
      insert: dados => { chamadas.escritas.push({ tabela, dados }); return builder; },
      update: dados => { chamadas.escritas.push({ tabela, dados }); return builder; },
      maybeSingle: () => { unico = true; return builder; },
      single: () => { unico = true; return builder; },
      then: (resolver, rejeitar) => Promise.resolve({
        data: unico ? { id: 1, nome_peca: "Farol", sku: "DM-LOT-02", quantidade: 1, quantidade_vendida: 1 } : [],
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
        chamadas.rpc.push({ nome, parametros });
        return { data: 99, error: null };
      }
    })
  };

  return { servico: contexto.supabaseService, chamadas };
}

const vendaBase = { pecaId: 1, quantidadeVendida: 1, valorUnitario: 240, canalVenda: "WhatsApp", dataVenda: "2026-09-24" };

test("salvarVenda: sem custos nem observacao, manda nulo (caso antigo) e nao grava nada fora da funcao", async () => {
  const { servico, chamadas } = carregarServicoComClienteFalso();

  await servico.salvarVenda({ ...vendaBase, custosVenda: [] });

  assert.equal(chamadas.rpc.length, 1);
  assert.equal(chamadas.rpc[0].nome, "registrar_venda_fifo");
  assert.equal(chamadas.rpc[0].parametros.p_custos, null);
  assert.equal(chamadas.rpc[0].parametros.p_observacoes, null);
  assert.equal(chamadas.escritas.length, 0);
});

test("salvarVenda: custos e observacao vao na mesma chamada da funcao (sem segundo passo)", async () => {
  const { servico, chamadas } = carregarServicoComClienteFalso();

  await servico.salvarVenda({
    ...vendaBase,
    observacoes: " Pedido 123 ",
    custosVenda: [
      { tipoCusto: "Frete", tipoCustoId: "5", valor: 25 },
      { tipoCusto: "Embalagem", tipoCustoId: "3", valor: 0 },
      { tipoCusto: "Tarifa mercado livre", tipoCustoId: "9", valor: 26.4 }
    ]
  });

  assert.equal(chamadas.rpc.length, 1);
  const p = chamadas.rpc[0].parametros;
  assert.deepEqual(JSON.parse(JSON.stringify(p.p_custos)), [{ tipo_custo_id: 5, valor: 25 }, { tipo_custo_id: 9, valor: 26.4 }]);
  assert.equal(p.p_observacoes, "Pedido 123");
  assert.equal(chamadas.escritas.length, 0);
});

test("salvarVenda: custo sem tipo cadastrado e recusado antes de chamar a funcao", async () => {
  const { servico, chamadas } = carregarServicoComClienteFalso();

  await assert.rejects(
    servico.salvarVenda({ ...vendaBase, custosVenda: [{ tipoCusto: "Comissão", valor: 10 }] }),
    /tipo de custo cadastrado/
  );
  assert.equal(chamadas.rpc.length, 0);
});
