const params = new URLSearchParams(window.location.search);
const origemId = Number(params.get("origemId"));

const tituloOrigem = document.getElementById("tituloOrigem");
const subtituloOrigem = document.getElementById("subtituloOrigem");
const mensagemOrigemNaoEncontrada = document.getElementById("mensagemOrigemNaoEncontrada");
const dadosOrigem = document.getElementById("dadosOrigem");
const resumoOrigem = document.getElementById("resumoOrigem");
const mensagemProdutosOrigem = document.getElementById("mensagemProdutosOrigem");
const tabelaProdutosOrigem = document.getElementById("tabelaProdutosOrigem");
const campoBuscaPecasOrigem = document.getElementById("buscaPecasOrigem");

let dadosDetalhesOrigem = { origem: null, pecas: [], custos: [], vendas: [] };

async function carregarOrigem(origemId) {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      return await window.supabaseService.buscarOrigemPorId(origemId);
    } catch (erro) {
      console.error("Erro ao carregar origem do Supabase:", erro);
      mensagemOrigemNaoEncontrada.textContent = "Nao foi possivel carregar a origem do Supabase.";
    }
  }

  mensagemOrigemNaoEncontrada.textContent = "Configure o Supabase para carregar os detalhes da origem.";
  return null;
}

async function carregarPecasDaOrigem(origemId) {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      return await window.supabaseService.listarPecasPorOrigem(origemId);
    } catch (erro) {
      console.error("Erro ao carregar pecas da origem do Supabase:", erro);
    }
  }

  return [];
}

async function carregarFinanceiroDaOrigem(pecasDaOrigem) {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemOrigemNaoEncontrada.textContent = "Configure o Supabase para calcular o resultado financeiro da origem sem usar dados temporarios do navegador.";
    return { custos: [], vendas: [] };
  }

  const idsPecas = pecasDaOrigem.map(peca => Number(peca.id));

  try {
    const [vendas, custosPeca, custosVenda] = await Promise.all([
      window.supabaseService.listarVendas(),
      window.supabaseService.listarCustosPeca(),
      window.supabaseService.listarCustosVenda()
    ]);

    const vendasDaOrigem = vendas.filter(venda => idsPecas.includes(Number(venda.pecaId || 0)));
    const idsVendasDaOrigem = vendasDaOrigem.map(venda => Number(venda.id));
    const custosPecaDaOrigem = custosPeca.filter(custo => idsPecas.includes(Number(custo.pecaId || 0)));
    const custosVendaDaOrigem = custosVenda.filter(custo => idsVendasDaOrigem.includes(Number(custo.vendaId || 0)));
    const custosVendaPorVenda = agruparCustosVendaPorVenda(custosVendaDaOrigem);
    const vendasComCustos = vendasDaOrigem.map(venda => {
      const custosDaVenda = custosVendaPorVenda[Number(venda.id)] || [];

      return {
        ...venda,
        custosVenda: custosDaVenda,
        totalCustosVenda: somarCampo(custosDaVenda, "valor")
      };
    });

    return {
      custos: custosPecaDaOrigem,
      vendas: vendasComCustos
    };
  } catch (erro) {
    console.error("Erro ao carregar resultado financeiro da origem:", erro);
    mensagemOrigemNaoEncontrada.textContent = "Nao foi possivel carregar vendas e custos do Supabase para calcular o resultado da origem.";
    return { custos: [], vendas: [] };
  }
}


function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarNomePeca(peca) {
  const nome = peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`;
  const sku = String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim();

  return sku ? `${sku} - ${nome}` : nome;
}

function formatarSku(peca) {
  return String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim() || "-";
}

function filtrarPecasPorBusca(pecas) {
  const termo = String(campoBuscaPecasOrigem?.value || "").trim().toLowerCase();

  if (!termo) {
    return pecas;
  }

  return pecas.filter(peca => {
    const nome = String(peca.nome || peca.nome_peca || peca.nomeProduto || "").toLowerCase();
    const sku = String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").toLowerCase();

    return nome.includes(termo) || sku.includes(termo);
  });
}

function somarCustosPorPeca(custos, pecaId) {
  return custos
    .filter(custo => Number(custo.pecaId || 0) === Number(pecaId || 0))
    .reduce((total, custo) => total + Number(custo.valor || 0), 0);
}

function somarCampo(lista, campo) {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

function agruparCustosVendaPorVenda(custosVenda) {
  return custosVenda.reduce((mapa, custo) => {
    const vendaId = Number(custo.vendaId || 0);

    if (!mapa[vendaId]) {
      mapa[vendaId] = [];
    }

    mapa[vendaId].push(custo);
    return mapa;
  }, {});
}

function calcularCustoPeca(peca, pecasDaOrigem, origem) {
  if (!origem || pecasDaOrigem.length === 0) {
    return Number(peca.custo || 0);
  }

  const totalUnidades = pecasDaOrigem.reduce((total, item) => {
    return total + Number(item.quantidade || 0);
  }, 0);

  if (totalUnidades <= 0) {
    return Number(peca.custo || 0);
  }

  return Number(origem.valorPago || origem.valor_total || 0) / totalUnidades;
}

function somarCustosReaisDasPecas(pecas) {
  return pecas
    .filter(peca => peca.tipoCusto === "real")
    .reduce((total, peca) => total + Number(peca.custo || 0), 0);
}

function calcularLucroOrigem(origem, faturamento, custosAdicionaisOrigem, custosReaisDasPecas) {
  return (
    faturamento -
    Number(origem.valorPago || 0) -
    Number(custosAdicionaisOrigem || 0) -
    Number(custosReaisDasPecas || 0)
  );
}

function obterQuantidadeVendidaNaVenda(venda) {
  return Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || 0);
}

function calcularValorVenda(venda) {
  const quantidadeVendida = obterQuantidadeVendidaNaVenda(venda);
  const valorUnitario = Number(venda.valorUnitario || venda.valor_unitario || venda.precoUnitario || 0);

  if (valorUnitario > 0) {
    return valorUnitario * quantidadeVendida;
  }

  return Number(venda.valorTotal || venda.valor_total || 0);
}

function lucroVenda(venda, pecasDaOrigem = [], origem = null, custos = []) {
  if (venda.valorTotal === undefined && venda.lucroBruto !== undefined) {
    return Number(venda.lucroBruto || 0);
  }

  const peca = pecasDaOrigem.find(item => Number(item.id) === Number(venda.pecaId));
  const custoUnitario = peca
    ? calcularCustoPeca(peca, pecasDaOrigem, origem)
    : 0;
  const custosPeca = somarCustosPorPeca(custos, venda.pecaId);
  const custosVenda = calcularTotalCustosVenda(venda);

  return Number(venda.valorTotal || 0) -
    (obterQuantidadeVendidaNaVenda(venda) * custoUnitario) -
    custosPeca -
    custosVenda;
}

function calcularTotalCustosVenda(venda) {
  if (venda.totalCustosVenda !== undefined) {
    return Number(venda.totalCustosVenda || 0);
  }

  if (!Array.isArray(venda.custosVenda)) {
    return 0;
  }

  return venda.custosVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0);
}

function calcularQuantidadeDisponivel(peca) {
  return Math.max(Number(peca.quantidade || 1) - Number(peca.quantidadeVendida || 0), 0);
}

function obterStatusPeca(peca) {
  return Number(peca.quantidadeVendida || 0) >= Number(peca.quantidade || 1)
    ? "vendida"
    : "em_estoque";
}

function renderizarDadosOrigem(origem) {
  tituloOrigem.textContent = origem.descricao;
  subtituloOrigem.textContent = `${origem.tipo} - ${origem.dataCompra}`;

  dadosOrigem.innerHTML = `
    <article class="detail-card">
      <span>ID</span>
      <strong>${origem.id}</strong>
    </article>
    <article class="detail-card">
      <span>Tipo</span>
      <strong>${origem.tipo}</strong>
    </article>
    <article class="detail-card">
      <span>Descrição</span>
      <strong>${origem.descricao}</strong>
    </article>
    <article class="detail-card">
      <span>Valor pago</span>
      <strong>${formatarMoeda(origem.valorPago)}</strong>
    </article>
    <article class="detail-card">
      <span>Data da compra</span>
      <strong>${origem.dataCompra}</strong>
    </article>
    <article class="detail-card">
      <span>Observações</span>
      <strong>${origem.observacoes || "-"}</strong>
    </article>
  `;
}

function renderizarResumo(origem, pecas, custos, vendas) {
  const idsPecas = pecas.map(peca => Number(peca.id));
  const vendasDaOrigem = vendas.filter(venda => idsPecas.includes(Number(venda.pecaId || 0)));
  const investimento = Number(origem.valorPago || origem.valor_total || origem.custoTotal || 0);
  const receita = vendasDaOrigem.reduce((total, venda) => total + calcularValorVenda(venda), 0);
  const custosDosProdutos = pecas.reduce((total, peca) => total + somarCustosPorPeca(custos, peca.id), 0);
  const custosDasVendas = vendasDaOrigem.reduce((total, venda) => total + calcularTotalCustosVenda(venda), 0);
  const totalCustos = investimento + custosDosProdutos + custosDasVendas;
  const lucroOrigem = receita - totalCustos;
  const deuLucro = lucroOrigem > 0;
  const classeResultado = deuLucro ? "profit-value profit-value--positive" : "profit-value profit-value--negative";
  const classeCardResultado = deuLucro ? "summary-card summary-card--profit" : "summary-card summary-card--loss";
  const textoStatus = deuLucro ? "Deu lucro" : "Ainda nao pagou";

  resumoOrigem.innerHTML = `
    <article class="summary-card">
      <span>Investimento</span>
      <strong>${formatarMoeda(investimento)}</strong>
    </article>
    <article class="summary-card">
      <span>Total vendido</span>
      <strong>${formatarMoeda(receita)}</strong>
    </article>
    <article class="${classeCardResultado}">
      <span>Lucro atual</span>
      <strong class="${classeResultado}">${formatarMoeda(lucroOrigem)}</strong>
    </article>
    <article class="${classeCardResultado}">
      <span>Status</span>
      <strong class="${classeResultado}">${textoStatus}</strong>
    </article>
    <article class="summary-card">
      <span>Custos de pecas</span>
      <strong>${formatarMoeda(custosDosProdutos)}</strong>
    </article>
    <article class="summary-card">
      <span>Custos de venda</span>
      <strong>${formatarMoeda(custosDasVendas)}</strong>
    </article>
  `;
}

function renderizarPecas(origem, pecas, custos, vendas) {
  tabelaProdutosOrigem.innerHTML = "";

  if (pecas.length === 0) {
    mensagemProdutosOrigem.textContent = campoBuscaPecasOrigem?.value
      ? "Nenhuma peça encontrada para a busca."
      : "Nenhuma peça vinculada a esta origem.";
    return;
  }

  mensagemProdutosOrigem.textContent = "";

  pecas.forEach(peca => {
    const custoCalculado = calcularCustoPeca(peca, pecas, origem);
    const precoVenda = Number(peca.precoVenda || 0);
    const lucro = precoVenda - custoCalculado;
    const quantidade = Number(peca.quantidade || 1);
    const quantidadeVendida = Number(peca.quantidadeVendida || 0);
    const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);
    const status = obterStatusPeca(peca);
    const custosDiversos = somarCustosPorPeca(custos, peca.id);
    const vendasProduto = vendas.filter(venda => Number(venda.pecaId || 0) === Number(peca.id));
    const faturamento = somarCampo(vendasProduto, "valorTotal");
    const quantidadeVendidaTotal = vendasProduto.reduce((total, venda) => {
      return total + obterQuantidadeVendidaNaVenda(venda);
    }, 0);
    const custosDasVendasProduto = vendasProduto.reduce((total, venda) => total + calcularTotalCustosVenda(venda), 0);
    const lucroBruto = faturamento - (quantidadeVendidaTotal * custoCalculado) - custosDiversos - custosDasVendasProduto;
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Produto">${formatarNomePeca(peca)}</td>
      <td data-label="SKU">${formatarSku(peca)}</td>
      <td data-label="ID">${peca.id}</td>
      <td data-label="Categoria">${peca.categoria || "-"}</td>
      <td data-label="Qtd. total">${quantidade}</td>
      <td data-label="Qtd. vendida">${quantidadeVendida}</td>
      <td data-label="Qtd. disponível">${quantidadeDisponivel}</td>
      <td data-label="Status">${status}</td>
      <td data-label="Tipo de custo">${peca.tipoCusto}</td>
      <td data-label="Custo calculado">${formatarMoeda(custoCalculado)}</td>
      <td data-label="Preço de venda">${formatarMoeda(precoVenda)}</td>
      <td data-label="Lucro">${formatarMoeda(lucro)}</td>
      <td data-label="Custos diversos">${formatarMoeda(custosDiversos)}</td>
      <td data-label="Faturamento">${formatarMoeda(faturamento)}</td>
      <td data-label="Lucro bruto">${formatarMoeda(lucroBruto)}</td>
      <td data-label="Ações">
        <div class="table-actions">
          <a class="table-link" href="detalhes-produto.html?pecaId=${encodeURIComponent(peca.id)}">Ver peça</a>
        </div>
      </td>
    `;

    tabelaProdutosOrigem.appendChild(linha);
  });
}

async function iniciarDetalhesOrigem() {
  const origem = await carregarOrigem(origemId);
  const pecasDaOrigem = await carregarPecasDaOrigem(origemId);

  if (!origem) {
    mensagemOrigemNaoEncontrada.textContent = "Origem não encontrada.";
    dadosOrigem.innerHTML = "";
    resumoOrigem.innerHTML = "";
    return;
  }

  mensagemOrigemNaoEncontrada.textContent = "";
  const financeiroOrigem = await carregarFinanceiroDaOrigem(pecasDaOrigem);
  const custos = financeiroOrigem.custos;
  const vendas = financeiroOrigem.vendas;

  dadosDetalhesOrigem = {
    origem,
    pecas: pecasDaOrigem,
    custos,
    vendas
  };
  renderizarDadosOrigem(origem);
  renderizarResumo(origem, pecasDaOrigem, custos, vendas);
  renderizarPecas(origem, filtrarPecasPorBusca(pecasDaOrigem), custos, vendas);
}

campoBuscaPecasOrigem?.addEventListener("input", () => {
  if (!dadosDetalhesOrigem.origem) {
    return;
  }

  renderizarPecas(
    dadosDetalhesOrigem.origem,
    filtrarPecasPorBusca(dadosDetalhesOrigem.pecas),
    dadosDetalhesOrigem.custos,
    dadosDetalhesOrigem.vendas
  );
});

iniciarDetalhesOrigem();
