const formularioOrigem = document.getElementById("formOrigem");
const mensagemFormulario = document.getElementById("mensagemFormulario");
const campoProdutoSku = document.getElementById("produtoSku");
const campoNomePeca = document.getElementById("nomePeca");
const sugestoesSkuOrigem = document.getElementById("sugestoesSkuOrigem");
const sugestoesNomeOrigem = document.getElementById("sugestoesNomeOrigem");
let pecasOrigemCarregadas = [];
let pecaSelecionadaOrigem = null;

function mostrarMensagem(mensagem, tipo) {
  mensagemFormulario.textContent = mensagem;
  mensagemFormulario.className = `form-message form-message--${tipo}`;
}

function normalizarSku(sku) {
  return String(sku || "").trim().toUpperCase();
}

function normalizarTexto(texto) {
  return String(texto || "").trim().toLowerCase();
}

function escaparHtml(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function obterMensagemErroSupabase(erro) {
  return erro?.message || erro?.details || erro?.hint || "erro desconhecido";
}

function formatarNomePeca(peca) {
  const nome = peca.nome || peca.nomePeca || peca.nome_peca || peca.descricao || `Peca ${peca.id}`;
  const sku = String(peca.sku || "").trim();

  return sku ? `${sku} - ${nome}` : nome;
}

function calcularQuantidadeDisponivel(peca) {
  return Math.max(Number(peca.quantidade || 0) - Number(peca.quantidadeVendida || 0), 0);
}

function fecharSugestoesOrigem() {
  sugestoesSkuOrigem.innerHTML = "";
  sugestoesNomeOrigem.innerHTML = "";
  sugestoesSkuOrigem.classList.remove("is-open");
  sugestoesNomeOrigem.classList.remove("is-open");
}

function selecionarPecaSugerida(peca) {
  pecaSelecionadaOrigem = peca;
  campoProdutoSku.value = normalizarSku(peca.sku);
  campoNomePeca.value = peca.nome || peca.nomePeca || peca.nome_peca || "";
  fecharSugestoesOrigem();
  mostrarMensagem("Produto existente selecionado. A entrada sera vinculada a ele.", "success");
}

function filtrarPecasPorTermo(termoDigitado) {
  const termo = normalizarTexto(termoDigitado);

  if (!termo) {
    return [];
  }

  return pecasOrigemCarregadas
    .filter(peca => {
      const nome = normalizarTexto(peca.nome || peca.nomePeca || peca.nome_peca);
      const sku = normalizarTexto(peca.sku);

      return nome.includes(termo) || sku.includes(termo);
    })
    .slice(0, 6);
}

function renderizarSugestoesOrigem(campo, lista) {
  const pecas = filtrarPecasPorTermo(campo.value);

  sugestoesSkuOrigem.innerHTML = "";
  sugestoesNomeOrigem.innerHTML = "";
  sugestoesSkuOrigem.classList.remove("is-open");
  sugestoesNomeOrigem.classList.remove("is-open");

  if (!String(campo.value || "").trim()) {
    return;
  }

  if (pecas.length === 0) {
    const item = document.createElement("div");
    item.className = "autocomplete-option";
    item.textContent = "Nenhum produto encontrado";
    lista.appendChild(item);
    lista.classList.add("is-open");
    return;
  }

  pecas.forEach(peca => {
    const botao = document.createElement("button");
    const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);

    botao.type = "button";
    botao.className = "autocomplete-option";
    botao.innerHTML = `
      <span>${escaparHtml(formatarNomePeca(peca))}</span>
      <span class="autocomplete-option__meta">${quantidadeDisponivel} em estoque</span>
    `;
    botao.addEventListener("click", () => selecionarPecaSugerida(peca));

    lista.appendChild(botao);
  });

  lista.classList.add("is-open");
}

function lerOrigemDoFormulario() {
  const valorPagoDigitado = document.getElementById("valorPago").value;
  const quantidadeDigitada = document.getElementById("quantidadeTotal").value;
  const produtoSku = normalizarSku(campoProdutoSku.value);

  return {
    tipo: document.getElementById("tipoOrigem").value,
    descricao: document.getElementById("descricaoOrigem").value.trim(),
    produtoSku,
    nomePeca: campoNomePeca.value.trim(),
    quantidadeTotal: Number(quantidadeDigitada),
    valorPago: Number(valorPagoDigitado),
    custoTotal: Number(valorPagoDigitado),
    custoTipo: "compra",
    dataCompra: document.getElementById("dataCompra").value,
    observacoes: document.getElementById("observacoes").value.trim()
  };
}

function validarOrigem(origem) {
  if (!origem.tipo || !origem.descricao || !origem.dataCompra) {
    return "Preencha tipo, descricao e data da compra.";
  }

  if (!origem.produtoSku) {
    return "Informe o SKU do produto que recebera esta entrada.";
  }

  if (!origem.nomePeca) {
    return "Informe o nome da peca.";
  }

  if (!origem.quantidadeTotal || origem.quantidadeTotal < 1) {
    return "A quantidade da entrada deve ser maior ou igual a 1.";
  }

  if (!Number.isFinite(origem.valorPago) || origem.valorPago < 0) {
    return "Informe um valor pago valido.";
  }

  return "";
}

function encontrarPecaPorSku(pecas, sku) {
  const skuNormalizado = normalizarSku(sku);

  return pecas.find(peca => normalizarSku(peca.sku) === skuNormalizado);
}

async function atualizarEstoqueDoProduto(peca, origem) {
  const quantidadeAtualizada = Number(peca.quantidade || 0) + Number(origem.quantidadeTotal || 0);
  const pecaAtualizada = {
    ...peca,
    quantidade: quantidadeAtualizada,
    status: Number(peca.quantidadeVendida || 0) >= quantidadeAtualizada ? "vendida" : "em_estoque"
  };

  return window.supabaseService.atualizarPeca(pecaAtualizada);
}

function montarNovaPeca(origem, origemSalva) {
  return {
    nome: origem.nomePeca,
    sku: origem.produtoSku,
    quantidade: 0,
    quantidadeVendida: 0,
    custo: 0,
    custoTotal: 0,
    tipoCusto: "real",
    precoVenda: 0,
    origemId: origemSalva.id,
    status: "em_estoque",
    observacoes: `Criada automaticamente pela entrada ${origem.descricao}.`
  };
}

async function buscarProdutoExistenteDaEntrada(origem) {
  if (pecaSelecionadaOrigem && normalizarSku(pecaSelecionadaOrigem.sku) === normalizarSku(origem.produtoSku)) {
    return pecaSelecionadaOrigem;
  }

  const pecas = pecasOrigemCarregadas.length > 0
    ? pecasOrigemCarregadas
    : await carregarPecasParaOrigem();

  return encontrarPecaPorSku(pecas, origem.produtoSku);
}

async function carregarPecasParaOrigem() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    pecasOrigemCarregadas = [];
    return pecasOrigemCarregadas;
  }

  try {
    pecasOrigemCarregadas = await window.supabaseService.listarPecas();
  } catch (erro) {
    console.error("Erro ao carregar produtos para sugestoes da origem:", erro);
    pecasOrigemCarregadas = [];
  }

  return pecasOrigemCarregadas;
}

async function obterProdutoDaEntrada(origem, origemSalva, pecaExistente) {
  if (pecaExistente) {
    return pecaExistente;
  }

  return window.supabaseService.salvarPeca(montarNovaPeca(origem, origemSalva));
}

function montarEntradaFifo(peca, origem) {
  const quantidadeTotal = Number(origem.quantidadeTotal || 0);
  const valorTotal = Number(origem.valorPago || origem.custoTotal || 0);

  return {
    pecaId: peca.id,
    origemId: origem.id,
    quantidadeTotal,
    quantidadeConsumida: 0,
    custoUnitario: quantidadeTotal > 0 ? valorTotal / quantidadeTotal : 0,
    dataEntrada: origem.dataCompra || origem.dataEntrada || new Date().toISOString().slice(0, 10)
  };
}

campoProdutoSku.addEventListener("input", () => {
  pecaSelecionadaOrigem = null;
  renderizarSugestoesOrigem(campoProdutoSku, sugestoesSkuOrigem);
});

campoNomePeca.addEventListener("input", () => {
  pecaSelecionadaOrigem = null;
  renderizarSugestoesOrigem(campoNomePeca, sugestoesNomeOrigem);
});

campoProdutoSku.addEventListener("focus", () => {
  if (campoProdutoSku.value.trim()) {
    renderizarSugestoesOrigem(campoProdutoSku, sugestoesSkuOrigem);
  }
});

campoNomePeca.addEventListener("focus", () => {
  if (campoNomePeca.value.trim()) {
    renderizarSugestoesOrigem(campoNomePeca, sugestoesNomeOrigem);
  }
});

document.addEventListener("click", event => {
  const clicouNoAutocomplete = event.target.closest("#produtoSku, #nomePeca, #sugestoesSkuOrigem, #sugestoesNomeOrigem");

  if (!clicouNoAutocomplete) {
    fecharSugestoesOrigem();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    fecharSugestoesOrigem();
  }
});

formularioOrigem.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const origem = lerOrigemDoFormulario();
  const erroValidacao = validarOrigem(origem);

  if (erroValidacao) {
    mostrarMensagem(erroValidacao, "warning");
    return;
  }

  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mostrarMensagem("Configure o Supabase para salvar entradas reais de estoque.", "warning");
    return;
  }

  const botaoSalvar = formularioOrigem.querySelector("button[type='submit']");
  botaoSalvar.disabled = true;

  try {
    const pecaExistente = await buscarProdutoExistenteDaEntrada(origem);
    const origemSalva = await window.supabaseService.salvarOrigem(origem);
    const peca = await obterProdutoDaEntrada(origem, origemSalva, pecaExistente);
    const entradaFifo = await window.supabaseService.salvarEntradaEstoque(montarEntradaFifo(peca, origemSalva));
    const pecaAtualizada = await atualizarEstoqueDoProduto(peca, origemSalva);

    console.log("Entrada cadastrada no Supabase:", origemSalva);
    console.log("Entrada FIFO cadastrada:", entradaFifo);
    console.log("Estoque atualizado:", pecaAtualizada);
    mostrarMensagem("Entrada cadastrada, FIFO gerado e estoque atualizado.", "success");
    alert("Entrada de estoque cadastrada com sucesso.");
    formularioOrigem.reset();
    pecaSelecionadaOrigem = null;
    fecharSugestoesOrigem();
    await carregarPecasParaOrigem();
  } catch (erro) {
    console.error("Erro ao cadastrar entrada de estoque:", erro);
    mostrarMensagem(`Nao foi possivel salvar a entrada: ${obterMensagemErroSupabase(erro)}`, "warning");
  } finally {
    botaoSalvar.disabled = false;
  }
});

carregarPecasParaOrigem();
