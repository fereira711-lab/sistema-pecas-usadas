const tabelaHistorico = document.getElementById("tabelaHistoricoVendas");
const mensagemHistorico = document.getElementById("mensagemHistorico");
const totalVendas = document.getElementById("totalVendas");
const pecasVendidas = document.getElementById("pecasVendidas");
const formFiltrosHistorico = document.getElementById("formFiltrosHistorico");
const buscaRapidaHistorico = document.getElementById("buscaRapidaHistorico");
const dataInicialHistorico = document.getElementById("dataInicialHistorico");
const dataFinalHistorico = document.getElementById("dataFinalHistorico");
const filtroSkuHistorico = document.getElementById("filtroSkuHistorico");
const filtroNomeHistorico = document.getElementById("filtroNomeHistorico");
const filtroCanalHistorico = document.getElementById("filtroCanalHistorico");
const limparFiltrosHistorico = document.getElementById("limparFiltrosHistorico");

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
  const skuBusca = normalizarTexto(filtroSkuHistorico?.value);
  const nomeBusca = normalizarTexto(filtroNomeHistorico?.value);
  const canalBusca = normalizarTexto(filtroCanalHistorico?.value);
  const buscaRapida = normalizarTexto(buscaRapidaHistorico?.value);

  return vendas.filter(venda => {
    const dataVenda = obterDataVenda(venda);
    const sku = normalizarTexto(obterSkuVenda(venda));
    const nome = normalizarTexto(obterNomePecaVenda(venda));
    const canal = normalizarTexto(venda.canalVenda || venda.cliente);
    const textoGeral = `${sku} ${nome} ${canal}`;

    if (dataInicial && (!dataVenda || dataVenda < dataInicial)) {
      return false;
    }

    if (dataFinal && (!dataVenda || dataVenda > dataFinal)) {
      return false;
    }

    if (skuBusca && !sku.includes(skuBusca)) {
      return false;
    }

    if (nomeBusca && !nome.includes(nomeBusca)) {
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

function atualizarResumo(vendas) {
  const quantidadeVendida = vendas.reduce((total, venda) => {
    return total + Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || 0);
  }, 0);

  totalVendas.textContent = vendas.length;
  pecasVendidas.textContent = quantidadeVendida;
}

function renderizarAcoesVenda(venda, indice) {
  const botaoDetalhes = `<button type="button" data-acao="detalhes" data-id="${venda.id || ""}" data-indice="${indice}">Ver detalhes</button>`;

  if (historicoCarregadoDoSupabase) {
    return `
      ${botaoDetalhes}
      <button type="button" disabled>Remoção não disponível</button>
    `;
  }

  return `
    ${botaoDetalhes}
    <button type="button" data-acao="remover-local" data-id="${venda.id || ""}" data-indice="${indice}">Remover local</button>
  `;
}

function renderizarHistorico() {
  const vendas = ordenarVendasPorData(filtrarVendas(vendasHistoricoCarregadas));

  tabelaHistorico.innerHTML = "";
  atualizarResumo(vendas);

  if (vendas.length === 0) {
    mensagemHistorico.textContent = "Nenhuma venda encontrada para os filtros informados.";
    return;
  }

  mensagemHistorico.textContent = "";

  vendas.forEach((venda, indice) => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${formatarData(obterDataVenda(venda))}</td>
      <td data-label="SKU">${obterSkuVenda(venda) || "-"}</td>
      <td data-label="Peça">${obterNomePecaVenda(venda) || "-"}</td>
      <td data-label="Quantidade">${venda.quantidadeVendidaNaVenda || venda.quantidadeVendida}</td>
      <td data-label="Canal">${venda.canalVenda || venda.cliente || "-"}</td>
      <td data-label="Ações">
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

  window.location.href = `detalhes-venda.html?index=${botao.dataset.indice}`;
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
});

[
  buscaRapidaHistorico,
  dataInicialHistorico,
  dataFinalHistorico,
  filtroSkuHistorico,
  filtroNomeHistorico,
  filtroCanalHistorico
].forEach(campo => {
  campo?.addEventListener("input", renderizarHistorico);
});

limparFiltrosHistorico?.addEventListener("click", function () {
  formFiltrosHistorico.reset();
  renderizarHistorico();
});

async function iniciarHistoricoVendas() {
  await carregarDadosHistorico();
  renderizarHistorico();
}

iniciarHistoricoVendas();

window.addEventListener("focus", iniciarHistoricoVendas);
