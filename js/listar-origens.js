const tabelaOrigensLista = document.getElementById("tabelaOrigensLista");
const mensagemOrigens = document.getElementById("mensagemOrigens");
const totalOrigens = document.getElementById("totalOrigens");
const totalCarros = document.getElementById("totalCarros");
const totalLotes = document.getElementById("totalLotes");
const totalComprasAvulsas = document.getElementById("totalComprasAvulsas");
const buscaOrigens = document.getElementById("buscaOrigens");
const filtroTipoOrigem = document.getElementById("filtroTipoOrigem");
const filtroDistribuicaoOrigem = document.getElementById("filtroDistribuicaoOrigem");
const ordenacaoOrigens = document.getElementById("ordenacaoOrigens");
const shellOrigens = document.querySelector(".origins-shell");
const botaoAbrirFiltrosOrigens = document.getElementById("botaoAbrirFiltrosOrigens");
const botaoFecharFiltrosOrigens = document.getElementById("botaoFecharFiltrosOrigens");
const botaoLimparFiltrosOrigens = document.getElementById("botaoLimparFiltrosOrigens");
const botaoAplicarFiltrosOrigens = document.getElementById("botaoAplicarFiltrosOrigens");

let origensCarregadasDoSupabase = false;
let origensCarregadas = [];
let entradasOrigensCarregadas = [];

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

async function carregarOrigens() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      const [origens, entradas] = await Promise.all([
        window.supabaseService.listarOrigens(),
        window.supabaseService.listarEntradasEstoque()
      ]);
      salvarOrigens(origens);
      entradasOrigensCarregadas = entradas || [];
      origensCarregadasDoSupabase = true;
      return origens;
    } catch (erro) {
      console.error("Erro ao carregar origens do Supabase:", erro);
      mensagemOrigens.textContent = "Nao foi possivel carregar do Supabase. Exibindo dados temporarios do navegador.";
    }
  }

  origensCarregadasDoSupabase = false;
  entradasOrigensCarregadas = [];
  return buscarOrigens();
}

function normalizarTexto(texto) {
  return String(texto || "").trim().toLowerCase();
}

function obterCodigoOrigem(origem) {
  return origem.codigoOrigem || `ORI-${String(origem.id).padStart(6, "0")}`;
}

function obterTipoOrigem(origem) {
  return origem.tipoOrigem || origem.tipo || "-";
}

function obterEntradasDaOrigem(origemId) {
  return entradasOrigensCarregadas.filter(entrada => Number(entrada.origemId || 0) === Number(origemId));
}

function obterStatusDistribuicao(origem) {
  const quantidadeOrigem = Number(origem.quantidadeTotal || origem.quantidade_total || 0);
  const quantidadeDistribuida = obterEntradasDaOrigem(origem.id).reduce((total, entrada) => {
    return total + Number(entrada.quantidadeTotal || 0);
  }, 0);

  if (quantidadeOrigem > 0 && quantidadeDistribuida >= quantidadeOrigem) {
    return "total";
  }

  return "parcial";
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

  return origens.filter(origem => {
    const codigo = normalizarTexto(obterCodigoOrigem(origem));
    const descricao = normalizarTexto(origem.descricao);
    const tipoOrigem = obterTipoOrigem(origem);
    const statusDistribuicao = obterStatusDistribuicao(origem);

    if (termo && !`${codigo} ${descricao}`.includes(termo)) {
      return false;
    }

    if (tipo && tipoOrigem !== tipo) {
      return false;
    }

    if (distribuicao && statusDistribuicao !== distribuicao) {
      return false;
    }

    return true;
  });
}

function ordenarOrigens(origens) {
  const sentido = ordenacaoOrigens?.value || "data-desc";

  return [...origens].sort((a, b) => {
    const dataA = String(a.dataCompra || "").slice(0, 10);
    const dataB = String(b.dataCompra || "").slice(0, 10);

    if (sentido === "data-asc") {
      return dataA.localeCompare(dataB);
    }

    return dataB.localeCompare(dataA);
  });
}

function obterOrigensVisiveis() {
  return ordenarOrigens(filtrarOrigens(origensCarregadas));
}

function alternarPainelFiltrosOrigens(aberto) {
  shellOrigens?.classList.toggle("origins-shell--filters-open", aberto);
  botaoAbrirFiltrosOrigens?.setAttribute("aria-expanded", aberto ? "true" : "false");
}

function limparFiltrosOrigens() {
  if (filtroTipoOrigem) filtroTipoOrigem.value = "";
  if (filtroDistribuicaoOrigem) filtroDistribuicaoOrigem.value = "";
  if (ordenacaoOrigens) ordenacaoOrigens.value = "data-desc";

  renderizarOrigens();
}

function atualizarResumo(origens) {
  totalOrigens.textContent = origens.length;
  totalCarros.textContent = origens.filter(origem => (origem.tipoOrigem || origem.tipo) === "Carro para desmonte").length;
  totalLotes.textContent = origens.filter(origem => (origem.tipoOrigem || origem.tipo) === "Lote").length;
  totalComprasAvulsas.textContent = origens.filter(origem => (origem.tipoOrigem || origem.tipo) === "Compra avulsa").length;
}

function renderizarAcoesOrigem(origem) {
  const botaoDetalhes = `<button type="button" data-acao="detalhes" data-origem-id="${origem.id}">Ver detalhes</button>`;

  if (origensCarregadasDoSupabase) {
    return `
      ${botaoDetalhes}
      <button type="button" disabled>Remocao nao disponivel</button>
    `;
  }

  return `
    ${botaoDetalhes}
    <button type="button" data-acao="remover-local" data-origem-id="${origem.id}">Remover local</button>
  `;
}

function renderizarOrigens() {
  const origens = obterOrigensVisiveis();
  tabelaOrigensLista.innerHTML = "";
  atualizarResumo(origens);

  if (origens.length === 0) {
    mensagemOrigens.textContent = "Nenhuma origem cadastrada.";
    return;
  }

  mensagemOrigens.textContent = "";

  origens.forEach(origem => {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td data-label="Codigo">${obterCodigoOrigem(origem)}</td>
      <td data-label="Data da compra">${formatarData(origem.dataCompra)}</td>
      <td data-label="Tipo">${obterTipoOrigem(origem)}</td>
      <td data-label="Descricao">${origem.descricao || "-"}</td>
      <td data-label="Observacoes">${origem.observacoes || "-"}</td>
      <td data-label="Acoes">
        <div class="table-actions">
          ${renderizarAcoesOrigem(origem)}
        </div>
      </td>
    `;

    tabelaOrigensLista.appendChild(linha);
  });
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
    mensagemOrigens.textContent = "Origem nao encontrada para remocao.";
    return;
  }

  const confirmou = confirm(`Deseja remover a origem "${origem.descricao}" apenas do armazenamento local?`);

  if (!confirmou) {
    return;
  }

  salvarOrigens(origens.filter(item => Number(item.id) !== Number(origemId)));
  carregarERenderizarOrigens();
}

tabelaOrigensLista.addEventListener("click", evento => {
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

[buscaOrigens, filtroTipoOrigem, filtroDistribuicaoOrigem, ordenacaoOrigens].forEach(campo => {
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
