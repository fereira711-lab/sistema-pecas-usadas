// Detalhes da origem (redesenho): quanto a origem custou, quanto já voltou em vendas, o resultado contra
// o valor pago, o que ainda está em estoque e a conta de cada peça.
// Os valores vêm do financeiro-utils.js (calcularRetornoOrigem); "parada" vem do alertas-regras.js.
const PECAS_VISIVEIS = 10;

const tituloOrigem = document.getElementById("tituloOrigem");
const subtituloOrigem = document.getElementById("subtituloOrigem");
const observacaoOrigem = document.getElementById("observacaoOrigem");
const mensagemOrigem = document.getElementById("mensagemOrigem");
const botaoEditarOrigem = document.getElementById("botaoEditarOrigem");
const linkAdicionarPeca = document.getElementById("linkAdicionarPeca");
const kpisOrigem = document.getElementById("kpisOrigem");
const blocoRetornoOrigem = document.getElementById("blocoRetornoOrigem");
const percentualRetornoOrigem = document.getElementById("percentualRetornoOrigem");
const barraRetornoOrigem = document.getElementById("barraRetornoOrigem");
const preenchimentoRetornoOrigem = document.getElementById("preenchimentoRetornoOrigem");
const legendaPagoOrigem = document.getElementById("legendaPagoOrigem");
const fraseRetornoOrigem = document.getElementById("fraseRetornoOrigem");
const blocoPecasOrigem = document.getElementById("blocoPecasOrigem");
const filtroPecasOrigem = document.getElementById("filtroPecasOrigem");
const tabelaPecasOrigem = document.getElementById("tabelaPecasOrigem");
const rodapePecasOrigem = document.getElementById("rodapePecasOrigem");
const formEditarOrigem = document.getElementById("formEditarOrigem");
const editarOrigemTipo = document.getElementById("editarOrigemTipo");
const editarOrigemDataCompra = document.getElementById("editarOrigemDataCompra");
const editarOrigemDescricao = document.getElementById("editarOrigemDescricao");
const editarOrigemCustoTotal = document.getElementById("editarOrigemCustoTotal");
const editarOrigemQuantidadeTotal = document.getElementById("editarOrigemQuantidadeTotal");
const editarOrigemObservacoes = document.getElementById("editarOrigemObservacoes");
const cancelarEdicaoOrigem = document.getElementById("cancelarEdicaoOrigem");

let origemId = 0;
let dadosOrigem = null;
let linhasPecas = [];
let filtroAtual = "todas";

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

function formatarPercentualInteiro(valor) {
  if (window.moedaUtils?.formatarPercentualBR) return window.moedaUtils.formatarPercentualBR(valor, 0);
  return `${Math.round(Number(valor || 0))}%`;
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function plural(quantidade, singular, pluralTexto) {
  return `${formatarNumero(quantidade)} ${quantidade === 1 ? singular : pluralTexto}`;
}

function formatarData(data) {
  const [ano, mes, dia] = String(data || "").slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "";
}

// ---- Regras da tela (sem cálculo financeiro próprio) ----

// Situação da peça com as mesmas regras e a mesma prioridade de Produtos:
// Vendida; Preço abaixo do custo > Parada há N dias > Em estoque.
function calcularSituacao(item, parada, financeiro, dados) {
  if (item.vendida) return { chave: "vendida" };
  if (item.saldo <= 0) return { chave: "sem-saldo" };

  const custo = financeiro.calcularCustoReferenciaPeca(item.peca.id, dados.entradas, dados.consumos, dados.custosPeca);
  const margem = custo.calculado ? financeiro.calcularMargemPreco(item.precoVenda, custo.valor) : null;

  if (margem !== null && margem < 0) return { chave: "abaixo-custo" };
  if (parada) return { chave: "parada", dias: parada.dias };
  return { chave: "estoque" };
}

function obterUltimaVenda(item) {
  return item.vendas.map(venda => String(venda.dataVenda || "").slice(0, 10)).sort().pop() || "";
}

// Vendidas primeiro (a mais recente no topo), depois as que ainda estão em estoque (maior custo no topo).
function ordenarLinhas(linhas) {
  return [...linhas].sort((a, b) => {
    if (a.vendida !== b.vendida) return a.vendida ? -1 : 1;
    if (a.vendida) return obterUltimaVenda(b).localeCompare(obterUltimaVenda(a)) || b.custoAtribuido - a.custoAtribuido;
    return b.custoAtribuido - a.custoAtribuido;
  });
}

function montarLinhasPecas(retorno, dados, opcoes = {}) {
  const financeiro = opcoes.financeiro || window.financeiroUtils;
  const regras = opcoes.alertasRegras || window.alertasRegras;
  const paradas = new Map(
    (regras?.calcularPecasParadas({
      pecas: retorno.pecas.map(item => item.peca),
      vendas: dados.vendas,
      entradasEstoque: dados.entradas
    }, opcoes.hoje) || []).map(item => [Number(item.peca.id), item])
  );

  return ordenarLinhas(retorno.pecas.map(item => ({
    ...item,
    situacao: calcularSituacao(item, paradas.get(Number(item.peca.id)), financeiro, dados)
  })));
}

function linhaCombinaComFiltro(linha, filtro) {
  if (filtro === "vendidas") return linha.vendida;
  if (filtro === "estoque") return linha.saldo > 0;
  return true;
}

// Frase do bloco "Retorno da origem": se já se pagou (ou quanto falta) e quanto o estoque ainda pode render.
function montarFraseRetorno(retorno) {
  const { estoque } = retorno;

  if (retorno.valorPago <= 0) {
    return "Origem sem valor pago registrado: não há o que recuperar.";
  }

  const pecasEstoque = `<strong>${escaparHtml(plural(estoque.pecas, "peça em estoque", "peças em estoque"))}</strong>`;
  const podeRender = `<strong>${escaparHtml(formatarMoeda(estoque.valorPrecoVenda))}</strong>`;
  let frase;

  if (retorno.jaSePagou) {
    frase = `Esta origem já se pagou e deixou ${escaparHtml(formatarMoeda(retorno.resultado))} de lucro até agora.`;
    frase += estoque.pecas > 0
      ? ` ${estoque.pecas === 1 ? "A" : "As"} ${pecasEstoque} ainda ${estoque.pecas === 1 ? "pode" : "podem"} render ${podeRender} pelos preços cadastrados.`
      : " Não há mais peças em estoque.";
  } else {
    frase = `Faltam <strong>${escaparHtml(formatarMoeda(retorno.faltaParaSePagar))}</strong> para esta origem se pagar.`;

    if (estoque.pecas > 0) {
      const cobre = estoque.valorPrecoVenda >= retorno.faltaParaSePagar;
      frase += ` ${estoque.pecas === 1 ? "A" : "As"} ${pecasEstoque} ainda ${estoque.pecas === 1 ? "pode" : "podem"} render ${podeRender} pelos preços cadastrados, ${cobre ? "o suficiente para cobrir o que falta" : "menos do que falta"}.`;
    } else {
      frase += " Não há mais peças em estoque.";
    }
  }

  if (estoque.pecasSemPreco > 0) {
    frase += ` ${estoque.pecasSemPreco === 1 ? "1 peça em estoque está sem preço e não entra" : `${formatarNumero(estoque.pecasSemPreco)} peças em estoque estão sem preço e não entram`} nessa conta.`;
  }

  return frase;
}

// ---- Carga ----

async function carregarDados(idOrigem) {
  const servico = window.supabaseService;

  if (!servico?.estaConfigurado()) {
    throw new Error("Configure o Supabase para carregar os detalhes da origem.");
  }

  const [origem, entradas, pecas, vendas, consumos, custosPeca, custosVenda] = await Promise.all([
    servico.buscarOrigemPorId(idOrigem),
    servico.listarEntradasEstoque(),
    servico.listarPecas(),
    servico.listarVendas(),
    servico.listarConsumosEstoque(),
    servico.listarCustosPeca(),
    servico.listarCustosVenda()
  ]);

  return {
    origem,
    entradas: entradas || [],
    pecas: pecas || [],
    vendas: vendas || [],
    consumos: consumos || [],
    custosPeca: custosPeca || [],
    custosVenda: custosVenda || []
  };
}

// ---- Renderização ----

function renderizarCabecalho(origem) {
  document.title = `${origem.descricao || "Origem"} · Detalhes da origem · Pátio Peças`;
  tituloOrigem.textContent = origem.descricao || "Origem sem descrição";
  const partes = [origem.tipoOrigem || origem.tipo, origem.dataCompra ? `comprado em ${formatarData(origem.dataCompra)}` : ""]
    .filter(Boolean)
    .map(escaparHtml);
  subtituloOrigem.innerHTML = [`<span class="mono">${escaparHtml(origem.codigoOrigem || "")}</span>`, ...partes].join(" · ");
  observacaoOrigem.textContent = origem.observacoes || "";
  observacaoOrigem.hidden = !origem.observacoes;
  linkAdicionarPeca.href = `cadastro-peca.html?origemId=${encodeURIComponent(origem.id)}`;
  botaoEditarOrigem.disabled = false;
}

function criarKpi({ rotulo, valor, classeValor = "", nota = "", classeNota = "" }) {
  return `
    <article class="kpi">
      <span class="kpi__label">${escaparHtml(rotulo)}</span>
      <span class="kpi__value kpi__value--tight ${classeValor}">${escaparHtml(valor)}</span>
      <span class="kpi__note ${classeNota}">${escaparHtml(nota)}</span>
    </article>
  `;
}

function renderizarKpis(retorno) {
  const quantidadePecas = retorno.pecas.length;
  const aDistribuir = retorno.valorPago - retorno.valorDistribuido;
  let notaPago = quantidadePecas ? `Distribuído em ${plural(quantidadePecas, "peça", "peças")}` : "Nenhuma peça cadastrada";
  let classeNotaPago = "";

  if (retorno.valorPago > 0 && aDistribuir > 0.009) {
    notaPago += ` · ${formatarMoeda(aDistribuir)} a distribuir`;
    classeNotaPago = "kpi__note--warning";
  } else if (aDistribuir < -0.009) {
    notaPago += ` · ${formatarMoeda(-aDistribuir)} acima do pago`;
    classeNotaPago = "kpi__note--danger";
  }

  const custosVenda = retorno.resultadoOrigem.custosVenda;
  const notaRecuperado = [
    plural(retorno.pecasVendidas, "peça vendida", "peças vendidas"),
    custosVenda > 0 ? `descontados ${formatarMoeda(custosVenda)} de custos da venda` : ""
  ].filter(Boolean).join(" · ");

  // Resultado = recuperado − valor pago − custos lançados nas peças da origem.
  const custosNasPecas = retorno.custosPeca > 0 ? ` · descontados ${formatarMoeda(retorno.custosPeca)} de custos nas peças` : "";
  let kpiResultado;
  if (retorno.valorPago <= 0) {
    kpiResultado = criarKpi({ rotulo: "Resultado da origem", valor: "—", classeValor: "kpi__value--muted", nota: "Sem valor pago" });
  } else if (retorno.jaSePagou) {
    kpiResultado = criarKpi({ rotulo: "Resultado da origem", valor: formatarMoeda(retorno.resultado), classeValor: "text-success", nota: `Já se pagou${custosNasPecas}`, classeNota: "kpi__note--success" });
  } else {
    kpiResultado = criarKpi({ rotulo: "Resultado da origem", valor: formatarMoeda(retorno.resultado), nota: `Faltam ${formatarMoeda(retorno.faltaParaSePagar)} para se pagar${custosNasPecas}`, classeNota: "kpi__note--warning" });
  }

  const { estoque } = retorno;
  const notaEstoque = [
    estoque.unidades !== estoque.pecas ? `em ${plural(estoque.pecas, "peça", "peças")}` : "",
    `${formatarMoeda(estoque.valorPrecoVenda)} a preço de venda`
  ].filter(Boolean).join(" · ");

  kpisOrigem.innerHTML = [
    criarKpi({ rotulo: "Valor pago", valor: formatarMoeda(retorno.valorPago), nota: notaPago, classeNota: classeNotaPago }),
    criarKpi({ rotulo: "Recuperado em vendas", valor: formatarMoeda(retorno.recuperado), nota: notaRecuperado }),
    kpiResultado,
    criarKpi({ rotulo: "Ainda em estoque", valor: plural(estoque.unidades, "unidade", "unidades"), nota: notaEstoque })
  ].join("");
}

function renderizarRetorno(retorno) {
  const percentual = retorno.percentualRecuperado;
  const largura = percentual === null ? 0 : Math.min(100, Math.max(0, percentual));

  const comCustosNasPecas = retorno.custosPeca > 0;
  percentualRetornoOrigem.textContent = percentual === null
    ? "Sem valor pago"
    : `${formatarPercentualInteiro(percentual)} do ${comCustosNasPecas ? "valor pago e dos custos nas peças" : "valor pago"} já recuperado`;
  percentualRetornoOrigem.classList.toggle("origem-retorno__percentual--pago", retorno.jaSePagou);
  preenchimentoRetornoOrigem.className = `progress__bar ${retorno.jaSePagou ? "progress__bar--complete" : "progress__bar--partial"}`;
  preenchimentoRetornoOrigem.style.width = `${Math.round(largura)}%`;
  barraRetornoOrigem.setAttribute("aria-valuenow", String(Math.round(largura)));
  legendaPagoOrigem.textContent = comCustosNasPecas
    ? `Pago ${formatarMoeda(retorno.valorPago)} + custos nas peças ${formatarMoeda(retorno.custosPeca)} = ${formatarMoeda(retorno.investido)}`
    : `Pago: ${formatarMoeda(retorno.valorPago)}`;
  fraseRetornoOrigem.innerHTML = montarFraseRetorno(retorno);
  blocoRetornoOrigem.hidden = false;
}

function renderizarSituacao(situacao) {
  if (situacao.chave === "vendida") return '<span class="pill pill--neutral">Vendida</span>';
  if (situacao.chave === "abaixo-custo") return '<span class="pill pill--warning">Preço abaixo do custo</span>';
  if (situacao.chave === "parada") return `<span class="pill pill--warning">Parada há ${formatarNumero(situacao.dias)} dias</span>`;
  if (situacao.chave === "sem-saldo") return '<span class="pill pill--neutral">Sem saldo</span>';
  return '<span class="pill pill--success">Em estoque</span>';
}

function renderizarPreco(linha) {
  if (linha.vendida) {
    return `<td class="num cell-strong" data-label="Vendida por">${escaparHtml(formatarMoeda(linha.receita))}</td>`;
  }

  const preco = linha.precoVenda > 0 ? escaparHtml(formatarMoeda(linha.precoVenda)) : '<span class="text-warning">Sem preço</span>';
  const unidadesVendidas = linha.quantidade - linha.saldo;
  const parcial = linha.vendas.length > 0
    ? `<span class="origem-pecas__sub">${escaparHtml(plural(unidadesVendidas, "vendida", "vendidas"))} por ${escaparHtml(formatarMoeda(linha.receita))}</span>`
    : "";

  return `<td class="num" data-label="Preço">${preco}${parcial}</td>`;
}

function renderizarLucro(linha) {
  if (!linha.lucro) return '<td class="num cell-muted" data-label="Lucro">—</td>';
  if (!linha.lucro.calculado) return '<td class="num cell-muted" data-label="Lucro">Custo não calculado</td>';

  const classe = linha.lucro.valor < 0 ? "text-danger" : "text-success";
  return `<td class="num cell-strong ${classe}" data-label="Lucro">${escaparHtml(formatarMoeda(linha.lucro.valor))}</td>`;
}

function renderizarLinha(linha) {
  const { peca } = linha;
  const detalhe = [peca.sku, linha.quantidade > 1 ? `${formatarNumero(linha.quantidade)} un.` : ""].filter(Boolean).join(" · ");

  return `
    <tr>
      <td data-label="Peça">
        <div class="item-cell__text">
          <a class="item-cell__name" href="detalhes-produto.html?pecaId=${encodeURIComponent(peca.id)}">${escaparHtml(peca.nome || `Peça ${peca.id}`)}</a>
          ${detalhe ? `<span class="mono">${escaparHtml(detalhe)}</span>` : ""}
        </div>
      </td>
      <td class="num" data-label="Custo atribuído">${escaparHtml(formatarMoeda(linha.custoAtribuido))}</td>
      ${renderizarPreco(linha)}
      <td data-label="Situação">${renderizarSituacao(linha.situacao)}</td>
      ${renderizarLucro(linha)}
    </tr>
  `;
}

function renderizarPecas() {
  const filtradas = linhasPecas.filter(linha => linhaCombinaComFiltro(linha, filtroAtual));
  const visiveis = filtradas.slice(0, PECAS_VISIVEIS);

  filtroPecasOrigem.querySelectorAll("[data-filtro]").forEach(botao => {
    botao.setAttribute("aria-pressed", String(botao.dataset.filtro === filtroAtual));
  });
  filtroPecasOrigem.querySelectorAll("[data-contagem]").forEach(contador => {
    contador.textContent = formatarNumero(linhasPecas.filter(linha => linhaCombinaComFiltro(linha, contador.dataset.contagem)).length);
  });

  tabelaPecasOrigem.innerHTML = visiveis.length
    ? visiveis.map(renderizarLinha).join("")
    : `<tr class="data-table__empty"><td colspan="5">${linhasPecas.length ? "Nenhuma peça nesta situação." : "Nenhuma peça cadastrada nesta origem."}</td></tr>`;

  // "Ver todas" abre Produtos filtrado por esta origem (e pela mesma situação, quando houver).
  if (filtradas.length > PECAS_VISIVEIS) {
    const situacaoProdutos = { vendidas: "vendidas", estoque: "estoque" }[filtroAtual];
    const href = `produtos.html?origemId=${encodeURIComponent(dadosOrigem.origem.id)}${situacaoProdutos ? `&situacao=${situacaoProdutos}` : ""}`;
    rodapePecasOrigem.innerHTML = `Mostrando ${formatarNumero(visiveis.length)} de ${formatarNumero(filtradas.length)} · <a class="origem-pecas__ver-todas" href="${href}">Ver todas</a>`;
    rodapePecasOrigem.hidden = false;
  } else {
    rodapePecasOrigem.innerHTML = "";
    rodapePecasOrigem.hidden = true;
  }

  blocoPecasOrigem.hidden = false;
}

function renderizarTela() {
  const financeiro = window.financeiroUtils;
  const retorno = financeiro.calcularRetornoOrigem(dadosOrigem.origem, dadosOrigem);

  renderizarCabecalho(dadosOrigem.origem);
  renderizarKpis(retorno);
  renderizarRetorno(retorno);
  linhasPecas = montarLinhasPecas(retorno, dadosOrigem);
  renderizarPecas();
}

function mostrarMensagem(texto) {
  mensagemOrigem.textContent = texto;
}

// ---- Edição da origem ----

function abrirEdicao() {
  const origem = dadosOrigem?.origem;
  if (!origem) return;

  editarOrigemTipo.value = origem.tipoOrigem || origem.tipo || "";
  editarOrigemDataCompra.value = String(origem.dataCompra || "").slice(0, 10);
  editarOrigemDescricao.value = origem.descricao || "";
  editarOrigemCustoTotal.value = formatarMoeda(origem.valorPago || origem.custoTotal || 0);
  editarOrigemQuantidadeTotal.value = Number(origem.quantidadeTotal || 0) || "";
  editarOrigemObservacoes.value = origem.observacoes || "";
  window.moedaUtils?.registrarCampoMoeda?.(editarOrigemCustoTotal);
  formEditarOrigem.hidden = false;
  editarOrigemTipo.focus();
}

function fecharEdicao() {
  formEditarOrigem.hidden = true;
}

async function salvarEdicao(evento) {
  evento.preventDefault();
  const origem = dadosOrigem?.origem;
  if (!origem) return;

  const tipoOrigem = editarOrigemTipo.value.trim();
  const descricao = editarOrigemDescricao.value.trim();
  const dataCompra = editarOrigemDataCompra.value;
  const valorPago = window.moedaUtils?.parseMoedaBR
    ? window.moedaUtils.parseMoedaBR(editarOrigemCustoTotal.value)
    : Number(String(editarOrigemCustoTotal.value || "0").replace(",", "."));
  const quantidadeTotal = Number(editarOrigemQuantidadeTotal.value || 0);

  if (!tipoOrigem || !descricao || !dataCompra) {
    mostrarMensagem("Preencha tipo, descrição e data da compra.");
    return;
  }

  if (!Number.isFinite(valorPago) || valorPago < 0) {
    mostrarMensagem("Informe um valor pago válido.");
    editarOrigemCustoTotal.focus();
    return;
  }

  if (!Number.isFinite(quantidadeTotal) || quantidadeTotal < 0) {
    mostrarMensagem("Informe uma quantidade prevista válida.");
    editarOrigemQuantidadeTotal.focus();
    return;
  }

  const botaoSalvar = formEditarOrigem.querySelector("button[type='submit']");
  botaoSalvar.disabled = true;
  mostrarMensagem("Salvando origem…");

  try {
    await window.supabaseService.atualizarOrigem({
      id: origem.id,
      tipoOrigem,
      tipo: tipoOrigem,
      descricao,
      custoTotal: valorPago,
      valorPago,
      custoTipo: origem.custoTipo || "",
      dataCompra,
      quantidadeTotal,
      produtoSku: origem.produtoSku || "",
      observacoes: editarOrigemObservacoes.value.trim()
    });

    dadosOrigem = await carregarDados(origemId);
    fecharEdicao();
    mostrarMensagem("");
    renderizarTela();
  } catch (erro) {
    console.error("Erro ao editar origem:", erro);
    mostrarMensagem(erro?.message || "Não foi possível salvar a origem.");
  } finally {
    botaoSalvar.disabled = false;
  }
}

// ---- Início ----

async function iniciarDetalhesOrigem() {
  origemId = Number(new URLSearchParams(window.location.search).get("origemId") || 0);

  if (!origemId) {
    tituloOrigem.textContent = "Origem";
    subtituloOrigem.textContent = "";
    mostrarMensagem("Abra uma origem pela lista de Origens.");
    return;
  }

  try {
    dadosOrigem = await carregarDados(origemId);

    if (!dadosOrigem.origem) {
      subtituloOrigem.textContent = "";
      mostrarMensagem("Origem não encontrada.");
      return;
    }

    renderizarTela();
  } catch (erro) {
    console.error(erro);
    subtituloOrigem.textContent = "";
    mostrarMensagem(erro?.message || "Não foi possível carregar a origem.");
  }
}

if (tabelaPecasOrigem) {
  filtroPecasOrigem.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-filtro]");
    if (!botao) return;
    filtroAtual = botao.dataset.filtro;
    renderizarPecas();
  });

  botaoEditarOrigem.addEventListener("click", abrirEdicao);
  cancelarEdicaoOrigem.addEventListener("click", fecharEdicao);
  formEditarOrigem.addEventListener("submit", salvarEdicao);

  iniciarDetalhesOrigem();
}
