const formularioProduto = document.getElementById("formProduto");
const mensagemProduto = document.getElementById("mensagemProduto");
const botaoPreencherExemplo = document.getElementById("btnPreencherExemplo");

const produtoExemplo = {
  nome: "Farol esquerdo Fiat Uno",
  sku: "FAR-UNO-001",
  categoria: "Iluminação",
  quantidade: 3,
  custo: 120,
  precoVenda: 250,
  observacoes: "Peça usada em bom estado"
};

function buscarProdutosSalvos() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function buscarOrigensSalvas() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function salvarOrigens(origens) {
  localStorage.setItem("origens", JSON.stringify(origens));
}

function garantirIdsDasOrigens(origens) {
  const origensComId = origens.map((origem, indice) => ({
    ...origem,
    id: origem.id || Date.now() + indice
  }));

  salvarOrigens(origensComId);
  return origensComId;
}

function salvarProduto(produto) {
  const produtosSalvos = buscarProdutosSalvos();
  produtosSalvos.push(produto);
  localStorage.setItem("produtos", JSON.stringify(produtosSalvos));
}

function carregarOrigensNoSelect() {
  const selectOrigem = document.getElementById("origemProduto");
  const origens = garantirIdsDasOrigens(buscarOrigensSalvas());

  selectOrigem.innerHTML = '<option value="">Selecione uma origem</option>';

  origens.forEach(origem => {
    const opcao = document.createElement("option");
    opcao.value = origem.id;
    opcao.textContent = origem.descricao;
    selectOrigem.appendChild(opcao);
  });
}

function buscarOrigemSelecionada() {
  const origemId = Number(document.getElementById("origemProduto").value);
  const origens = buscarOrigensSalvas();

  return origens.find(origem => origem.id === origemId);
}

function mostrarSucesso(mensagem) {
  mensagemProduto.textContent = mensagem;
  mensagemProduto.className = "form-message form-message--success";
}

function preencherFormularioComExemplo() {
  document.getElementById("nomeProduto").value = produtoExemplo.nome;
  document.getElementById("skuProduto").value = produtoExemplo.sku;
  document.getElementById("categoriaProduto").value = produtoExemplo.categoria;

  const primeiraOrigem = buscarOrigensSalvas()[0];
  if (primeiraOrigem) {
    document.getElementById("origemProduto").value = primeiraOrigem.id;
  }

  document.getElementById("quantidadeProduto").value = produtoExemplo.quantidade;
  document.getElementById("custoProduto").value = produtoExemplo.custo;
  document.getElementById("precoVendaProduto").value = produtoExemplo.precoVenda;
  document.getElementById("observacoesProduto").value = produtoExemplo.observacoes;

  mensagemProduto.textContent = "Formulário preenchido com exemplo. Revise e clique em Salvar Peça.";
  mensagemProduto.className = "form-message";
}

formularioProduto.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const quantidadeDigitada = document.getElementById("quantidadeProduto").value;
  const custoDigitado = document.getElementById("custoProduto").value;
  const precoVendaDigitado = document.getElementById("precoVendaProduto").value;
  const origemSelecionada = buscarOrigemSelecionada();
  const origemId = origemSelecionada ? origemSelecionada.id : 0;

  const produto = {
    id: Date.now(),
    nome: document.getElementById("nomeProduto").value.trim(),
    sku: document.getElementById("skuProduto").value.trim(),
    categoria: document.getElementById("categoriaProduto").value,
    origemId,
    origem: origemSelecionada ? origemSelecionada.descricao : "",
    quantidade: Number(quantidadeDigitada),
    custo: Number(custoDigitado),
    precoVenda: Number(precoVendaDigitado),
    observacoes: document.getElementById("observacoesProduto").value.trim()
  };

  if (
    !produto.nome ||
    !produto.categoria ||
    !produto.origemId ||
    !quantidadeDigitada ||
    !custoDigitado ||
    !precoVendaDigitado
  ) {
    mensagemProduto.textContent = "Preencha nome, categoria, origem, quantidade, custo e preço de venda.";
    mensagemProduto.className = "form-message form-message--warning";
    return;
  }

  salvarProduto(produto);

  console.log("Peça preenchida:", produto);

  mostrarSucesso("Peça cadastrada no estoque temporário.");

  alert("Peça cadastrada com sucesso.");
  formularioProduto.reset();
});

carregarOrigensNoSelect();
botaoPreencherExemplo.addEventListener("click", preencherFormularioComExemplo);
