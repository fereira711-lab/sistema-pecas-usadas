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

const TIPOS_CUSTO_PECA = ["real", "rateado", "simbolico"];
const TIPO_CUSTO_PADRAO = "real";
let dadosDetalhesOrigem = { origem: null, pecas: [], custos: [], vendas: [] };

function buscarLista(chave) {
  return JSON.parse(localStorage.getItem(chave)) || [];
}

async function carregarOrigem(origemId) {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      const origem = await window.supabaseService.buscarOrigemPorId(origemId);
      salvarOrigemNoCache(origem);
      return origem;
    } catch (erro) {
      console.error("Erro ao carregar origem do Supabase:", erro);
      mensagemOrigemNaoEncontrada.textContent = "Nao foi possivel carregar a origem do Supabase. Exibindo dados temporarios do navegador.";
    }
  }

  return garantirIdsDasOrigens(buscarLista("origens")).find(o => Number(o.id) === Number(origemId));
}

async function carregarPecasDaOrigem(origemId) {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      const pecas = await window.supabaseService.listarPecasPorOrigem(origemId);
      salvarPecasNoCache(pecas);
      return pecas;
    } catch (erro) {
      console.error("Erro ao carregar pecas da origem do Supabase:", erro);
    }
  }

  return garantirDadosDasPecas(buscarLista("produtos"))
    .filter(p => Number(p.origemId) === Number(origemId));
}

function salvarLista(chave, lista) {
  localStorage.setItem(chave, JSON.stringify(lista));
}

function salvarOrigemNoCache(origem) {
  if (!origem) {
    return;
  }

  const origens = buscarLista("origens").filter(item => Number(item.id) !== Number(origem.id));
  origens.push(origem);
  salvarLista("origens", origens);
}

function salvarPecasNoCache(pecas) {
  const idsDasPecas = pecas.map(peca => Number(peca.id));
  const pecasAntigas = buscarLista("produtos").filter(peca => !idsDasPecas.includes(Number(peca.id)));

  salvarLista("produtos", [...pecasAntigas, ...pecas]);
}

function garantirIdsDasOrigens(origens) {
  const origensComId = origens.map((origem, indice) => ({
    ...origem,
    id: origem.id || Date.now() + indice
  }));

  salvarLista("origens", origensComId);
  return origensComId;
}

function normalizarTipoCusto(tipoCusto) {
  return TIPOS_CUSTO_PECA.includes(tipoCusto) ? tipoCusto : TIPO_CUSTO_PADRAO;
}

function garantirDadosDasPecas(pecas) {
  const pecasNormalizadas = pecas.map((peca, indice) => {
    const quantidade = Number(peca.quantidade || 1);
    const quantidadeVendida = Number(peca.quantidadeVendida || 0);
    const quantidadeDisponivel = Math.max(quantidade - quantidadeVendida, 0);

    return {
      ...peca,
      id: peca.id || Date.now() + indice,
      quantidade,
      quantidadeVendida,
      status: quantidadeDisponivel <= 0 ? "vendida" : "em_estoque",
      origemId: Number(peca.origemId || 0),
      tipoCusto: normalizarTipoCusto(peca.tipoCusto)
    };
  });

  salvarLista("produtos", pecasNormalizadas);
  return pecasNormalizadas;
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
  const custosDosProdutos = pecas.reduce((total, peca) => total + somarCustosPorPeca(custos, peca.id), 0);
  const custoBaseProdutos = pecas.reduce((total, peca) => {
    return total + (calcularCustoPeca(peca, pecas, origem) * Number(peca.quantidade || 0));
  }, 0);
  const faturamento = somarCampo(vendasDaOrigem, "valorTotal");
  const custoBaseVendido = vendasDaOrigem.reduce((total, venda) => {
    const peca = pecas.find(item => Number(item.id) === Number(venda.pecaId));
    const custoUnitario = peca ? calcularCustoPeca(peca, pecas, origem) : 0;

    return total + (obterQuantidadeVendidaNaVenda(venda) * custoUnitario);
  }, 0);
  const custosDasVendas = vendasDaOrigem.reduce((total, venda) => total + calcularTotalCustosVenda(venda), 0);
  const lucroOrigem = faturamento - custoBaseVendido - custosDosProdutos - custosDasVendas;

  resumoOrigem.innerHTML = `
    <article class="summary-card">
      <span>Valor pago na origem</span>
      <strong>${formatarMoeda(origem.valorPago)}</strong>
    </article>
    <article class="summary-card">
      <span>Peças vinculadas</span>
      <strong>${pecas.length}</strong>
    </article>
    <article class="summary-card">
      <span>Custo base das peças</span>
      <strong>${formatarMoeda(custoBaseProdutos)}</strong>
    </article>
    <article class="summary-card">
      <span>Custos diversos</span>
      <strong>${formatarMoeda(custosDosProdutos)}</strong>
    </article>
    <article class="summary-card">
      <span>Faturamento da origem</span>
      <strong>${formatarMoeda(faturamento)}</strong>
    </article>
    <article class="summary-card">
      <span>Lucro bruto da origem</span>
      <strong>${formatarMoeda(lucroOrigem)}</strong>
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
  const custos = buscarLista("custosDiversos");
  const vendas = buscarLista("vendas");

  if (!origem) {
    mensagemOrigemNaoEncontrada.textContent = "Origem não encontrada.";
    dadosOrigem.innerHTML = "";
    resumoOrigem.innerHTML = "";
    return;
  }

  mensagemOrigemNaoEncontrada.textContent = "";
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
