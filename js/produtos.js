const tabelaProdutos = document.getElementById("tabelaProdutos");
const mensagemProdutos = document.getElementById("mensagemProdutos");

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
    custo: Number(peca.custo || 0),
    custoTotal: Number(peca.custoTotal || peca.custo_total || peca.custo || 0),
    precoVenda,
    preparada: Boolean(peca.preparada)
  };
}

function normalizarOrigem(origem) {
  return {
    ...origem,
    id: Number(origem.id),
    descricao: origem.descricao || origem.nome || `Origem ${origem.id}`,
    custoTotal: Number(origem.custoTotal || origem.custo_total || origem.valorPago || origem.valor_pago || 0),
    valorPago: Number(origem.valorPago || origem.valor_pago || origem.custoTotal || origem.custo_total || 0)
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
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemProdutos.textContent = "Configure o Supabase para carregar a lista de pecas.";
    return { pecas: [], origens: [], vendas: [], custosPeca: [], custosVenda: [] };
  }

  try {
    const [pecasSupabase, origensSupabase, vendasSupabase, custosPecaSupabase, custosVendaSupabase] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarOrigens(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarCustosPeca(),
      window.supabaseService.listarCustosVenda()
    ]);

    return {
      pecas: pecasSupabase.map(normalizarPeca),
      origens: origensSupabase.map(normalizarOrigem),
      vendas: vendasSupabase,
      custosPeca: custosPecaSupabase,
      custosVenda: custosVendaSupabase
    };
  } catch (erro) {
    console.error("Erro ao carregar produtos do Supabase:", erro);
    mensagemProdutos.textContent = "Nao foi possivel carregar os dados do Supabase.";
    return { pecas: [], origens: [], vendas: [], custosPeca: [], custosVenda: [] };
  }
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

function somarValores(lista, campo = "valor") {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

function filtrarPorPeca(lista, pecaId) {
  return lista.filter(item => Number(item.pecaId || 0) === Number(pecaId || 0));
}

function calcularReceitaPeca(vendasDaPeca) {
  return vendasDaPeca.reduce((total, venda) => {
    const quantidadeVendida = Number(venda.quantidadeVendida || venda.quantidade_vendida || 0);
    const valorUnitario = Number(venda.valorUnitario || venda.valor_unitario || 0);

    return total + (valorUnitario * quantidadeVendida);
  }, 0);
}

function calcularCustoRateado(peca, pecas, origem) {
  if (!origem) {
    return Number(peca.custoTotal || peca.custo || 0);
  }

  const pecasDaOrigem = pecas.filter(item => Number(item.origemId || 0) === Number(peca.origemId || 0));
  const quantidadeTotalOrigem = pecasDaOrigem.reduce((total, item) => total + Number(item.quantidade || 0), 0);

  if (quantidadeTotalOrigem <= 0) {
    return Number(peca.custoTotal || peca.custo || 0);
  }

  return (Number(origem.custoTotal || origem.valorPago || 0) / quantidadeTotalOrigem) * Number(peca.quantidade || 0);
}

function calcularCustoBasePeca(peca, pecas, origem) {
  if (peca.tipoCusto === "rateado") {
    return calcularCustoRateado(peca, pecas, origem);
  }

  return Number(peca.custoTotal || peca.custo || 0);
}

function calcularLucroPeca(peca, pecas, origem, vendas, custosPeca, custosVenda) {
  const vendasDaPeca = filtrarPorPeca(vendas, peca.id);
  const idsVendasDaPeca = vendasDaPeca.map(venda => Number(venda.id));
  const custosVendaDaPeca = custosVenda.filter(custo => idsVendasDaPeca.includes(Number(custo.vendaId || 0)));
  const receita = calcularReceitaPeca(vendasDaPeca);
  const custoBase = calcularCustoBasePeca(peca, pecas, origem);
  const totalCustosPeca = somarValores(filtrarPorPeca(custosPeca, peca.id));
  const totalCustosVenda = somarValores(custosVendaDaPeca);

  return receita - custoBase - totalCustosPeca - totalCustosVenda;
}

function obterClasseLucro(lucro) {
  if (lucro < 0) {
    return "profit-value profit-value--negative";
  }

  return "profit-value profit-value--positive";
}

function renderizarProdutos(pecas, origens, vendas, custosPeca, custosVenda) {
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
    const lucro = calcularLucroPeca(peca, pecas, origem, vendas, custosPeca, custosVenda);
    const classeLucro = obterClasseLucro(lucro);
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
      <td data-label="Lucro"><strong class="${classeLucro}">${formatarMoeda(lucro)}</strong></td>
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
  const { pecas, origens, vendas, custosPeca, custosVenda } = await carregarDados();
  renderizarProdutos(pecas, origens, vendas, custosPeca, custosVenda);
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
