// Detalhes da venda (redesenho): o extrato de uma venda. Peça vendida, dados, custos da venda,
// entrada consumida (de onde veio o custo de entrada) e o resultado, tudo pelo financeiro-utils.js.
// Só data e canal podem ser editados; quantidade, valor e custo consumido ficam protegidos.
const CANAIS_FIXOS = ["Mercado Livre", "WhatsApp", "Balcão", "Outro"];
const TEXTO_CUSTO_NAO_CALCULADO = "Custo não calculado";

const tituloVenda = document.getElementById("tituloVenda");
const subtituloVenda = document.getElementById("subtituloVenda");
const mensagemVenda = document.getElementById("mensagemVenda");
const acoesVenda = document.getElementById("acoesVenda");
const linkVerPeca = document.getElementById("linkVerPeca");
const botaoEditarVenda = document.getElementById("botaoEditarVenda");
const formEditarVenda = document.getElementById("formEditarVenda");
const editarVendaData = document.getElementById("editarVendaData");
const editarVendaCanais = document.getElementById("editarVendaCanais");
const dicaCanalAntigo = document.getElementById("dicaCanalAntigo");
const cancelarEdicaoVenda = document.getElementById("cancelarEdicaoVenda");
const conteudoVenda = document.getElementById("conteudoVenda");
const dadosProdutoVenda = document.getElementById("dadosProdutoVenda");
const dadosVenda = document.getElementById("dadosVenda");
const totalCustosVendaDetalhe = document.getElementById("totalCustosVendaDetalhe");
const tabelaCustosVenda = document.getElementById("tabelaCustosVenda");
const statusCustoVenda = document.getElementById("statusCustoVenda");
const tabelaCustoFifoVenda = document.getElementById("tabelaCustoFifoVenda");
const resumo = {
  receita: document.getElementById("resumoReceita"),
  custoPeca: document.getElementById("resumoCustoPeca"),
  linhaCustosPeca: document.getElementById("linhaCustosPecaVenda"),
  custosPeca: document.getElementById("resumoCustosPecaVenda"),
  custosVenda: document.getElementById("resumoCustosVenda"),
  lucroLinha: document.getElementById("resumoLucroLinha"),
  lucro: document.getElementById("resumoLucro"),
  margem: document.getElementById("resumoMargem"),
  nota: document.getElementById("notaResultadoVenda")
};

let vendaAtual = null;
let contextoVenda = { produto: null, origens: [], entradas: [], custosVenda: [], consumos: [], custosPeca: [] };
let canalEditado = "";

// ---- Formatação ----

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarMoeda(valor) {
  if (window.moedaUtils?.formatarMoedaBR) return window.moedaUtils.formatarMoedaBR(Number(valor || 0));
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarNegativo(valor) {
  return Number(valor || 0) > 0 ? `− ${formatarMoeda(valor)}` : formatarMoeda(0);
}

function formatarPercentual(valor) {
  if (window.moedaUtils?.formatarPercentualBR) return window.moedaUtils.formatarPercentualBR(valor, 1);
  return `${Number(valor || 0).toFixed(1).replace(".", ",")}%`;
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function formatarData(data) {
  const [ano, mes, dia] = String(data || "").slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

function obterDataVenda(venda) {
  return String(venda?.dataVenda || "").slice(0, 10);
}

// ---- Renderização ----

function renderizarCabecalho(venda) {
  const produto = contextoVenda.produto;
  const nome = produto?.nome || venda.produtoNome || `Peça ${venda.pecaId || ""}`.trim();

  document.title = `Venda de ${nome} · Detalhes da venda`;
  tituloVenda.textContent = `Venda de ${nome}`;
  subtituloVenda.textContent = [`Venda nº ${venda.id}`, formatarData(obterDataVenda(venda)), venda.canalVenda].filter(Boolean).join(" · ");
  linkVerPeca.href = venda.pecaId ? `detalhes-produto.html?pecaId=${encodeURIComponent(venda.pecaId)}` : "produtos.html";
  acoesVenda.hidden = false;
}

function renderizarProduto(venda) {
  const produto = contextoVenda.produto;
  const nome = produto?.nome || venda.produtoNome || "Peça";
  const sku = produto?.sku || venda.sku || "";
  const origem = contextoVenda.origens.find(item => Number(item.id) === Number(produto?.origemId));
  const imagemUrl = String(produto?.imagemUrl || "").trim();
  const quantidade = Number(venda.quantidadeVendida || 0);
  const receita = window.financeiroUtils.calcularReceitaVenda(venda);
  const unitario = Number(venda.valorUnitario || 0) || (quantidade > 0 ? receita / quantidade : 0);
  const meta = [
    sku ? `<span class="mono">${escaparHtml(sku)}</span>` : "",
    origem ? `<a href="detalhes-origem.html?origemId=${encodeURIComponent(origem.id)}">${escaparHtml(origem.descricao)}</a>` : ""
  ].filter(Boolean).join(" · ");

  dadosProdutoVenda.innerHTML = `
    <span class="thumb venda-peca__foto">${imagemUrl ? `<img src="${escaparHtml(imagemUrl)}" alt="" loading="lazy">` : '<i class="ri-image-line" aria-hidden="true"></i>'}</span>
    <div class="item-cell__text venda-peca__texto">
      ${venda.pecaId ? `<a class="item-cell__name" href="detalhes-produto.html?pecaId=${encodeURIComponent(venda.pecaId)}">${escaparHtml(nome)}</a>` : `<span class="cell-strong">${escaparHtml(nome)}</span>`}
      ${meta ? `<span class="item-cell__meta">${meta}</span>` : ""}
    </div>
    <dl class="venda-peca__valores">
      <div><dt>Qtd.</dt><dd>${formatarNumero(quantidade)}</dd></div>
      <div><dt>Unitário</dt><dd>${formatarMoeda(unitario)}</dd></div>
      <div><dt>Total</dt><dd>${formatarMoeda(receita)}</dd></div>
    </dl>
  `;
}

function renderizarDadosVenda(venda) {
  const observacao = String(venda.observacoes || "").trim();

  dadosVenda.innerHTML = `
    <div><dt>Data</dt><dd>${formatarData(obterDataVenda(venda))}</dd></div>
    <div><dt>Canal</dt><dd>${escaparHtml(venda.canalVenda || "—")}</dd></div>
    <div><dt>Observação</dt><dd>${escaparHtml(observacao || "—")}</dd></div>
  `;
}

function renderizarCustos(venda) {
  const custos = contextoVenda.custosVenda;
  const total = window.financeiroUtils.calcularCustosVenda(venda.id, custos).valor;

  totalCustosVendaDetalhe.textContent = custos.length ? formatarMoeda(total) : "";

  if (custos.length === 0) {
    tabelaCustosVenda.innerHTML = '<tr class="data-table__empty"><td colspan="4">Nenhum custo lançado nesta venda.</td></tr>';
    return;
  }

  tabelaCustosVenda.innerHTML = custos.map(custo => `
    <tr>
      <td class="cell-strong" data-label="Tipo">${escaparHtml(custo.tipoCusto || custo.tipo || "Custo da venda")}</td>
      <td class="cell-nowrap" data-label="Data">${formatarData(custo.dataCusto || custo.data || obterDataVenda(venda))}</td>
      <td class="cell-muted" data-label="Observação">${escaparHtml(custo.descricao || custo.observacoes || "—")}</td>
      <td class="num" data-label="Valor">${formatarMoeda(custo.valor)}</td>
    </tr>
  `).join("");
}

// De onde veio o custo de entrada: as entradas consumidas na baixa de estoque desta venda.
function renderizarEntradaConsumida() {
  const consumos = contextoVenda.consumos;

  if (consumos.length === 0) {
    statusCustoVenda.textContent = TEXTO_CUSTO_NAO_CALCULADO;
    statusCustoVenda.className = "pill pill--warning";
    tabelaCustoFifoVenda.innerHTML = `<tr class="data-table__empty"><td colspan="6">${TEXTO_CUSTO_NAO_CALCULADO}: não há entrada consumida registrada para esta venda.</td></tr>`;
    return;
  }

  statusCustoVenda.textContent = "Custo calculado";
  statusCustoVenda.className = "pill pill--success";

  tabelaCustoFifoVenda.innerHTML = consumos.map(consumo => {
    const entrada = contextoVenda.entradas.find(item => Number(item.id) === Number(consumo.entradaEstoqueId));
    const origem = contextoVenda.origens.find(item => Number(item.id) === Number(entrada?.origemId));

    return `
      <tr>
        <td class="cell-nowrap" data-label="Entrada"><span class="mono">ENT-${String(consumo.entradaEstoqueId || 0).padStart(6, "0")}</span></td>
        <td data-label="Origem">${origem ? `<a href="detalhes-origem.html?origemId=${encodeURIComponent(origem.id)}">${escaparHtml(origem.descricao)}</a>` : "—"}</td>
        <td class="cell-nowrap" data-label="Data da entrada">${formatarData(entrada?.dataEntrada)}</td>
        <td class="num" data-label="Qtd.">${formatarNumero(consumo.quantidadeConsumida)}</td>
        <td class="num" data-label="Custo unitário">${formatarMoeda(consumo.custoUnitario)}</td>
        <td class="num cell-strong" data-label="Custo total">${formatarMoeda(consumo.custoTotal)}</td>
      </tr>
    `;
  }).join("");
}

function renderizarResultado(venda) {
  // Custos lançados na peça (limpeza, pintura...) entram rateados pelas unidades vendidas.
  const resultado = window.financeiroUtils.calcularLucroVenda(venda, contextoVenda.consumos, contextoVenda.custosVenda, {
    custosPeca: contextoVenda.custosPeca,
    entradas: contextoVenda.entradas
  });

  resumo.receita.textContent = formatarMoeda(resultado.receita);
  resumo.linhaCustosPeca.hidden = !(resultado.custosPeca > 0);
  resumo.custosPeca.textContent = formatarNegativo(resultado.custosPeca);
  resumo.custosVenda.textContent = formatarNegativo(resultado.custosVenda);
  resumo.lucroLinha.classList.remove("summary-side__result--success", "summary-side__result--danger", "summary-side__result--neutral");
  resumo.margem.classList.remove("text-success", "text-danger");

  if (!resultado.calculado) {
    resumo.custoPeca.textContent = TEXTO_CUSTO_NAO_CALCULADO;
    resumo.lucro.textContent = "—";
    resumo.margem.textContent = "—";
    resumo.lucroLinha.classList.add("summary-side__result--neutral");
    resumo.nota.textContent = "Sem entrada consumida registrada, o lucro e a margem não são calculados.";
    return;
  }

  const classe = resultado.lucro < 0 ? "danger" : "success";
  resumo.custoPeca.textContent = formatarNegativo(resultado.custoConsumido);
  resumo.lucro.textContent = formatarMoeda(resultado.lucro);
  resumo.margem.textContent = resultado.margem === null ? "—" : formatarPercentual(resultado.margem);
  resumo.lucroLinha.classList.add(`summary-side__result--${classe}`);
  if (resultado.margem !== null) resumo.margem.classList.add(`text-${classe}`);
  resumo.nota.textContent = resultado.custosPeca > 0
    ? "O custo de entrada vem da entrada consumida nesta venda; os custos lançados (limpeza, pintura etc.) entram divididos pelas unidades da peça."
    : "O custo de entrada vem da entrada consumida na baixa de estoque desta venda.";
}

function renderizarTela() {
  renderizarCabecalho(vendaAtual);
  renderizarProduto(vendaAtual);
  renderizarDadosVenda(vendaAtual);
  renderizarCustos(vendaAtual);
  renderizarEntradaConsumida();
  renderizarResultado(vendaAtual);
  conteudoVenda.hidden = false;
}

function mostrarMensagem(texto, tipo = "") {
  mensagemVenda.textContent = texto;
  mensagemVenda.className = `page-message${tipo === "success" ? " page-message--success" : ""}`;
}

// ---- Edição (data e canal) ----

function selecionarCanalEdicao(canal) {
  canalEditado = canal;
  editarVendaCanais.querySelectorAll("[data-canal]").forEach(botao => {
    botao.setAttribute("aria-pressed", String(botao.dataset.canal === canal));
  });
}

function abrirEdicao() {
  if (!vendaAtual) return;

  const canalAtual = String(vendaAtual.canalVenda || "").trim();
  const fixo = CANAIS_FIXOS.find(canal => canal.toLowerCase() === canalAtual.toLowerCase()) || "";

  editarVendaData.value = obterDataVenda(vendaAtual);
  selecionarCanalEdicao(fixo);
  // Canal antigo em texto livre: continua como está, a menos que um dos botões seja escolhido.
  dicaCanalAntigo.hidden = !canalAtual || Boolean(fixo);
  dicaCanalAntigo.textContent = `Canal gravado: "${canalAtual}". Ele continua assim se nenhum botão for escolhido.`;
  formEditarVenda.hidden = false;
  editarVendaData.focus();
}

function fecharEdicao() {
  formEditarVenda.hidden = true;
}

async function salvarEdicao(evento) {
  evento.preventDefault();

  if (!editarVendaData.value) {
    mostrarMensagem("Informe a data da venda.");
    editarVendaData.focus();
    return;
  }

  const botaoSalvar = formEditarVenda.querySelector("button[type='submit']");
  botaoSalvar.disabled = true;
  mostrarMensagem("Salvando venda…");

  try {
    const vendaAtualizada = await window.supabaseService.atualizarVendaBasica({
      id: vendaAtual.id,
      dataVenda: editarVendaData.value,
      canalVenda: canalEditado || vendaAtual.canalVenda || ""
    });

    vendaAtual = { ...vendaAtual, dataVenda: vendaAtualizada.dataVenda, canalVenda: vendaAtualizada.canalVenda };
    fecharEdicao();
    renderizarTela();
    mostrarMensagem("Venda atualizada.", "success");
  } catch (erro) {
    console.error("Erro ao editar venda:", erro);
    mostrarMensagem(erro?.message || "Não foi possível atualizar a venda.");
  } finally {
    botaoSalvar.disabled = false;
  }
}

// ---- Início ----

async function iniciarDetalhesVenda() {
  const vendaId = Number(new URLSearchParams(window.location.search).get("vendaId") || 0);

  if (!vendaId) {
    subtituloVenda.textContent = "";
    mostrarMensagem("Abra uma venda pela lista de Vendas.");
    return;
  }

  if (!window.supabaseService?.estaConfigurado()) {
    subtituloVenda.textContent = "";
    mostrarMensagem("Configure o Supabase para ver a venda.");
    return;
  }

  try {
    const servico = window.supabaseService;
    const [vendas, origens, custosVenda, consumos, entradas, custosPeca] = await Promise.all([
      servico.listarVendas(),
      servico.listarOrigens(),
      servico.listarCustosVenda(),
      servico.listarConsumosEstoque(),
      servico.listarEntradasEstoque(),
      servico.listarCustosPeca()
    ]);
    const venda = (vendas || []).find(item => Number(item.id) === vendaId);

    if (!venda) {
      subtituloVenda.textContent = "";
      mostrarMensagem("Venda não encontrada.");
      return;
    }

    contextoVenda = {
      produto: venda.pecaId ? await servico.buscarPecaPorId(venda.pecaId) : null,
      origens: origens || [],
      entradas: entradas || [],
      custosVenda: (custosVenda || []).filter(custo => Number(custo.vendaId) === vendaId),
      consumos: (consumos || []).filter(consumo => Number(consumo.vendaId) === vendaId),
      custosPeca: custosPeca || []
    };
    vendaAtual = venda;
    mostrarMensagem("");
    renderizarTela();
  } catch (erro) {
    console.error("Erro ao carregar a venda:", erro);
    subtituloVenda.textContent = "";
    mostrarMensagem("Não foi possível carregar a venda.");
  }
}

if (formEditarVenda) {
  botaoEditarVenda.addEventListener("click", abrirEdicao);
  cancelarEdicaoVenda.addEventListener("click", fecharEdicao);
  formEditarVenda.addEventListener("submit", salvarEdicao);
  editarVendaCanais.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-canal]");
    if (botao) selecionarCanalEdicao(botao.dataset.canal);
  });

  iniciarDetalhesVenda();
}
