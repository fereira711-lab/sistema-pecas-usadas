// Origens (redesenho): lista operacional das origens (carros, lotes, compras avulsas) com a situação
// da distribuição do valor pago nas peças. Sem análise financeira: o retorno fica em Detalhes da origem.
const ITENS_POR_PAGINA = 20;
const TOLERANCIA = 0.009;

const resumoOrigens = document.getElementById("resumoOrigens");
const mensagemOrigens = document.getElementById("mensagemOrigens");
const kpisOrigens = document.getElementById("kpisOrigens");
const buscaOrigens = document.getElementById("buscaOrigens");
const filtroTipoOrigem = document.getElementById("filtroTipoOrigem");
const filtroDataInicialOrigem = document.getElementById("filtroDataInicialOrigem");
const filtroDataFinalOrigem = document.getElementById("filtroDataFinalOrigem");
const filtroDistribuicaoOrigem = document.getElementById("filtroDistribuicaoOrigem");
const tabelaOrigens = document.getElementById("tabelaOrigens");
const paginacaoOrigens = document.getElementById("paginacaoOrigens");
const paginacaoTexto = document.getElementById("paginacaoTexto");
const botaoPaginaAnterior = document.getElementById("paginaAnterior");
const botaoPaginaProxima = document.getElementById("paginaProxima");

let linhasOrigens = [];
let situacaoSelecionada = "";
let paginaAtual = 1;

const SITUACOES = {
  pendente: { texto: "Falta distribuir", pilula: "pill--warning" },
  distribuida: { texto: "Distribuída", pilula: "pill--success" },
  acima: { texto: "Acima do pago", pilula: "pill--danger" },
  "sem-valor": { texto: "Sem valor pago", pilula: "pill--neutral" }
};

// ---- Formatação ----

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatarMoeda(valor) {
  if (window.moedaUtils?.formatarMoedaBR) return window.moedaUtils.formatarMoedaBR(Number(valor || 0));
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function plural(quantidade, singular, pluralTexto) {
  return `${formatarNumero(quantidade)} ${quantidade === 1 ? singular : pluralTexto}`;
}

function formatarData(data) {
  const [ano, mes, dia] = String(data || "").slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

// ---- Regras da lista ----

// Valor atribuído a uma entrada: quantidade × custo unitário (o que a peça recebeu do valor da origem).
function calcularValorEntrada(entrada) {
  return Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0);
}

function obterSituacao(valorPago, valorDistribuido) {
  const restante = valorPago - valorDistribuido;
  if (valorPago <= 0) return "sem-valor";
  if (restante < -TOLERANCIA) return "acima";
  if (Math.abs(restante) <= TOLERANCIA) return "distribuida";
  return "pendente";
}

function montarLinhasOrigens(origens, entradas) {
  return origens.map(origem => {
    const entradasDaOrigem = entradas.filter(entrada => Number(entrada.origemId || 0) === Number(origem.id));
    const valorPago = Number(origem.valorPago || origem.custoTotal || 0);
    const valorDistribuido = entradasDaOrigem.reduce((total, entrada) => total + calcularValorEntrada(entrada), 0);

    return {
      origem,
      tipo: origem.tipoOrigem || origem.tipo || "",
      dataCompra: String(origem.dataCompra || "").slice(0, 10),
      valorPago,
      valorDistribuido,
      aDistribuir: valorPago - valorDistribuido,
      pecas: new Set(entradasDaOrigem.map(entrada => Number(entrada.pecaId))).size,
      situacao: obterSituacao(valorPago, valorDistribuido)
    };
  }).sort((a, b) => b.dataCompra.localeCompare(a.dataCompra) || Number(b.origem.id) - Number(a.origem.id));
}

// Cada palavra digitada precisa aparecer no código, na descrição ou no tipo, sem diferenciar acentos.
function linhaCombinaComBusca(linha, termo) {
  if (!termo) return true;
  const texto = normalizarTexto(`${linha.origem.codigoOrigem} ${linha.origem.descricao} ${linha.tipo}`);
  return termo.split(/\s+/).every(palavra => texto.includes(palavra));
}

function filtrarLinhas(linhas, filtros) {
  return linhas.filter(linha => (
    linhaCombinaComBusca(linha, filtros.termo) &&
    (!filtros.tipo || linha.tipo === filtros.tipo) &&
    (!filtros.dataInicial || (linha.dataCompra && linha.dataCompra >= filtros.dataInicial)) &&
    (!filtros.dataFinal || (linha.dataCompra && linha.dataCompra <= filtros.dataFinal))
  ));
}

function lerFiltros() {
  return {
    termo: normalizarTexto(buscaOrigens.value),
    tipo: filtroTipoOrigem.value,
    dataInicial: filtroDataInicialOrigem.value,
    dataFinal: filtroDataFinalOrigem.value
  };
}

// ---- Renderização ----

function criarKpi({ rotulo, valor, nota = "", classeNota = "" }) {
  return `
    <article class="kpi">
      <span class="kpi__label">${escaparHtml(rotulo)}</span>
      <span class="kpi__value kpi__value--tight">${escaparHtml(valor)}</span>
      <span class="kpi__note ${classeNota}">${escaparHtml(nota)}</span>
    </article>
  `;
}

function renderizarResumo() {
  const total = linhasOrigens.length;
  const pendentes = linhasOrigens.filter(linha => linha.situacao === "pendente");
  const acima = linhasOrigens.filter(linha => linha.situacao === "acima");
  const valorComprado = linhasOrigens.reduce((soma, linha) => soma + linha.valorPago, 0);
  const valorDistribuido = linhasOrigens.reduce((soma, linha) => soma + linha.valorDistribuido, 0);
  const aDistribuir = pendentes.reduce((soma, linha) => soma + linha.aDistribuir, 0);
  const pecas = linhasOrigens.reduce((soma, linha) => soma + linha.pecas, 0);

  resumoOrigens.textContent = total
    ? `${plural(total, "origem cadastrada", "origens cadastradas")}${pendentes.length ? ` · ${plural(pendentes.length, "com valor a distribuir", "com valor a distribuir")}` : ""}`
    : "Nenhuma origem cadastrada";

  kpisOrigens.innerHTML = [
    criarKpi({ rotulo: "Origens", valor: formatarNumero(total), nota: `${plural(pecas, "peça vinculada", "peças vinculadas")}` }),
    criarKpi({ rotulo: "Valor comprado", valor: formatarMoeda(valorComprado), nota: "Soma do valor pago" }),
    criarKpi({ rotulo: "Distribuído nas peças", valor: formatarMoeda(valorDistribuido), nota: "Custo já atribuído às entradas" }),
    criarKpi({
      rotulo: "A distribuir",
      valor: formatarMoeda(aDistribuir),
      nota: acima.length
        ? `${plural(acima.length, "origem acima do pago", "origens acima do pago")}`
        : pendentes.length ? `Em ${plural(pendentes.length, "origem", "origens")}` : "Tudo distribuído",
      classeNota: acima.length ? "kpi__note--danger" : pendentes.length ? "kpi__note--warning" : "kpi__note--success"
    })
  ].join("");
}

function renderizarFiltroTipos() {
  const tipos = [...new Set(linhasOrigens.map(linha => linha.tipo).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const atual = filtroTipoOrigem.value;
  filtroTipoOrigem.innerHTML = '<option value="">Todos os tipos</option>' +
    tipos.map(tipo => `<option value="${escaparHtml(tipo)}">${escaparHtml(tipo)}</option>`).join("");
  filtroTipoOrigem.value = tipos.includes(atual) ? atual : "";
}

function renderizarLinha(linha) {
  const { origem } = linha;
  const situacao = SITUACOES[linha.situacao];
  const href = `detalhes-origem.html?origemId=${encodeURIComponent(origem.id)}`;
  const classeRestante = linha.situacao === "acima" ? " text-danger" : linha.situacao === "pendente" ? " text-warning" : " cell-muted";

  return `
    <tr>
      <td data-label="Origem">
        <div class="item-cell__text">
          <a class="item-cell__name" href="${href}">${escaparHtml(origem.descricao || "Origem sem descrição")}</a>
          <span class="mono">${escaparHtml(origem.codigoOrigem || "")}</span>
        </div>
      </td>
      <td class="cell-muted" data-label="Tipo">${escaparHtml(linha.tipo || "—")}</td>
      <td class="cell-nowrap" data-label="Compra">${formatarData(linha.dataCompra)}</td>
      <td class="num cell-strong" data-label="Valor pago">${formatarMoeda(linha.valorPago)}</td>
      <td class="num" data-label="Distribuído">${formatarMoeda(linha.valorDistribuido)}</td>
      <td class="num${classeRestante}" data-label="A distribuir">${Math.abs(linha.aDistribuir) <= TOLERANCIA ? "—" : formatarMoeda(linha.aDistribuir)}</td>
      <td class="num" data-label="Peças">${formatarNumero(linha.pecas)}</td>
      <td data-label="Situação"><span class="pill ${situacao.pilula}">${situacao.texto}</span></td>
    </tr>
  `;
}

function renderizarLista() {
  const filtradasSemSituacao = filtrarLinhas(linhasOrigens, lerFiltros());
  const filtradas = filtradasSemSituacao.filter(linha => !situacaoSelecionada || linha.situacao === situacaoSelecionada);

  filtroDistribuicaoOrigem.querySelectorAll("[data-contagem]").forEach(contador => {
    const chave = contador.dataset.contagem;
    contador.textContent = formatarNumero(filtradasSemSituacao.filter(linha => !chave || linha.situacao === chave).length);
  });

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = filtradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  if (filtradas.length === 0) {
    const vazio = linhasOrigens.length ? "Nenhuma origem encontrada para esta busca ou filtro." : "Nenhuma origem cadastrada ainda.";
    tabelaOrigens.innerHTML = `<tr class="data-table__empty"><td colspan="8">${vazio}</td></tr>`;
    paginacaoOrigens.hidden = true;
    return;
  }

  tabelaOrigens.innerHTML = pagina.map(renderizarLinha).join("");
  paginacaoOrigens.hidden = filtradas.length <= ITENS_POR_PAGINA;
  paginacaoTexto.textContent = `Mostrando ${formatarNumero(inicio + 1)}–${formatarNumero(inicio + pagina.length)} de ${formatarNumero(filtradas.length)}`;
  botaoPaginaAnterior.disabled = paginaAtual <= 1;
  botaoPaginaProxima.disabled = paginaAtual >= totalPaginas;
}

function selecionarSituacao(situacao) {
  situacaoSelecionada = situacao;
  filtroDistribuicaoOrigem.querySelectorAll("[data-situacao]").forEach(botao => {
    botao.setAttribute("aria-pressed", String(botao.dataset.situacao === situacao));
  });
  paginaAtual = 1;
  renderizarLista();
}

// ---- Início ----

async function iniciarOrigens() {
  if (!window.supabaseService?.estaConfigurado()) {
    resumoOrigens.textContent = "";
    mensagemOrigens.textContent = "Configure o Supabase para ver as origens.";
    return;
  }

  try {
    const [origens, entradas] = await Promise.all([
      window.supabaseService.listarOrigens(),
      window.supabaseService.listarEntradasEstoque()
    ]);

    linhasOrigens = montarLinhasOrigens(origens || [], entradas || []);
    mensagemOrigens.textContent = "";
    renderizarFiltroTipos();
    renderizarResumo();
    renderizarLista();
  } catch (erro) {
    console.error("Erro ao carregar origens:", erro);
    resumoOrigens.textContent = "";
    mensagemOrigens.textContent = "Não foi possível carregar as origens.";
  }
}

if (tabelaOrigens) {
  [buscaOrigens, filtroTipoOrigem, filtroDataInicialOrigem, filtroDataFinalOrigem].forEach(campo => {
    campo.addEventListener("input", () => {
      paginaAtual = 1;
      renderizarLista();
    });
  });

  filtroDistribuicaoOrigem.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-situacao]");
    if (botao) selecionarSituacao(botao.dataset.situacao);
  });

  botaoPaginaAnterior.addEventListener("click", () => {
    paginaAtual -= 1;
    renderizarLista();
  });

  botaoPaginaProxima.addEventListener("click", () => {
    paginaAtual += 1;
    renderizarLista();
  });

  iniciarOrigens();
}
