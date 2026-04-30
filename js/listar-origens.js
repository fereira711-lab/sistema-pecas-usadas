const tabelaOrigensLista = document.getElementById("tabelaOrigensLista");
const mensagemOrigens = document.getElementById("mensagemOrigens");
const totalOrigens = document.getElementById("totalOrigens");
const valorTotalInvestido = document.getElementById("valorTotalInvestido");
const totalCarros = document.getElementById("totalCarros");
const totalLotes = document.getElementById("totalLotes");
const totalComprasAvulsas = document.getElementById("totalComprasAvulsas");

let origensCarregadasDoSupabase = false;

function buscarOrigens() {
  const origens = JSON.parse(localStorage.getItem("origens")) || [];
  const origensComId = origens.map((origem, indice) => ({
    ...origem,
    id: origem.id || Date.now() + indice
  }));

  localStorage.setItem("origens", JSON.stringify(origensComId));
  return origensComId;
}

function salvarOrigens(origens) {
  localStorage.setItem("origens", JSON.stringify(origens));
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
      mensagemOrigens.textContent = "Não foi possível carregar do Supabase. Exibindo dados temporários do navegador.";
    }
  }

  origensCarregadasDoSupabase = false;
  return buscarOrigens();
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function atualizarResumo(origens) {
  const valorTotal = origens.reduce((total, origem) => total + Number(origem.valorPago || 0), 0);

  totalOrigens.textContent = origens.length;
  valorTotalInvestido.textContent = formatarMoeda(valorTotal);
  totalCarros.textContent = origens.filter(origem => origem.tipo === "Carro para desmonte").length;
  totalLotes.textContent = origens.filter(origem => origem.tipo === "Lote").length;
  totalComprasAvulsas.textContent = origens.filter(origem => origem.tipo === "Compra avulsa").length;
}

function renderizarAcoesOrigem(origem) {
  const botaoDetalhes = `<button type="button" data-acao="detalhes" data-origem-id="${origem.id}">Ver detalhes</button>`;

  if (origensCarregadasDoSupabase) {
    return `
      ${botaoDetalhes}
      <button type="button" disabled>Remoção não disponível</button>
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
    const quantidadeTotal = Number(origem.quantidadeTotal || origem.quantidade_total || 0);
    const custoUnitario = quantidadeTotal > 0
      ? Number(origem.valorPago || 0) / quantidadeTotal
      : 0;

    linha.innerHTML = `
      <td data-label="Data da compra">${origem.dataCompra || "-"}</td>
      <td data-label="Tipo">${origem.tipo || "-"}</td>
      <td data-label="SKU">${origem.produtoSku || "-"}</td>
      <td data-label="Quantidade">${quantidadeTotal}</td>
      <td data-label="Descrição">${origem.descricao || "-"}</td>
      <td data-label="Valor pago">${formatarMoeda(origem.valorPago)}</td>
      <td data-label="Custo unitário">${formatarMoeda(custoUnitario)}</td>
      <td data-label="Observações">${origem.observacoes || "-"}</td>
      <td data-label="Ações">
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
    mensagemOrigens.textContent = "Origem não encontrada para remoção.";
    return;
  }

  const confirmou = confirm(`Deseja remover a origem "${origem.descricao}" apenas do armazenamento local?`);

  if (!confirmou) {
    return;
  }

  salvarOrigens(origens.filter(item => Number(item.id) !== Number(origemId)));
  renderizarOrigens();
}

tabelaOrigensLista.addEventListener("click", function (evento) {
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
