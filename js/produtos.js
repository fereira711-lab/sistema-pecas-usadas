const formularioProduto = document.getElementById("formProduto");
const mensagemProduto = document.getElementById("mensagemProduto");
const botaoPreencherExemplo = document.getElementById("btnPreencherExemplo");

const TIPOS_CUSTO_PECA = ["real", "rateado", "simbolico"];
const TIPO_CUSTO_PADRAO = "real";

let origensCarregadas = [];

const produtoExemplo = {
  nome: "Farol esquerdo Fiat Uno",
  sku: "FAR-UNO-001",
  categoria: "Motor",
  quantidade: 3,
  custo: 120,
  tipoCusto: TIPO_CUSTO_PADRAO,
  precoVenda: 250,
  observacoes: "Peca usada em bom estado"
};

function normalizarTipoCusto(tipoCusto) {
  return TIPOS_CUSTO_PECA.includes(tipoCusto) ? tipoCusto : TIPO_CUSTO_PADRAO;
}

function normalizarProduto(produto) {
  const quantidade = Number(produto.quantidade || 1);
  const quantidadeVendida = Number(produto.quantidadeVendida || 0);
  const quantidadeDisponivel = Math.max(quantidade - quantidadeVendida, 0);

  return {
    ...produto,
    quantidade,
    quantidadeVendida,
    status: quantidadeDisponivel <= 0 ? "vendida" : "em_estoque",
    origemId: Number(produto.origemId || 0),
    tipoCusto: normalizarTipoCusto(produto.tipoCusto)
  };
}

function buscarProdutosSalvos() {
  const produtos = JSON.parse(localStorage.getItem("produtos")) || [];
  const produtosNormalizados = produtos.map(normalizarProduto);

  localStorage.setItem("produtos", JSON.stringify(produtosNormalizados));
  return produtosNormalizados;
}

function buscarOrigensSalvas() {
  if (origensCarregadas.length > 0) {
    return origensCarregadas;
  }

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
  produtosSalvos.push(normalizarProduto(produto));
  localStorage.setItem("produtos", JSON.stringify(produtosSalvos));
}

function salvarProdutoNoCache(produto) {
  const produtosSalvos = buscarProdutosSalvos().filter(item => Number(item.id) !== Number(produto.id));
  produtosSalvos.push(normalizarProduto(produto));
  localStorage.setItem("produtos", JSON.stringify(produtosSalvos));
}

async function carregarOrigensNoSelect() {
  const selectOrigem = document.getElementById("origemProduto");
  let origens = buscarOrigensSalvas();

  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      origens = await window.supabaseService.listarOrigens();
      salvarOrigens(origens);
    } catch (erro) {
      console.error("Erro ao carregar origens do Supabase:", erro);
      mensagemProduto.textContent = "Nao foi possivel carregar origens do Supabase. Usando dados temporarios do navegador.";
      mensagemProduto.className = "form-message form-message--warning";
    }
  }

  origens = garantirIdsDasOrigens(origens);
  origensCarregadas = origens;
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

  return origens.find(origem => Number(origem.id) === origemId);
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

  mensagemProduto.textContent = "Formulario preenchido com exemplo. Revise e clique em Salvar Peca.";
  mensagemProduto.className = "form-message";
}

formularioProduto.addEventListener("submit", async function (evento) {
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
    quantidadeVendida: 0,
    status: "em_estoque",
    custo: Number(custoDigitado),
    tipoCusto: TIPO_CUSTO_PADRAO,
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
    mensagemProduto.textContent = "Preencha nome, categoria, origem, quantidade, custo e preco de venda.";
    mensagemProduto.className = "form-message form-message--warning";
    return;
  }

  const botaoSalvar = formularioProduto.querySelector("button[type='submit']");
  botaoSalvar.disabled = true;

  try {
    const produtoSalvo = window.supabaseService && window.supabaseService.estaConfigurado()
      ? await window.supabaseService.salvarPeca(produto)
      : null;

    if (produtoSalvo) {
      salvarProdutoNoCache(produtoSalvo);
      console.log("Peca cadastrada no Supabase:", produtoSalvo);
      mostrarSucesso("Peca cadastrada no Supabase.");
    } else {
      salvarProduto(produto);
      console.log("Peca cadastrada no armazenamento temporario:", produto);
      mostrarSucesso("Peca cadastrada no estoque temporario. Configure o Supabase para salvar no banco.");
    }

    alert("Peca cadastrada com sucesso.");
    formularioProduto.reset();
  } catch (erro) {
    console.error("Erro ao cadastrar peca:", erro);
    mensagemProduto.textContent = "Nao foi possivel salvar a peca no Supabase. Verifique a configuracao e se a origem existe no banco.";
    mensagemProduto.className = "form-message form-message--warning";
  } finally {
    botaoSalvar.disabled = false;
  }
});

carregarOrigensNoSelect();
botaoPreencherExemplo.addEventListener("click", preencherFormularioComExemplo);
