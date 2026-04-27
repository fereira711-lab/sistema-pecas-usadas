const formularioCusto = document.getElementById("formCusto");
const selectProdutoCusto = document.getElementById("produtoCusto");
const resumoProdutoCusto = document.getElementById("resumoProdutoCusto");
const tabelaCustos = document.getElementById("tabelaCustos");
const mensagemCusto = document.getElementById("mensagemCusto");
const mensagemListaCustos = document.getElementById("mensagemListaCustos");

function buscarProdutos() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function salvarProdutos(produtos) {
  localStorage.setItem("produtos", JSON.stringify(produtos));
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

  selectProdutoCusto.innerHTML = '<option value="">Selecione um produto</option>';

  produtos.forEach((produto, indice) => {
    const opcao = document.createElement("option");
    const nomeProduto = produto.nome || produto.nomePeca || produto.nomeProduto || produto.descricao || `Peca ${produto.id || indice + 1}`;
    const idProduto = produto.id || indice + 1;

    opcao.value = indice;
    opcao.textContent = `${nomeProduto} - ID ${idProduto}`;
    selectProdutoCusto.appendChild(opcao);
  });

  if (produtos.length === 0) {
    mensagemCusto.textContent = supabaseConfigurado
      ? "Nenhum produto encontrado no Supabase. Cadastre uma peca antes de adicionar custos."
      : "Supabase nao configurado. Preencha js/supabase-config.js para carregar as pecas do banco.";
    mensagemCusto.className = "form-message form-message--warning";
  }
}

function renderizarResumoProduto() {
  const indiceProduto = selectProdutoCusto.value;
  resumoProdutoCusto.innerHTML = "";

  if (indiceProduto === "") {
    return;
  }

  const produtos = buscarProdutos();
  const produto = produtos[Number(indiceProduto)];
  const origem = buscarOrigens().find(item => item.id === Number(produto.origemId || 0));
  const pecasDaOrigem = produtos.filter(item => Number(item.origemId || 0) === Number(produto.origemId || 0));
  const custoBase = calcularCustoPeca(produto, pecasDaOrigem, origem);
  const custosDiversos = somarCustosPorPeca(produto.id);
  const custoTotal = custoBase + custosDiversos;

  resumoProdutoCusto.innerHTML = `
    <article class="summary-card">
      <span>Produto</span>
      <strong>${produto.nome}</strong>
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
      <td data-label="Produto">${custo.produtoNome}</td>
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
    `Produto: ${custo.produtoNome}\n` +
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
    produtoNome: produto.nome || produto.nomePeca || produto.nomeProduto || produto.descricao || `Peca ${produto.id}`,
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
  const indiceProduto = selectProdutoCusto.value;
  const tipo = document.getElementById("tipoCusto").value;
  const descricao = document.getElementById("descricaoCusto").value.trim();
  const valorDigitado = document.getElementById("valorCusto").value;
  const data = document.getElementById("dataCusto").value;

  if (indiceProduto === "" || !tipo || !descricao || !valorDigitado || !data) {
    mensagemCusto.textContent = "Preencha produto, tipo, descricao, valor e data do custo.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  if (Number(valorDigitado) <= 0) {
    mensagemCusto.textContent = "O valor do custo deve ser maior que zero.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  const produto = produtos[Number(indiceProduto)];
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
