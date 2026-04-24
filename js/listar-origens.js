const tabelaOrigensLista = document.getElementById("tabelaOrigensLista");
const mensagemOrigens = document.getElementById("mensagemOrigens");
const totalOrigens = document.getElementById("totalOrigens");
const valorTotalInvestido = document.getElementById("valorTotalInvestido");
const totalCarros = document.getElementById("totalCarros");
const totalLotes = document.getElementById("totalLotes");
const totalComprasAvulsas = document.getElementById("totalComprasAvulsas");

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

function renderizarOrigens() {
  const origens = buscarOrigens();
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
      <td data-label="Data da compra">${origem.dataCompra}</td>
      <td data-label="Tipo">${origem.tipo}</td>
      <td data-label="Descrição">${origem.descricao}</td>
      <td data-label="Valor pago">${formatarMoeda(origem.valorPago)}</td>
      <td data-label="Observações">${origem.observacoes || "-"}</td>
      <td data-label="Ações">
        <div class="table-actions">
          <button type="button" data-acao="detalhes" data-origem-id="${origem.id}">Ver detalhes</button>
          <button type="button" data-acao="remover" data-origem-id="${origem.id}">Remover</button>
        </div>
      </td>
    `;

    tabelaOrigensLista.appendChild(linha);
  });
}

function abrirDetalhesOrigem(origemId) {
  window.location.href = `detalhes-origem.html?origemId=${origemId}`;
}

function removerOrigem(origemId) {
  const origens = buscarOrigens();
  const origem = origens.find(item => item.id === origemId);

  if (!origem) {
    mensagemOrigens.textContent = "Origem não encontrada para remoção.";
    return;
  }

  const confirmou = confirm(`Deseja remover a origem "${origem.descricao}"?`);

  if (!confirmou) {
    return;
  }

  salvarOrigens(origens.filter(item => item.id !== origemId));
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

  if (botao.dataset.acao === "remover") {
    removerOrigem(Number(botao.dataset.origemId));
  }
});

renderizarOrigens();

window.addEventListener("focus", renderizarOrigens);
