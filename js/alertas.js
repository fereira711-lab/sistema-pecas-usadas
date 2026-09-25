// Alertas (redesenho, seção 8 da especificação): pontos de atenção pensados para desmanche.
// As regras ficam em alertas-regras.js (as mesmas do Painel e do contador da sidebar);
// esta tela só agrupa, filtra e mostra cada ocorrência com a ação para resolver.
const mensagemAlertas = document.getElementById("mensagemAlertas");
const resumoAlertas = document.getElementById("resumoAlertas");
const campoBuscaAlertas = document.getElementById("buscaAlertas");
const filtroGravidadeAlertas = document.getElementById("filtroGravidadeAlertas");
const gruposAlertas = document.getElementById("gruposAlertas");

let gruposCarregados = [];
let gravidadeSelecionada = "todas";

const ICONES_ALERTA = {
  "venda-prejuizo": "ri-line-chart-line",
  "distribuicao-acima": "ri-error-warning-line",
  "venda-sem-custo": "ri-question-line",
  "preco-abaixo-custo": "ri-price-tag-3-line",
  "peca-parada": "ri-time-line",
  "origem-a-distribuir": "ri-stack-line"
};

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
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatarMoeda(valor) {
  if (window.moedaUtils?.formatarMoedaBR) return window.moedaUtils.formatarMoedaBR(Number(valor || 0));
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarPercentual(valor) {
  if (window.moedaUtils?.formatarPercentualBR) return window.moedaUtils.formatarPercentualBR(valor, 0);
  return `${Math.round(Number(valor || 0))}%`;
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function formatarData(valor) {
  const [ano, mes, dia] = String(valor || "").slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

function plural(quantidade, singular, pluralTexto) {
  return `${formatarNumero(quantidade)} ${quantidade === 1 ? singular : pluralTexto}`;
}

// ---- Montagem dos grupos (dados prontos para a tela) ----

function criarCelulaPeca(peca) {
  const nome = peca?.nome || peca?.nome_peca || "Peça";
  return {
    html: `<div class="alertas-peca"><span class="alertas-peca__nome">${escaparHtml(nome)}</span>${peca?.sku ? `<span class="mono">${escaparHtml(peca.sku)}</span>` : ""}</div>`,
    texto: `${peca?.sku || ""} ${nome}`
  };
}

function criarCelulaOrigem(origem) {
  const descricao = origem?.descricao || "Origem";
  const codigo = origem?.codigoOrigem || "";
  return {
    html: `<div class="alertas-peca"><span class="alertas-peca__nome">${escaparHtml(descricao)}</span>${codigo ? `<span class="mono">${escaparHtml(codigo)}</span>` : ""}</div>`,
    texto: `${codigo} ${descricao}`
  };
}

function celula(texto, classe = "") {
  return { html: escaparHtml(texto), texto, classe };
}

function linkPeca(pecaId) {
  return `detalhes-produto.html?pecaId=${encodeURIComponent(pecaId)}`;
}

function linkVenda(vendaId) {
  return `detalhes-venda.html?vendaId=${encodeURIComponent(vendaId)}`;
}

function linkOrigem(origemId) {
  return `detalhes-origem.html?origemId=${encodeURIComponent(origemId)}`;
}

const ROTULOS_GRAVIDADE = { danger: "Crítico", warning: "Atenção", info: "Informação" };

// Título do card: "6 peças paradas há mais de 90 dias"; com busca ativa, "2 de 6 peças paradas…".
function montarTitulo(grupo, visiveis = grupo.total) {
  const [singular, pluralTexto] = grupo.nome;
  const contagem = visiveis === grupo.total ? formatarNumero(grupo.total) : `${formatarNumero(visiveis)} de ${formatarNumero(grupo.total)}`;
  return `${contagem} ${grupo.total === 1 ? singular : pluralTexto} ${grupo.complemento}`;
}

// Cada tipo de alerta vira um grupo com título, resumo, colunas e uma linha por ocorrência.
function descreverGrupo(grupo, dados) {
  const pecaPorId = new Map((dados.pecas || []).map(peca => [Number(peca.id), peca]));
  const origemPorId = new Map((dados.origens || []).map(origem => [Number(origem.id), origem]));
  const itens = grupo.itens;

  switch (grupo.tipo) {
    case "venda-prejuizo": {
      const prejuizo = itens.reduce((total, item) => total + Number(item.resultado.lucro || 0), 0);
      return {
        nome: ["venda", "vendas"],
        complemento: "com prejuízo",
        resumo: `Prejuízo somado de ${formatarMoeda(Math.abs(prejuizo))}`,
        colunas: [["Data"], ["Peça"], ["Canal"], ["Valor", "num"], ["Custos", "num"], ["Lucro", "num"]],
        linhas: itens.map(({ venda, resultado }) => ({
          celulas: [
            celula(formatarData(venda.dataVenda), "cell-nowrap"),
            criarCelulaPeca(pecaPorId.get(Number(venda.pecaId)) || { nome: venda.produtoNome, sku: venda.sku }),
            celula(venda.canalVenda || "—", "cell-muted cell-nowrap"),
            celula(formatarMoeda(resultado.receita), "num"),
            celula(formatarMoeda(resultado.custoConsumido + resultado.custosPeca + resultado.custosVenda), "num cell-muted"),
            celula(formatarMoeda(resultado.lucro), "num text-danger")
          ],
          acao: { texto: "Ver venda", href: linkVenda(venda.id) }
        }))
      };
    }
    case "distribuicao-acima":
    case "origem-a-distribuir": {
      const acima = grupo.tipo === "distribuicao-acima";
      const total = itens.reduce((soma, item) => soma + Math.abs(item.diferenca), 0);
      return {
        nome: ["origem", "origens"],
        complemento: acima ? "com distribuição acima do valor pago" : "com valor a distribuir",
        resumo: acima
          ? `O custo lançado nas peças passa do valor pago em ${formatarMoeda(total)}`
          : `${formatarMoeda(total)} ainda sem peça vinculada`,
        colunas: [["Origem"], ["Valor pago", "num"], ["Distribuído", "num"], [acima ? "Acima do pago" : "A distribuir", "num"]],
        linhas: itens.map(item => ({
          celulas: [
            criarCelulaOrigem(item.origem),
            celula(formatarMoeda(item.valorPago), "num"),
            celula(formatarMoeda(item.valorDistribuido), "num cell-muted"),
            celula(formatarMoeda(Math.abs(item.diferenca)), `num cell-strong${acima ? " text-danger" : ""}`)
          ],
          acao: { texto: acima ? "Ver origem" : "Distribuir", href: linkOrigem(item.origem.id) }
        }))
      };
    }
    case "venda-sem-custo":
      return {
        nome: ["venda", "vendas"],
        complemento: "sem custo calculado",
        resumo: "Lucro e margem ficam pendentes até o custo ser calculado",
        colunas: [["Data"], ["Peça"], ["Canal"], ["Valor", "num"]],
        linhas: itens.map(({ venda, resultado }) => ({
          celulas: [
            celula(formatarData(venda.dataVenda), "cell-nowrap"),
            criarCelulaPeca(pecaPorId.get(Number(venda.pecaId)) || { nome: venda.produtoNome, sku: venda.sku }),
            celula(venda.canalVenda || "—", "cell-muted cell-nowrap"),
            celula(formatarMoeda(resultado.receita), "num")
          ],
          acao: { texto: "Ver venda", href: linkVenda(venda.id) }
        }))
      };
    case "preco-abaixo-custo":
      return {
        nome: ["peça", "peças"],
        complemento: "com preço abaixo do custo",
        resumo: "Vendendo pelo preço cadastrado, a peça dá prejuízo",
        colunas: [["Peça"], ["Preço", "num"], ["Custo", "num"], ["Margem", "num"]],
        linhas: itens.map(item => ({
          celulas: [
            criarCelulaPeca(item.peca),
            celula(formatarMoeda(item.preco), "num"),
            celula(formatarMoeda(item.custo), "num cell-muted"),
            celula(formatarPercentual(item.margem), "num text-danger")
          ],
          acao: { texto: "Ajustar preço", href: `${linkPeca(item.peca.id)}&editar=1&campo=preco` }
        }))
      };
    case "peca-parada": {
      const valorParado = itens.reduce((total, item) => total + item.valorParado, 0);
      const dias = window.alertasRegras?.DIAS_PARA_PECA_PARADA || 90;
      return {
        nome: ["peça parada", "peças paradas"],
        complemento: `há mais de ${dias} dias`,
        resumo: `${formatarMoeda(valorParado)} de custo parado`,
        colunas: [["Peça"], ["Origem"], ["Parada há", "num"], ["Estoque", "num"], ["Custo parado", "num"]],
        // Maior custo parado primeiro: é o dinheiro que mais pesa.
        linhas: [...itens]
          .sort((a, b) => b.valorParado - a.valorParado || b.dias - a.dias)
          .map(item => ({
            celulas: [
              criarCelulaPeca(item.peca),
              celula(origemPorId.get(Number(item.peca.origemId || item.peca.origem_id))?.descricao || "—", "cell-muted"),
              celula(`${formatarNumero(item.dias)} dias`, "num"),
              celula(`${formatarNumero(item.quantidade)} un.`, "num"),
              celula(formatarMoeda(item.valorParado), "num cell-strong")
            ],
            acao: { texto: "Ver peça", href: linkPeca(item.peca.id) }
          }))
      };
    }
    default:
      return null;
  }
}

function montarGruposAlertas(dados, opcoes = {}) {
  return window.alertasRegras.calcularAtencao(dados, opcoes)
    .map(grupo => {
      const texto = descreverGrupo(grupo, dados);
      if (!texto) return null;

      const montado = {
        tipo: grupo.tipo,
        gravidade: grupo.gravidade,
        ...texto,
        total: texto.linhas.length,
        linhas: texto.linhas.map(linha => ({
          ...linha,
          busca: normalizarTexto(linha.celulas.map(item => item.texto).join(" "))
        }))
      };
      montado.titulo = montarTitulo(montado);
      return montado;
    })
    .filter(Boolean);
}

// ---- Filtros ----

function filtrarGrupos(grupos, termo, gravidade) {
  const palavras = normalizarTexto(termo).split(/\s+/).filter(Boolean);

  return grupos
    .filter(grupo => gravidade === "todas" || grupo.gravidade === gravidade)
    .map(grupo => ({
      ...grupo,
      linhas: grupo.linhas.filter(linha => palavras.every(palavra => linha.busca.includes(palavra)))
    }))
    .filter(grupo => grupo.linhas.length > 0);
}

function atualizarContagens(grupos) {
  const termo = campoBuscaAlertas?.value || "";
  const contar = gravidade => filtrarGrupos(grupos, termo, gravidade).reduce((total, grupo) => total + grupo.linhas.length, 0);

  filtroGravidadeAlertas?.querySelectorAll("[data-contagem]").forEach(elemento => {
    elemento.textContent = formatarNumero(contar(elemento.dataset.contagem));
  });
}

// ---- Renderização ----

function renderizarGrupo(grupo) {
  const cabecalho = grupo.colunas
    .map(([titulo, classe]) => `<th scope="col"${classe ? ` class="${classe}"` : ""}>${escaparHtml(titulo)}</th>`)
    .join("");

  const linhas = grupo.linhas.map(linha => `
    <tr>
      ${linha.celulas.map((item, indice) => `<td data-label="${escaparHtml(grupo.colunas[indice][0])}"${item.classe ? ` class="${item.classe}"` : ""}>${item.html}</td>`).join("")}
      <td class="alertas-tabela__acao"><a class="btn btn--secondary btn--compact" href="${escaparHtml(linha.acao.href)}">${escaparHtml(linha.acao.texto)}</a></td>
    </tr>
  `).join("");

  return `
    <section class="card card--flush alertas-grupo" id="${escaparHtml(grupo.tipo)}" aria-labelledby="titulo-${escaparHtml(grupo.tipo)}">
      <div class="card__head alertas-grupo__head">
        <span class="alert-item__icon alert-item__icon--${grupo.gravidade}" aria-hidden="true"><i class="${ICONES_ALERTA[grupo.tipo] || "ri-alert-line"}"></i></span>
        <div class="card__head-text">
          <div class="alertas-grupo__titulo">
            <h2 class="card__title" id="titulo-${escaparHtml(grupo.tipo)}">${escaparHtml(montarTitulo(grupo, grupo.linhas.length))}</h2>
            <span class="pill pill--${grupo.gravidade}">${escaparHtml(ROTULOS_GRAVIDADE[grupo.gravidade] || "")}</span>
          </div>
          <p class="card__subtitle">${escaparHtml(grupo.resumo)}</p>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table data-table--responsive alertas-tabela">
          <thead><tr>${cabecalho}<th scope="col"><span class="sr-only">Ação</span></th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderizarTudoCerto(texto) {
  return `
    <section class="card alertas-vazio">
      <div class="alert-item alert-item--center">
        <span class="alert-item__icon alert-item__icon--success" aria-hidden="true"><i class="ri-check-line"></i></span>
        <span class="alert-item__title alert-item__title--plain">${escaparHtml(texto)}</span>
      </div>
    </section>
  `;
}

function renderizarResumo() {
  const ocorrencias = gruposCarregados.reduce((total, grupo) => total + grupo.linhas.length, 0);

  resumoAlertas.textContent = gruposCarregados.length
    ? `${plural(gruposCarregados.length, "tipo de problema", "tipos de problema")} · ${plural(ocorrencias, "ocorrência", "ocorrências")}`
    : "Nada precisa de atenção agora";
}

function renderizarAlertas() {
  atualizarContagens(gruposCarregados);

  if (gruposCarregados.length === 0) {
    gruposAlertas.innerHTML = renderizarTudoCerto("Nada precisa de atenção agora");
    return;
  }

  const visiveis = filtrarGrupos(gruposCarregados, campoBuscaAlertas?.value || "", gravidadeSelecionada);
  gruposAlertas.innerHTML = visiveis.length
    ? visiveis.map(renderizarGrupo).join("")
    : `<p class="empty-state">Nenhum alerta encontrado para esta busca ou filtro.</p>`;
}

function selecionarGravidade(gravidade) {
  gravidadeSelecionada = gravidade;
  filtroGravidadeAlertas.querySelectorAll("[data-gravidade]").forEach(botao => {
    botao.setAttribute("aria-pressed", String(botao.dataset.gravidade === gravidade));
  });
  renderizarAlertas();
}

// ---- Carga ----

async function carregarDados() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemAlertas.textContent = "Configure o Supabase para carregar os alertas.";
    return null;
  }

  try {
    const [origens, pecas, vendas, consumosEstoque, entradasEstoque, custosVenda, custosPeca] = await Promise.all([
      window.supabaseService.listarOrigens(),
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarConsumosEstoque(),
      window.supabaseService.listarEntradasEstoque(),
      window.supabaseService.listarCustosVenda(),
      window.supabaseService.listarCustosPeca()
    ]);

    return {
      origens: origens || [],
      pecas: pecas || [],
      vendas: vendas || [],
      consumosEstoque: consumosEstoque || [],
      entradasEstoque: entradasEstoque || [],
      custosVenda: custosVenda || [],
      custosPeca: custosPeca || []
    };
  } catch (erro) {
    console.error("Erro ao carregar alertas:", erro);
    mensagemAlertas.textContent = "Não foi possível carregar os alertas do Supabase.";
    return null;
  }
}

async function iniciarAlertas() {
  if (!window.alertasRegras || !window.financeiroUtils) {
    mensagemAlertas.textContent = "Não foi possível calcular os alertas.";
    return;
  }

  const dados = await carregarDados();

  if (!dados) {
    resumoAlertas.textContent = "";
    return;
  }

  gruposCarregados = montarGruposAlertas(dados);
  // Esta tela já calcula tudo: informa o total para a sidebar não buscar de novo.
  window.sidebarNavegacao?.atualizarContadorAtencao(gruposCarregados.length);
  renderizarResumo();
  renderizarAlertas();

  // Vindo do Painel com #peca-parada (por exemplo), rola até o grupo.
  if (window.location.hash) {
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }
}

campoBuscaAlertas?.addEventListener("input", renderizarAlertas);

filtroGravidadeAlertas?.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-gravidade]");
  if (botao) selecionarGravidade(botao.dataset.gravidade);
});

document.addEventListener("DOMContentLoaded", iniciarAlertas);
