const TIPOS_CUSTO_PECA = ["real", "rateado", "simbolico"];

function buscarOrigensLocais() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function salvarOrigensNoCache(origens) {
  localStorage.setItem("origens", JSON.stringify(origens));
}

function buscarPecasLocais() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function salvarPecaLocal(peca) {
  const pecas = buscarPecasLocais();
  pecas.push(peca);
  localStorage.setItem("produtos", JSON.stringify(pecas));
}

function salvarPecaNoCache(peca) {
  const pecas = buscarPecasLocais().filter(item => Number(item.id) !== Number(peca.id));
  pecas.push(peca);
  localStorage.setItem("produtos", JSON.stringify(pecas));
}

function obterMensagemErroSupabase(erro) {
  return erro?.message || erro?.details || erro?.hint || "erro desconhecido";
}

async function carregarOrigens() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      const origens = await window.supabaseService.listarOrigens();
      salvarOrigensNoCache(origens);
      return origens;
    } catch (erro) {
      console.error("Erro ao carregar origens do Supabase:", erro);
      alert(`Nao foi possivel carregar as origens do Supabase: ${obterMensagemErroSupabase(erro)}`);
      return [];
    }
  }

  return buscarOrigensLocais();
}

async function preencherSelectOrigens() {
  const selectOrigem = document.getElementById("origemId");
  const origens = await carregarOrigens();

  selectOrigem.innerHTML = '<option value="">Selecione a origem</option>';

  origens.forEach(origem => {
    const opcao = document.createElement("option");
    opcao.value = origem.id;
    opcao.textContent = origem.descricao;
    selectOrigem.appendChild(opcao);
  });
}

function lerPecaDoFormulario() {
  const custoDigitado = document.getElementById("custo").value;
  const precoDigitado = document.getElementById("preco").value;
  const quantidade = Number(document.getElementById("quantidade").value);
  const tipoCusto = document.getElementById("tipoCusto").value;

  return {
    id: Date.now(),
    nome: document.getElementById("nome").value.trim(),
    sku: document.getElementById("sku").value.trim().toUpperCase(),
    precoVenda: Number(precoDigitado || 0),
    quantidade,
    quantidadeVendida: 0,
    custo: Number(custoDigitado || 0),
    custoTotal: Number(custoDigitado || 0),
    tipoCusto,
    origemId: Number(document.getElementById("origemId").value),
    status: "em_estoque"
  };
}

function validarPeca(peca) {
  if (!peca.nome) {
    return "Informe o nome da peca.";
  }

  if (!peca.sku) {
    return "Informe o SKU da peca. Ele sera usado para somar entradas de estoque.";
  }

  if (!peca.origemId) {
    return "Selecione a origem da peca.";
  }

  if (!peca.quantidade || peca.quantidade < 1) {
    return "A quantidade deve ser maior ou igual a 1.";
  }

  if (!TIPOS_CUSTO_PECA.includes(peca.tipoCusto)) {
    return "Selecione um tipo de custo valido.";
  }

  return "";
}

async function salvarPeca() {
  const peca = lerPecaDoFormulario();
  const erroValidacao = validarPeca(peca);
  const botaoSalvar = document.querySelector("button[onclick='salvarPeca()']");

  if (erroValidacao) {
    alert(erroValidacao);
    return;
  }

  botaoSalvar.disabled = true;

  try {
    const pecaSalva = window.supabaseService && window.supabaseService.estaConfigurado()
      ? await window.supabaseService.salvarPeca(peca)
      : null;

    if (pecaSalva) {
      salvarPecaNoCache(pecaSalva);
      alert("Peca cadastrada no Supabase com sucesso.");
    } else {
      salvarPecaLocal(peca);
      alert("Peca cadastrada no armazenamento temporario. Configure o Supabase para salvar no banco.");
    }

    window.location.href = "produtos.html";
  } catch (erro) {
    console.error("Erro ao cadastrar peca:", erro);
    alert(`Nao foi possivel salvar a peca no Supabase: ${obterMensagemErroSupabase(erro)}`);
  } finally {
    botaoSalvar.disabled = false;
  }
}

preencherSelectOrigens();
