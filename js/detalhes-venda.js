const tituloVenda = document.getElementById("tituloVenda");
const subtituloVenda = document.getElementById("subtituloVenda");
const mensagemVendaNaoEncontrada = document.getElementById("mensagemVendaNaoEncontrada");
const dadosVenda = document.getElementById("dadosVenda");
const resumoFinanceiroVenda = document.getElementById("resumoFinanceiroVenda");
const mensagemProdutoVenda = document.getElementById("mensagemProdutoVenda");
const dadosProdutoVenda = document.getElementById("dadosProdutoVenda");
const acaoDetalhesProduto = document.getElementById("acaoDetalhesProduto");
const mensagemCustosVenda = document.getElementById("mensagemCustosVenda");
const tabelaCustosVenda = document.getElementById("tabelaCustosVenda");
const mensagemCustoFifoVenda = document.getElementById("mensagemCustoFifoVenda");
const tabelaCustoFifoVenda = document.getElementById("tabelaCustoFifoVenda");
let contextoVenda = {
  produto: null,
  origens: [],
  custosPeca: [],
  custosVenda: [],
  consumosFifo: []
};

function buscarVendas() {
  return JSON.parse(localStorage.getItem("vendas")) || [];
}

function buscarProdutos() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function buscarOrigens() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function buscarCustos() {
  return JSON.parse(localStorage.getItem("custosDiversos")) || [];
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarNomePeca(peca) {
  const nome = peca.nome || peca.nome_peca || peca.nomeProduto || peca.produtoNome || peca.descricao || `Peca ${peca.id || peca.pecaId}`;
  const sku = String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim();

  return sku ? `${sku} - ${nome}` : nome;
}

function formatarSku(peca) {
  return String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim() || "-";
}

function formatarPorcentagem(valor) {
  return `${Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}%`;
}

function encontrarVenda() {
  const vendas = buscarVendas();
  const parametros = new URLSearchParams(window.location.search);
  const id = parametros.get("id");
  const index = parametros.get("index");

  if (id) {
    const vendaPorId = vendas.find(venda => String(venda.id) === String(id));

    if (vendaPorId) {
      return vendaPorId;
    }
  }

  if (index !== null) {
    return vendas[Number(index)];
  }

  return null;
}

async function encontrarVendaSupabase() {
  const parametros = new URLSearchParams(window.location.search);
  const id = parametros.get("id");

  if (!id || !window.supabaseService || !window.supabaseService.estaConfigurado()) {
    return null;
  }

  const vendas = await window.supabaseService.listarVendas();
  return vendas.find(venda => String(venda.id) === String(id)) || null;
}

function calcularCustoUnitario(venda) {
  if (venda.custoUnitario !== undefined) {
    return Number(venda.custoUnitario || 0);
  }

  if (venda.custoUnitarioAtualizado !== undefined) {
    return Number(venda.custoUnitarioAtualizado || 0);
  }

  const custoTotal = calcularCustoTotal(venda);
  const quantidade = Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || 0);
  return quantidade > 0 ? custoTotal / quantidade : 0;
}

function calcularCustoTotal(venda) {
  if (venda.custoTotal !== undefined) {
    return Number(venda.custoTotal || 0);
  }

  if (venda.custoTotalVenda !== undefined) {
    return Number(venda.custoTotalVenda || 0);
  }

  return 0;
}

function normalizarCustosVenda(custosVenda) {
  if (!Array.isArray(custosVenda)) {
    return [];
  }

  return custosVenda
    .map(custo => ({
      tipo: String(custo.tipo || "").trim(),
      descricao: String(custo.descricao || "").trim(),
      valor: Number(custo.valor || 0)
    }))
    .filter(custo => custo.tipo && custo.valor > 0);
}

function calcularTotalCustosVenda(venda) {
  if (venda.totalCustosVenda !== undefined) {
    return Number(venda.totalCustosVenda || 0);
  }

  return normalizarCustosVenda(venda.custosVenda)
    .reduce((total, custo) => total + Number(custo.valor || 0), 0);
}

function calcularLucroBruto(venda) {
  if (venda.valorTotal !== undefined) {
    return Number(venda.valorTotal || 0) - calcularCustoTotal(venda) - calcularTotalCustosVenda(venda);
  }

  return Number(venda.lucroBruto || 0);
}

function normalizarSku(sku) {
  return String(sku || "").trim().toUpperCase();
}

function obterOrigensDoProduto(peca, origens) {
  const sku = normalizarSku(peca.sku);
  const origensPorSku = origens.filter(origem => normalizarSku(origem.produtoSku || origem.produto_sku) === sku);

  return origensPorSku.length > 0
    ? origensPorSku
    : origens.filter(origem => Number(origem.id) === Number(peca.origemId || 0));
}

function calcularCustoPeca(peca, origens) {
  const origensDoProduto = obterOrigensDoProduto(peca, origens);
  const totalUnidades = origensDoProduto.reduce((total, origem) => {
    return total + Number(origem.quantidadeTotal || origem.quantidade_total || 0);
  }, 0);
  const totalInvestido = origensDoProduto.reduce((total, origem) => {
    return total + Number(origem.valorPago || origem.valor_pago || origem.custoTotal || origem.custo_total || 0);
  }, 0);

  if (totalUnidades <= 0 || totalInvestido <= 0) {
    return Number(peca.custo || 0);
  }

  return totalInvestido / totalUnidades;
}

function calcularCustoUnitarioAtualDaPeca(peca) {
  const origens = contextoVenda.origens.length > 0 ? contextoVenda.origens : buscarOrigens();
  return calcularCustoPeca(peca, origens);
}

function calcularCustosPeca(pecaId) {
  const custos = contextoVenda.custosPeca.length > 0 ? contextoVenda.custosPeca : buscarCustos();

  return custos
    .filter(custo => Number(custo.pecaId || 0) === Number(pecaId || 0))
    .reduce((total, custo) => total + Number(custo.valor || 0), 0);
}

function calcularCustoFifoVenda(consumosFifo) {
  return consumosFifo.reduce((total, consumo) => total + Number(consumo.custoTotal || 0), 0);
}

function recalcularVendaComCustoAtual(venda) {
  const peca = contextoVenda.produto || buscarProdutos().find(item => Number(item.id) === Number(venda.pecaId));
  const quantidade = Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || 0);
  const custoUnitario = peca ? calcularCustoUnitarioAtualDaPeca(peca) : calcularCustoUnitario(venda);
  const custoFifo = calcularCustoFifoVenda(contextoVenda.consumosFifo);
  const custoTotal = custoFifo > 0 ? custoFifo : custoUnitario * quantidade;
  const custosPeca = calcularCustosPeca(venda.pecaId);
  const custosVenda = calcularTotalCustosVenda(venda);
  const lucroBruto = Number(venda.valorTotal || 0) - custoTotal - custosPeca - custosVenda;

  return {
    custoUnitario: quantidade > 0 ? custoTotal / quantidade : custoUnitario,
    custoTotal,
    custosPeca,
    custosVenda,
    lucroBruto
  };
}

function calcularQuantidadeDisponivel(produto) {
  return Math.max(Number(produto.quantidade || 1) - Number(produto.quantidadeVendida || 0), 0);
}

function obterStatusProduto(produto) {
  return Number(produto.quantidadeVendida || 0) >= Number(produto.quantidade || 1)
    ? "vendida"
    : "em_estoque";
}

function renderizarDadosVenda(venda) {
  tituloVenda.textContent = venda.id || "Venda sem ID";
  const produtoAtual = contextoVenda.produto || buscarProdutos().find(item => Number(item.id) === Number(venda.pecaId));
  const nomeVenda = formatarNomePeca({
    id: venda.pecaId,
    nome: venda.produtoNome || produtoAtual?.nome,
    sku: venda.sku || produtoAtual?.sku
  });

  subtituloVenda.textContent = `${nomeVenda} • ${venda.dataVenda}`;

  dadosVenda.innerHTML = `
    <article class="detail-card">
      <span>ID da venda</span>
      <strong>${venda.id || "Venda antiga sem ID"}</strong>
    </article>
    <article class="detail-card">
      <span>Data da venda</span>
      <strong>${venda.dataVenda || "-"}</strong>
    </article>
    <article class="detail-card">
      <span>Produto</span>
      <strong>${nomeVenda}</strong>
    </article>
    <article class="detail-card">
      <span>SKU</span>
      <strong>${formatarSku({ sku: venda.sku || produtoAtual?.sku })}</strong>
    </article>
    <article class="detail-card">
      <span>ID da peca</span>
      <strong>${venda.pecaId || "-"}</strong>
    </article>
    <article class="detail-card">
      <span>Quantidade vendida</span>
      <strong>${venda.quantidadeVendidaNaVenda || venda.quantidadeVendida}</strong>
    </article>
    <article class="detail-card">
      <span>Preço unitário</span>
      <strong>${formatarMoeda(venda.precoUnitario)}</strong>
    </article>
    <article class="detail-card">
      <span>Valor total</span>
      <strong>${formatarMoeda(venda.valorTotal)}</strong>
    </article>
    <article class="detail-card">
      <span>Cliente</span>
      <strong>${venda.cliente || "-"}</strong>
    </article>
    <article class="detail-card">
      <span>Observações</span>
      <strong>${venda.observacoes || "-"}</strong>
    </article>
  `;
}

function renderizarResumoFinanceiro(venda) {
  const valorTotal = Number(venda.valorTotal || 0);
  const resultado = recalcularVendaComCustoAtual(venda);
  const custoUnitario = resultado.custoUnitario;
  const custoTotal = resultado.custoTotal;
  const totalCustosVenda = resultado.custosVenda;
  const lucroBruto = resultado.lucroBruto;
  const margem = valorTotal > 0 ? (lucroBruto / valorTotal) * 100 : 0;

  resumoFinanceiroVenda.innerHTML = `
    <article class="summary-card">
      <span>Valor total da venda</span>
      <strong>${formatarMoeda(valorTotal)}</strong>
    </article>
    <article class="summary-card">
      <span>Custo unitário</span>
      <strong>${formatarMoeda(custoUnitario)}</strong>
    </article>
    <article class="summary-card">
      <span>Custo total</span>
      <strong>${formatarMoeda(custoTotal)}</strong>
    </article>
    <article class="summary-card">
      <span>Custos da venda</span>
      <strong>${formatarMoeda(totalCustosVenda)}</strong>
    </article>
    <article class="summary-card">
      <span>Lucro bruto</span>
      <strong>${formatarMoeda(lucroBruto)}</strong>
    </article>
    <article class="summary-card">
      <span>Margem de lucro</span>
      <strong>${formatarPorcentagem(margem)}</strong>
    </article>
  `;
}

function renderizarProduto(venda) {
  const produtos = buscarProdutos();
  const produto = contextoVenda.produto || produtos.find(item => Number(item.id) === Number(venda.pecaId));

  if (!produto) {
    mensagemProdutoVenda.textContent = "Produto não encontrado no estoque atual.";
    dadosProdutoVenda.innerHTML = "";
    acaoDetalhesProduto.innerHTML = "";
    return;
  }

  mensagemProdutoVenda.textContent = "";
  const custoBase = calcularCustoPeca(produto, contextoVenda.origens.length > 0 ? contextoVenda.origens : buscarOrigens());
  const quantidade = Number(produto.quantidade || 1);
  const quantidadeVendida = Number(produto.quantidadeVendida || 0);
  const quantidadeDisponivel = calcularQuantidadeDisponivel(produto);
  const status = obterStatusProduto(produto);

  acaoDetalhesProduto.innerHTML = `
    <a class="button-primary" href="detalhes-produto.html?pecaId=${encodeURIComponent(produto.id)}">Ver detalhes da peça</a>
  `;

  dadosProdutoVenda.innerHTML = `
    <article class="detail-card">
      <span>Nome atual do produto</span>
      <strong>${formatarNomePeca(produto)}</strong>
    </article>
    <article class="detail-card">
      <span>SKU atual</span>
      <strong>${formatarSku(produto)}</strong>
    </article>
    <article class="detail-card">
      <span>Categoria</span>
      <strong>${produto.categoria || "-"}</strong>
    </article>
    <article class="detail-card">
      <span>Origem</span>
      <strong>${produto.origem || "-"}</strong>
    </article>
    <article class="detail-card">
      <span>Quantidade total</span>
      <strong>${quantidade}</strong>
    </article>
    <article class="detail-card">
      <span>Quantidade vendida</span>
      <strong>${quantidadeVendida}</strong>
    </article>
    <article class="detail-card">
      <span>Quantidade disponível</span>
      <strong>${quantidadeDisponivel}</strong>
    </article>
    <article class="detail-card">
      <span>Status</span>
      <strong>${status}</strong>
    </article>
    <article class="detail-card">
      <span>Custo base atual</span>
      <strong>${formatarMoeda(custoBase)}</strong>
    </article>
    <article class="detail-card">
      <span>Preço de venda atual</span>
      <strong>${formatarMoeda(produto.precoVenda)}</strong>
    </article>
  `;
}

function renderizarCustos(venda) {
  const custos = (contextoVenda.custosPeca.length > 0 ? contextoVenda.custosPeca : buscarCustos())
    .filter(custo => Number(custo.pecaId || 0) === Number(venda.pecaId || 0));
  const custosVenda = contextoVenda.custosVenda.length > 0
    ? contextoVenda.custosVenda
    : normalizarCustosVenda(venda.custosVenda);
  tabelaCustosVenda.innerHTML = "";

  if (custos.length === 0 && custosVenda.length === 0) {
    mensagemCustosVenda.textContent = "Nenhum custo diverso vinculado a este produto.";
    return;
  }

  mensagemCustosVenda.textContent = "";

  custos.forEach(custo => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${custo.data}</td>
      <td data-label="Tipo">${custo.tipo}</td>
      <td data-label="Descrição">${custo.descricao}</td>
      <td data-label="Valor">${formatarMoeda(custo.valor)}</td>
    `;

    tabelaCustosVenda.appendChild(linha);
  });

  custosVenda.forEach(custo => {
    const linha = document.createElement("tr");
    const tipoCusto = custo.tipo || custo.tipoCusto;

    linha.innerHTML = `
      <td data-label="Data">${venda.dataVenda || "-"}</td>
      <td data-label="Tipo">Venda - ${tipoCusto}</td>
      <td data-label="Descrição">${custo.descricao || "-"}</td>
      <td data-label="Valor">${formatarMoeda(custo.valor)}</td>
    `;

    tabelaCustosVenda.appendChild(linha);
  });
}

function obterDescricaoOrigem(origemId) {
  const origem = contextoVenda.origens.find(item => Number(item.id) === Number(origemId));

  return origem?.descricao || "-";
}

function renderizarCustoFifo() {
  tabelaCustoFifoVenda.innerHTML = "";

  if (!contextoVenda.consumosFifo.length) {
    mensagemCustoFifoVenda.textContent = "Esta venda ainda nao possui custo calculado por lote. O resumo usa fallback temporario.";
    return;
  }

  mensagemCustoFifoVenda.textContent = "";

  contextoVenda.consumosFifo.forEach(consumo => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Lote">Lote ${consumo.entradaEstoqueId}</td>
      <td data-label="Origem">${obterDescricaoOrigem(consumo.origemId)}</td>
      <td data-label="Quantidade">${consumo.quantidadeConsumida}x</td>
      <td data-label="Custo unitario">${formatarMoeda(consumo.custoUnitario)}</td>
      <td data-label="Custo total">${formatarMoeda(consumo.custoTotal)}</td>
    `;

    tabelaCustoFifoVenda.appendChild(linha);
  });

  const linhaTotal = document.createElement("tr");
  linhaTotal.innerHTML = `
    <td data-label="Lote" colspan="4"><strong>Custo total da venda</strong></td>
    <td data-label="Custo total"><strong>${formatarMoeda(calcularCustoFifoVenda(contextoVenda.consumosFifo))}</strong></td>
  `;
  tabelaCustoFifoVenda.appendChild(linhaTotal);
}

async function carregarContextoSupabase(venda) {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado() || !venda?.id) {
    return venda;
  }

  const [produto, origens, custosPeca, custosVenda, consumosEstoque] = await Promise.all([
    window.supabaseService.buscarPecaPorId(venda.pecaId),
    window.supabaseService.listarOrigens(),
    window.supabaseService.listarCustosPeca(),
    window.supabaseService.listarCustosVenda(),
    window.supabaseService.listarConsumosEstoque()
  ]);
  const custosVendaDaVenda = custosVenda.filter(custo => Number(custo.vendaId || 0) === Number(venda.id));

  contextoVenda = {
    produto,
    origens,
    custosPeca,
    custosVenda: custosVendaDaVenda,
    consumosFifo: consumosEstoque.filter(consumo => Number(consumo.vendaId || 0) === Number(venda.id))
  };

  return {
    ...venda,
    custosVenda: custosVendaDaVenda,
    totalCustosVenda: custosVendaDaVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0)
  };
}

async function iniciarDetalhesVenda() {
  let venda = null;

  try {
    venda = await encontrarVendaSupabase();
  } catch (erro) {
    console.error("Erro ao carregar venda do Supabase:", erro);
    mensagemVendaNaoEncontrada.textContent = "Nao foi possivel carregar a venda do Supabase. Tentando dados temporarios.";
  }

  venda = venda || encontrarVenda();

  if (!venda) {
    mensagemVendaNaoEncontrada.textContent = "Venda não encontrada.";
    dadosVenda.innerHTML = "";
    resumoFinanceiroVenda.innerHTML = "";
    tabelaCustoFifoVenda.innerHTML = "";
    return;
  }

  venda = await carregarContextoSupabase(venda);
  mensagemVendaNaoEncontrada.textContent = "";
  renderizarDadosVenda(venda);
  renderizarResumoFinanceiro(venda);
  renderizarCustoFifo();
  renderizarProduto(venda);
  renderizarCustos(venda);
}

iniciarDetalhesVenda();
