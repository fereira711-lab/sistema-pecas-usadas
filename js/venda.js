// Registrar venda (redesenho, seção 7 da especificação): peça escolhida como cartão, canal por botões
// (Mercado Livre, WhatsApp, Balcão, Outro), custos da venda em linhas e resumo lateral com o resultado
// ANTES de registrar. A prévia do custo usa financeiro-utils.estimarCustoVendaPeca (mesma ordem de
// consumo do banco); o registro continua pela função oficial registrar_venda_fifo, que calcula o custo real.
const MAXIMO_SUGESTOES = 8;

const formVenda = document.getElementById("formVenda");
const mensagemVenda = document.getElementById("mensagemVenda");
const campoBuscaPecaVenda = document.getElementById("buscaPecaVenda");
const campoBuscaPeca = document.getElementById("campoBuscaPeca");
const sugestoesPecaVenda = document.getElementById("sugestoesPecaVenda");
const cartaoPecaVenda = document.getElementById("cartaoPecaVenda");
const campoQuantidade = document.getElementById("quantidadeVendidaNaVenda");
const campoValor = document.getElementById("valorVenda");
const dicaPrecoCadastrado = document.getElementById("dicaPrecoCadastrado");
const campoDataVenda = document.getElementById("dataVenda");
const canaisVenda = document.getElementById("canaisVenda");
const campoObservacoes = document.getElementById("observacoesVenda");
const listaCustosVenda = document.getElementById("listaCustosVenda");
const cabecalhoCustosVenda = document.getElementById("cabecalhoCustosVenda");
const botaoAdicionarCustoVenda = document.getElementById("botaoAdicionarCustoVenda");
const botaoRegistrarVenda = document.getElementById("botaoRegistrarVenda");

const resumoReceita = document.getElementById("resumoReceita");
const resumoCustoPeca = document.getElementById("resumoCustoPeca");
const resumoCustosVenda = document.getElementById("resumoCustosVenda");
const resumoLucroLinha = document.getElementById("resumoLucroLinha");
const resumoLucro = document.getElementById("resumoLucro");
const resumoMargem = document.getElementById("resumoMargem");
const notaCustoVenda = document.getElementById("notaCustoVenda");

let pecasVenda = [];
let origensVenda = [];
let entradasVenda = [];
let tiposCustoVenda = [];
let pecaSelecionada = null;
let canalSelecionado = "";
let sugestoesAtuais = [];
let indiceSugestao = -1;
let registrando = false;

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
  if (window.moedaUtils?.formatarPercentualBR) return window.moedaUtils.formatarPercentualBR(valor, 1);
  return `${Number(valor || 0).toFixed(1).replace(".", ",")}%`;
}

function formatarNegativo(valor) {
  // Custos no resumo aparecem como saída: "− R$ 190,00".
  return Number(valor || 0) > 0 ? `− ${formatarMoeda(valor)}` : formatarMoeda(0);
}

function lerMoeda(texto) {
  const valor = String(texto || "").trim();
  if (!valor) return null;
  const numero = window.moedaUtils?.parseMoedaBR ? window.moedaUtils.parseMoedaBR(valor) : Number(valor.replace(",", "."));
  return Number.isFinite(numero) ? numero : NaN;
}

function obterDataLocalHoje() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
}

function mostrarMensagem(html, tipo = "warning") {
  mensagemVenda.innerHTML = html;
  mensagemVenda.classList.toggle("page-message--success", tipo === "success");
}

// ---- Dados da peça ----

function obterPreco(peca) {
  return Number(peca?.precoVenda || peca?.preco_venda || peca?.preco_sugerido || 0);
}

function calcularSaldo(pecaId) {
  return entradasVenda
    .filter(entrada => Number(entrada.pecaId) === Number(pecaId))
    .reduce((total, entrada) => total + Math.max(0, Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0)), 0);
}

function obterOrigem(peca) {
  return origensVenda.find(origem => Number(origem.id) === Number(peca?.origemId)) || null;
}

// ---- Prévia do resultado (sem DOM, para poder testar) ----

// Receita, custo da peça estimado pela ordem de consumo, custos da venda, lucro e margem.
// Sem estoque suficiente ou sem entrada: custo não calculado, sem inventar lucro/margem.
function calcularPreviaVenda({ pecaId, quantidade, valorUnitario, custosVenda, entradas }) {
  const qtd = Number.isInteger(quantidade) && quantidade > 0 ? quantidade : 0;
  const unitario = Number.isFinite(valorUnitario) && valorUnitario >= 0 ? valorUnitario : 0;
  const receita = qtd * unitario;
  const totalCustosVenda = (custosVenda || []).reduce((total, custo) => total + Number(custo.valor || 0), 0);
  const custo = pecaId && qtd > 0 && window.financeiroUtils?.estimarCustoVendaPeca
    ? window.financeiroUtils.estimarCustoVendaPeca(pecaId, qtd, entradas)
    : { calculado: false, valor: null, quantidadeSemEstoque: 0 };

  if (!custo.calculado) {
    return { receita, custoPeca: null, custosVenda: totalCustosVenda, lucro: null, margem: null, quantidadeSemEstoque: custo.quantidadeSemEstoque };
  }

  const lucro = receita - custo.valor - totalCustosVenda;
  return {
    receita,
    custoPeca: custo.valor,
    custosVenda: totalCustosVenda,
    lucro,
    margem: receita > 0 ? (lucro / receita) * 100 : null,
    quantidadeSemEstoque: 0
  };
}

// ---- Busca e cartão da peça ----

function textoBuscaPeca(peca) {
  return normalizarTexto([peca.sku, peca.nome, peca.compatibilidade, obterOrigem(peca)?.descricao].join(" "));
}

function buscarPecas(termo) {
  const palavras = normalizarTexto(termo).split(/\s+/).filter(Boolean);
  if (!palavras.length) return [];

  return pecasVenda
    .filter(peca => palavras.every(palavra => textoBuscaPeca(peca).includes(palavra)))
    .sort((a, b) => Number(calcularSaldo(b.id) > 0) - Number(calcularSaldo(a.id) > 0))
    .slice(0, MAXIMO_SUGESTOES);
}

function fecharSugestoes() {
  sugestoesPecaVenda.hidden = true;
  sugestoesPecaVenda.innerHTML = "";
  campoBuscaPecaVenda.setAttribute("aria-expanded", "false");
  campoBuscaPecaVenda.removeAttribute("aria-activedescendant");
  sugestoesAtuais = [];
  indiceSugestao = -1;
}

function renderizarSugestoes() {
  sugestoesAtuais = buscarPecas(campoBuscaPecaVenda.value);

  if (!String(campoBuscaPecaVenda.value || "").trim()) {
    fecharSugestoes();
    return;
  }

  indiceSugestao = sugestoesAtuais.findIndex(peca => calcularSaldo(peca.id) > 0);
  sugestoesPecaVenda.innerHTML = sugestoesAtuais.length
    ? sugestoesAtuais.map((peca, indice) => {
      const saldo = calcularSaldo(peca.id);
      const origem = obterOrigem(peca);
      return `
        <button type="button" role="option" id="sugestao-${peca.id}" class="venda-busca__opcao${indice === indiceSugestao ? " is-active" : ""}"
          data-indice="${indice}" aria-selected="${indice === indiceSugestao}" ${saldo > 0 ? "" : "disabled"}>
          <span class="venda-busca__nome">${escaparHtml(peca.nome)} <span class="mono">${escaparHtml(peca.sku || "")}</span></span>
          <span class="venda-busca__meta">${escaparHtml(origem?.descricao || "")}${origem ? " · " : ""}${saldo > 0 ? `${saldo} un.` : "Sem estoque"}</span>
        </button>`;
    }).join("")
    : '<p class="venda-busca__vazio">Nenhuma peça encontrada.</p>';

  sugestoesPecaVenda.hidden = false;
  campoBuscaPecaVenda.setAttribute("aria-expanded", "true");
  atualizarDestaqueSugestao();
}

function atualizarDestaqueSugestao() {
  sugestoesPecaVenda.querySelectorAll(".venda-busca__opcao").forEach(opcao => {
    const ativa = Number(opcao.dataset.indice) === indiceSugestao;
    opcao.classList.toggle("is-active", ativa);
    opcao.setAttribute("aria-selected", String(ativa));
    if (ativa) campoBuscaPecaVenda.setAttribute("aria-activedescendant", opcao.id);
  });
}

function moverDestaque(direcao) {
  const disponiveis = sugestoesAtuais.map((peca, indice) => (calcularSaldo(peca.id) > 0 ? indice : -1)).filter(indice => indice >= 0);
  if (!disponiveis.length) return;
  const posicao = disponiveis.indexOf(indiceSugestao);
  indiceSugestao = disponiveis[posicao < 0 ? 0 : (posicao + direcao + disponiveis.length) % disponiveis.length];
  atualizarDestaqueSugestao();
}

function renderizarCartaoPeca() {
  if (!pecaSelecionada) {
    cartaoPecaVenda.hidden = true;
    cartaoPecaVenda.innerHTML = "";
    campoBuscaPeca.hidden = false;
    return;
  }

  const peca = pecaSelecionada;
  const saldo = calcularSaldo(peca.id);
  const origem = obterOrigem(peca);
  const imagem = String(peca.imagemUrl || "").trim();

  cartaoPecaVenda.innerHTML = `
    <span class="thumb venda-peca__foto">${imagem ? `<img src="${escaparHtml(imagem)}" alt="">` : '<i class="ri-image-line" aria-hidden="true"></i>'}</span>
    <div class="venda-peca__texto">
      <span class="venda-peca__nome">${escaparHtml(peca.nome)}</span>
      <span class="venda-peca__meta"><span class="mono">${escaparHtml(peca.sku || "")}</span>${origem ? ` · ${escaparHtml(origem.descricao || origem.codigoOrigem)}` : ""}</span>
      ${peca.compatibilidade ? `<span class="venda-peca__compat">Compatível com: ${escaparHtml(peca.compatibilidade)}</span>` : ""}
    </div>
    <div class="venda-peca__estoque">
      <span class="pill ${saldo > 0 ? "pill--success" : "pill--danger"}">${saldo > 0 ? "Em estoque" : "Sem estoque"}</span>
      <span class="venda-peca__quantidade">${saldo} un.</span>
    </div>
    <button type="button" class="btn btn--quiet btn--compact" id="botaoTrocarPeca">Trocar peça</button>
  `;
  cartaoPecaVenda.hidden = false;
  campoBuscaPeca.hidden = true;
}

function selecionarPeca(peca) {
  pecaSelecionada = peca;
  fecharSugestoes();
  campoBuscaPecaVenda.value = "";

  const saldo = calcularSaldo(peca.id);
  const preco = obterPreco(peca);
  campoQuantidade.max = String(Math.max(saldo, 1));
  if (Number(campoQuantidade.value || 0) > saldo) campoQuantidade.value = String(Math.max(saldo, 1));
  // Valor unitário começa no preço cadastrado; quem vende ajusta se negociou outro valor.
  campoValor.value = preco > 0 ? formatarMoeda(preco) : "";
  dicaPrecoCadastrado.textContent = preco > 0 ? `Preço cadastrado: ${formatarMoeda(preco)}` : "Peça sem preço cadastrado";

  renderizarCartaoPeca();
  atualizarResumo();
  (preco > 0 ? campoQuantidade : campoValor).focus();
}

function trocarPeca() {
  pecaSelecionada = null;
  dicaPrecoCadastrado.textContent = "";
  campoQuantidade.removeAttribute("max");
  renderizarCartaoPeca();
  atualizarResumo();
  campoBuscaPecaVenda.focus();
}

// ---- Canal ----

function selecionarCanal(canal) {
  canalSelecionado = canal;
  canaisVenda.querySelectorAll("[data-canal]").forEach(botao => {
    botao.setAttribute("aria-pressed", String(botao.dataset.canal === canal));
  });
}

// ---- Custos da venda ----

function criarOpcoesTipos(tipoSelecionado = "") {
  return tiposCustoVenda
    .map(tipo => `<option value="${escaparHtml(tipo.nome)}" data-tipo-id="${escaparHtml(tipo.id)}"${tipo.nome === tipoSelecionado ? " selected" : ""}>${escaparHtml(tipo.nome)}</option>`)
    .join("");
}

// "Tipo" e "Valor" aparecem uma vez, no cabeçalho das colunas; cada campo tem o próprio aria-label.
function atualizarCabecalhoCustos() {
  if (cabecalhoCustosVenda) {
    cabecalhoCustosVenda.hidden = !listaCustosVenda.querySelector(".venda-custo");
  }
}

function adicionarLinhaCusto(custo = {}) {
  const linha = document.createElement("div");
  linha.className = "venda-custo";
  linha.innerHTML = `
    <select class="select venda-custo__tipo" data-campo="tipo" aria-label="Tipo do custo">${criarOpcoesTipos(custo.tipo)}</select>
    <input class="input" data-campo="valor" type="text" inputmode="decimal" placeholder="R$ 0,00" autocomplete="off" aria-label="Valor do custo">
    <button type="button" class="btn btn--icon venda-custo__remover" data-acao="remover-custo" aria-label="Remover custo">
      <i class="ri-delete-bin-line" aria-hidden="true"></i>
    </button>
  `;
  listaCustosVenda.appendChild(linha);
  atualizarCabecalhoCustos();
  window.moedaUtils?.registrarCampoMoeda?.(linha.querySelector("[data-campo='valor']"));
  linha.querySelector("[data-campo='valor']").focus();
  atualizarResumo();
}

function lerCustosVenda() {
  return Array.from(listaCustosVenda.querySelectorAll(".venda-custo")).map(linha => {
    const select = linha.querySelector("[data-campo='tipo']");
    const tipo = select?.value || "";
    return {
      tipo,
      tipoCusto: tipo,
      tipoCustoId: select?.selectedOptions[0]?.dataset?.tipoId || null,
      descricao: tipo,
      valor: lerMoeda(linha.querySelector("[data-campo='valor']")?.value),
      data: campoDataVenda.value || obterDataLocalHoje(),
      dataCusto: campoDataVenda.value || obterDataLocalHoje()
    };
  });
}

// ---- Resumo ----

function lerQuantidade() {
  const texto = String(campoQuantidade.value || "").trim();
  return texto === "" ? null : Number(texto);
}

function atualizarResumo() {
  const custos = lerCustosVenda().filter(custo => Number.isFinite(custo.valor) && custo.valor > 0);
  const previa = calcularPreviaVenda({
    pecaId: pecaSelecionada?.id,
    quantidade: lerQuantidade(),
    valorUnitario: lerMoeda(campoValor.value),
    custosVenda: custos,
    entradas: entradasVenda
  });

  resumoReceita.textContent = formatarMoeda(previa.receita);
  resumoCustosVenda.textContent = formatarNegativo(previa.custosVenda);
  resumoLucroLinha.classList.remove("summary-side__result--success", "summary-side__result--danger", "summary-side__result--neutral");
  resumoMargem.classList.remove("text-success", "text-danger");

  if (previa.custoPeca === null) {
    resumoCustoPeca.textContent = pecaSelecionada ? "Custo não calculado" : "—";
    resumoLucro.textContent = "—";
    resumoMargem.textContent = "—";
    resumoLucroLinha.classList.add("summary-side__result--neutral");
    notaCustoVenda.textContent = pecaSelecionada && previa.quantidadeSemEstoque > 0
      ? `${previa.quantidadeSemEstoque === 1 ? "Falta" : "Faltam"} ${previa.quantidadeSemEstoque} un. em estoque para esta quantidade.`
      : "O custo vem da entrada mais antiga desta peça e é confirmado ao registrar.";
    return;
  }

  resumoCustoPeca.textContent = formatarNegativo(previa.custoPeca);
  resumoLucro.textContent = formatarMoeda(previa.lucro);
  resumoMargem.textContent = previa.margem === null ? "—" : formatarPercentual(previa.margem);
  resumoLucroLinha.classList.add(previa.lucro < 0 ? "summary-side__result--danger" : "summary-side__result--success");
  // Margem na mesma cor do lucro.
  if (previa.margem !== null) {
    resumoMargem.classList.add(previa.lucro < 0 ? "text-danger" : "text-success");
  }
  notaCustoVenda.textContent = "O custo vem da entrada mais antiga desta peça e é confirmado ao registrar.";
}

// ---- Registrar ----

function validarVenda() {
  const quantidade = lerQuantidade();
  const valorUnitario = lerMoeda(campoValor.value);
  const custos = lerCustosVenda();

  if (!pecaSelecionada) return { campo: campoBuscaPecaVenda, mensagem: "Escolha a peça vendida." };
  if (!Number.isInteger(quantidade) || quantidade < 1) return { campo: campoQuantidade, mensagem: "A quantidade deve ser um número inteiro maior ou igual a 1." };
  if (quantidade > calcularSaldo(pecaSelecionada.id)) return { campo: campoQuantidade, mensagem: "Quantidade maior que o estoque disponível." };
  if (valorUnitario === null || !Number.isFinite(valorUnitario) || valorUnitario < 0) return { campo: campoValor, mensagem: "Informe o valor unitário da venda." };
  if (!campoDataVenda.value) return { campo: campoDataVenda, mensagem: "Informe a data da venda." };
  if (!canalSelecionado) return { campo: canaisVenda.querySelector("[data-canal]"), mensagem: "Escolha o canal da venda." };

  const custoInvalido = custos.findIndex(custo => custo.valor !== null && (!Number.isFinite(custo.valor) || custo.valor < 0));
  if (custoInvalido >= 0) {
    return { campo: listaCustosVenda.querySelectorAll("[data-campo='valor']")[custoInvalido], mensagem: "Os custos da venda devem ser valores maiores ou iguais a zero." };
  }
  const custoSemTipo = custos.findIndex(custo => custo.valor > 0 && !custo.tipo);
  if (custoSemTipo >= 0) {
    return { campo: listaCustosVenda.querySelectorAll("[data-campo='tipo']")[custoSemTipo], mensagem: "Escolha o tipo em todos os custos com valor." };
  }

  return null;
}

function limparFormulario() {
  pecaSelecionada = null;
  campoQuantidade.value = "1";
  campoQuantidade.removeAttribute("max");
  campoValor.value = "";
  dicaPrecoCadastrado.textContent = "";
  campoObservacoes.value = "";
  selecionarCanal("");
  listaCustosVenda.innerHTML = "";
  atualizarCabecalhoCustos();
  renderizarCartaoPeca();
  atualizarResumo();
  if (window.location.search) window.history.replaceState({}, "", window.location.pathname);
}

async function registrarVenda() {
  if (registrando) return;

  const erro = validarVenda();
  if (erro) {
    mostrarMensagem(escaparHtml(erro.mensagem));
    erro.campo?.focus();
    return;
  }

  const quantidade = lerQuantidade();
  const valorUnitario = lerMoeda(campoValor.value);
  const venda = {
    pecaId: pecaSelecionada.id,
    quantidadeVendida: quantidade,
    quantidadeVendidaNaVenda: quantidade,
    valorUnitario,
    valorVendaUnitario: valorUnitario,
    valorVenda: quantidade * valorUnitario,
    valorTotal: quantidade * valorUnitario,
    canalVenda: canalSelecionado,
    observacoes: campoObservacoes.value.trim(),
    dataVenda: campoDataVenda.value,
    custosVenda: lerCustosVenda().filter(custo => custo.tipo && custo.valor > 0)
  };

  registrando = true;
  botaoRegistrarVenda.disabled = true;
  mostrarMensagem("Registrando venda…", "success");

  try {
    const resultado = await window.supabaseService.salvarVenda(venda);
    entradasVenda = await window.supabaseService.listarEntradasEstoque() || entradasVenda;
    const nome = pecaSelecionada.nome;
    limparFormulario();
    mostrarMensagem(
      `Venda de ${escaparHtml(nome)} registrada. <a href="detalhes-venda.html?vendaId=${encodeURIComponent(resultado.venda.id)}">Ver venda</a>`,
      "success"
    );
    campoBuscaPecaVenda.focus();
  } catch (erroRegistro) {
    console.error("Erro ao registrar venda:", erroRegistro);
    mostrarMensagem(`Não foi possível registrar a venda: ${escaparHtml(erroRegistro?.message || "erro desconhecido")}`);
  } finally {
    registrando = false;
    botaoRegistrarVenda.disabled = false;
  }
}

// ---- Início ----

async function iniciarRegistrarVenda() {
  campoDataVenda.value = obterDataLocalHoje();
  window.moedaUtils?.registrarCampoMoeda?.(campoValor);

  if (!window.supabaseService?.estaConfigurado()) {
    mostrarMensagem("Configure o Supabase para registrar vendas.");
    return;
  }

  try {
    const [pecas, origens, entradas, tipos] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarOrigens(),
      window.supabaseService.listarEntradasEstoque(),
      window.supabaseService.listarTiposCusto("venda")
    ]);
    pecasVenda = pecas || [];
    origensVenda = origens || [];
    entradasVenda = entradas || [];
    tiposCustoVenda = tipos || [];
  } catch (erro) {
    console.error("Erro ao carregar dados da venda:", erro);
    mostrarMensagem("Não foi possível carregar as peças do Supabase.");
    return;
  }

  // Vindo de "Vender" em Produtos ou no detalhe da peça.
  const pecaIdUrl = Number(new URLSearchParams(window.location.search).get("pecaId") || 0);
  const pecaUrl = pecasVenda.find(peca => Number(peca.id) === pecaIdUrl);
  if (pecaUrl) selecionarPeca(pecaUrl);

  atualizarResumo();
}

campoBuscaPecaVenda?.addEventListener("input", renderizarSugestoes);
campoBuscaPecaVenda?.addEventListener("keydown", evento => {
  if (evento.key === "ArrowDown") { evento.preventDefault(); moverDestaque(1); return; }
  if (evento.key === "ArrowUp") { evento.preventDefault(); moverDestaque(-1); return; }
  if (evento.key === "Escape") { fecharSugestoes(); return; }
  if (evento.key === "Enter") {
    evento.preventDefault();
    const peca = sugestoesAtuais[indiceSugestao];
    if (peca) selecionarPeca(peca);
  }
});

sugestoesPecaVenda?.addEventListener("click", evento => {
  const opcao = evento.target.closest(".venda-busca__opcao");
  if (opcao && !opcao.disabled) selecionarPeca(sugestoesAtuais[Number(opcao.dataset.indice)]);
});

document.addEventListener("click", evento => {
  if (!evento.target.closest("#campoBuscaPeca")) fecharSugestoes();
});

cartaoPecaVenda?.addEventListener("click", evento => {
  if (evento.target.closest("#botaoTrocarPeca")) trocarPeca();
});

canaisVenda?.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-canal]");
  if (botao) selecionarCanal(botao.dataset.canal);
});

[campoQuantidade, campoValor].forEach(campo => campo?.addEventListener("input", atualizarResumo));
campoValor?.addEventListener("blur", atualizarResumo);
listaCustosVenda?.addEventListener("input", atualizarResumo);
listaCustosVenda?.addEventListener("change", atualizarResumo);
listaCustosVenda?.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-acao='remover-custo']");
  if (botao) {
    botao.closest(".venda-custo")?.remove();
    atualizarCabecalhoCustos();
    atualizarResumo();
  }
});

botaoAdicionarCustoVenda?.addEventListener("click", () => adicionarLinhaCusto());

formVenda?.addEventListener("submit", evento => {
  evento.preventDefault();
  registrarVenda();
});

document.addEventListener("DOMContentLoaded", iniciarRegistrarVenda);
