// Painel (redesenho, seção 7 da especificação).
// Resultado do período, retorno por origem, o que precisa de atenção e as últimas vendas.
// Todos os valores financeiros vêm do financeiro-utils.js; as regras de atenção, do alertas-regras.js.
const mensagemPainel = document.getElementById("mensagemPainel");
const subtituloPainel = document.getElementById("subtituloPainel");
const periodoPainel = document.getElementById("periodoPainel");
const kpisPainel = document.getElementById("kpisPainel");
const retornoOrigens = document.getElementById("retornoOrigens");
const atencaoPainel = document.getElementById("atencaoPainel");
const listaUltimasVendas = document.getElementById("listaUltimasVendas");

const PERIODO_TUDO = "tudo";
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MAXIMO_ORIGENS = 6;
const MAXIMO_ATENCAO = 4;

let dadosPainel = null;

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Formatação centralizada no moeda-utils.js (negativos com o sinal de menos U+2212).
function formatarMoeda(valor) {
  if (window.moedaUtils?.formatarMoedaBR) return window.moedaUtils.formatarMoedaBR(Number(valor || 0));
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function formatarPercentual(valor) {
  if (window.moedaUtils?.formatarPercentualBR) return window.moedaUtils.formatarPercentualBR(Number(valor || 0));
  return `${Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function plural(quantidade, singular, pluralTexto) {
  return `${formatarNumero(quantidade)} ${quantidade === 1 ? singular : pluralTexto}`;
}

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || venda.createdAt || venda.created_at || "").slice(0, 10);
}

function formatarDiaMes(dataIso) {
  const [ano, mes, dia] = String(dataIso || "").split("-");
  return ano && mes && dia ? `${dia}/${mes}` : "—";
}

function obterFinanceiro() {
  return window.financeiroUtils || null;
}

function calcularResultadoVenda(venda, dados) {
  const financeiro = obterFinanceiro();
  if (!financeiro) {
    return { calculado: false, receita: 0, custoConsumido: null, custosVenda: 0, lucro: null, margem: null };
  }
  return financeiro.calcularLucroVenda(venda, dados.consumosEstoque || [], dados.custosVenda || []);
}

// ---- Período ----

function chaveMes(dataIso) {
  return String(dataIso || "").slice(0, 7);
}

function descreverMes(chave) {
  const [ano, mes] = chave.split("-").map(Number);
  return `${MESES[mes - 1]} de ${ano}`;
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function montarOpcoesPeriodo(vendas) {
  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const meses = new Set([mesAtual, ...vendas.map(venda => chaveMes(obterDataVenda(venda))).filter(Boolean)]);
  const ordenados = [...meses].sort().reverse();

  periodoPainel.innerHTML = [
    ...ordenados.map(chave => `<option value="${chave}">${capitalizar(descreverMes(chave))}</option>`),
    `<option value="${PERIODO_TUDO}">Todo o período</option>`
  ].join("");
  periodoPainel.value = mesAtual;
}

function filtrarVendasDoPeriodo(vendas, periodo) {
  if (periodo === PERIODO_TUDO) return vendas;
  return vendas.filter(venda => chaveMes(obterDataVenda(venda)) === periodo);
}

// ---- KPIs ----

function criarKpi({ rotulo, valor, nota = "", classeValor = "", classeNota = "" }) {
  return `
    <article class="kpi">
      <span class="kpi__label">${escaparHtml(rotulo)}</span>
      <span class="kpi__value ${classeValor}">${escaparHtml(valor)}</span>
      <span class="kpi__note ${classeNota}">${escaparHtml(nota)}</span>
    </article>
  `;
}

function calcularSaldoPorPeca(entradas) {
  return entradas.reduce((mapa, entrada) => {
    const pecaId = Number(entrada.pecaId || 0);
    const saldo = Math.max(0, Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0));
    mapa[pecaId] = (mapa[pecaId] || 0) + saldo;
    return mapa;
  }, {});
}

function renderizarKpis(dados, periodo) {
  const vendas = filtrarVendasDoPeriodo(dados.vendas, periodo);
  const resultados = vendas.map(venda => calcularResultadoVenda(venda, dados));
  const receita = resultados.reduce((total, r) => total + Number(r.receita || 0), 0);
  const custosDaVenda = resultados.reduce((total, r) => total + Number(r.custosVenda || 0), 0);
  const calculados = resultados.filter(r => r.calculado);
  const semCusto = resultados.length - calculados.length;
  const custoPecas = calculados.reduce((total, r) => total + Number(r.custoConsumido || 0), 0);

  // Lucro e margem só aparecem quando todas as vendas do período têm custo calculado.
  let kpiLucro;
  if (resultados.length === 0) {
    kpiLucro = criarKpi({ rotulo: "Lucro real", valor: formatarMoeda(0), nota: "Sem vendas no período" });
  } else if (semCusto > 0) {
    kpiLucro = criarKpi({
      rotulo: "Lucro real",
      valor: "Custo não calculado",
      classeValor: "kpi__value--muted",
      nota: `${plural(semCusto, "venda", "vendas")} sem custo calculado`,
      classeNota: "kpi__note--warning"
    });
  } else {
    const lucro = calculados.reduce((total, r) => total + Number(r.lucro || 0), 0);
    const margem = receita > 0 ? (lucro / receita) * 100 : 0;
    kpiLucro = criarKpi({
      rotulo: "Lucro real",
      valor: formatarMoeda(lucro),
      classeValor: lucro < 0 ? "text-danger" : "",
      nota: `Margem de ${formatarPercentual(margem)}`,
      classeNota: lucro < 0 ? "kpi__note--danger" : "kpi__note--success"
    });
  }

  const saldoPorPeca = calcularSaldoPorPeca(dados.entradasEstoque);
  const pecasComSaldo = Object.values(saldoPorPeca).filter(saldo => saldo > 0).length;
  const unidades = Object.values(saldoPorPeca).reduce((total, saldo) => total + saldo, 0);

  kpisPainel.innerHTML = [
    criarKpi({
      rotulo: periodo === PERIODO_TUDO ? "Receita total" : "Receita do mês",
      valor: formatarMoeda(receita),
      nota: resultados.length ? plural(resultados.length, "venda", "vendas") : "Nenhuma venda no período"
    }),
    kpiLucro,
    criarKpi({
      rotulo: "Custo das peças vendidas",
      valor: formatarMoeda(custoPecas),
      nota: `+ ${formatarMoeda(custosDaVenda)} em custos da venda`
    }),
    criarKpi({
      rotulo: "Peças em estoque",
      valor: formatarNumero(pecasComSaldo),
      nota: `${plural(unidades, "unidade", "unidades")} · ${plural(dados.pecas.length, "cadastrada", "cadastradas")}`
    })
  ].join("");

  subtituloPainel.textContent = periodo === PERIODO_TUDO
    ? "Resultado de todo o período"
    : `Resultado de ${descreverMes(periodo)}`;
}

// ---- Retorno por origem ----

// Quanto a origem já devolveu: receita das vendas das peças dela (ligadas pelas entradas consumidas)
// menos os custos dessas vendas, calculado pelo financeiro-utils.js, comparado com o valor pago.
function calcularRetornoOrigem(origem, dados) {
  const financeiro = obterFinanceiro();
  const resultado = financeiro
    ? financeiro.calcularResultadoOrigem(origem, dados.entradasEstoque, dados.vendas, dados.consumosEstoque, dados.custosPeca, dados.custosVenda)
    : { recuperado: 0 };
  const valorPago = Number(origem.valorPago || origem.custoTotal || 0);
  const recuperado = Number(resultado.recuperado || 0);

  return {
    origem,
    valorPago,
    recuperado,
    percentual: valorPago > 0 ? Math.min(recuperado / valorPago, 1) : 0,
    pago: valorPago > 0 && recuperado >= valorPago
  };
}

function renderizarRetornoOrigens(dados) {
  const retornos = dados.origens
    .map(origem => calcularRetornoOrigem(origem, dados))
    .sort((a, b) => b.percentual - a.percentual || b.valorPago - a.valorPago);

  if (retornos.length === 0) {
    retornoOrigens.innerHTML = `<p class="empty-state">Nenhuma origem cadastrada ainda.</p>`;
    return;
  }

  retornoOrigens.innerHTML = retornos.slice(0, MAXIMO_ORIGENS).map(item => {
    const { origem, valorPago, recuperado, percentual, pago } = item;
    let status;
    let classeBarra;

    if (valorPago <= 0) {
      status = "Sem valor pago registrado";
      classeBarra = "progress__bar--info";
    } else if (pago) {
      status = `Já se pagou · lucro de ${formatarMoeda(recuperado - valorPago)}`;
      classeBarra = "progress__bar--complete";
    } else {
      status = `Faltam ${formatarMoeda(valorPago - recuperado)} para se pagar`;
      classeBarra = "progress__bar--partial";
    }

    const largura = `${Math.round(percentual * 100)}%`;
    const href = `paginas/detalhes-origem.html?origemId=${encodeURIComponent(origem.id)}`;

    return `
      <div class="retorno-item">
        <div class="retorno-item__linha">
          <a class="retorno-item__nome" href="${href}">
            <span class="retorno-item__titulo">${escaparHtml(origem.descricao || "Origem sem descrição")}</span>
            <span class="mono">${escaparHtml(origem.codigoOrigem || "")}</span>
          </a>
          <span class="retorno-item__valores">${formatarMoeda(recuperado)} de ${formatarMoeda(valorPago)}</span>
        </div>
        <div class="progress" role="progressbar" aria-label="Retorno de ${escaparHtml(origem.descricao || "origem")}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percentual * 100)}">
          <div class="progress__bar ${classeBarra}" style="width: ${largura}"></div>
        </div>
        <span class="retorno-item__status${pago ? " retorno-item__status--pago" : ""}">${escaparHtml(status)}</span>
      </div>
    `;
  }).join("");
}

// ---- Precisa de atenção ----

const ICONES_ATENCAO = {
  "venda-prejuizo": "ri-line-chart-line",
  "distribuicao-acima": "ri-error-warning-line",
  "venda-sem-custo": "ri-question-line",
  "preco-abaixo-custo": "ri-price-tag-3-line",
  "peca-parada": "ri-time-line",
  "origem-a-distribuir": "ri-stack-line"
};

function nomePeca(peca) {
  return peca ? [peca.sku, peca.nome].filter(Boolean).join(" · ") : "Peça";
}

function descreverGrupoAtencao(grupo, dados) {
  const itens = grupo.itens;
  const quantidade = itens.length;
  const pecaPorId = id => dados.pecas.find(peca => Number(peca.id) === Number(id));

  switch (grupo.tipo) {
    case "venda-prejuizo": {
      const primeiro = itens[0];
      const prejuizo = itens.reduce((total, item) => total + Number(item.resultado.lucro || 0), 0);
      return {
        titulo: `${plural(quantidade, "venda", "vendas")} com prejuízo`,
        detalhe: quantidade === 1
          ? `${nomePeca(pecaPorId(primeiro.venda.pecaId))} · margem de ${formatarPercentual(primeiro.resultado.margem)}`
          : `Prejuízo somado de ${formatarMoeda(Math.abs(prejuizo))}`,
        acao: quantidade === 1 ? "Ver venda" : "Ver vendas",
        href: quantidade === 1 ? `paginas/detalhes-venda.html?vendaId=${encodeURIComponent(primeiro.venda.id)}` : "paginas/historico-vendas.html"
      };
    }
    case "distribuicao-acima": {
      const primeiro = itens[0];
      return {
        titulo: `${plural(quantidade, "origem", "origens")} com distribuição acima do valor pago`,
        detalhe: quantidade === 1
          ? `${primeiro.origem.descricao || primeiro.origem.codigoOrigem} · ${formatarMoeda(Math.abs(primeiro.diferenca))} acima do pago`
          : "O custo lançado nas peças passa do valor pago",
        acao: quantidade === 1 ? "Ver origem" : "Ver origens",
        href: quantidade === 1 ? `paginas/detalhes-origem.html?origemId=${encodeURIComponent(primeiro.origem.id)}` : "paginas/listar-origens.html"
      };
    }
    case "venda-sem-custo":
      return {
        titulo: `${plural(quantidade, "venda", "vendas")} sem custo calculado`,
        detalhe: "Lucro e margem ficam pendentes até o custo ser calculado",
        acao: "Ver vendas",
        href: "paginas/alertas.html#venda-sem-custo"
      };
    case "preco-abaixo-custo": {
      const primeiro = itens[0];
      return {
        titulo: `${plural(quantidade, "peça", "peças")} com preço abaixo do custo`,
        detalhe: quantidade === 1
          ? `${nomePeca(primeiro.peca)} · preço ${formatarMoeda(primeiro.preco)}, custo ${formatarMoeda(primeiro.custo)}`
          : "Vendendo pelo preço cadastrado, essas peças dão prejuízo",
        acao: quantidade === 1 ? "Ajustar preço" : "Ver peças",
        href: quantidade === 1
          ? `paginas/detalhes-produto.html?pecaId=${encodeURIComponent(primeiro.peca.id)}&editar=1&campo=preco`
          : "paginas/alertas.html#preco-abaixo-custo"
      };
    }
    case "peca-parada": {
      const valorParado = itens.reduce((total, item) => total + item.valorParado, 0);
      return {
        titulo: `${plural(quantidade, "peça parada", "peças paradas")} há mais de ${window.alertasRegras?.DIAS_PARA_PECA_PARADA || 90} dias`,
        detalhe: `${formatarMoeda(valorParado)} em estoque sem giro`,
        acao: "Ver peças",
        href: "paginas/alertas.html#peca-parada"
      };
    }
    case "origem-a-distribuir": {
      const primeiro = itens[0];
      const total = itens.reduce((soma, item) => soma + item.diferenca, 0);
      return {
        titulo: `${plural(quantidade, "origem", "origens")} com valor a distribuir`,
        detalhe: quantidade === 1
          ? `${primeiro.origem.descricao || primeiro.origem.codigoOrigem} · ${formatarMoeda(primeiro.diferenca)} sem peça vinculada`
          : `${formatarMoeda(total)} sem peça vinculada`,
        acao: "Distribuir",
        href: quantidade === 1 ? `paginas/detalhes-origem.html?origemId=${encodeURIComponent(primeiro.origem.id)}` : "paginas/listar-origens.html"
      };
    }
    default:
      return null;
  }
}

function criarItemAtencao(grupo, texto) {
  return `
    <div class="alert-item">
      <span class="alert-item__icon alert-item__icon--${grupo.gravidade}" aria-hidden="true"><i class="${ICONES_ATENCAO[grupo.tipo] || "ri-alert-line"}"></i></span>
      <div class="alert-item__text">
        <span class="alert-item__title">${escaparHtml(texto.titulo)}</span>
        <span class="alert-item__detail">${escaparHtml(texto.detalhe)}</span>
        <a class="alert-item__action" href="${escaparHtml(texto.href)}">${escaparHtml(texto.acao)}</a>
      </div>
    </div>
  `;
}

function criarItemTudoCerto(texto) {
  return `
    <div class="alert-item alert-item--center">
      <span class="alert-item__icon alert-item__icon--success" aria-hidden="true"><i class="ri-check-line"></i></span>
      <span class="alert-item__title alert-item__title--plain">${escaparHtml(texto)}</span>
    </div>
  `;
}

function renderizarAtencao(dados) {
  if (!window.alertasRegras || !obterFinanceiro()) {
    atencaoPainel.innerHTML = `<p class="empty-state">Não foi possível calcular os alertas.</p>`;
    return;
  }

  const grupos = window.alertasRegras.calcularAtencao(dados);
  window.sidebarNavegacao?.atualizarContadorAtencao(grupos.length);

  const itens = grupos.slice(0, MAXIMO_ATENCAO).map(grupo => criarItemAtencao(grupo, descreverGrupoAtencao(grupo, dados)));
  const temVendaSemCusto = grupos.some(grupo => grupo.tipo === "venda-sem-custo");

  if (grupos.length === 0) {
    itens.push(criarItemTudoCerto("Nada precisa de atenção agora"));
  } else if (!temVendaSemCusto && dados.vendas.length > 0 && itens.length < MAXIMO_ATENCAO) {
    itens.push(criarItemTudoCerto("Todas as vendas com custo calculado"));
  }

  atencaoPainel.innerHTML = itens.join("");
}

// ---- Últimas vendas ----

function obterUltimasVendas(vendas, limite = 7) {
  return [...vendas]
    .sort((a, b) => {
      const dataA = obterDataVenda(a);
      const dataB = obterDataVenda(b);

      if (dataA !== dataB) {
        return dataB.localeCompare(dataA);
      }

      return Number(b.id || 0) - Number(a.id || 0);
    })
    .slice(0, limite);
}

function renderizarUltimasVendas(dados) {
  if (!listaUltimasVendas) {
    return;
  }

  const ultimas = obterUltimasVendas(dados.vendas || [], 7);

  if (ultimas.length === 0) {
    listaUltimasVendas.innerHTML = `<tr class="data-table__empty"><td colspan="6">Nenhuma venda registrada ainda.</td></tr>`;
    return;
  }

  const pecas = dados.pecas || [];
  const origens = dados.origens || [];

  listaUltimasVendas.innerHTML = ultimas.map(venda => {
    const peca = pecas.find(item => Number(item.id) === Number(venda.pecaId));
    const origem = peca ? origens.find(item => Number(item.id) === Number(peca.origemId)) : null;
    const nome = peca?.nome || venda.produtoNome || `Peça ${venda.pecaId || ""}`.trim();
    const veiculo = origem?.descricao ? ` · ${origem.descricao}` : "";
    const sku = peca?.sku || venda.sku || "";
    const resultado = calcularResultadoVenda(venda, dados);
    // Custos = custo da peça + custos da venda, para que valor − custos = lucro na mesma linha.
    const custos = resultado.calculado ? formatarMoeda(Number(resultado.custoConsumido || 0) + Number(resultado.custosVenda || 0)) : "Custo não calculado";
    const lucro = resultado.calculado ? formatarMoeda(resultado.lucro) : "—";
    const classeLucro = !resultado.calculado ? "cell-muted" : resultado.lucro < 0 ? "text-danger" : "text-success";

    return `
      <tr class="linha-venda">
        <td class="cell-muted" data-label="Data">${formatarDiaMes(obterDataVenda(venda))}</td>
        <td data-label="Peça">
          <a class="data-table__item" href="paginas/detalhes-venda.html?vendaId=${encodeURIComponent(venda.id)}">
            ${sku ? `<span class="mono">${escaparHtml(sku)}</span>` : ""}
            <span class="data-table__name">${escaparHtml(nome + veiculo)}</span>
          </a>
        </td>
        <td data-label="Canal">${escaparHtml(venda.canalVenda || "—")}</td>
        <td class="num" data-label="Valor">${formatarMoeda(resultado.receita)}</td>
        <td class="num cell-muted" data-label="Custos">${escaparHtml(custos)}</td>
        <td class="num cell-strong ${classeLucro}" data-label="Lucro">${escaparHtml(lucro)}</td>
      </tr>
    `;
  }).join("");
}

// ---- Carga ----

async function carregarDadosPainel() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemPainel.textContent = "Configure o Supabase para carregar o painel.";
    return null;
  }

  try {
    const [origens, pecas, vendas, consumosEstoque, entradasEstoque, custosPeca, custosVenda] = await Promise.all([
      window.supabaseService.listarOrigens(),
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarConsumosEstoque(),
      window.supabaseService.listarEntradasEstoque(),
      window.supabaseService.listarCustosPeca?.() || [],
      window.supabaseService.listarCustosVenda?.() || []
    ]);

    mensagemPainel.textContent = "";

    return {
      origens: origens || [],
      pecas: pecas || [],
      vendas: vendas || [],
      consumosEstoque: consumosEstoque || [],
      entradasEstoque: entradasEstoque || [],
      custosPeca: custosPeca || [],
      custosVenda: custosVenda || []
    };
  } catch (erro) {
    console.error("Erro ao carregar o painel:", erro);
    mensagemPainel.textContent = "Não foi possível carregar os dados do Supabase.";
    return null;
  }
}

async function iniciarPainelGeral() {
  dadosPainel = await carregarDadosPainel();

  if (!dadosPainel) {
    return;
  }

  montarOpcoesPeriodo(dadosPainel.vendas);
  renderizarKpis(dadosPainel, periodoPainel.value);
  renderizarRetornoOrigens(dadosPainel);
  renderizarAtencao(dadosPainel);
  renderizarUltimasVendas(dadosPainel);
}

periodoPainel?.addEventListener("change", () => {
  if (dadosPainel) {
    renderizarKpis(dadosPainel, periodoPainel.value);
  }
});

document.addEventListener("DOMContentLoaded", iniciarPainelGeral);
