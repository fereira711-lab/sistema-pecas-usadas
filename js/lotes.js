const tabelaLotes = document.getElementById("tabelaLotes");
const mensagemLotes = document.getElementById("mensagemLotes");
const campoBuscaLotes = document.getElementById("buscaLotes");

let lotesCarregados = [];

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarData(data) {
  if (!data) {
    return "-";
  }

  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

function calcularSaldo(lote) {
  return Math.max(Number(lote.quantidadeTotal || 0) - Number(lote.quantidadeConsumida || 0), 0);
}

function obterStatusLote(lote) {
  const quantidadeTotal = Number(lote.quantidadeTotal || 0);
  const quantidadeConsumida = Number(lote.quantidadeConsumida || 0);
  const saldo = calcularSaldo(lote);

  if (saldo <= 0) {
    return "esgotado";
  }

  if (quantidadeConsumida > 0 && quantidadeConsumida < quantidadeTotal) {
    return "parcialmente consumido";
  }

  return "disponivel";
}

function obterClasseStatus(status) {
  if (status === "esgotado") {
    return "status-badge status-badge--empty";
  }

  if (status === "parcialmente consumido") {
    return "status-badge status-badge--stock";
  }

  return "profit-value profit-value--positive";
}

function criarAlerta(tipo, texto) {
  return { tipo, texto };
}

function obterAlertasLote(lote) {
  const saldo = calcularSaldo(lote);
  const quantidadeTotal = Number(lote.quantidadeTotal || 0);
  const quantidadeConsumida = Number(lote.quantidadeConsumida || 0);
  const alertas = [];

  if (quantidadeConsumida >= quantidadeTotal) {
    alertas.push(criarAlerta("danger", "Lote esgotado"));
  } else if (saldo <= 2) {
    alertas.push(criarAlerta("warning", "Estoque baixo"));
  }

  return alertas;
}

function renderizarAlertas(alertas) {
  if (!alertas.length) {
    return `<span class="alert-pill alert-pill--ok">OK</span>`;
  }

  return `
    <div class="alert-list">
      ${alertas.map(alerta => `<span class="alert-pill alert-pill--${alerta.tipo}">${alerta.texto}</span>`).join("")}
    </div>
  `;
}

function filtrarLotesPorBusca(lotes) {
  const termo = String(campoBuscaLotes?.value || "").trim().toLowerCase();

  if (!termo) {
    return lotes;
  }

  return lotes.filter(lote => {
    const sku = String(lote.sku || "").toLowerCase();
    const nome = String(lote.nomePeca || "").toLowerCase();
    const origem = String(lote.origemDescricao || "").toLowerCase();

    return sku.includes(termo) || nome.includes(termo) || origem.includes(termo);
  });
}

async function carregarLotes() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemLotes.textContent = "Configure o Supabase para visualizar as entradas de estoque.";
    return [];
  }

  try {
    const lotes = await window.supabaseService.listarEntradasEstoque();
    mensagemLotes.textContent = "";
    return lotes || [];
  } catch (erro) {
    console.error("Erro ao carregar entradas de estoque:", erro);
    mensagemLotes.textContent = "Nao foi possivel carregar as entradas de estoque do Supabase.";
    return [];
  }
}

function renderizarLotes(lotes) {
  tabelaLotes.innerHTML = "";

  if (lotes.length === 0) {
    mensagemLotes.textContent = campoBuscaLotes?.value
      ? "Nenhum lote encontrado para a busca."
      : "Nenhuma entrada de estoque cadastrada.";
    return;
  }

  mensagemLotes.textContent = "";

  lotes.forEach(lote => {
    const saldo = calcularSaldo(lote);
    const status = obterStatusLote(lote);
    const alertas = obterAlertasLote(lote);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="SKU">${lote.sku || "-"}</td>
      <td data-label="Nome da peca"><strong class="product-name">${lote.nomePeca || "-"}</strong></td>
      <td data-label="Origem">${lote.origemDescricao || "-"}</td>
      <td data-label="Data da entrada">${formatarData(lote.dataEntrada)}</td>
      <td data-label="Qtd. total">${lote.quantidadeTotal}</td>
      <td data-label="Qtd. consumida">${lote.quantidadeConsumida}</td>
      <td data-label="Saldo disponivel">${saldo}</td>
      <td data-label="Custo unitario">${formatarMoeda(lote.custoUnitario)}</td>
      <td data-label="Status do lote"><span class="${obterClasseStatus(status)}">${status}</span></td>
      <td data-label="Alertas">${renderizarAlertas(alertas)}</td>
    `;

    tabelaLotes.appendChild(linha);
  });
}

async function iniciarLotes() {
  lotesCarregados = await carregarLotes();
  renderizarLotes(filtrarLotesPorBusca(lotesCarregados));
}

campoBuscaLotes?.addEventListener("input", () => {
  renderizarLotes(filtrarLotesPorBusca(lotesCarregados));
});

document.addEventListener("DOMContentLoaded", iniciarLotes);
