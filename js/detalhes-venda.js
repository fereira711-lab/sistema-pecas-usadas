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
const botaoEditarVenda = document.getElementById("botaoEditarVenda");
const formEditarVenda = document.getElementById("formEditarVenda");
const editarVendaData = document.getElementById("editarVendaData");
const editarVendaCanal = document.getElementById("editarVendaCanal");
const editarVendaCustoEmbalagem = document.getElementById("editarVendaCustoEmbalagem");
const editarVendaCustoComissao = document.getElementById("editarVendaCustoComissao");
const editarVendaCustoFrete = document.getElementById("editarVendaCustoFrete");
const editarVendaCustoOutros = document.getElementById("editarVendaCustoOutros");
const cancelarEdicaoVenda = document.getElementById("cancelarEdicaoVenda");
let vendaAtual = null;
let contextoVenda = {
  produto: null,
  origens: [],
  entradasEstoque: [],
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

function converterNumero(valor) {
  return Number(String(valor || "0").replace(",", "."));
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

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || "").slice(0, 10);
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
  const id = parametros.get("vendaId") || parametros.get("id");
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
  const id = parametros.get("vendaId") || parametros.get("id");

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
  const entradasDaPeca = contextoVenda.entradasEstoque.filter(entrada => Number(entrada.pecaId || 0) === Number(peca.id || 0));

  if (entradasDaPeca.length > 0) {
    const totalUnidadesEntrada = entradasDaPeca.reduce((total, entrada) => total + Number(entrada.quantidadeTotal || 0), 0);
    const totalInvestidoEntrada = entradasDaPeca.reduce((total, entrada) => {
      return total + (Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0));
    }, 0);

    if (totalUnidadesEntrada > 0 && totalInvestidoEntrada > 0) {
      return totalInvestidoEntrada / totalUnidadesEntrada;
    }
  }

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

function calcularCustoFifoVenda(consumosFifo) {
  return consumosFifo.reduce((total, consumo) => total + Number(consumo.custoTotal || 0), 0);
}

function recalcularVendaComCustoAtual(venda) {
  const peca = contextoVenda.produto || buscarProdutos().find(item => Number(item.id) === Number(venda.pecaId));
  const quantidade = Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || 0);
  const custoUnitario = peca ? calcularCustoUnitarioAtualDaPeca(peca) : calcularCustoUnitario(venda);
  const custoFifo = calcularCustoFifoVenda(contextoVenda.consumosFifo);
  const custoTotal = custoFifo > 0 ? custoFifo : custoUnitario * quantidade;
  const custosVenda = calcularTotalCustosVenda(venda);
  const lucroVenda = Number(venda.valorTotal || 0) - custoTotal - custosVenda;

  return {
    custoUnitario: quantidade > 0 ? custoTotal / quantidade : custoUnitario,
    custoTotal,
    custosVenda,
    lucroVenda
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
  const dataVenda = obterDataVenda(venda);
  const nomeVenda = formatarNomePeca({
    id: venda.pecaId,
    nome: venda.produtoNome || produtoAtual?.nome,
    sku: venda.sku || produtoAtual?.sku
  });

  subtituloVenda.textContent = `${nomeVenda} • ${formatarData(dataVenda)}`;

  dadosVenda.innerHTML = `
    <article class="detail-card">
      <span>ID da venda</span>
      <strong>${venda.id || "Venda antiga sem ID"}</strong>
    </article>
    <article class="detail-card">
      <span>Data da venda</span>
      <strong>${formatarData(dataVenda)}</strong>
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
      <span>ID da peça</span>
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
      <span>Canal de venda</span>
      <strong>${venda.canalVenda || venda.canal_venda || venda.cliente || "-"}</strong>
    </article>
  `;
}

function normalizarTipoCusto(tipo) {
  return String(tipo || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll(" ", "_");
}

function obterCustoVendaPorTipo(tipo) {
  const tipoNormalizado = normalizarTipoCusto(tipo);
  return contextoVenda.custosVenda.find(custo => {
    const tipoCusto = normalizarTipoCusto(custo.tipo || custo.tipoCusto);
    return tipoCusto === tipoNormalizado || (tipoNormalizado === "outros" && tipoCusto.startsWith("outro"));
  });
}

function preencherCampoCusto(campo, tipo) {
  const custo = obterCustoVendaPorTipo(tipo);
  campo.value = custo ? Number(custo.valor || 0) : "";
}

function abrirFormularioEdicaoVenda() {
  if (!vendaAtual || !formEditarVenda) {
    return;
  }

  editarVendaData.value = obterDataVenda(vendaAtual);
  editarVendaCanal.value = vendaAtual.canalVenda || vendaAtual.canal_venda || vendaAtual.cliente || "";
  preencherCampoCusto(editarVendaCustoEmbalagem, "embalagem");
  preencherCampoCusto(editarVendaCustoComissao, "comissao");
  preencherCampoCusto(editarVendaCustoFrete, "frete");
  preencherCampoCusto(editarVendaCustoOutros, "outros");
  formEditarVenda.hidden = false;
  editarVendaData.focus();
}

function fecharFormularioEdicaoVenda() {
  if (formEditarVenda) {
    formEditarVenda.hidden = true;
  }
}

function montarCustoVendaEditado(tipo, campo, descricaoPadrao) {
  const valor = converterNumero(campo.value);
  const custoExistente = obterCustoVendaPorTipo(tipo);

  if (Number.isNaN(valor) || valor < 0) {
    throw new Error("Valor de custo inválido.");
  }

  if (valor <= 0) {
    return null;
  }

  return {
    tipo,
    tipoCusto: tipo,
    descricao: custoExistente?.descricao || descricaoPadrao,
    valor
  };
}

function montarCustosVendaEditados() {
  const tiposEditados = new Set(["embalagem", "comissao", "frete", "outros"]);
  const custosMantidos = contextoVenda.custosVenda
    .filter(custo => {
      const tipo = normalizarTipoCusto(custo.tipo || custo.tipoCusto);
      const tipoPadrao = tipo.startsWith("outro") ? "outros" : tipo;
      return !tiposEditados.has(tipoPadrao);
    })
    .map(custo => ({
      tipo: custo.tipo || custo.tipoCusto,
      tipoCusto: custo.tipoCusto || custo.tipo,
      descricao: custo.descricao || "",
      valor: Number(custo.valor || 0)
    }));

  return [
    ...custosMantidos,
    montarCustoVendaEditado("embalagem", editarVendaCustoEmbalagem, "Custo de embalagem"),
    montarCustoVendaEditado("comissao", editarVendaCustoComissao, "Comissão da venda"),
    montarCustoVendaEditado("frete", editarVendaCustoFrete, "Frete da venda"),
    montarCustoVendaEditado("outros", editarVendaCustoOutros, "Outros custos da venda")
  ].filter(Boolean);
}

async function salvarEdicaoVenda(evento) {
  evento.preventDefault();

  if (!vendaAtual?.id || !window.supabaseService?.estaConfigurado()) {
    mensagemVendaNaoEncontrada.textContent = "Configure o Supabase antes de editar a venda.";
    return;
  }

  if (!editarVendaData.value) {
    mensagemVendaNaoEncontrada.textContent = "Informe a data da venda.";
    return;
  }

  let custosVendaEditados = [];

  try {
    custosVendaEditados = montarCustosVendaEditados();
  } catch (erro) {
    mensagemVendaNaoEncontrada.textContent = erro.message;
    return;
  }

  const botaoSalvar = formEditarVenda.querySelector("button[type='submit']");
  botaoSalvar.disabled = true;
  mensagemVendaNaoEncontrada.textContent = "Salvando venda...";

  try {
    const vendaAtualizada = await window.supabaseService.atualizarVendaBasica({
      id: vendaAtual.id,
      dataVenda: editarVendaData.value,
      canalVenda: editarVendaCanal.value.trim()
    });
    const custosAtualizados = await window.supabaseService.substituirCustosVenda(vendaAtual.id, custosVendaEditados);
    const totalCustosVenda = custosAtualizados.reduce((total, custo) => total + Number(custo.valor || 0), 0);

    contextoVenda.custosVenda = custosAtualizados;
    vendaAtual = {
      ...vendaAtual,
      ...vendaAtualizada,
      custosVenda: custosAtualizados,
      totalCustosVenda
    };

    fecharFormularioEdicaoVenda();
    renderizarDadosVenda(vendaAtual);
    renderizarResumoFinanceiro(vendaAtual);
    renderizarCustos(vendaAtual);
    mensagemVendaNaoEncontrada.textContent = "Venda atualizada com sucesso.";
  } catch (erro) {
    console.error("Erro ao editar venda:", erro);
    mensagemVendaNaoEncontrada.textContent = "Não foi possível atualizar a venda.";
  } finally {
    botaoSalvar.disabled = false;
  }
}

function renderizarResumoFinanceiro(venda) {
  const valorTotal = Number(venda.valorTotal || 0);
  const resultado = recalcularVendaComCustoAtual(venda);
  const custoUnitario = resultado.custoUnitario;
  const custoTotal = resultado.custoTotal;
  const totalCustosVenda = resultado.custosVenda;
  const lucroVenda = resultado.lucroVenda;
  const margem = valorTotal > 0 ? (lucroVenda / valorTotal) * 100 : 0;

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
      <span>Custo das entradas consumidas</span>
      <strong>${formatarMoeda(custoTotal)}</strong>
    </article>
    <article class="summary-card">
      <span>Custos da venda</span>
      <strong>${formatarMoeda(totalCustosVenda)}</strong>
    </article>
    <article class="summary-card">
      <span>Lucro da venda</span>
      <strong>${formatarMoeda(lucroVenda)}</strong>
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
  const custosVenda = contextoVenda.custosVenda.length > 0
    ? contextoVenda.custosVenda
    : normalizarCustosVenda(venda.custosVenda);
  tabelaCustosVenda.innerHTML = "";

  if (custosVenda.length === 0) {
    mensagemCustosVenda.textContent = "Nenhum custo vinculado diretamente a esta venda.";
    return;
  }

  mensagemCustosVenda.textContent = "";

  custosVenda.forEach(custo => {
    const linha = document.createElement("tr");
    const tipoCusto = custo.tipo || custo.tipoCusto;

    linha.innerHTML = `
      <td data-label="Data">${formatarData(custo.data || custo.dataCusto || obterDataVenda(venda))}</td>
      <td data-label="Tipo">${tipoCusto || "-"}</td>
      <td data-label="Descrição">${custo.descricao || "-"}</td>
      <td data-label="Valor">${formatarMoeda(custo.valor)}</td>
    `;

    tabelaCustosVenda.appendChild(linha);
  });

  const linhaTotal = document.createElement("tr");
  linhaTotal.innerHTML = `
    <td data-label="Data" colspan="3"><strong>Total de custos da venda</strong></td>
    <td data-label="Valor"><strong>${formatarMoeda(calcularTotalCustosVenda(venda))}</strong></td>
  `;
  tabelaCustosVenda.appendChild(linhaTotal);
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
      <td data-label="Lote">Entrada ${consumo.entradaEstoqueId}</td>
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

  const [produto, origens, custosVenda, consumosEstoque, entradasEstoque] = await Promise.all([
    window.supabaseService.buscarPecaPorId(venda.pecaId),
    window.supabaseService.listarOrigens(),
    window.supabaseService.listarCustosVenda(),
    window.supabaseService.listarConsumosEstoque(),
    window.supabaseService.listarEntradasEstoque()
  ]);
  const custosVendaDaVenda = custosVenda.filter(custo => Number(custo.vendaId || 0) === Number(venda.id));

  contextoVenda = {
    produto,
    origens,
    entradasEstoque: entradasEstoque || [],
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
  vendaAtual = venda;
  mensagemVendaNaoEncontrada.textContent = "";
  renderizarDadosVenda(venda);
  renderizarResumoFinanceiro(venda);
  renderizarCustoFifo();
  renderizarProduto(venda);
  renderizarCustos(venda);
}

botaoEditarVenda?.addEventListener("click", abrirFormularioEdicaoVenda);
cancelarEdicaoVenda?.addEventListener("click", fecharFormularioEdicaoVenda);
formEditarVenda?.addEventListener("submit", salvarEdicaoVenda);

iniciarDetalhesVenda();
