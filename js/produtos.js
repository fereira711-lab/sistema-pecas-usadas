const tabelaProdutos = document.getElementById("tabelaProdutos");
const mensagemProdutos = document.getElementById("mensagemProdutos");
const campoBuscaProdutos = document.getElementById("buscaProdutos");
let dadosProdutos = { pecas: [], origens: [], vendas: [], custosPeca: [], custosVenda: [], consumosEstoque: [], entradasEstoque: [] };

function primeiroValorPreenchido(...valores) {
  return valores.find(valor => valor !== null && valor !== undefined);
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarNomePeca(peca) {
  const nome = peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`;
  const sku = String(peca.sku || "").trim();

  return sku ? `${sku} - ${nome}` : nome;
}

function formatarSku(peca) {
  return String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim() || "-";
}

function normalizarPeca(peca) {
  const quantidade = Number(peca.quantidade || 1);
  const quantidadeVendida = Number(peca.quantidadeVendida || peca.quantidade_vendida || 0);
  const origemId = Number(peca.origemId || peca.origem_id || 0);
  const precoVenda = Number(peca.precoVenda || peca.preco_venda || peca.preco_sugerido || 0);
  const custoTotal = primeiroValorPreenchido(peca.custoTotal, peca.custo_total, peca.custo, 0);

  return {
    ...peca,
    id: Number(peca.id),
    nome: peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`,
    sku: peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "",
    origemId,
    tipoCusto: peca.tipoCusto || peca.tipo_custo || peca.tipo_custo_atribuido || "-",
    quantidade,
    quantidadeVendida,
    status: peca.status || "em_estoque",
    custo: Number(peca.custo || 0),
    custoTotal: Number(custoTotal || 0),
    precoVenda,
    preparada: Boolean(peca.preparada)
  };
}

function normalizarOrigem(origem) {
  return {
    ...origem,
    id: Number(origem.id),
    descricao: origem.descricao || origem.nome || `Origem ${origem.id}`,
    produtoSku: origem.produtoSku || origem.produto_sku || "",
    quantidadeTotal: Number(origem.quantidadeTotal || origem.quantidade_total || 0),
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
    return { pecas: [], origens: [], vendas: [], custosPeca: [], custosVenda: [], consumosEstoque: [], entradasEstoque: [] };
  }

  try {
    const [pecasSupabase, origensSupabase, vendasSupabase, custosPecaSupabase, custosVendaSupabase, consumosEstoqueSupabase, entradasEstoqueSupabase] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarOrigens(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarCustosPeca(),
      window.supabaseService.listarCustosVenda(),
      window.supabaseService.listarConsumosEstoque(),
      window.supabaseService.listarEntradasEstoque()
    ]);

    return {
      pecas: pecasSupabase.map(normalizarPeca),
      origens: origensSupabase.map(normalizarOrigem),
      vendas: vendasSupabase,
      custosPeca: custosPecaSupabase,
      custosVenda: custosVendaSupabase,
      consumosEstoque: consumosEstoqueSupabase || [],
      entradasEstoque: entradasEstoqueSupabase || []
    };
  } catch (erro) {
    console.error("Erro ao carregar produtos do Supabase:", erro);
    mensagemProdutos.textContent = "Nao foi possivel carregar os dados do Supabase.";
    return { pecas: [], origens: [], vendas: [], custosPeca: [], custosVenda: [], consumosEstoque: [], entradasEstoque: [] };
  }
}

function abrirDetalhesOrigem(origemId) {
  window.location.href = `detalhes-origem.html?origemId=${encodeURIComponent(origemId)}`;
}

function abrirDetalhesProduto(pecaId) {
  window.location.href = `detalhes-produto.html?pecaId=${encodeURIComponent(pecaId)}`;
}

function abrirLancamentoCusto(pecaId) {
  window.location.href = `cadastro-custo.html?pecaId=${encodeURIComponent(pecaId)}`;
}

function filtrarPecasPorBusca(pecas) {
  const termo = String(campoBuscaProdutos?.value || "").trim().toLowerCase();

  if (!termo) {
    return pecas;
  }

  return pecas.filter(peca => {
    const nome = String(peca.nome || peca.nome_peca || "").toLowerCase();
    const sku = String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").toLowerCase();

    return nome.includes(termo) || sku.includes(termo);
  });
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

function normalizarSku(sku) {
  return String(sku || "").trim().toUpperCase();
}

function obterOrigensDoProduto(peca, origens) {
  const sku = normalizarSku(peca.sku);
  const origensPorSku = origens.filter(origem => normalizarSku(origem.produtoSku) === sku);

  return origensPorSku.length > 0
    ? origensPorSku
    : origens.filter(origem => Number(origem.id) === Number(peca.origemId || 0));
}

function calcularCustoBasePeca(peca, origens) {
  const origensDoProduto = obterOrigensDoProduto(peca, origens);

  const totalUnidades = origensDoProduto.reduce((total, origem) => {
    return total + Number(origem.quantidadeTotal || 0);
  }, 0);
  const totalInvestido = origensDoProduto.reduce((total, origem) => {
    return total + Number(origem.valorPago || origem.custoTotal || 0);
  }, 0);

  if (totalUnidades <= 0 || totalInvestido <= 0) {
    return Number(peca.custoTotal || peca.custo || 0);
  }

  return totalInvestido / totalUnidades;
}

function calcularReceitaPeca(vendasDaPeca) {
  return vendasDaPeca.reduce((total, venda) => {
    if (venda.valorTotal !== undefined || venda.valor_total !== undefined) {
      return total + Number(venda.valorTotal || venda.valor_total || 0);
    }

    const quantidadeVendida = Number(venda.quantidadeVendida || venda.quantidade_vendida || 0);
    const valorUnitario = Number(venda.valorUnitario || venda.valor_unitario || 0);

    return total + (valorUnitario * quantidadeVendida);
  }, 0);
}

function somarCustosEmbutidosDasVendas(vendasDaPeca) {
  return vendasDaPeca.reduce((total, venda) => {
    if (venda.totalCustosVenda !== undefined) {
      return total + Number(venda.totalCustosVenda || 0);
    }

    if (!Array.isArray(venda.custosVenda)) {
      return total;
    }

    return total + somarValores(venda.custosVenda);
  }, 0);
}

function calcularQuantidadeVendidaPeca(vendasDaPeca) {
  return vendasDaPeca.reduce((total, venda) => {
    return total + Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || venda.quantidade_vendida || 0);
  }, 0);
}

function agruparConsumosPorVenda(consumosEstoque) {
  return consumosEstoque.reduce((mapa, consumo) => {
    const vendaId = Number(consumo.vendaId || 0);

    if (!mapa[vendaId]) {
      mapa[vendaId] = [];
    }

    mapa[vendaId].push(consumo);
    return mapa;
  }, {});
}

function calcularCustoFifoComFallback(vendasDaPeca, consumosPorVenda, custoUnitarioFallback) {
  return vendasDaPeca.reduce((total, venda) => {
    const consumosDaVenda = consumosPorVenda[Number(venda.id)] || [];

    if (consumosDaVenda.length > 0) {
      return total + somarValores(consumosDaVenda, "custoTotal");
    }

    return total + (Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || 0) * custoUnitarioFallback);
  }, 0);
}

function calcularLucroPeca(peca, origens, vendas, custosPeca, custosVenda, consumosEstoque) {
  const vendasDaPeca = filtrarPorPeca(vendas, peca.id);
  const idsVendasDaPeca = vendasDaPeca.map(venda => Number(venda.id));
  const custosVendaDaPeca = custosVenda.filter(custo => idsVendasDaPeca.includes(Number(custo.vendaId || 0)));
  const receita = calcularReceitaPeca(vendasDaPeca);
  const custoUnitario = calcularCustoBasePeca(peca, origens);
  const consumosPorVenda = agruparConsumosPorVenda(consumosEstoque);
  const custoFifo = calcularCustoFifoComFallback(vendasDaPeca, consumosPorVenda, custoUnitario);
  const totalCustosPeca = somarValores(filtrarPorPeca(custosPeca, peca.id));
  const totalCustosVenda = somarValores(custosVendaDaPeca) || somarCustosEmbutidosDasVendas(vendasDaPeca);

  return receita - custoFifo - totalCustosPeca - totalCustosVenda;
}

function obterClasseLucro(lucro, temVenda) {
  if (!temVenda || lucro === 0) {
    return "profit-value profit-value--neutral";
  }

  if (lucro > 0) {
    return "profit-value profit-value--positive";
  }

  return "profit-value profit-value--negative";
}

function obterClasseStatus(status) {
  if (status === "vendida") {
    return "status-badge status-badge--sold";
  }

  return "status-badge status-badge--stock";
}

function criarAlerta(tipo, texto) {
  return { tipo, texto };
}

function obterAlertasProduto(peca, quantidadeDisponivel, vendasDaPeca, entradasEstoque, consumosPorVenda) {
  const alertas = [];
  const entradasDaPeca = entradasEstoque.filter(entrada => Number(entrada.pecaId || 0) === Number(peca.id));
  const vendasSemConsumo = vendasDaPeca.filter(venda => !(consumosPorVenda[Number(venda.id)] || []).length);

  if (quantidadeDisponivel <= 0) {
    alertas.push(criarAlerta("danger", "Sem estoque"));
  } else if (quantidadeDisponivel <= 2) {
    alertas.push(criarAlerta("warning", "Estoque baixo"));
  }

  if (entradasDaPeca.length === 0) {
    alertas.push(criarAlerta("info", "Sem entrada de estoque"));
  }

  if (vendasSemConsumo.length > 0) {
    alertas.push(criarAlerta("warning", "Venda sem custo calculado"));
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

function renderizarProdutos(pecas, origens, vendas, custosPeca, custosVenda, consumosEstoque, entradasEstoque) {
  const mapaOrigens = criarMapaOrigens(origens);
  const consumosPorVenda = agruparConsumosPorVenda(consumosEstoque);
  tabelaProdutos.innerHTML = "";

  if (pecas.length === 0) {
    mensagemProdutos.textContent = campoBuscaProdutos?.value
      ? "Nenhuma peca encontrada para a busca."
      : "Nenhuma peca cadastrada.";
    return;
  }

  mensagemProdutos.textContent = "";

  pecas.forEach(peca => {
    const origem = mapaOrigens[Number(peca.origemId)];
    const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);
    const vendasDaPeca = filtrarPorPeca(vendas, peca.id);
    const quantidadeVendida = calcularQuantidadeVendidaPeca(vendasDaPeca);
    const custoUnitario = calcularCustoBasePeca(peca, origens);
    const custoTotalVendido = calcularCustoFifoComFallback(vendasDaPeca, consumosPorVenda, custoUnitario);
    const lucro = calcularLucroPeca(peca, origens, vendas, custosPeca, custosVenda, consumosEstoque);
    const temVenda = vendasDaPeca.length > 0;
    const classeLucro = obterClasseLucro(lucro, temVenda);
    const classeStatus = obterClasseStatus(peca.status);
    const alertas = obterAlertasProduto(peca, quantidadeDisponivel, vendasDaPeca, entradasEstoque, consumosPorVenda);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="ID">${peca.id}</td>
      <td data-label="SKU">${formatarSku(peca)}</td>
      <td data-label="Nome da peca"><strong class="product-name">${formatarNomePeca(peca)}</strong></td>
      <td data-label="Origem">${origem ? origem.descricao : "-"}</td>
      <td data-label="Tipo de custo">${peca.tipoCusto}</td>
      <td data-label="Estoque">${quantidadeDisponivel}</td>
      <td data-label="Vendidos">${quantidadeVendida}</td>
      <td data-label="Status"><span class="${classeStatus}">${peca.status}</span></td>
      <td data-label="Custo unitario">${formatarMoeda(custoUnitario)}</td>
      <td data-label="Custo vendido">${formatarMoeda(custoTotalVendido)}</td>
      <td data-label="Preco">${formatarMoeda(peca.precoVenda)}</td>
      <td data-label="Lucro"><strong class="${classeLucro}">${formatarMoeda(lucro)}</strong></td>
      <td data-label="Preparada">${peca.preparada ? "Sim" : "Nao"}</td>
      <td data-label="Alertas">${renderizarAlertas(alertas)}</td>
      <td data-label="Acoes">
        <div class="table-actions">
          <button type="button" data-acao="venda" data-peca-id="${peca.id}" onclick="abrirVenda(${peca.id})" ${quantidadeDisponivel > 0 ? "" : "disabled"}>Vender</button>
          <button type="button" data-acao="detalhes" data-peca-id="${peca.id}">Ver detalhes</button>
          <button type="button" data-acao="custo" data-peca-id="${peca.id}">Lancar custo</button>
          <button type="button" data-acao="origem" data-origem-id="${peca.origemId}" ${peca.origemId ? "" : "disabled"}>Ver origem</button>
          <button type="button" data-acao="editar" data-peca-id="${peca.id}">Editar peca</button>
        </div>
      </td>
    `;

    tabelaProdutos.appendChild(linha);
  });
}

async function inicializarProdutos() {
  dadosProdutos = await carregarDados();
  renderizarProdutos(
    filtrarPecasPorBusca(dadosProdutos.pecas),
    dadosProdutos.origens,
    dadosProdutos.vendas,
    dadosProdutos.custosPeca,
    dadosProdutos.custosVenda,
    dadosProdutos.consumosEstoque,
    dadosProdutos.entradasEstoque
  );
}

campoBuscaProdutos?.addEventListener("input", () => {
  renderizarProdutos(
    filtrarPecasPorBusca(dadosProdutos.pecas),
    dadosProdutos.origens,
    dadosProdutos.vendas,
    dadosProdutos.custosPeca,
    dadosProdutos.custosVenda,
    dadosProdutos.consumosEstoque,
    dadosProdutos.entradasEstoque
  );
});

tabelaProdutos.addEventListener("click", evento => {
  const botao = evento.target.closest("button[data-acao]");

  if (!botao) {
    return;
  }

  if (botao.dataset.acao === "origem" && botao.dataset.origemId) {
    abrirDetalhesOrigem(botao.dataset.origemId);
    return;
  }

  if (botao.dataset.acao === "detalhes" && botao.dataset.pecaId) {
    abrirDetalhesProduto(botao.dataset.pecaId);
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
