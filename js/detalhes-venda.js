const tituloVenda = document.getElementById("tituloVenda");
const subtituloVenda = document.getElementById("subtituloVenda");
const mensagemVendaNaoEncontrada = document.getElementById("mensagemVendaNaoEncontrada");
const dadosVenda = document.getElementById("dadosVenda");
const resumoRapidoVenda = document.getElementById("resumoRapidoVenda");
const resumoFinanceiroVenda = document.getElementById("resumoFinanceiroVenda");
const mensagemProdutoVenda = document.getElementById("mensagemProdutoVenda");
const dadosProdutoVenda = document.getElementById("dadosProdutoVenda");
const acaoDetalhesProduto = document.getElementById("acaoDetalhesProduto");
const mensagemCustosVenda = document.getElementById("mensagemCustosVenda");
const tabelaCustosVenda = document.getElementById("tabelaCustosVenda");
const totalCustosVendaDetalhe = document.getElementById("totalCustosVendaDetalhe");
const mensagemCustoFifoVenda = document.getElementById("mensagemCustoFifoVenda");
const tabelaCustoFifoVenda = document.getElementById("tabelaCustoFifoVenda");
const statusFifoVenda = document.getElementById("statusFifoVenda");
const botaoEditarVenda = document.getElementById("botaoEditarVenda");
const formEditarVenda = document.getElementById("formEditarVenda");
const dadosObservacoesVenda = document.getElementById("dadosObservacoesVenda");
const editarVendaData = document.getElementById("editarVendaData");
const editarVendaCanal = document.getElementById("editarVendaCanal");
const editarListaCustosVenda = document.getElementById("editarListaCustosVenda");
const botaoEditarAdicionarCustoVenda = document.getElementById("botaoEditarAdicionarCustoVenda");
const cancelarEdicaoVenda = document.getElementById("cancelarEdicaoVenda");
let tiposCustoVendaDetalhes = [];
const tiposCustoVendaPadraoDetalhes = ["Embalagem", "Frete", "Comissão", "Taxa marketplace", "Taxa cartão", "Coleta", "Etiqueta", "Outros"];
const TEXTO_CUSTO_NAO_CALCULADO = "Custo não calculado";
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

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function converterNumero(valor) {
  return Number(String(valor || "0").replace(",", "."));
}

function escaparHtml(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buscarTiposCustoVendaLocais() {
  const tipos = JSON.parse(localStorage.getItem("tiposCusto")) || [];

  if (tipos.length > 0) {
    return tipos;
  }

  return tiposCustoVendaPadraoDetalhes.map((nome, indice) => ({
    id: `local-venda-${indice + 1}`,
    nome,
    categoria: "venda",
    ativo: true
  }));
}

function criarOpcoesTiposCustoVenda(tipoSelecionado = "") {
  return [
    '<option value="">Tipo de custo</option>',
    ...tiposCustoVendaDetalhes
      .filter(tipo => tipo.ativo !== false && ["venda", "ambos"].includes(tipo.categoria || "ambos"))
      .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"))
      .map(tipo => {
        const selecionado = tipo.nome === tipoSelecionado ? " selected" : "";
        return `<option value="${escaparHtml(tipo.nome)}" data-tipo-id="${escaparHtml(tipo.id)}"${selecionado}>${escaparHtml(tipo.nome)}</option>`;
      })
  ].join("");
}

async function carregarTiposCustoVendaDetalhes() {
  if (window.supabaseService?.estaConfigurado()) {
    try {
      tiposCustoVendaDetalhes = await window.supabaseService.listarTiposCusto("venda") || [];
      return;
    } catch (erro) {
      console.error("Erro ao carregar tipos de custo da venda:", erro);
    }
  }

  tiposCustoVendaDetalhes = buscarTiposCustoVendaLocais();
}

function adicionarLinhaEdicaoCustoVenda(custo = {}) {
  if (!editarListaCustosVenda) {
    return;
  }

  const linha = document.createElement("div");
  linha.className = "cost-line";
  linha.innerHTML = `
    <select data-campo="tipo" aria-label="Tipo de custo da venda">
      ${criarOpcoesTiposCustoVenda(custo.tipoCusto || custo.tipo || "")}
    </select>
    <input data-campo="valor" type="number" min="0" step="0.01" placeholder="Valor" value="${custo.valor || ""}">
    <input data-campo="descricao" type="text" placeholder="Observacao" value="${escaparHtml(custo.descricao || "")}">
    <button type="button" class="button-secondary" data-acao="remover-custo">Remover</button>
  `;

  editarListaCustosVenda.appendChild(linha);
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
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return "-";
  }

  return `${Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}%`;
}

function obterClasseLucro(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return "profit-value profit-value--neutral";
  }

  return Number(valor) >= 0
    ? "profit-value profit-value--positive"
    : "profit-value profit-value--negative";
}

function obterQuantidadeVendida(venda) {
  return Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || venda.quantidade_vendida || 0);
}

function obterValorUnitarioVenda(venda) {
  const quantidade = obterQuantidadeVendida(venda);
  const valorUnitario = Number(venda.valorUnitario || venda.valor_unitario || venda.precoUnitario || venda.valorVendaUnitario || 0);

  if (valorUnitario > 0) {
    return valorUnitario;
  }

  const receita = window.financeiroUtils?.calcularReceitaVenda
    ? window.financeiroUtils.calcularReceitaVenda(venda)
    : Number(venda.valorTotal || venda.valor_total || venda.valorVenda || 0);

  return quantidade > 0 ? receita / quantidade : 0;
}

function obterObservacoesVenda(venda) {
  return venda.observacoes || venda.observacao || venda.descricao || "-";
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

function obterCustosVendaParaCalculo(venda) {
  const custos = contextoVenda.custosVenda.length > 0
    ? contextoVenda.custosVenda
    : normalizarCustosVenda(venda.custosVenda);

  return custos.map(custo => ({
    ...custo,
    vendaId: custo.vendaId || venda.id
  }));
}

function recalcularVendaComCustoAtual(venda) {
  const quantidade = Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || 0);
  const resultado = window.financeiroUtils.calcularLucroVenda(venda, contextoVenda.consumosFifo, obterCustosVendaParaCalculo(venda));

  return {
    custoCalculado: resultado.calculado,
    custoUnitario: resultado.calculado && quantidade > 0 ? resultado.custoConsumido / quantidade : null,
    custoTotal: resultado.custoConsumido,
    custosVenda: resultado.custosVenda,
    lucroVenda: resultado.lucro,
    receita: resultado.receita,
    margem: resultado.margem
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

function renderizarDadosVendaLegado(venda) {
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

  formEditarVenda.hidden = false;
  editarVendaData.focus();
}

function fecharFormularioEdicaoVenda() {
  if (formEditarVenda) {
    formEditarVenda.hidden = true;
  }
}


function montarCustosVendaEditados() {
  return Array.from(editarListaCustosVenda.querySelectorAll(".cost-line"))
    .map(linha => {
      const selectTipo = linha.querySelector("[data-campo='tipo']");
      const tipo = selectTipo?.value || "";
      const tipoCustoId = selectTipo?.selectedOptions[0]?.dataset?.tipoId || null;
      const descricao = linha.querySelector("[data-campo='descricao']")?.value.trim() || tipo;
      const valor = converterNumero(linha.querySelector("[data-campo='valor']")?.value || 0);

      if (Number.isNaN(valor) || valor < 0) {
        throw new Error("Valor de custo invalido.");
      }

      if (valor > 0 && !tipo) {
        throw new Error("Selecione o tipo de custo em todas as linhas com valor.");
      }

      return {
        tipo,
        tipoCusto: tipo,
        tipoCustoId,
        descricao,
        valor
      };
    })
    .filter(custo => custo.tipo && Number(custo.valor || 0) > 0);
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

  const botaoSalvar = formEditarVenda.querySelector("button[type='submit']");
  botaoSalvar.disabled = true;
  mensagemVendaNaoEncontrada.textContent = "Salvando venda...";

  try {
    const vendaAtualizada = await window.supabaseService.atualizarVendaBasica({
      id: vendaAtual.id,
      dataVenda: editarVendaData.value,
      canalVenda: editarVendaCanal.value.trim()
    });

    vendaAtual = {
      ...vendaAtual,
      ...vendaAtualizada,
      custosVenda: contextoVenda.custosVenda,
      totalCustosVenda: contextoVenda.custosVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0)
    };

    fecharFormularioEdicaoVenda();
    renderizarDadosVendaCompleta(vendaAtual);
    renderizarObservacoesVenda(vendaAtual);
    renderizarResumoRapido(vendaAtual);
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

function obterDescricaoOrigem(origemId) {
  const origem = contextoVenda.origens.find(item => Number(item.id) === Number(origemId));

  return origem?.descricao || "-";
}

function obterEntradaConsumida(entradaId) {
  return contextoVenda.entradasEstoque.find(entrada => Number(entrada.id) === Number(entradaId));
}

function obterImagemProdutoVenda(produto) {
  return String(produto?.imagemUrl || produto?.imagem_url || "").trim();
}

function renderizarImagemProdutoVenda(produto, nome) {
  const imagemUrl = obterImagemProdutoVenda(produto);

  if (imagemUrl) {
    return `<img src="${escaparHtml(imagemUrl)}" alt="Imagem de ${escaparHtml(nome)}" loading="lazy">`;
  }

  return "<span>IMG</span>";
}

function renderizarDadosVendaCompleta(venda) {
  tituloVenda.textContent = venda.id || "Venda sem ID";
  const produtoAtual = contextoVenda.produto || buscarProdutos().find(item => Number(item.id) === Number(venda.pecaId));
  const dataVenda = obterDataVenda(venda);
  const nomeVenda = formatarNomePeca({
    id: venda.pecaId,
    nome: venda.produtoNome || produtoAtual?.nome,
    sku: venda.sku || produtoAtual?.sku
  });
  const observacao = obterObservacoesVenda(venda);

  subtituloVenda.textContent = `${nomeVenda} - ${formatarData(dataVenda)}`;

  dadosVenda.innerHTML = `
    <article class="detail-card">
      <span>Data da venda</span>
      <strong>${formatarData(dataVenda)}</strong>
    </article>
    <article class="detail-card">
      <span>Canal</span>
      <strong>${escaparHtml(venda.canalVenda || venda.canal_venda || venda.cliente || "-")}</strong>
    </article>
    <article class="detail-card">
      <span>ID da venda</span>
      <strong>${escaparHtml(venda.id || "-")}</strong>
    </article>
    <article class="detail-card detail-card--wide">
      <span>Observacao</span>
      <strong>${escaparHtml(observacao)}</strong>
    </article>
  `;
}

function renderizarProduto(venda) {
  const produtos = buscarProdutos();
  const produto = contextoVenda.produto || produtos.find(item => Number(item.id) === Number(venda.pecaId));
  const sku = venda.sku || produto?.sku;
  const nome = venda.produtoNome || produto?.nome || produto?.nome_peca || produto?.descricao || "-";
  const quantidade = obterQuantidadeVendida(venda);
  const valorUnitario = obterValorUnitarioVenda(venda);
  const receita = window.financeiroUtils.calcularReceitaVenda(venda);

  if (!produto && !venda.pecaId) {
    mensagemProdutoVenda.textContent = "Produto nao encontrado no estoque atual.";
    dadosProdutoVenda.innerHTML = "";
    acaoDetalhesProduto.innerHTML = "";
    return;
  }

  mensagemProdutoVenda.textContent = "";
  acaoDetalhesProduto.innerHTML = venda.pecaId
    ? `<a class="button-secondary" href="detalhes-produto.html?pecaId=${encodeURIComponent(venda.pecaId)}">Ver produto</a>`
    : "";

  dadosProdutoVenda.innerHTML = `
    <article class="sale-detail-product-line">
      <div class="sale-detail-product-image">${renderizarImagemProdutoVenda(produto, nome)}</div>
      <div class="sale-detail-product-info">
        <span>${escaparHtml(formatarSku({ sku }))}</span>
        <strong>${escaparHtml(nome)}</strong>
        <small>ID da peca: ${escaparHtml(venda.pecaId || "-")}</small>
      </div>
      <div class="sale-detail-product-metric">
        <span>Qtd.</span>
        <strong>${quantidade}</strong>
      </div>
      <div class="sale-detail-product-metric">
        <span>Unitario</span>
        <strong>${formatarMoeda(valorUnitario)}</strong>
      </div>
      <div class="sale-detail-product-metric sale-detail-product-metric--total">
        <span>Total</span>
        <strong>${formatarMoeda(receita)}</strong>
      </div>
    </article>
  `;
}

function renderizarCustos(venda) {
  const custosVenda = obterCustosVendaParaCalculo(venda);
  const totalCustosVenda = window.financeiroUtils.calcularCustosVenda(venda.id, custosVenda).valor;

  tabelaCustosVenda.innerHTML = "";
  totalCustosVendaDetalhe.textContent = formatarMoeda(totalCustosVenda);

  if (custosVenda.length === 0) {
    mensagemCustosVenda.textContent = "Nenhum custo vinculado diretamente a esta venda.";
    return;
  }

  mensagemCustosVenda.textContent = "";

  custosVenda.forEach(custo => {
    const linha = document.createElement("article");
    linha.className = "sale-detail-cost-line";
    const tipoCusto = custo.tipo || custo.tipoCusto;

    linha.innerHTML = `
      <div>
        <span>${escaparHtml(tipoCusto || "Custo da venda")}</span>
        <small>${formatarData(custo.data || custo.dataCusto || obterDataVenda(venda))}</small>
      </div>
      <strong>${formatarMoeda(custo.valor)}</strong>
      <p>${escaparHtml(custo.descricao || "-")}</p>
    `;

    tabelaCustosVenda.appendChild(linha);
  });
}

function renderizarCustoFifo() {
  tabelaCustoFifoVenda.innerHTML = "";

  if (!contextoVenda.consumosFifo.length) {
    mensagemCustoFifoVenda.textContent = TEXTO_CUSTO_NAO_CALCULADO;
    statusFifoVenda.textContent = TEXTO_CUSTO_NAO_CALCULADO;
    statusFifoVenda.className = "status-badge status-badge--warning";
    const linha = document.createElement("article");
    linha.className = "sale-detail-fifo-line sale-detail-fifo-line--empty";
    linha.innerHTML = `<strong>${TEXTO_CUSTO_NAO_CALCULADO}</strong>`;
    tabelaCustoFifoVenda.appendChild(linha);
    return;
  }

  mensagemCustoFifoVenda.textContent = "";
  statusFifoVenda.textContent = "Custo calculado";
  statusFifoVenda.className = "status-badge status-badge--stock";

  contextoVenda.consumosFifo.forEach(consumo => {
    const entrada = obterEntradaConsumida(consumo.entradaEstoqueId);
    const linha = document.createElement("article");
    linha.className = "sale-detail-fifo-line";

    linha.innerHTML = `
      <strong>Entrada ${escaparHtml(consumo.entradaEstoqueId || "-")}</strong>
      <time>${formatarData(entrada?.dataEntrada)}</time>
      <span>${escaparHtml(consumo.quantidadeConsumida || "-")}</span>
      <span>${formatarMoeda(consumo.custoUnitario)}</span>
      <strong>${formatarMoeda(consumo.custoTotal)}</strong>
    `;

    tabelaCustoFifoVenda.appendChild(linha);
  });

  const custoConsumido = window.financeiroUtils.calcularCustoConsumidoVenda(vendaAtual?.id, contextoVenda.consumosFifo);
  const linhaTotal = document.createElement("article");
  linhaTotal.className = "sale-detail-fifo-line sale-detail-fifo-line--total";
  linhaTotal.innerHTML = `
    <strong>Custo total consumido</strong>
    <span>-</span>
    <span>-</span>
    <span>-</span>
    <strong>${formatarMoeda(custoConsumido.valor)}</strong>
  `;
  tabelaCustoFifoVenda.appendChild(linhaTotal);
}

function renderizarResumoFinanceiro(venda) {
  const resultado = recalcularVendaComCustoAtual(venda);

  if (!resultado.custoCalculado) {
    resumoFinanceiroVenda.innerHTML = `
      <div class="sale-detail-result-note">
        <strong>${TEXTO_CUSTO_NAO_CALCULADO}</strong>
        <p>Nao ha custo consumido registrado para esta venda. O lucro e a margem ficam bloqueados ate o custo da peca estar disponivel.</p>
      </div>
    `;
    return;
  }

  resumoFinanceiroVenda.innerHTML = `
    <div class="sale-detail-result-note">
      <p>Receita de ${formatarMoeda(resultado.receita)} menos ${formatarMoeda(resultado.custoTotal)} de custo da peca e ${formatarMoeda(resultado.custosVenda)} de custos da venda.</p>
      <strong>Resultado final: ${formatarMoeda(resultado.lucroVenda)} de lucro, margem de ${formatarPorcentagem(resultado.margem)}.</strong>
    </div>
  `;
}

function renderizarResumoRapido(venda) {
  if (!resumoRapidoVenda) {
    return;
  }

  const resultado = recalcularVendaComCustoAtual(venda);
  const classeCardResultado = resultado.custoCalculado
    ? (resultado.lucroVenda >= 0 ? "summary-card summary-card--profit" : "summary-card summary-card--loss")
    : "summary-card";

  resumoRapidoVenda.innerHTML = `
    <article class="summary-card">
      <span>Receita</span>
      <strong>${formatarMoeda(resultado.receita)}</strong>
    </article>
    <article class="summary-card">
      <span>Custo da peça</span>
      <strong>${resultado.custoCalculado ? formatarMoeda(resultado.custoTotal) : TEXTO_CUSTO_NAO_CALCULADO}</strong>
    </article>
    <article class="summary-card">
      <span>Custos da venda</span>
      <strong>${formatarMoeda(resultado.custosVenda)}</strong>
    </article>
    <article class="${classeCardResultado}">
      <span>Lucro</span>
      <strong>${resultado.custoCalculado ? `<span class="${obterClasseLucro(resultado.lucroVenda)}">${formatarMoeda(resultado.lucroVenda)}</span>` : TEXTO_CUSTO_NAO_CALCULADO}</strong>
    </article>
    <article class="${classeCardResultado}">
      <span>Margem</span>
      <strong>${resultado.custoCalculado ? `<span class="${obterClasseLucro(resultado.lucroVenda)}">${formatarPorcentagem(resultado.margem)}</span>` : TEXTO_CUSTO_NAO_CALCULADO}</strong>
    </article>
  `;
}

function renderizarObservacoesVenda(venda) {
  if (!dadosObservacoesVenda) {
    return;
  }

  dadosObservacoesVenda.innerHTML = `
    <article class="detail-card detail-card--wide">
      <span>Observacoes</span>
      <strong>${escaparHtml(obterObservacoesVenda(venda))}</strong>
    </article>
    <article class="detail-card">
      <span>Permitido editar</span>
      <strong>Data da venda e canal.</strong>
    </article>
    <article class="detail-card">
      <span>Protegido</span>
      <strong>Quantidade vendida e custo consumido.</strong>
    </article>
  `;
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

  await carregarTiposCustoVendaDetalhes();

  try {
    venda = await encontrarVendaSupabase();
  } catch (erro) {
    console.error("Erro ao carregar venda do Supabase:", erro);
    mensagemVendaNaoEncontrada.textContent = "Nao foi possivel carregar a venda do Supabase. Tentando dados temporarios.";
  }

  venda = venda || encontrarVenda();

  if (!venda) {
    mensagemVendaNaoEncontrada.textContent = "Selecione uma venda pelo historico para abrir os detalhes.";
    dadosVenda.innerHTML = "";
    resumoRapidoVenda.innerHTML = "";
    resumoFinanceiroVenda.innerHTML = "";
    tabelaCustoFifoVenda.innerHTML = "";
    return;
  }

  venda = await carregarContextoSupabase(venda);
  vendaAtual = venda;
  mensagemVendaNaoEncontrada.textContent = "";
  renderizarDadosVendaCompleta(venda);
  renderizarResumoRapido(venda);
  renderizarResumoFinanceiro(venda);
  renderizarCustoFifo();
  renderizarProduto(venda);
  renderizarCustos(venda);
  renderizarObservacoesVenda(venda);
}

botaoEditarVenda?.addEventListener("click", abrirFormularioEdicaoVenda);
cancelarEdicaoVenda?.addEventListener("click", fecharFormularioEdicaoVenda);
formEditarVenda?.addEventListener("submit", salvarEdicaoVenda);
botaoEditarAdicionarCustoVenda?.addEventListener("click", () => adicionarLinhaEdicaoCustoVenda());
editarListaCustosVenda?.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-acao='remover-custo']");

  if (botao) {
    botao.closest(".cost-line")?.remove();
  }
});

iniciarDetalhesVenda();
