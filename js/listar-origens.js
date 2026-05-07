const tabelaOrigensLista = document.getElementById("tabelaOrigensLista");
const mensagemOrigens = document.getElementById("mensagemOrigens");
const totalOrigens = document.getElementById("totalOrigens");
const totalCarros = document.getElementById("totalCarros");
const totalLotes = document.getElementById("totalLotes");
const totalComprasAvulsas = document.getElementById("totalComprasAvulsas");

let origensCarregadasDoSupabase = false;

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
      const origens = await window.supabaseService.listarOrigens();
      salvarOrigens(origens);
      origensCarregadasDoSupabase = true;
      return origens;
    } catch (erro) {
      console.error("Erro ao carregar origens do Supabase:", erro);
      mensagemOrigens.textContent = "Nao foi possivel carregar do Supabase. Exibindo dados temporarios do navegador.";
    }
  }

  origensCarregadasDoSupabase = false;
  return buscarOrigens();
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

async function renderizarOrigens() {
  const origens = await carregarOrigens();
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
      <td data-label="Codigo">${origem.codigoOrigem || `ORI-${String(origem.id).padStart(6, "0")}`}</td>
      <td data-label="Data da compra">${formatarData(origem.dataCompra)}</td>
      <td data-label="Tipo">${origem.tipoOrigem || origem.tipo || "-"}</td>
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
  renderizarOrigens();
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

renderizarOrigens();
window.addEventListener("focus", renderizarOrigens);
