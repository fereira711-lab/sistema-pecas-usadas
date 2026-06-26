const formularioCusto = document.getElementById("formCusto");
const selectProdutoCusto = document.getElementById("produtoCusto");
const resumoProdutoCusto = document.getElementById("resumoProdutoCusto");
const tabelaCustos = document.getElementById("tabelaCustos");
const mensagemCusto = document.getElementById("mensagemCusto");
const mensagemListaCustos = document.getElementById("mensagemListaCustos");
const campoBuscaPecaCusto = document.getElementById("buscaPecaCusto");
const sugestoesPecaCusto = document.getElementById("sugestoesPecaCusto");
const selectTipoCusto = document.getElementById("tipoCusto");
const botaoNovoTipoCusto = document.getElementById("botaoNovoTipoCusto");
const botaoSalvarCusto = document.getElementById("botaoSalvarCusto");
const botaoCancelarEdicaoCusto = document.getElementById("botaoCancelarEdicaoCusto");
const campoBuscaCustosLista = document.getElementById("buscaCustosLista");
const dataInicialCustos = document.getElementById("dataInicialCustos");
const dataFinalCustos = document.getElementById("dataFinalCustos");
const filtroTipoCustoLista = document.getElementById("filtroTipoCustoLista");
const shellCustos = document.querySelector(".cost-list-shell");
const botaoAbrirFiltrosCustos = document.getElementById("botaoAbrirFiltrosCustos");
const botaoFecharFiltrosCustos = document.getElementById("botaoFecharFiltrosCustos");
const botaoLimparFiltrosCustos = document.getElementById("botaoLimparFiltrosCustos");
const botaoAplicarFiltrosCustos = document.getElementById("botaoAplicarFiltrosCustos");
let produtosCustoCarregados = [];
let custosCustoCarregados = [];
let origensCustoCarregadas = [];
let tiposCustoCarregados = [];
let sugestoesCustoAtuais = [];
let indiceSugestaoCusto = -1;
let custoEmEdicaoId = null;
let custoExclusaoPendenteId = null;
const tiposCustoPadrao = ["Limpeza", "Solda", "Pintura", "Conserto", "Preparo"];
const categoriasTipoCusto = ["peca", "venda", "ambos"];

function supabaseEstaConfigurado() {
  return window.supabaseService && window.supabaseService.estaConfigurado();
}

function buscarProdutos() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function salvarProdutos(produtos) {
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

function obterPecaIdDaUrl() {
  const params = new URLSearchParams(window.location.search);
  const pecaId = Number(params.get("pecaId"));

  return pecaId || null;
}

function formatarNomePeca(peca) {
  const nome = peca.nome || peca.nome_peca || peca.nomePeca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`;
  const sku = String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim();

  return sku ? `${sku} - ${nome}` : nome;
}

function escaparHtml(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escaparRegex(texto) {
  return String(texto || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function destacarBusca(texto) {
  const termo = String(campoBuscaPecaCusto?.value || "").trim();
  const textoSeguro = escaparHtml(texto);

  if (!termo) {
    return textoSeguro;
  }

  return textoSeguro.replace(new RegExp(`(${escaparRegex(termo)})`, "gi"), "<mark>$1</mark>");
}

function padronizarNomeTipoCusto(nome) {
  const texto = String(nome || "").trim().replace(/\s+/g, " ").toLowerCase();

  if (!texto) {
    return "";
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function normalizarNomeTipoCusto(nome) {
  return String(nome || "").trim().toLowerCase();
}

function obterDataLocalHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function preencherDataCustoPadrao() {
  const campoDataCusto = document.getElementById("dataCusto");

  if (campoDataCusto && !campoDataCusto.value) {
    campoDataCusto.value = obterDataLocalHoje();
  }
}

function buscarTiposCustoLocais() {
  const tipos = JSON.parse(localStorage.getItem("tiposCusto")) || [];

  if (tipos.length > 0) {
    return tipos;
  }

  return tiposCustoPadrao.map((nome, indice) => ({
    id: `local-${indice + 1}`,
    nome,
    categoria: "peca",
    ativo: true
  }));
}

function salvarTiposCustoLocais(tipos) {
  localStorage.setItem("tiposCusto", JSON.stringify(tipos));
}

function renderizarTiposCusto(tipoSelecionado = "") {
  const valorSelecionado = tipoSelecionado || selectTipoCusto.value;
  let encontrouSelecionado = !valorSelecionado;

  selectTipoCusto.innerHTML = '<option value="">Selecione o tipo</option>';

  tiposCustoCarregados
    .filter(tipo => tipo.ativo !== false && ["peca", "ambos"].includes(tipo.categoria || "ambos"))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"))
    .forEach(tipo => {
      const opcao = document.createElement("option");
      opcao.value = tipo.nome;
      opcao.textContent = tipo.nome;
      opcao.dataset.tipoId = tipo.id;
      selectTipoCusto.appendChild(opcao);
      encontrouSelecionado = encontrouSelecionado || tipo.nome === valorSelecionado;
    });

  if (valorSelecionado && !encontrouSelecionado) {
    const opcao = document.createElement("option");
    opcao.value = valorSelecionado;
    opcao.textContent = valorSelecionado;
    selectTipoCusto.appendChild(opcao);
  }

  if (valorSelecionado) {
    selectTipoCusto.value = valorSelecionado;
  }
}

async function carregarTiposCusto() {
  if (supabaseEstaConfigurado()) {
    try {
      tiposCustoCarregados = await window.supabaseService.listarTiposCusto("peca") || [];
      salvarTiposCustoLocais(tiposCustoCarregados);
      renderizarTiposCusto();
      return;
    } catch (erro) {
      console.error("Erro ao carregar tipos de custo:", erro);
      mensagemCusto.textContent = "Nao foi possivel carregar os tipos de custo do Supabase. Usando lista local.";
      mensagemCusto.className = "form-message form-message--warning";
    }
  }

  tiposCustoCarregados = buscarTiposCustoLocais();
  renderizarTiposCusto();
}

async function criarNovoTipoCusto() {
  const nomeDigitado = prompt("Nome do novo tipo de custo:");
  const nomePadronizado = padronizarNomeTipoCusto(nomeDigitado);

  if (!nomeDigitado) {
    return;
  }

  if (!nomePadronizado) {
    mensagemCusto.textContent = "Informe um nome valido para o tipo de custo.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  const tipoExistente = tiposCustoCarregados.find(tipo => (
    normalizarNomeTipoCusto(tipo.nome) === normalizarNomeTipoCusto(nomePadronizado)
  ));

  if (tipoExistente) {
    renderizarTiposCusto(tipoExistente.nome);
    mensagemCusto.textContent = `Tipo "${tipoExistente.nome}" ja existe e foi selecionado.`;
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  const categoriaDigitada = prompt("Categoria do tipo: peca, venda ou ambos", "peca");
  const categoria = normalizarNomeTipoCusto(categoriaDigitada || "peca");

  if (!categoriasTipoCusto.includes(categoria)) {
    mensagemCusto.textContent = "Categoria invalida. Use peca, venda ou ambos.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  try {
    const novoTipo = supabaseEstaConfigurado()
      ? await window.supabaseService.criarTipoCusto(nomePadronizado, categoria)
      : {
          id: `local-${Date.now()}`,
          nome: nomePadronizado,
          categoria,
          ativo: true
        };

    tiposCustoCarregados.push(novoTipo);
    salvarTiposCustoLocais(tiposCustoCarregados);
    renderizarTiposCusto(novoTipo.nome);
    mensagemCusto.textContent = `Tipo "${novoTipo.nome}" criado e selecionado.`;
    mensagemCusto.className = "form-message form-message--success";
  } catch (erro) {
    console.error("Erro ao criar tipo de custo:", erro);
    mensagemCusto.textContent = "Nao foi possivel criar o tipo de custo. Verifique se ele ja existe.";
    mensagemCusto.className = "form-message form-message--warning";
  }
}

function formatarNomePecaDestacado(peca) {
  const nome = peca.nome || peca.nome_peca || peca.nomePeca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`;
  const sku = String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim();

  return sku
    ? `${destacarBusca(sku)} - ${destacarBusca(nome)}`
    : destacarBusca(nome);
}

function filtrarProdutosPorBusca(produtos) {
  const termo = String(campoBuscaPecaCusto?.value || "").trim().toLowerCase();

  if (!termo) {
    return produtos;
  }

  return produtos.filter(produto => {
    const nome = String(produto.nome || produto.nome_peca || produto.nomePeca || produto.nomeProduto || "").toLowerCase();
    const sku = String(produto.sku || produto.codigo || produto.codigo_peca || produto.cod || "").toLowerCase();

    return nome.includes(termo) || sku.includes(termo);
  });
}

function buscarOrigens() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function buscarCustos() {
  return JSON.parse(localStorage.getItem("custosDiversos")) || [];
}

function salvarCustos(custos) {
  localStorage.setItem("custosDiversos", JSON.stringify(custos));
}

function normalizarProduto(produto) {
  const quantidade = Number(produto.quantidade || 1);
  const quantidadeVendida = Number(produto.quantidadeVendida || 0);
  const quantidadeDisponivel = Math.max(quantidade - quantidadeVendida, 0);

  return {
    ...produto,
    id: Number(produto.id),
    nome: produto.nome || produto.nome_peca || produto.nomePeca || produto.nomeProduto || produto.descricao || `Peca ${produto.id}`,
    sku: produto.sku || produto.codigo || produto.codigo_peca || produto.cod || "",
    quantidade,
    quantidadeVendida,
    status: quantidadeDisponivel <= 0 ? "vendida" : "em_estoque",
    origemId: Number(produto.origemId || produto.origem_id || 0)
  };
}

function salvarCustoNoCache(custo) {
  const custos = buscarCustos().filter(item => Number(item.id) !== Number(custo.id));
  custos.push(custo);
  salvarCustos(custos);
}

function calcularQuantidadeDisponivel(peca) {
  return Math.max(Number(peca.quantidade || 1) - Number(peca.quantidadeVendida || 0), 0);
}

async function carregarProdutos() {
  let produtos = [];
  const supabaseConfigurado = supabaseEstaConfigurado();

  if (supabaseConfigurado) {
    try {
      produtos = await window.supabaseService.listarPecas();
      salvarProdutos(produtos.map(normalizarProduto));
    } catch (erro) {
      console.error("Erro ao carregar pecas do Supabase para custos:", erro);
      mensagemCusto.textContent = "Nao foi possivel carregar as pecas do Supabase.";
      mensagemCusto.className = "form-message form-message--warning";
    }
  } else {
    produtos = buscarProdutos();
  }

  produtosCustoCarregados = produtos.map(normalizarProduto);

  const pecaIdUrl = obterPecaIdDaUrl();

  if (pecaIdUrl) {
    const produtoUrl = produtosCustoCarregados.find(produto => Number(produto.id) === pecaIdUrl);

    if (produtoUrl) {
      selecionarProdutoCusto(produtoUrl);
    }
  }

  if (produtos.length === 0) {
    mensagemCusto.textContent = supabaseConfigurado
      ? "Nenhum produto encontrado no Supabase. Cadastre uma peca antes de adicionar custos."
      : "Supabase nao configurado. Preencha js/supabase-config.js para carregar as pecas do banco.";
    mensagemCusto.className = "form-message form-message--warning";
  }
}

async function carregarOrigensParaCustos() {
  if (supabaseEstaConfigurado()) {
    try {
      origensCustoCarregadas = await window.supabaseService.listarOrigens() || [];
      return;
    } catch (erro) {
      console.error("Erro ao carregar origens do Supabase para custos:", erro);
      origensCustoCarregadas = [];
      return;
    }
  }

  origensCustoCarregadas = buscarOrigens();
}

function buscarProdutoPorId(pecaId) {
  return produtosCustoCarregados.find(item => Number(item.id) === Number(pecaId));
}

function fecharSugestoesCusto() {
  sugestoesPecaCusto.innerHTML = "";
  sugestoesPecaCusto.classList.remove("is-open");
  indiceSugestaoCusto = -1;
}

function obterPrimeiroIndiceDisponivel(produtos) {
  return produtos.findIndex(produto => calcularQuantidadeDisponivel(produto) > 0);
}

function selecionarProdutoCusto(produto) {
  const quantidadeDisponivel = calcularQuantidadeDisponivel(produto);

  if (quantidadeDisponivel <= 0) {
    return;
  }

  selectProdutoCusto.value = String(produto.id);
  campoBuscaPecaCusto.value = formatarNomePeca(produto);
  fecharSugestoesCusto();
  renderizarResumoProduto();
}

function renderizarSugestoesCusto(produtos) {
  if (!String(campoBuscaPecaCusto?.value || "").trim()) {
    fecharSugestoesCusto();
    return;
  }

  sugestoesCustoAtuais = produtos;
  sugestoesPecaCusto.innerHTML = "";
  indiceSugestaoCusto = obterPrimeiroIndiceDisponivel(produtos);

  if (produtos.length === 0) {
    const item = document.createElement("div");
    item.className = "autocomplete-option";
    item.textContent = "Nenhuma peça encontrada";
    sugestoesPecaCusto.appendChild(item);
    sugestoesPecaCusto.classList.add("is-open");
    return;
  }

  produtos.forEach((produto, indice) => {
    const quantidadeDisponivel = calcularQuantidadeDisponivel(produto);
    const botao = document.createElement("button");
    const textoQuantidade = quantidadeDisponivel > 0
      ? `${quantidadeDisponivel} disponível${quantidadeDisponivel === 1 ? "" : "s"}`
      : "SEM ESTOQUE";

    botao.type = "button";
    botao.className = `autocomplete-option${indice === indiceSugestaoCusto ? " is-active" : ""}${quantidadeDisponivel <= 0 ? " autocomplete-option--unavailable" : ""}`;
    botao.disabled = quantidadeDisponivel <= 0;
    botao.innerHTML = `
      <span>${formatarNomePecaDestacado(produto)}</span>
      <span class="autocomplete-option__meta">${textoQuantidade}</span>
    `;
    botao.addEventListener("click", () => selecionarProdutoCusto(produto));

    sugestoesPecaCusto.appendChild(botao);
  });

  sugestoesPecaCusto.classList.add("is-open");
}

function atualizarDestaqueSugestoesCusto() {
  Array.from(sugestoesPecaCusto.querySelectorAll(".autocomplete-option")).forEach((item, indice) => {
    item.classList.toggle("is-active", indice === indiceSugestaoCusto);
  });
}

function moverDestaqueSugestoesCusto(direcao) {
  const indicesDisponiveis = sugestoesCustoAtuais
    .map((produto, indice) => calcularQuantidadeDisponivel(produto) > 0 ? indice : -1)
    .filter(indice => indice >= 0);

  if (indicesDisponiveis.length === 0) {
    indiceSugestaoCusto = -1;
    atualizarDestaqueSugestoesCusto();
    return;
  }

  const posicaoAtual = indicesDisponiveis.indexOf(indiceSugestaoCusto);
  const proximaPosicao = posicaoAtual < 0
    ? 0
    : (posicaoAtual + direcao + indicesDisponiveis.length) % indicesDisponiveis.length;

  indiceSugestaoCusto = indicesDisponiveis[proximaPosicao];
  atualizarDestaqueSugestoesCusto();
}

function atualizarSugestoesCusto() {
  selectProdutoCusto.value = "";
  renderizarSugestoesCusto(filtrarProdutosPorBusca(produtosCustoCarregados));
  renderizarResumoProduto();
}

function renderizarResumoProduto() {
  const pecaId = Number(selectProdutoCusto.value);
  resumoProdutoCusto.innerHTML = "";

  if (!pecaId) {
    resumoProdutoCusto.innerHTML = `
      <article class="cost-selected-piece cost-selected-piece--empty">
        <div>
          <span>Peca selecionada</span>
          <strong>Nenhuma peca selecionada</strong>
          <p>Use a busca acima para vincular um custo.</p>
        </div>
      </article>
    `;
    return;
  }

  const produto = buscarProdutoPorId(pecaId);

  if (!produto) {
    mensagemCusto.textContent = "Nao foi possivel encontrar a peca selecionada. Atualize a lista e tente novamente.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  const quantidadeDisponivel = calcularQuantidadeDisponivel(produto);

  resumoProdutoCusto.innerHTML = `
    <article class="cost-selected-piece">
      <div>
        <span>Peca selecionada</span>
        <strong>${escaparHtml(produto.sku || "-")}</strong>
        <h4>${escaparHtml(produto.nome || produto.nome_peca || produto.nomePeca || produto.nomeProduto || produto.descricao || "-")}</h4>
      </div>
      <div class="cost-selected-piece__stock">
        <span>Estoque disponivel</span>
        <strong>${quantidadeDisponivel}</strong>
      </div>
      <button class="button-secondary" type="button" data-acao="detalhes-produto" data-peca-id="${produto.id}">Ver detalhes</button>
    </article>
  `;
}

async function carregarCustos() {
  if (supabaseEstaConfigurado()) {
    try {
      custosCustoCarregados = await window.supabaseService.listarCustosPeca() || [];
      ordenarCustosPorMaisRecente();
      mensagemListaCustos.textContent = "";
      return "supabase";
    } catch (erro) {
      console.error("Erro ao carregar custos da peca no Supabase:", erro);
      custosCustoCarregados = [];
      mensagemListaCustos.textContent = "Nao foi possivel carregar os custos do Supabase.";
      return "erro";
    }
  }

  custosCustoCarregados = buscarCustos();
  ordenarCustosPorMaisRecente();
  return "local";
}

function ordenarCustosPorMaisRecente() {
  custosCustoCarregados.sort((a, b) => {
    const dataA = String(a.data || a.dataCusto || "");
    const dataB = String(b.data || b.dataCusto || "");
    const comparacaoData = dataB.localeCompare(dataA);

    if (comparacaoData !== 0) {
      return comparacaoData;
    }

    return Number(b.id || 0) - Number(a.id || 0);
  });
}

function obterDataCusto(custo) {
  return String(custo.data || custo.dataCusto || "").slice(0, 10);
}

function obterTipoCusto(custo) {
  return custo.tipoCusto || custo.tipo || "-";
}

function renderizarFiltroTipoCustoLista() {
  if (!filtroTipoCustoLista) {
    return;
  }

  const valorAtual = filtroTipoCustoLista.value;
  const tipos = [...new Set(custosCustoCarregados.map(obterTipoCusto).filter(tipo => tipo && tipo !== "-"))];
  filtroTipoCustoLista.innerHTML = '<option value="">Todos</option>';

  tipos
    .sort((a, b) => String(a).localeCompare(String(b), "pt-BR"))
    .forEach(tipo => {
      const opcao = document.createElement("option");
      opcao.value = tipo;
      opcao.textContent = tipo;
      filtroTipoCustoLista.appendChild(opcao);
    });

  filtroTipoCustoLista.value = tipos.includes(valorAtual) ? valorAtual : "";
}

function filtrarCustosLista(custos) {
  const termo = String(campoBuscaCustosLista?.value || "").trim().toLowerCase();
  const dataInicial = dataInicialCustos?.value || "";
  const dataFinal = dataFinalCustos?.value || "";
  const tipo = filtroTipoCustoLista?.value || "";

  return custos.filter(custo => {
    const produto = obterDadosProdutoDoCusto(custo);
    const dataCusto = obterDataCusto(custo);
    const tipoCusto = obterTipoCusto(custo);
    const textoBusca = [
      produto.sku,
      produto.nome,
      custo.descricao,
      custo.observacoes
    ].join(" ").toLowerCase();

    if (termo && !textoBusca.includes(termo)) {
      return false;
    }

    if (dataInicial && (!dataCusto || dataCusto < dataInicial)) {
      return false;
    }

    if (dataFinal && (!dataCusto || dataCusto > dataFinal)) {
      return false;
    }

    if (tipo && tipoCusto !== tipo) {
      return false;
    }

    return true;
  });
}

function alternarPainelFiltrosCustos(aberto) {
  shellCustos?.classList.toggle("cost-list-shell--filters-open", aberto);
  botaoAbrirFiltrosCustos?.setAttribute("aria-expanded", aberto ? "true" : "false");
}

function limparFiltrosCustos() {
  if (dataInicialCustos) dataInicialCustos.value = "";
  if (dataFinalCustos) dataFinalCustos.value = "";
  if (filtroTipoCustoLista) filtroTipoCustoLista.value = "";

  renderizarCustos();
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

function obterDadosProdutoDoCusto(custo) {
  const produto = buscarProdutoPorId(custo.pecaId);

  return {
    sku: produto?.sku || custo.sku || "-",
    nome: produto ? formatarNomePeca(produto) : custo.produtoNome || `Peca ${custo.pecaId || ""}`.trim()
  };
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function renderizarCustos(origemDados = supabaseEstaConfigurado() ? "supabase" : "local") {
  const custos = filtrarCustosLista(custosCustoCarregados);
  tabelaCustos.innerHTML = "";

  if (custos.length === 0) {
    mensagemListaCustos.textContent = custosCustoCarregados.length > 0
      ? "Nenhum custo encontrado para os filtros informados."
      : origemDados === "erro"
      ? "Nao foi possivel carregar os custos do Supabase."
      : origemDados === "supabase"
        ? "Nenhum custo cadastrado no Supabase."
        : "Nenhum custo local cadastrado.";
    return;
  }

  mensagemListaCustos.textContent = "";
  custoExclusaoPendenteId = custos.some(custo => Number(custo.id) === Number(custoExclusaoPendenteId)) ? custoExclusaoPendenteId : null;

  custos.forEach((custo) => {
    const linha = document.createElement("article");
    const custoId = custo.id || "";
    const observacaoCurta = custo.descricao || custo.observacoes || "-";

    linha.className = `cost-line${Number(custoExclusaoPendenteId) === Number(custoId) ? " cost-line--confirm" : ""}`;
    linha.innerHTML = `
      <time datetime="${escaparHtml(obterDataCusto(custo))}">${formatarData(custo.data || custo.dataCusto)}</time>
      <span class="cost-line__type">${escaparHtml(custo.tipoCusto || custo.tipo || "-")}</span>
      <strong class="cost-line__value">${formatarMoeda(custo.valor)}</strong>
      <p title="${escaparHtml(observacaoCurta)}">${escaparHtml(observacaoCurta)}</p>
      <div class="cost-line__actions">
        <button class="button-secondary" type="button" data-acao="editar-custo" data-custo-id="${custoId}">Editar</button>
        <button class="button-secondary button-danger-soft" type="button" data-acao="excluir-custo" data-custo-id="${custoId}">Excluir</button>
      </div>
    `;

    tabelaCustos.appendChild(linha);

    if (Number(custoExclusaoPendenteId) === Number(custoId)) {
      const linhaConfirmacao = document.createElement("div");
      linhaConfirmacao.className = "cost-delete-confirm-row";
      linhaConfirmacao.innerHTML = `
        <div class="cost-delete-confirm">
          <span>Excluir este custo?</span>
          <button class="button-secondary button-danger-soft" type="button" data-acao="confirmar-exclusao-custo" data-custo-id="${custoId}">Confirmar exclusao</button>
          <button class="button-secondary" type="button" data-acao="cancelar-exclusao-custo">Cancelar</button>
        </div>
      `;
      tabelaCustos.appendChild(linhaConfirmacao);
    }
  });
}

function abrirDetalhesProduto(pecaId) {
  window.location.href = `detalhes-produto.html?pecaId=${encodeURIComponent(pecaId)}`;
}

function buscarCustoPorId(custoId) {
  return custosCustoCarregados.find(custo => Number(custo.id) === Number(custoId));
}

function preencherFormularioParaEdicao(custo) {
  const produto = buscarProdutoPorId(custo.pecaId);

  custoEmEdicaoId = Number(custo.id);
  selectProdutoCusto.value = String(custo.pecaId || "");
  campoBuscaPecaCusto.value = produto ? formatarNomePeca(produto) : custo.produtoNome || "";
  renderizarResumoProduto();
  renderizarTiposCusto(custo.tipoCusto || custo.tipo || "");
  document.getElementById("descricaoCusto").value = custo.descricao || "";
  document.getElementById("valorCusto").value = Number(custo.valor || 0).toFixed(2);
  document.getElementById("dataCusto").value = String(custo.data || custo.dataCusto || "").slice(0, 10);
  document.getElementById("observacoesCusto").value = custo.observacoes || "";
  botaoSalvarCusto.textContent = "Atualizar custo";
  botaoCancelarEdicaoCusto.hidden = false;
  mensagemCusto.textContent = "Editando custo cadastrado.";
  mensagemCusto.className = "form-message form-message--warning";
  formularioCusto.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelarEdicaoCusto() {
  custoEmEdicaoId = null;
  formularioCusto.reset();
  renderizarTiposCusto();
  preencherDataCustoPadrao();
  renderizarResumoProduto();
  botaoSalvarCusto.textContent = "Salvar custo";
  botaoCancelarEdicaoCusto.hidden = true;
  mensagemCusto.textContent = "";
  mensagemCusto.className = "form-message";
}

function montarCusto(produto, tipo, descricao, valor, data, tipoCustoId) {
  return {
    id: Date.now(),
    pecaId: Number(produto.id),
    produtoNome: formatarNomePeca(produto),
    tipo: tipo,
    tipoCusto: tipo,
    tipoCustoId,
    descricao: descricao,
    valor: Number(valor),
    data: data,
    dataCusto: data,
    observacoes: document.getElementById("observacoesCusto").value.trim()
  };
}

async function salvarCustoNoSupabaseOuFallback(custo) {
  if (supabaseEstaConfigurado()) {
    const custoSalvo = custoEmEdicaoId
      ? await window.supabaseService.atualizarCustoPeca(custo)
      : await window.supabaseService.salvarCustoPeca(custo);
    console.log("Custo salvo no Supabase:", custoSalvo);
    return "supabase";
  }

  salvarCustoNoCache(custo);
  console.warn("Custo da peca salvo no armazenamento temporario:", custo);
  return "fallback";
}

formularioCusto.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const pecaId = Number(selectProdutoCusto.value);
  const tipo = document.getElementById("tipoCusto").value;
  const tipoCustoId = selectTipoCusto.selectedOptions[0]?.dataset?.tipoId || null;
  const descricao = document.getElementById("descricaoCusto").value.trim();
  const valorDigitado = document.getElementById("valorCusto").value;
  const data = document.getElementById("dataCusto").value;

  if (!pecaId || !tipo || !descricao || !valorDigitado || !data) {
    mensagemCusto.textContent = "Preencha peca, tipo, descricao, valor e data do custo.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  if (Number(valorDigitado) <= 0) {
    mensagemCusto.textContent = "O valor do custo deve ser maior que zero.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  const produto = buscarProdutoPorId(pecaId);

  if (!produto) {
    mensagemCusto.textContent = "Nao foi possivel encontrar a peca selecionada. Atualize a lista e tente novamente.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  const custo = montarCusto(produto, tipo, descricao, valorDigitado, data, tipoCustoId);
  custo.id = custoEmEdicaoId || custo.id;

  if (!custo.pecaId) {
    mensagemCusto.textContent = "Nao foi possivel identificar a peca. Atualize a lista de pecas e tente novamente.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  const botaoSalvar = formularioCusto.querySelector("button[type='submit']");
  botaoSalvar.disabled = true;

  try {
    const destino = await salvarCustoNoSupabaseOuFallback(custo);
    const estavaEditando = Boolean(custoEmEdicaoId);
    const mensagemSucesso = destino === "supabase"
      ? `Custo ${estavaEditando ? "atualizado" : "cadastrado"} no Supabase e vinculado a peca.`
      : `Custo ${estavaEditando ? "atualizado" : "cadastrado"} no armazenamento temporario.`;

    alert(`Custo ${estavaEditando ? "atualizado" : "cadastrado"} com sucesso.`);
    cancelarEdicaoCusto();
    mensagemCusto.textContent = mensagemSucesso;
    mensagemCusto.className = "form-message form-message--success";
    await carregarCustos();
    renderizarFiltroTipoCustoLista();
    renderizarResumoProduto();
    renderizarCustos(destino);
  } catch (erro) {
    console.error("Erro ao cadastrar custo da peca:", erro);
    mensagemCusto.textContent = "Nao foi possivel salvar o custo da peca.";
    mensagemCusto.className = "form-message form-message--warning";
  } finally {
    botaoSalvar.disabled = false;
  }
});

selectProdutoCusto.addEventListener("change", renderizarResumoProduto);

campoBuscaPecaCusto?.addEventListener("input", atualizarSugestoesCusto);
botaoNovoTipoCusto?.addEventListener("click", criarNovoTipoCusto);
botaoCancelarEdicaoCusto?.addEventListener("click", cancelarEdicaoCusto);

campoBuscaCustosLista?.addEventListener("input", () => renderizarCustos());

[dataInicialCustos, dataFinalCustos, filtroTipoCustoLista].forEach(campo => {
  campo?.addEventListener("input", () => renderizarCustos());
  campo?.addEventListener("change", () => renderizarCustos());
});

botaoAbrirFiltrosCustos?.addEventListener("click", () => {
  const aberto = !shellCustos?.classList.contains("cost-list-shell--filters-open");
  alternarPainelFiltrosCustos(aberto);
});

botaoFecharFiltrosCustos?.addEventListener("click", () => {
  alternarPainelFiltrosCustos(false);
});

botaoAplicarFiltrosCustos?.addEventListener("click", () => {
  renderizarCustos();
  alternarPainelFiltrosCustos(false);
});

botaoLimparFiltrosCustos?.addEventListener("click", limparFiltrosCustos);

document.addEventListener("keydown", evento => {
  if (evento.key === "Escape") {
    alternarPainelFiltrosCustos(false);
  }
});

campoBuscaPecaCusto?.addEventListener("focus", () => {
  if (!selectProdutoCusto.value && String(campoBuscaPecaCusto.value || "").trim()) {
    renderizarSugestoesCusto(filtrarProdutosPorBusca(produtosCustoCarregados));
  }
});

campoBuscaPecaCusto?.addEventListener("keydown", evento => {
  if (evento.key === "ArrowDown") {
    evento.preventDefault();
    moverDestaqueSugestoesCusto(1);
    return;
  }

  if (evento.key === "ArrowUp") {
    evento.preventDefault();
    moverDestaqueSugestoesCusto(-1);
    return;
  }

  if (evento.key === "Escape") {
    fecharSugestoesCusto();
    alternarPainelFiltrosCustos(false);
    return;
  }

  if (evento.key !== "Enter") {
    return;
  }

  evento.preventDefault();
  const produto = sugestoesCustoAtuais[indiceSugestaoCusto] || sugestoesCustoAtuais[0];

  if (produto) {
    selecionarProdutoCusto(produto);
  }
});

tabelaCustos.addEventListener("click", function (evento) {
  const botao = evento.target.closest("button");

  if (!botao) {
    return;
  }

  if (botao.dataset.acao === "detalhes-produto" && botao.dataset.pecaId) {
    abrirDetalhesProduto(botao.dataset.pecaId);
  }

  if (botao.dataset.acao === "editar-custo") {
    const custo = buscarCustoPorId(botao.dataset.custoId);

    if (custo) {
      preencherFormularioParaEdicao(custo);
    }
  }

  if (botao.dataset.acao === "excluir-custo") {
    custoExclusaoPendenteId = Number(botao.dataset.custoId);
    renderizarCustos();
  }

  if (botao.dataset.acao === "cancelar-exclusao-custo") {
    custoExclusaoPendenteId = null;
    renderizarCustos();
  }

  if (botao.dataset.acao === "confirmar-exclusao-custo") {
    excluirCusto(botao.dataset.custoId);
  }
});

resumoProdutoCusto.addEventListener("click", function (evento) {
  const botao = evento.target.closest("button[data-acao='detalhes-produto']");

  if (botao?.dataset.pecaId) {
    abrirDetalhesProduto(botao.dataset.pecaId);
  }
});

async function excluirCusto(custoId) {
  const custo = buscarCustoPorId(custoId);

  if (!custo) {
    mensagemCusto.textContent = "Nao foi possivel identificar o custo para excluir.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  if (!supabaseEstaConfigurado()) {
    mensagemCusto.textContent = "Configure o Supabase para excluir custos reais da peca.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  try {
    await window.supabaseService.excluirCustoPeca(custo.id);
    custoExclusaoPendenteId = null;

    if (Number(custoEmEdicaoId) === Number(custo.id)) {
      cancelarEdicaoCusto();
    }

    await carregarCustos();
    renderizarFiltroTipoCustoLista();
    renderizarCustos("supabase");
    renderizarResumoProduto();
    mensagemCusto.textContent = "Custo excluido do Supabase com sucesso.";
    mensagemCusto.className = "form-message form-message--success";
  } catch (erro) {
    console.error("Erro ao excluir custo da peca:", erro);
    mensagemCusto.textContent = "Nao foi possivel excluir o custo da peca.";
    mensagemCusto.className = "form-message form-message--warning";
  }
}

async function iniciarTelaCustos() {
  preencherDataCustoPadrao();
  await carregarTiposCusto();
  await carregarProdutos();
  await carregarOrigensParaCustos();
  const origemDados = await carregarCustos();
  renderizarFiltroTipoCustoLista();
  renderizarCustos(origemDados);
  renderizarResumoProduto();
}

iniciarTelaCustos();
