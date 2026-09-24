// Vendas (redesenho): lista operacional das vendas registradas, com acesso ao extrato de cada uma.
// Lucro e margem ficam no extrato (Detalhes da venda) e nas Análises.
const ITENS_POR_PAGINA = 20;
const CANAIS_FIXOS = ["Mercado Livre", "WhatsApp", "Balcão"];

const resumoVendas = document.getElementById("resumoVendas");
const mensagemHistorico = document.getElementById("mensagemHistorico");
const buscaRapidaHistorico = document.getElementById("buscaRapidaHistorico");
const dataInicialHistorico = document.getElementById("dataInicialHistorico");
const dataFinalHistorico = document.getElementById("dataFinalHistorico");
const filtroCanalHistorico = document.getElementById("filtroCanalHistorico");
const tabelaHistorico = document.getElementById("tabelaHistoricoVendas");
const paginacaoVendas = document.getElementById("paginacaoVendas");
const paginacaoTexto = document.getElementById("paginacaoTexto");
const botaoPaginaAnterior = document.getElementById("paginaAnterior");
const botaoPaginaProxima = document.getElementById("paginaProxima");

let linhasVendas = [];
let canalSelecionado = "";
let paginaAtual = 1;

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

// Canal para o filtro: os fixos da tela Registrar venda; qualquer texto antigo cai em "Outro".
// Na tabela o canal aparece como foi gravado.
function obterGrupoCanal(canal) {
  const chave = normalizarTexto(canal);
  return CANAIS_FIXOS.find(fixo => normalizarTexto(fixo) === chave) || "Outro";
}

function montarLinhasVendas(vendas, pecas, origens) {
  const pecasPorId = new Map(pecas.map(peca => [Number(peca.id), peca]));
  const origensPorId = new Map(origens.map(origem => [Number(origem.id), origem]));

  return vendas.map(venda => {
    const peca = pecasPorId.get(Number(venda.pecaId)) || null;
    const origem = peca ? origensPorId.get(Number(peca.origemId)) || null : null;

    return {
      venda,
      data: String(venda.dataVenda || "").slice(0, 10),
      nome: peca?.nome || venda.produtoNome || `Peça ${venda.pecaId || ""}`.trim(),
      sku: peca?.sku || venda.sku || "",
      origem: origem?.descricao || "",
      canal: venda.canalVenda || "",
      grupoCanal: obterGrupoCanal(venda.canalVenda),
      quantidade: Number(venda.quantidadeVendida || 0),
      valor: Number(venda.valorTotal || 0)
    };
  }).sort((a, b) => b.data.localeCompare(a.data) || Number(b.venda.id) - Number(a.venda.id));
}

// Cada palavra digitada precisa aparecer no SKU, na peça, na origem, no canal ou na observação.
function linhaCombinaComBusca(linha, termo) {
  if (!termo) return true;
  const texto = normalizarTexto(`${linha.sku} ${linha.nome} ${linha.origem} ${linha.canal} ${linha.venda.observacoes || ""}`);
  return termo.split(/\s+/).every(palavra => texto.includes(palavra));
}

function filtrarLinhas(linhas, filtros) {
  return linhas.filter(linha => (
    linhaCombinaComBusca(linha, filtros.termo) &&
    (!filtros.dataInicial || (linha.data && linha.data >= filtros.dataInicial)) &&
    (!filtros.dataFinal || (linha.data && linha.data <= filtros.dataFinal))
  ));
}

// ---- Renderização ----

function renderizarLinha(linha) {
  const href = `detalhes-venda.html?vendaId=${encodeURIComponent(linha.venda.id)}`;
  const detalhe = [
    linha.sku ? `<span class="mono">${escaparHtml(linha.sku)}</span>` : "",
    linha.origem ? escaparHtml(linha.origem) : ""
  ].filter(Boolean).join(" · ");

  return `
    <tr>
      <td class="cell-nowrap" data-label="Data">${formatarData(linha.data)}</td>
      <td data-label="Peça">
        <div class="item-cell__text">
          <a class="item-cell__name" href="${href}">${escaparHtml(linha.nome)}</a>
          ${detalhe ? `<span class="item-cell__meta">${detalhe}</span>` : ""}
        </div>
      </td>
      <td class="cell-muted" data-label="Canal">${escaparHtml(linha.canal || "—")}</td>
      <td class="num" data-label="Qtd.">${formatarNumero(linha.quantidade)}</td>
      <td class="num cell-strong" data-label="Valor">${formatarMoeda(linha.valor)}</td>
      <td class="cell-acoes"><a class="btn btn--secondary btn--compact" href="${href}">Ver venda</a></td>
    </tr>
  `;
}

function renderizarLista() {
  const filtros = {
    termo: normalizarTexto(buscaRapidaHistorico.value),
    dataInicial: dataInicialHistorico.value,
    dataFinal: dataFinalHistorico.value
  };
  const semCanal = filtrarLinhas(linhasVendas, filtros);
  const filtradas = semCanal.filter(linha => !canalSelecionado || linha.grupoCanal === canalSelecionado);

  filtroCanalHistorico.querySelectorAll("[data-contagem]").forEach(contador => {
    const chave = contador.dataset.contagem;
    contador.textContent = formatarNumero(semCanal.filter(linha => !chave || linha.grupoCanal === chave).length);
  });

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  paginaAtual = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const pagina = filtradas.slice(inicio, inicio + ITENS_POR_PAGINA);

  if (filtradas.length === 0) {
    const vazio = linhasVendas.length ? "Nenhuma venda encontrada para esta busca ou filtro." : "Nenhuma venda registrada ainda.";
    tabelaHistorico.innerHTML = `<tr class="data-table__empty"><td colspan="6">${vazio}</td></tr>`;
    paginacaoVendas.hidden = true;
    return;
  }

  tabelaHistorico.innerHTML = pagina.map(renderizarLinha).join("");
  paginacaoVendas.hidden = filtradas.length <= ITENS_POR_PAGINA;
  paginacaoTexto.textContent = `Mostrando ${formatarNumero(inicio + 1)}–${formatarNumero(inicio + pagina.length)} de ${formatarNumero(filtradas.length)}`;
  botaoPaginaAnterior.disabled = paginaAtual <= 1;
  botaoPaginaProxima.disabled = paginaAtual >= totalPaginas;
}

function selecionarCanal(canal) {
  canalSelecionado = canal;
  filtroCanalHistorico.querySelectorAll("[data-canal]").forEach(botao => {
    botao.setAttribute("aria-pressed", String(botao.dataset.canal === canal));
  });
  paginaAtual = 1;
  renderizarLista();
}

// ---- Início ----

async function iniciarHistoricoVendas() {
  if (!window.supabaseService?.estaConfigurado()) {
    resumoVendas.textContent = "";
    mensagemHistorico.textContent = "Configure o Supabase para ver as vendas.";
    return;
  }

  try {
    const [vendas, pecas, origens] = await Promise.all([
      window.supabaseService.listarVendas(),
      window.supabaseService.listarPecas(),
      window.supabaseService.listarOrigens()
    ]);

    linhasVendas = montarLinhasVendas(vendas || [], pecas || [], origens || []);
    resumoVendas.textContent = linhasVendas.length
      ? plural(linhasVendas.length, "venda registrada", "vendas registradas")
      : "Nenhuma venda registrada";
    mensagemHistorico.textContent = "";
    renderizarLista();
  } catch (erro) {
    console.error("Erro ao carregar vendas:", erro);
    resumoVendas.textContent = "";
    mensagemHistorico.textContent = "Não foi possível carregar as vendas.";
  }
}

if (tabelaHistorico) {
  [buscaRapidaHistorico, dataInicialHistorico, dataFinalHistorico].forEach(campo => {
    campo.addEventListener("input", () => {
      paginaAtual = 1;
      renderizarLista();
    });
  });

  filtroCanalHistorico.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-canal]");
    if (botao) selecionarCanal(botao.dataset.canal);
  });

  botaoPaginaAnterior.addEventListener("click", () => {
    paginaAtual -= 1;
    renderizarLista();
  });

  botaoPaginaProxima.addEventListener("click", () => {
    paginaAtual += 1;
    renderizarLista();
  });

  iniciarHistoricoVendas();
}
