const listaOrigensCompacta = document.getElementById("listaOrigensCompacta");
const mensagemOrigens = document.getElementById("mensagemOrigens");
const totalOrigens = document.getElementById("totalOrigens");
const totalOrigensPendentes = document.getElementById("totalOrigensPendentes");
const valorTotalComprado = document.getElementById("valorTotalComprado");
const valorNaoDistribuido = document.getElementById("valorNaoDistribuido");
const contadorOrigensExibidas = document.getElementById("contadorOrigensExibidas");
const buscaOrigens = document.getElementById("buscaOrigens");
const quantidadeOrigens = document.getElementById("quantidadeOrigens");
const filtroTipoOrigem = document.getElementById("filtroTipoOrigem");
const filtroDistribuicaoOrigem = document.getElementById("filtroDistribuicaoOrigem");
const filtroDataInicialOrigem = document.getElementById("filtroDataInicialOrigem");
const filtroDataFinalOrigem = document.getElementById("filtroDataFinalOrigem");
const shellOrigens = document.querySelector(".origins-shell");
const botaoAbrirFiltrosOrigens = document.getElementById("botaoAbrirFiltrosOrigens");
const botaoFecharFiltrosOrigens = document.getElementById("botaoFecharFiltrosOrigens");
const botaoLimparFiltrosOrigens = document.getElementById("botaoLimparFiltrosOrigens");
const botaoAplicarFiltrosOrigens = document.getElementById("botaoAplicarFiltrosOrigens");

let origensCarregadasDoSupabase = false;
let origensCarregadas = [];
let entradasOrigensCarregadas = [];
let pecasOrigensCarregadas = [];

function buscarOrigens() {
  const origens = JSON.parse(localStorage.getItem("origens")) || [];
  const origensComId = origens.map((origem, indice) => ({
    ...origem,
    id: origem.id || Date.now() + indice,
    codigoOrigem: origem.codigoOrigem || `ORI-${String(origem.id || indice + 1).padStart(6, "0")}`
  }));

  localStorage.setItem("origens", JSON.stringify(origensComId));
  return origensComId;
}

function salvarOrigens(origens) {
  localStorage.setItem("origens", JSON.stringify(origens));
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

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

async function carregarOrigens() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      const [origens, entradas, pecas] = await Promise.all([
        window.supabaseService.listarOrigens(),
        window.supabaseService.listarEntradasEstoque(),
        window.supabaseService.listarPecas()
      ]);
      salvarOrigens(origens);
      entradasOrigensCarregadas = entradas || [];
      pecasOrigensCarregadas = pecas || [];
      origensCarregadasDoSupabase = true;
      return origens || [];
    } catch (erro) {
      console.error("Erro ao carregar origens do Supabase:", erro);
      mensagemOrigens.textContent = "Não foi possível carregar do Supabase. Exibindo dados temporários do navegador.";
    }
  }

  origensCarregadasDoSupabase = false;
  entradasOrigensCarregadas = [];
  pecasOrigensCarregadas = [];
  return buscarOrigens();
}

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function escaparHtml(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function obterCodigoOrigem(origem) {
  return origem.codigoOrigem || `ORI-${String(origem.id).padStart(6, "0")}`;
}

function obterTipoOrigem(origem) {
  return origem.tipoOrigem || origem.tipo || "-";
}

function obterValorPagoOrigem(origem) {
  return Number(origem.valorPago ?? origem.valor_pago ?? origem.custoTotal ?? origem.custo_total ?? 0);
}

function obterEntradasDaOrigem(origemId) {
  return entradasOrigensCarregadas.filter(entrada => Number(entrada.origemId || 0) === Number(origemId));
}

function obterPecasDaOrigem(origemId) {
  return pecasOrigensCarregadas.filter(peca => Number(peca.origemId || peca.origem_id || 0) === Number(origemId));
}

function calcularValorDistribuido(origem) {
  return obterEntradasDaOrigem(origem.id).reduce((total, entrada) => {
    const valorAtribuido = Number(
      entrada.valorAtribuidoEntrada ?? entrada.valor_atribuido_entrada ?? entrada.valorAtribuido ?? entrada.valor_atribuido ?? 0
    );

    if (valorAtribuido > 0) {
      return total + valorAtribuido;
    }

    return total + (Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0));
  }, 0);
}

function calcularQuantidadePecasVinculadas(origem) {
  const ids = new Set();

  obterPecasDaOrigem(origem.id).forEach(peca => {
    if (peca.id) {
      ids.add(Number(peca.id));
    }
  });

  obterEntradasDaOrigem(origem.id).forEach(entrada => {
    if (entrada.pecaId) {
      ids.add(Number(entrada.pecaId));
    }
  });

  return ids.size;
}

function obterStatusDistribuicao(origem) {
  const valorPago = obterValorPagoOrigem(origem);
  const valorDistribuido = calcularValorDistribuido(origem);
  const restante = valorPago - valorDistribuido;

  if (valorPago <= 0) {
    return "sem-valor";
  }

  if (restante < -0.009) {
    return "acima";
  }

  if (Math.abs(restante) <= 0.009) {
    return "distribuida";
  }

  return "pendente";
}

function obterTextoStatus(status) {
  const textos = {
    pendente: "Falta distribuir",
    distribuida: "Distribuída",
    acima: "Acima do previsto",
    "sem-valor": "Sem valor pago"
  };

  return textos[status] || "Falta distribuir";
}

function obterClasseStatus(status) {
  const classes = {
    pendente: "status-badge--warning",
    distribuida: "status-badge--stock",
    acima: "status-badge--empty",
    "sem-valor": "status-badge--info"
  };

  return classes[status] || "status-badge--warning";
}

function renderizarFiltroTipo(origens) {
  if (!filtroTipoOrigem) {
    return;
  }

  const valorAtual = filtroTipoOrigem.value;
  const tipos = [...new Set(origens.map(obterTipoOrigem).filter(tipo => tipo && tipo !== "-"))];
  filtroTipoOrigem.innerHTML = '<option value="">Todos</option>';

  tipos
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .forEach(tipo => {
      const opcao = document.createElement("option");
      opcao.value = tipo;
      opcao.textContent = tipo;
      filtroTipoOrigem.appendChild(opcao);
    });

  filtroTipoOrigem.value = valorAtual;
}

function filtrarOrigens(origens) {
  const termo = normalizarTexto(buscaOrigens?.value);
  const tipo = filtroTipoOrigem?.value || "";
  const distribuicao = filtroDistribuicaoOrigem?.value || "";
  const dataInicial = filtroDataInicialOrigem?.value || "";
  const dataFinal = filtroDataFinalOrigem?.value || "";

  return origens.filter(origem => {
    const codigo = normalizarTexto(obterCodigoOrigem(origem));
    const descricao = normalizarTexto(origem.descricao);
    const tipoOrigem = obterTipoOrigem(origem);
    const tipoBusca = normalizarTexto(tipoOrigem);
    const statusDistribuicao = obterStatusDistribuicao(origem);
    const dataCompra = String(origem.dataCompra || origem.data_compra || "").slice(0, 10);

    if (termo && !`${codigo} ${descricao} ${tipoBusca}`.includes(termo)) {
      return false;
    }

    if (tipo && tipoOrigem !== tipo) {
      return false;
    }

    if (distribuicao && statusDistribuicao !== distribuicao) {
      return false;
    }

    if (dataInicial && dataCompra && dataCompra < dataInicial) {
      return false;
    }

    if (dataFinal && dataCompra && dataCompra > dataFinal) {
      return false;
    }

    return true;
  });
}

function ordenarOrigens(origens) {
  return [...origens].sort((a, b) => {
    const dataA = String(a.dataCompra || a.data_compra || "").slice(0, 10);
    const dataB = String(b.dataCompra || b.data_compra || "").slice(0, 10);

    if (dataA !== dataB) {
      return dataB.localeCompare(dataA);
    }

    return Number(b.id || 0) - Number(a.id || 0);
  });
}

function limitarOrigens(origens) {
  const limite = quantidadeOrigens?.value || "12";

  if (limite === "todos") {
    return origens;
  }

  return origens.slice(0, Number(limite || 12));
}

function obterOrigensFiltradas() {
  return ordenarOrigens(filtrarOrigens(origensCarregadas));
}

function obterOrigensVisiveis() {
  return limitarOrigens(obterOrigensFiltradas());
}

function alternarPainelFiltrosOrigens(aberto) {
  shellOrigens?.classList.toggle("origins-shell--filters-open", aberto);
  botaoAbrirFiltrosOrigens?.setAttribute("aria-expanded", aberto ? "true" : "false");
}

function limparFiltrosOrigens() {
  if (filtroTipoOrigem) filtroTipoOrigem.value = "";
  if (filtroDistribuicaoOrigem) filtroDistribuicaoOrigem.value = "";
  if (filtroDataInicialOrigem) filtroDataInicialOrigem.value = "";
  if (filtroDataFinalOrigem) filtroDataFinalOrigem.value = "";

  renderizarOrigens();
}

function atualizarResumo(origens) {
  const total = origens.length;
  const pendentes = origens.filter(origem => obterStatusDistribuicao(origem) === "pendente").length;
  const valorTotal = origens.reduce((soma, origem) => soma + obterValorPagoOrigem(origem), 0);
  const valorPendente = origens.reduce((soma, origem) => {
    const restante = obterValorPagoOrigem(origem) - calcularValorDistribuido(origem);
    return soma + Math.max(restante, 0);
  }, 0);

  if (totalOrigens) totalOrigens.textContent = total;
  if (totalOrigensPendentes) totalOrigensPendentes.textContent = pendentes;
  if (valorTotalComprado) valorTotalComprado.textContent = formatarMoeda(valorTotal);
  if (valorNaoDistribuido) valorNaoDistribuido.textContent = formatarMoeda(valorPendente);
}

function atualizarContador(total, visiveis) {
  if (!contadorOrigensExibidas) {
    return;
  }

  contadorOrigensExibidas.textContent = total === visiveis
    ? `${visiveis} exibidas`
    : `${visiveis} de ${total}`;
}

function renderizarAcoesOrigem(origem) {
  return `<button class="button-secondary table-link" type="button" data-acao="detalhes" data-origem-id="${escaparHtml(origem.id)}">Ver detalhes</button>`;
}

function renderizarOrigens() {
  const origensFiltradas = obterOrigensFiltradas();
  const origens = obterOrigensVisiveis();
  listaOrigensCompacta.innerHTML = "";
  atualizarResumo(origensCarregadas);
  atualizarContador(origensFiltradas.length, origens.length);

  if (origensFiltradas.length === 0) {
    mensagemOrigens.textContent = "Nenhuma origem encontrada.";
    return;
  }

  mensagemOrigens.textContent = "";

  listaOrigensCompacta.innerHTML = origens.map(origem => {
    const valorPago = obterValorPagoOrigem(origem);
    const valorDistribuido = calcularValorDistribuido(origem);
    const valorRestante = valorPago - valorDistribuido;
    const status = obterStatusDistribuicao(origem);
    const dataCompra = origem.dataCompra || origem.data_compra;

    return `
      <div class="origins-compact-row" role="row">
        <strong data-label="Código" class="origin-code">${escaparHtml(obterCodigoOrigem(origem))}</strong>
        <span data-label="Tipo">${escaparHtml(obterTipoOrigem(origem))}</span>
        <span data-label="Descrição" class="product-name">${escaparHtml(origem.descricao || "-")}</span>
        <span data-label="Data">${formatarData(dataCompra)}</span>
        <span data-label="Valor pago">${formatarMoeda(valorPago)}</span>
        <span data-label="Distribuído">${formatarMoeda(valorDistribuido)}</span>
        <span data-label="Não distribuído">${formatarMoeda(valorRestante)}</span>
        <span data-label="Peças">${calcularQuantidadePecasVinculadas(origem)}</span>
        <span data-label="Situação" class="status-badge ${obterClasseStatus(status)}">${obterTextoStatus(status)}</span>
        <div class="table-actions">
          ${renderizarAcoesOrigem(origem)}
        </div>
      </div>
    `;
  }).join("");
}

async function carregarERenderizarOrigens() {
  origensCarregadas = await carregarOrigens();
  renderizarFiltroTipo(origensCarregadas);
  renderizarOrigens();
}

function abrirDetalhesOrigem(origemId) {
  window.location.href = `detalhes-origem.html?origemId=${encodeURIComponent(origemId)}`;
}

function removerOrigemLocal(origemId) {
  const origens = buscarOrigens();
  const origem = origens.find(item => Number(item.id) === Number(origemId));

  if (!origem) {
    mensagemOrigens.textContent = "Origem não encontrada para remoção.";
    return;
  }

  const confirmou = confirm(`Deseja remover a origem "${origem.descricao}" apenas do armazenamento local?`);

  if (!confirmou) {
    return;
  }

  salvarOrigens(origens.filter(item => Number(item.id) !== Number(origemId)));
  carregarERenderizarOrigens();
}

listaOrigensCompacta.addEventListener("click", evento => {
  const botao = evento.target.closest("button");

  if (!botao) {
    return;
  }

  if (botao.dataset.acao === "detalhes") {
    abrirDetalhesOrigem(botao.dataset.origemId);
  }

  if (botao.dataset.acao === "remover-local") {
    removerOrigemLocal(Number(botao.dataset.origemId));
  }
});

[buscaOrigens, quantidadeOrigens, filtroTipoOrigem, filtroDistribuicaoOrigem, filtroDataInicialOrigem, filtroDataFinalOrigem].forEach(campo => {
  campo?.addEventListener("input", renderizarOrigens);
  campo?.addEventListener("change", renderizarOrigens);
});

botaoAbrirFiltrosOrigens?.addEventListener("click", () => {
  const aberto = !shellOrigens?.classList.contains("origins-shell--filters-open");
  alternarPainelFiltrosOrigens(aberto);
});

botaoFecharFiltrosOrigens?.addEventListener("click", () => {
  alternarPainelFiltrosOrigens(false);
});

botaoAplicarFiltrosOrigens?.addEventListener("click", () => {
  renderizarOrigens();
  alternarPainelFiltrosOrigens(false);
});

botaoLimparFiltrosOrigens?.addEventListener("click", limparFiltrosOrigens);

document.addEventListener("keydown", evento => {
  if (evento.key === "Escape") {
    alternarPainelFiltrosOrigens(false);
  }
});

carregarERenderizarOrigens();
window.addEventListener("focus", carregarERenderizarOrigens);
