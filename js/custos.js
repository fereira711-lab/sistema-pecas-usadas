const formularioCusto = document.getElementById("formCusto");
const selectProdutoCusto = document.getElementById("produtoCusto");
const resumoProdutoCusto = document.getElementById("resumoProdutoCusto");
const tabelaCustos = document.getElementById("tabelaCustos");
const mensagemCusto = document.getElementById("mensagemCusto");
const mensagemListaCustos = document.getElementById("mensagemListaCustos");

function buscarProdutos() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
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

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function somarCustosPorSku(sku) {
  return buscarCustos()
    .filter(custo => custo.sku === sku)
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

function carregarProdutos() {
  const produtos = buscarProdutos();

  produtos.forEach((produto, indice) => {
    const opcao = document.createElement("option");
    opcao.value = indice;
    opcao.textContent = `${produto.nome} - ${produto.sku || "sem SKU"}`;
    selectProdutoCusto.appendChild(opcao);
  });

  if (produtos.length === 0) {
    mensagemCusto.textContent = "Nenhum produto cadastrado. Cadastre uma peça antes de adicionar custos.";
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
  const custosDiversos = somarCustosPorSku(produto.sku);
  const custoTotal = custoBase + custosDiversos;

  resumoProdutoCusto.innerHTML = `
    <article class="summary-card">
      <span>Produto</span>
      <strong>${produto.nome}</strong>
    </article>
    <article class="summary-card">
      <span>SKU</span>
      <strong>${produto.sku || "-"}</strong>
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
      <td data-label="SKU">${custo.sku || "-"}</td>
      <td data-label="Tipo">${custo.tipo}</td>
      <td data-label="Descrição">${custo.descricao}</td>
      <td data-label="Valor">${formatarMoeda(custo.valor)}</td>
      <td data-label="Ações">
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
    `SKU: ${custo.sku || "-"}\n` +
    `Tipo: ${custo.tipo}\n` +
    `Descrição: ${custo.descricao}\n` +
    `Valor: ${formatarMoeda(custo.valor)}\n` +
    `Data: ${custo.data}\n` +
    `Observações: ${custo.observacoes || "-"}`
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

formularioCusto.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const produtos = buscarProdutos();
  const indiceProduto = selectProdutoCusto.value;
  const tipo = document.getElementById("tipoCusto").value;
  const descricao = document.getElementById("descricaoCusto").value.trim();
  const valorDigitado = document.getElementById("valorCusto").value;
  const data = document.getElementById("dataCusto").value;

  if (indiceProduto === "" || !tipo || !descricao || !valorDigitado || !data) {
    mensagemCusto.textContent = "Preencha produto, tipo, descrição, valor e data do custo.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  if (Number(valorDigitado) <= 0) {
    mensagemCusto.textContent = "O valor do custo deve ser maior que zero.";
    mensagemCusto.className = "form-message form-message--warning";
    return;
  }

  const produto = produtos[Number(indiceProduto)];
  const custo = {
    produtoNome: produto.nome,
    sku: produto.sku,
    tipo: tipo,
    descricao: descricao,
    valor: Number(valorDigitado),
    data: data,
    observacoes: document.getElementById("observacoesCusto").value.trim()
  };

  const custos = buscarCustos();
  custos.push(custo);
  salvarCustos(custos);

  console.log("Custo cadastrado:", custo);

  alert("Custo cadastrado com sucesso.");
  mensagemCusto.textContent = "Custo cadastrado e vinculado à peça.";
  mensagemCusto.className = "form-message form-message--success";
  formularioCusto.reset();
  renderizarResumoProduto();
  renderizarCustos();
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
