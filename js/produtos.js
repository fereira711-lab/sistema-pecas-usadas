const tabelaProdutos = document.getElementById("tabelaProdutos");
const mensagemProdutos = document.getElementById("mensagemProdutos");

function buscarListaLocal(chave) {
  return JSON.parse(localStorage.getItem(chave)) || [];
}

function salvarListaLocal(chave, lista) {
  localStorage.setItem(chave, JSON.stringify(lista));
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function normalizarPeca(peca) {
  const quantidade = Number(peca.quantidade || 1);
  const quantidadeVendida = Number(peca.quantidadeVendida || peca.quantidade_vendida || 0);
  const origemId = Number(peca.origemId || peca.origem_id || 0);
  const precoVenda = Number(peca.precoVenda || peca.preco_venda || peca.preco_sugerido || 0);

  return {
    ...peca,
    id: Number(peca.id),
    nome: peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`,
    origemId,
    tipoCusto: peca.tipoCusto || peca.tipo_custo || peca.tipo_custo_atribuido || "-",
    quantidade,
    quantidadeVendida,
    status: peca.status || "em_estoque",
    precoVenda,
    preparada: Boolean(peca.preparada)
  };
}

function normalizarOrigem(origem) {
  return {
    ...origem,
    id: Number(origem.id),
    descricao: origem.descricao || origem.nome || `Origem ${origem.id}`
  };
}

function calcularQuantidadeDisponivel(peca) {
  return Math.max(Number(peca.quantidade || 0) - Number(peca.quantidadeVendida || 0), 0);
}

function criarMapaOrigens(origens) {
  return origens.reduce((mapa, origem) => {
    mapa[Number(origem.id)] = origem;
    return mapa;
  }, {});
}

async function carregarDados() {
  let pecas = buscarListaLocal("produtos").map(normalizarPeca);
  let origens = buscarListaLocal("origens").map(normalizarOrigem);

  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      const [pecasSupabase, origensSupabase] = await Promise.all([
        window.supabaseService.listarPecas(),
        window.supabaseService.listarOrigens()
      ]);

      pecas = pecasSupabase.map(normalizarPeca);
      origens = origensSupabase.map(normalizarOrigem);
      salvarListaLocal("produtos", pecas);
      salvarListaLocal("origens", origens);
    } catch (erro) {
      console.error("Erro ao carregar produtos do Supabase:", erro);
      mensagemProdutos.textContent = "Nao foi possivel carregar do Supabase. Exibindo dados temporarios do navegador.";
    }
  }

  return { pecas, origens };
}

function abrirDetalhesOrigem(origemId) {
  window.location.href = `detalhes-origem.html?origemId=${encodeURIComponent(origemId)}`;
}

function abrirLancamentoCusto(pecaId) {
  window.location.href = `cadastro-custo-peca.html?pecaId=${encodeURIComponent(pecaId)}`;
}

function abrirVenda(pecaId) {
  const id = Number(pecaId);

  if (!id) {
    alert("Nao foi possivel identificar a peca selecionada.");
    return;
  }

  window.location.href = `cadastro-venda.html?pecaId=${encodeURIComponent(id)}`;
}

function renderizarProdutos(pecas, origens) {
  const mapaOrigens = criarMapaOrigens(origens);
  tabelaProdutos.innerHTML = "";

  if (pecas.length === 0) {
    mensagemProdutos.textContent = "Nenhuma peca cadastrada.";
    return;
  }

  if (!mensagemProdutos.textContent) {
    mensagemProdutos.textContent = "";
  }

  pecas.forEach(peca => {
    const origem = mapaOrigens[Number(peca.origemId)];
    const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="ID">${peca.id}</td>
      <td data-label="Nome da peca">${peca.nome}</td>
      <td data-label="Origem">${origem ? origem.descricao : "-"}</td>
      <td data-label="Tipo de custo">${peca.tipoCusto}</td>
      <td data-label="Qtd. total">${peca.quantidade}</td>
      <td data-label="Qtd. vendida">${peca.quantidadeVendida}</td>
      <td data-label="Qtd. disponivel">${quantidadeDisponivel}</td>
      <td data-label="Status">${peca.status}</td>
      <td data-label="Preco">${formatarMoeda(peca.precoVenda)}</td>
      <td data-label="Preparada">${peca.preparada ? "Sim" : "Nao"}</td>
      <td data-label="Acoes">
        <div class="table-actions">
          <button type="button" data-acao="origem" data-origem-id="${peca.origemId}" ${peca.origemId ? "" : "disabled"}>Ver origem</button>
          <button type="button" data-acao="custo" data-peca-id="${peca.id}">Lancar custo</button>
          <button type="button" data-acao="venda" data-peca-id="${peca.id}" onclick="abrirVenda(${peca.id})" ${quantidadeDisponivel > 0 ? "" : "disabled"}>Vender</button>
          <button type="button" data-acao="editar" data-peca-id="${peca.id}">Editar peca</button>
        </div>
      </td>
    `;

    tabelaProdutos.appendChild(linha);
  });
}

async function inicializarProdutos() {
  const { pecas, origens } = await carregarDados();
  renderizarProdutos(pecas, origens);
}

tabelaProdutos.addEventListener("click", evento => {
  const botao = evento.target.closest("button[data-acao]");

  if (!botao) {
    return;
  }

  if (botao.dataset.acao === "origem" && botao.dataset.origemId) {
    abrirDetalhesOrigem(botao.dataset.origemId);
    return;
  }

  if (botao.dataset.acao === "custo" && botao.dataset.pecaId) {
    abrirLancamentoCusto(botao.dataset.pecaId);
    return;
  }

  if (botao.dataset.acao === "venda") {
    return;
  }

  if (botao.dataset.acao === "editar") {
    alert("Edicao de peca sera implementada em uma proxima etapa.");
  }
});

document.addEventListener("DOMContentLoaded", inicializarProdutos);
