const tabelaHistorico = document.getElementById("tabelaHistoricoVendas");
const mensagemHistorico = document.getElementById("mensagemHistorico");
const formFiltrosHistorico = document.getElementById("formFiltrosHistorico");
const buscaRapidaHistorico = document.getElementById("buscaRapidaHistorico");
const quantidadePaginaHistorico = document.getElementById("quantidadePaginaHistorico");
const dataInicialHistorico = document.getElementById("dataInicialHistorico");
const dataFinalHistorico = document.getElementById("dataFinalHistorico");
const filtroCanalHistorico = document.getElementById("filtroCanalHistorico");
const limparFiltrosHistorico = document.getElementById("limparFiltrosHistorico");
const shellHistoricoVendas = document.querySelector(".sales-history-shell");
const botaoAbrirFiltrosHistorico = document.getElementById("botaoAbrirFiltrosHistorico");
const botaoFecharFiltrosHistorico = document.getElementById("botaoFecharFiltrosHistorico");

let historicoCarregadoDoSupabase = false;
let vendasHistoricoCarregadas = [];
let produtosHistoricoCarregados = [];

function buscarVendas() {
  return JSON.parse(localStorage.getItem("vendas")) || [];
}

function buscarProdutos() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function salvarVendas(vendas) {
  localStorage.setItem("vendas", JSON.stringify(vendas));
}

async function carregarDadosHistorico() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      const [vendas, pecas] = await Promise.all([
        window.supabaseService.listarVendas(),
        window.supabaseService.listarPecas()
      ]);

      historicoCarregadoDoSupabase = true;
      vendasHistoricoCarregadas = vendas || [];
      produtosHistoricoCarregados = pecas || [];
      mensagemHistorico.textContent = "";
      return;
    } catch (erro) {
      console.error("Erro ao carregar vendas do Supabase:", erro);
      mensagemHistorico.textContent = "Nao foi possivel carregar vendas do Supabase. Exibindo dados temporarios do navegador.";
    }
  }

  historicoCarregadoDoSupabase = false;
  vendasHistoricoCarregadas = buscarVendas();
  produtosHistoricoCarregados = buscarProdutos();
}

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || "").slice(0, 10);
}

function formatarData(data) {
  if (!data) {
    return "-";
  }

  const dataIso = String(data).slice(0, 10);
  const partes = dataIso.split("-");

  if (partes.length !== 3) {
    return dataIso;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function normalizarTexto(texto) {
  return String(texto || "").trim().toLowerCase();
}

function escaparHtml(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buscarProdutoDaVenda(venda) {
  return produtosHistoricoCarregados.find(item => Number(item.id) === Number(venda.pecaId));
}

function obterSkuVenda(venda) {
  const produto = buscarProdutoDaVenda(venda);
  return String(venda.sku || produto?.sku || "").trim();
}

function obterNomePecaVenda(venda) {
  const produto = buscarProdutoDaVenda(venda);
  return venda.produtoNome || produto?.nome || venda.nome || `Peca ${venda.pecaId || ""}`.trim();
}

function formatarNomePecaVenda(venda) {
  const nome = obterNomePecaVenda(venda);
  const sku = obterSkuVenda(venda);

  return sku ? `${sku} - ${nome}` : nome;
}

function filtrarVendas(vendas) {
  const dataInicial = dataInicialHistorico?.value || "";
  const dataFinal = dataFinalHistorico?.value || "";
  const canalBusca = normalizarTexto(filtroCanalHistorico?.value);
  const buscaRapida = normalizarTexto(buscaRapidaHistorico?.value);

  return vendas.filter(venda => {
    const dataVenda = obterDataVenda(venda);
    const sku = normalizarTexto(obterSkuVenda(venda));
    const nome = normalizarTexto(obterNomePecaVenda(venda));
    const canal = normalizarTexto(venda.canalVenda || venda.cliente);
    const textoGeral = `${sku} ${nome}`;

    if (dataInicial && (!dataVenda || dataVenda < dataInicial)) {
      return false;
    }

    if (dataFinal && (!dataVenda || dataVenda > dataFinal)) {
      return false;
    }

    if (canalBusca && !canal.includes(canalBusca)) {
      return false;
    }

    if (buscaRapida && !textoGeral.includes(buscaRapida)) {
      return false;
    }

    return true;
  });
}

function ordenarVendasPorData(vendas) {
  return [...vendas].sort((a, b) => {
    const dataA = new Date(obterDataVenda(a) || 0).getTime();
    const dataB = new Date(obterDataVenda(b) || 0).getTime();

    if (dataA !== dataB) {
      return dataB - dataA;
    }

    return Number(b.id || 0) - Number(a.id || 0);
  });
}

function alternarPainelFiltrosHistorico(aberto) {
  shellHistoricoVendas?.classList.toggle("sales-history-shell--filters-open", aberto);
  botaoAbrirFiltrosHistorico?.setAttribute("aria-expanded", aberto ? "true" : "false");
}

function limparFiltrosAvancadosHistorico() {
  if (dataInicialHistorico) dataInicialHistorico.value = "";
  if (dataFinalHistorico) dataFinalHistorico.value = "";
  if (filtroCanalHistorico) filtroCanalHistorico.value = "";

  renderizarHistorico();
}

function renderizarAcoesVenda(venda, indice) {
  const vendaId = venda.id || venda.vendaId || venda.id_venda || "";
  const botaoDetalhes = `<button class="button-secondary sales-history-detail-button" type="button" data-acao="detalhes" data-id="${escaparHtml(vendaId)}" data-indice="${indice}" ${vendaId ? "" : "disabled"}>Ver detalhes</button>`;

  if (historicoCarregadoDoSupabase) {
    return botaoDetalhes;
  }

  return `
    ${botaoDetalhes}
    <button class="button-secondary button-danger-soft" type="button" data-acao="remover-local" data-id="${venda.id || ""}" data-indice="${indice}">Remover local</button>
  `;
}

function renderizarHistorico() {
  const vendas = ordenarVendasPorData(filtrarVendas(vendasHistoricoCarregadas));
  const limite = Number(quantidadePaginaHistorico?.value || 24);
  const vendasVisiveis = Number.isFinite(limite) && limite > 0 ? vendas.slice(0, limite) : vendas;

  tabelaHistorico.innerHTML = "";

  if (vendas.length === 0) {
    mensagemHistorico.textContent = "Nenhuma venda encontrada para os filtros informados.";
    return;
  }

  mensagemHistorico.textContent = "";

  vendasVisiveis.forEach((venda, indice) => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${formatarData(obterDataVenda(venda))}</td>
      <td data-label="SKU">${escaparHtml(obterSkuVenda(venda) || "-")}</td>
      <td data-label="Peca"><strong class="product-name">${escaparHtml(obterNomePecaVenda(venda) || "-")}</strong></td>
      <td data-label="Quantidade">${escaparHtml(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || "-")}</td>
      <td data-label="Canal"><span class="sales-history-channel">${escaparHtml(venda.canalVenda || venda.cliente || "-")}</span></td>
      <td data-label="Acoes">
        <div class="table-actions">
          ${renderizarAcoesVenda(venda, indice)}
        </div>
      </td>
    `;

    tabelaHistorico.appendChild(linha);
  });
}

function abrirDetalhesVenda(botao) {
  if (botao.dataset.id) {
    window.location.href = `detalhes-venda.html?vendaId=${encodeURIComponent(botao.dataset.id)}`;
    return;
  }
}

function removerVendaLocal(botao) {
  const vendas = buscarVendas();
  const vendaId = Number(botao.dataset.id || 0);
  const indice = vendaId
    ? vendas.findIndex(venda => Number(venda.id) === vendaId)
    : Number(botao.dataset.indice);
  const venda = vendas[indice];

  if (!venda) {
    return;
  }

  const confirmou = confirm(`Deseja remover a venda de "${formatarNomePecaVenda(venda)}"?`);

  if (!confirmou) {
    return;
  }

  vendas.splice(indice, 1);
  salvarVendas(vendas);
  vendasHistoricoCarregadas = buscarVendas();
  renderizarHistorico();
}

tabelaHistorico.addEventListener("click", function (evento) {
  const botao = evento.target.closest("button");

  if (!botao) {
    return;
  }

  const acao = botao.dataset.acao;

  if (acao === "detalhes") {
    abrirDetalhesVenda(botao);
  }

  if (acao === "remover-local") {
    removerVendaLocal(botao);
  }
});

formFiltrosHistorico?.addEventListener("submit", function (evento) {
  evento.preventDefault();
  renderizarHistorico();
  alternarPainelFiltrosHistorico(false);
});

[
  buscaRapidaHistorico,
  quantidadePaginaHistorico,
  dataInicialHistorico,
  dataFinalHistorico,
  filtroCanalHistorico
].forEach(campo => {
  campo?.addEventListener("input", renderizarHistorico);
  campo?.addEventListener("change", renderizarHistorico);
});

limparFiltrosHistorico?.addEventListener("click", function () {
  limparFiltrosAvancadosHistorico();
});

botaoAbrirFiltrosHistorico?.addEventListener("click", function () {
  const aberto = !shellHistoricoVendas?.classList.contains("sales-history-shell--filters-open");
  alternarPainelFiltrosHistorico(aberto);
});

botaoFecharFiltrosHistorico?.addEventListener("click", function () {
  alternarPainelFiltrosHistorico(false);
});

document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape") {
    alternarPainelFiltrosHistorico(false);
  }
});

async function iniciarHistoricoVendas() {
  await carregarDadosHistorico();
  renderizarHistorico();
}

iniciarHistoricoVendas();

window.addEventListener("focus", iniciarHistoricoVendas);
