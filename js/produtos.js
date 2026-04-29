const tabelaProdutos = document.getElementById("tabelaProdutos");
const mensagemProdutos = document.getElementById("mensagemProdutos");
const campoBuscaProdutos = document.getElementById("buscaProdutos");
let dadosProdutos = { pecas: [], origens: [], vendas: [], custosPeca: [], custosVenda: [] };

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

function obterPecasDaOrigem(peca, pecas) {
  return pecas.filter(item => Number(item.origemId || 0) === Number(peca.origemId || 0));
}

function calcularCustoBasePeca(peca, pecas, origem) {
  const pecasDaOrigem = obterPecasDaOrigem(peca, pecas);

  if (!origem || pecasDaOrigem.length === 0) {
    return Number(peca.custoTotal || peca.custo || 0);
  }

  const totalUnidades = pecasDaOrigem.reduce((total, item) => {
    return total + Number(item.quantidade || 0);
  }, 0);

  if (totalUnidades <= 0) {
    return Number(peca.custoTotal || peca.custo || 0);
  }

  return Number(origem.valorPago || origem.valor_total || origem.custoTotal || 0) / totalUnidades;
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

function calcularLucroPeca(peca, pecas, origem, vendas, custosPeca, custosVenda) {
  const vendasDaPeca = filtrarPorPeca(vendas, peca.id);
  const idsVendasDaPeca = vendasDaPeca.map(venda => Number(venda.id));
  const custosVendaDaPeca = custosVenda.filter(custo => idsVendasDaPeca.includes(Number(custo.vendaId || 0)));
  const receita = calcularReceitaPeca(vendasDaPeca);
  const custoUnitario = calcularCustoBasePeca(peca, pecas, origem);
  const quantidadeVendida = calcularQuantidadeVendidaPeca(vendasDaPeca);
  const totalCustosPeca = somarValores(filtrarPorPeca(custosPeca, peca.id));
  const totalCustosVenda = somarValores(custosVendaDaPeca) || somarCustosEmbutidosDasVendas(vendasDaPeca);

  return receita - (quantidadeVendida * custoUnitario) - totalCustosPeca - totalCustosVenda;
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

function renderizarProdutos(pecas, origens, vendas, custosPeca, custosVenda) {
  const mapaOrigens = criarMapaOrigens(origens);
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
    const lucro = calcularLucroPeca(peca, pecas, origem, vendas, custosPeca, custosVenda);
    const temVenda = filtrarPorPeca(vendas, peca.id).length > 0;
    const classeLucro = obterClasseLucro(lucro, temVenda);
    const classeStatus = obterClasseStatus(peca.status);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="ID">${peca.id}</td>
      <td data-label="SKU">${formatarSku(peca)}</td>
      <td data-label="Nome da peca"><strong class="product-name">${formatarNomePeca(peca)}</strong></td>
      <td data-label="Origem">${origem ? origem.descricao : "-"}</td>
      <td data-label="Tipo de custo">${peca.tipoCusto}</td>
      <td data-label="Qtd. total">${peca.quantidade}</td>
      <td data-label="Qtd. vendida">${peca.quantidadeVendida}</td>
      <td data-label="Qtd. disponivel">${quantidadeDisponivel}</td>
      <td data-label="Status"><span class="${classeStatus}">${peca.status}</span></td>
      <td data-label="Preco">${formatarMoeda(peca.precoVenda)}</td>
      <td data-label="Lucro"><strong class="${classeLucro}">${formatarMoeda(lucro)}</strong></td>
      <td data-label="Preparada">${peca.preparada ? "Sim" : "Nao"}</td>
      <td data-label="Acoes">
        <div class="table-actions">
          <button type="button" data-acao="venda" data-peca-id="${peca.id}" onclick="abrirVenda(${peca.id})" ${quantidadeDisponivel > 0 ? "" : "disabled"}>Vender</button>
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
    dadosProdutos.custosVenda
  );
}

campoBuscaProdutos?.addEventListener("input", () => {
  renderizarProdutos(
    filtrarPecasPorBusca(dadosProdutos.pecas),
    dadosProdutos.origens,
    dadosProdutos.vendas,
    dadosProdutos.custosPeca,
    dadosProdutos.custosVenda
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
