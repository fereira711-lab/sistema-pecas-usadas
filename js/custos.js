const formularioCusto = document.getElementById("formCusto");
const selectProdutoCusto = document.getElementById("produtoCusto");
const resumoProdutoCusto = document.getElementById("resumoProdutoCusto");
const tabelaCustos = document.getElementById("tabelaCustos");
const mensagemCusto = document.getElementById("mensagemCusto");
const mensagemListaCustos = document.getElementById("mensagemListaCustos");
const campoBuscaPecaCusto = document.getElementById("buscaPecaCusto");
const sugestoesPecaCusto = document.getElementById("sugestoesPecaCusto");
let produtosCustoCarregados = [];
let sugestoesCustoAtuais = [];
let indiceSugestaoCusto = -1;

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
    origemId: Number(produto.origemId || 0)
  };
}

function salvarCustoNoCache(custo) {
  const custos = buscarCustos().filter(item => Number(item.id) !== Number(custo.id));
  custos.push(custo);
  salvarCustos(custos);
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function somarCustosPorPeca(pecaId) {
  return buscarCustos()
    .filter(custo => Number(custo.pecaId || 0) === Number(pecaId || 0))
    .reduce((total, custo) => total + Number(custo.valor || 0), 0);
}

function calcularCustoPeca(peca, pecasDaOrigem, origem) {
  if (peca.tipoCusto !== "rateado") {
    return Number(peca.custo || 0);
  }

  if (!origem || pecasDaOrigem.length === 0) {
    return Number(peca.custo || 0);
  }

  return Number(origem.valorPago || 0) / pecasDaOrigem.length;
}

function calcularQuantidadeDisponivel(peca) {
  return Math.max(Number(peca.quantidade || 1) - Number(peca.quantidadeVendida || 0), 0);
}

async function carregarProdutos() {
  let produtos = buscarProdutos();
  const supabaseConfigurado = window.supabaseService && window.supabaseService.estaConfigurado();

  if (supabaseConfigurado) {
    try {
      produtos = await window.supabaseService.listarPecas();
      salvarProdutos(produtos.map(normalizarProduto));
    } catch (erro) {
      console.error("Erro ao carregar pecas do Supabase para custos:", erro);
    }
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
    return;
  }

  const produtos = buscarProdutos();
  const produto = produtos.find(item => Number(item.id) === pecaId);

  if (!produto) {
    mensagemCusto.textContent = "Nao foi possivel encontrar a peca selecionada. Atualize a lista e tente novamente.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  const origem = buscarOrigens().find(item => item.id === Number(produto.origemId || 0));
  const pecasDaOrigem = produtos.filter(item => Number(item.origemId || 0) === Number(produto.origemId || 0));
  const custoBase = calcularCustoPeca(produto, pecasDaOrigem, origem);
  const custosDiversos = somarCustosPorPeca(produto.id);
  const custoTotal = custoBase + custosDiversos;

  resumoProdutoCusto.innerHTML = `
    <article class="summary-card">
      <span>Peca</span>
      <strong>${formatarNomePeca(produto)}</strong>
    </article>
    <article class="summary-card">
      <span>ID da peca</span>
      <strong>${produto.id}</strong>
    </article>
    <article class="summary-card">
      <span>Custo base</span>
      <strong>${formatarMoeda(custoBase)}</strong>
    </article>
    <article class="summary-card">
      <span>Custos diversos</span>
      <strong>${formatarMoeda(custosDiversos)}</strong>
    </article>
    <article class="summary-card">
      <span>Custo total atualizado</span>
      <strong>${formatarMoeda(custoTotal)}</strong>
    </article>
  `;
}

function renderizarCustos() {
  const custos = buscarCustos();
  tabelaCustos.innerHTML = "";

  if (custos.length === 0) {
    mensagemListaCustos.textContent = "Nenhum custo diverso cadastrado.";
    return;
  }

  mensagemListaCustos.textContent = "";

  custos.forEach((custo, indice) => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${custo.data}</td>
      <td data-label="Peca">${custo.produtoNome}</td>
      <td data-label="ID da peca">${custo.pecaId || "-"}</td>
      <td data-label="Tipo">${custo.tipo}</td>
      <td data-label="Descricao">${custo.descricao}</td>
      <td data-label="Valor">${formatarMoeda(custo.valor)}</td>
      <td data-label="Acoes">
        <div class="table-actions">
          <button type="button" data-acao="detalhes" data-indice="${indice}">Ver detalhes</button>
          <button type="button" data-acao="remover" data-indice="${indice}">Remover</button>
        </div>
      </td>
    `;

    tabelaCustos.appendChild(linha);
  });
}

function verDetalhes(indice) {
  const custo = buscarCustos()[indice];

  alert(
    `Peca: ${custo.produtoNome}\n` +
    `ID da peca: ${custo.pecaId || "-"}\n` +
    `Tipo: ${custo.tipo}\n` +
    `Descricao: ${custo.descricao}\n` +
    `Valor: ${formatarMoeda(custo.valor)}\n` +
    `Data: ${custo.data}\n` +
    `Observacoes: ${custo.observacoes || "-"}`
  );
}

function removerCusto(indice) {
  const custos = buscarCustos();
  const confirmou = confirm(`Deseja remover o custo "${custos[indice].descricao}"?`);

  if (!confirmou) {
    return;
  }

  custos.splice(indice, 1);
  salvarCustos(custos);
  renderizarCustos();
  renderizarResumoProduto();
}

function montarCusto(produto, tipo, descricao, valor, data) {
  return {
    id: Date.now(),
    pecaId: Number(produto.id),
    produtoNome: formatarNomePeca(produto),
    tipo: tipo,
    tipoCusto: tipo,
    descricao: descricao,
    valor: Number(valor),
    data: data,
    dataCusto: data,
    observacoes: document.getElementById("observacoesCusto").value.trim()
  };
}

async function salvarCustoNoSupabaseOuFallback(custo) {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      const custoSalvo = await window.supabaseService.salvarCustoPeca(custo);
      const custoComDadosProduto = {
        ...custo,
        ...custoSalvo,
        produtoNome: custo.produtoNome,
        observacoes: custo.observacoes
      };

      salvarCustoNoCache(custoComDadosProduto);
      console.log("Custo cadastrado no Supabase:", custoComDadosProduto);
      return "supabase";
    } catch (erro) {
      console.error("Erro ao salvar custo da peca no Supabase:", erro);
    }
  }

  salvarCustoNoCache(custo);
  console.warn("Custo da peca salvo no armazenamento temporario:", custo);
  return "fallback";
}

formularioCusto.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const produtos = buscarProdutos();
  const pecaId = Number(selectProdutoCusto.value);
  const tipo = document.getElementById("tipoCusto").value;
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

  const produto = produtos.find(item => Number(item.id) === pecaId);

  if (!produto) {
    mensagemCusto.textContent = "Nao foi possivel encontrar a peca selecionada. Atualize a lista e tente novamente.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  const custo = montarCusto(produto, tipo, descricao, valorDigitado, data);

  if (!custo.pecaId) {
    mensagemCusto.textContent = "Nao foi possivel identificar o ID da peca. Atualize a lista de pecas e tente novamente.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  const botaoSalvar = formularioCusto.querySelector("button[type='submit']");
  botaoSalvar.disabled = true;

  try {
    const destino = await salvarCustoNoSupabaseOuFallback(custo);
    const mensagemSucesso = destino === "supabase"
      ? "Custo cadastrado no Supabase e vinculado a peca."
      : "Custo cadastrado no armazenamento temporario.";

    alert("Custo cadastrado com sucesso.");
    mensagemCusto.textContent = mensagemSucesso;
    mensagemCusto.className = "form-message form-message--success";
    formularioCusto.reset();
    renderizarResumoProduto();
    renderizarCustos();
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

  const indice = Number(botao.dataset.indice);

  if (botao.dataset.acao === "detalhes") {
    verDetalhes(indice);
  }

  if (botao.dataset.acao === "remover") {
    removerCusto(indice);
  }
});

carregarProdutos();
renderizarCustos();
