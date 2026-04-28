const tabelaHistorico = document.getElementById("tabelaHistoricoVendas");
const mensagemHistorico = document.getElementById("mensagemHistorico");
const totalVendas = document.getElementById("totalVendas");
const pecasVendidas = document.getElementById("pecasVendidas");
const faturamentoTotal = document.getElementById("faturamentoTotal");

function buscarVendas() {
  return JSON.parse(localStorage.getItem("vendas")) || [];
}

function buscarProdutos() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function salvarVendas(vendas) {
  localStorage.setItem("vendas", JSON.stringify(vendas));
}

async function carregarVendas() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      const vendas = await window.supabaseService.listarVendas();
      salvarVendas(vendas);
      return vendas;
    } catch (erro) {
      console.error("Erro ao carregar vendas do Supabase:", erro);
      mensagemHistorico.textContent = "Nao foi possivel carregar vendas do Supabase. Exibindo dados temporarios do navegador.";
    }
  }

  return buscarVendas();
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarNomePecaVenda(venda, produtos = buscarProdutos()) {
  const produto = produtos.find(item => Number(item.id) === Number(venda.pecaId));
  const nome = venda.produtoNome || produto?.nome || venda.nome || `Peca ${venda.pecaId || ""}`.trim();
  const sku = String(venda.sku || produto?.sku || "").trim();

  return sku ? `${sku} - ${nome}` : nome;
}

function atualizarResumo(vendas) {
  const quantidadeVendida = vendas.reduce((total, venda) => {
    return total + Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || 0);
  }, 0);

  const faturamento = vendas.reduce((total, venda) => {
    return total + Number(venda.valorTotal || 0);
  }, 0);

  totalVendas.textContent = vendas.length;
  pecasVendidas.textContent = quantidadeVendida;
  faturamentoTotal.textContent = formatarMoeda(faturamento);
}

async function renderizarHistorico() {
  const vendas = await carregarVendas();
  const produtos = buscarProdutos();
  tabelaHistorico.innerHTML = "";
  atualizarResumo(vendas);

  if (vendas.length === 0) {
    mensagemHistorico.textContent = "Nenhuma venda registrada.";
    return;
  }

  mensagemHistorico.textContent = "";

  vendas.forEach((venda, indice) => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${venda.dataVenda}</td>
      <td data-label="Produto">${formatarNomePecaVenda(venda, produtos) || "-"}</td>
      <td data-label="ID da peca">${venda.pecaId || "-"}</td>
      <td data-label="Quantidade">${venda.quantidadeVendidaNaVenda || venda.quantidadeVendida}</td>
      <td data-label="Preço unitário">${formatarMoeda(venda.precoUnitario)}</td>
      <td data-label="Valor total">${formatarMoeda(venda.valorTotal)}</td>
      <td data-label="Canal">${venda.canalVenda || venda.cliente || "-"}</td>
      <td data-label="Ações">
        <div class="table-actions">
          <button type="button" data-acao="detalhes" data-id="${venda.id || ""}" data-indice="${indice}">Ver detalhes</button>
          <button type="button" data-acao="remover" data-indice="${indice}">Remover</button>
        </div>
      </td>
    `;

    tabelaHistorico.appendChild(linha);
  });
}

function abrirDetalhesVenda(botao) {
  if (botao.dataset.id) {
    window.location.href = `detalhes-venda.html?id=${encodeURIComponent(botao.dataset.id)}`;
    return;
  }

  window.location.href = `detalhes-venda.html?index=${botao.dataset.indice}`;
}

function removerVenda(indice) {
  const vendas = buscarVendas();
  const confirmou = confirm(`Deseja remover a venda de "${formatarNomePecaVenda(vendas[indice])}"?`);

  if (!confirmou) {
    return;
  }

  vendas.splice(indice, 1);
  salvarVendas(vendas);
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

  if (acao === "remover") {
    removerVenda(Number(botao.dataset.indice));
  }
});

renderizarHistorico();

window.addEventListener("focus", renderizarHistorico);
