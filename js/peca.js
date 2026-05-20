const mensagemPeca = document.getElementById("mensagemPeca");
const selectOrigem = document.getElementById("origemId");
const resumoOrigemCadastro = document.getElementById("resumoOrigemCadastro");
const resumoOrigemValorTotal = document.getElementById("resumoOrigemValorTotal");
const resumoOrigemValorDistribuido = document.getElementById("resumoOrigemValorDistribuido");
const resumoOrigemValorRestante = document.getElementById("resumoOrigemValorRestante");
const resumoOrigemPecasVinculadas = document.getElementById("resumoOrigemPecasVinculadas");
const resumoOrigemSituacao = document.getElementById("resumoOrigemSituacao");
const linkDetalhesOrigem = document.getElementById("linkDetalhesOrigem");
const campoDataEntrada = document.getElementById("dataEntrada");
const previewImagemPeca = document.getElementById("previewImagemPeca");
const resumoSalvarOrigem = document.getElementById("resumoSalvarOrigem");
const resumoSalvarNome = document.getElementById("resumoSalvarNome");
const resumoSalvarSku = document.getElementById("resumoSalvarSku");
const resumoSalvarQuantidade = document.getElementById("resumoSalvarQuantidade");
const resumoSalvarCustoUnitario = document.getElementById("resumoSalvarCustoUnitario");
const resumoSalvarValorAtribuido = document.getElementById("resumoSalvarValorAtribuido");

let origensCadastro = [];
let pecasCadastro = [];

function buscarOrigensLocais() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function salvarOrigensNoCache(origens) {
  localStorage.setItem("origens", JSON.stringify(origens));
}

function buscarPecasLocais() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function salvarPecasLocais(pecas) {
  localStorage.setItem("produtos", JSON.stringify(pecas));
}

function salvarPecaNoCache(peca) {
  const pecas = buscarPecasLocais().filter(item => Number(item.id) !== Number(peca.id));
  pecas.push(peca);
  salvarPecasLocais(pecas);
}

function buscarEntradasLocais() {
  return JSON.parse(localStorage.getItem("entradasEstoque")) || [];
}

function salvarEntradasLocais(entradas) {
  localStorage.setItem("entradasEstoque", JSON.stringify(entradas));
}

function salvarEntradaNoCache(entrada) {
  const entradas = buscarEntradasLocais().filter(item => Number(item.id) !== Number(entrada.id));
  entradas.push(entrada);
  salvarEntradasLocais(entradas);
}

function mostrarMensagem(texto, tipo) {
  mensagemPeca.textContent = texto;
  mensagemPeca.className = `form-message form-message--${tipo}`;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function obterMensagemErroSupabase(erro) {
  return erro?.message || erro?.details || erro?.hint || "erro desconhecido";
}

function obterDataLocalHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterOrigemIdDaUrl() {
  const parametros = new URLSearchParams(window.location.search);
  return Number(parametros.get("origemId") || 0);
}

async function carregarOrigens() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      const origens = await window.supabaseService.listarOrigens();
      salvarOrigensNoCache(origens);
      return origens;
    } catch (erro) {
      console.error("Erro ao carregar origens do Supabase:", erro);
      return buscarOrigensLocais();
    }
  }

  return buscarOrigensLocais();
}

async function carregarEntradasEstoque() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      return await window.supabaseService.listarEntradasEstoque();
    } catch (erro) {
      console.error("Erro ao carregar entradas de estoque:", erro);
      return buscarEntradasLocais();
    }
  }

  return buscarEntradasLocais();
}

async function carregarPecas() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      const pecas = await window.supabaseService.listarPecas();
      salvarPecasLocais(pecas);
      return pecas;
    } catch (erro) {
      console.error("Erro ao carregar pecas:", erro);
      return buscarPecasLocais();
    }
  }

  return buscarPecasLocais();
}

function formatarCodigoOrigem(origem) {
  return origem?.codigoOrigem || `ORI-${String(origem?.id || "").padStart(6, "0")}`;
}

function obterTextoOrigem(origem) {
  if (!origem) {
    return "Não selecionada";
  }

  return `${formatarCodigoOrigem(origem)} - ${origem.descricao || `Origem ${origem.id}`}`;
}

async function preencherSelectOrigens() {
  origensCadastro = await carregarOrigens();
  const origemPreselecionada = obterOrigemIdDaUrl();

  selectOrigem.innerHTML = '<option value="">Selecione a origem</option>';

  origensCadastro.forEach(origem => {
    const opcao = document.createElement("option");
    opcao.value = origem.id;
    opcao.textContent = `${formatarCodigoOrigem(origem)} - ${origem.descricao || `Origem ${origem.id}`}`;
    selectOrigem.appendChild(opcao);
  });

  if (origemPreselecionada) {
    selectOrigem.value = String(origemPreselecionada);
  }

  await atualizarResumoOrigemSelecionada();
}

function lerNumeroDoCampo(id) {
  const valor = document.getElementById(id).value.trim();
  return valor === "" ? null : Number(valor);
}

function calcularCustoTotalEntrada() {
  const quantidade = lerNumeroDoCampo("quantidade");
  const custoUnitario = lerNumeroDoCampo("custoUnitarioEntrada");
  const campoCustoTotal = document.getElementById("custoTotalEntrada");

  if (quantidade === null || custoUnitario === null || !Number.isFinite(quantidade) || !Number.isFinite(custoUnitario)) {
    campoCustoTotal.value = "";
    return 0;
  }

  const custoTotal = quantidade * custoUnitario;
  campoCustoTotal.value = custoTotal.toFixed(2);
  atualizarResumoSalvarPeca();
  return custoTotal;
}

function calcularValorEntrada(entrada) {
  return Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0);
}

function origemTemQuantidadeTotalDefinida(origem) {
  const valor = origem?.quantidadeTotal;
  return valor !== undefined && valor !== null && valor !== "" && Number.isFinite(Number(valor));
}

function formatarQuantidadeRestante(quantidadeRestante, temQuantidadeTotal) {
  if (!temQuantidadeTotal) {
    return "Sem quantidade prevista";
  }

  if (quantidadeRestante < 0) {
    return "Quantidade excedida";
  }

  return String(quantidadeRestante);
}

function atualizarVisualQuantidadeRestante(quantidadeRestante, temQuantidadeTotal) {
  resumoOrigemSituacao.classList.remove(
    "summary-value--neutral",
    "summary-value--attention"
  );

  if (!temQuantidadeTotal) {
    resumoOrigemSituacao.classList.add("summary-value--neutral");
    return;
  }

  if (quantidadeRestante < 0) {
    resumoOrigemSituacao.classList.add("summary-value--attention");
  }
}

function obterSituacaoDistribuicao(valorTotal, valorDistribuido) {
  if (valorTotal <= 0) {
    return "Sem valor pago";
  }

  if (valorDistribuido > valorTotal) {
    return "Distribuição acima do previsto";
  }

  if (valorDistribuido >= valorTotal) {
    return "Distribuída";
  }

  return "Falta distribuir";
}

async function atualizarResumoOrigemSelecionada() {
  const origemId = Number(selectOrigem.value || 0);
  const origem = origensCadastro.find(item => Number(item.id) === origemId);

  if (!origem) {
    resumoOrigemCadastro.hidden = true;
    linkDetalhesOrigem.href = "cadastro-origem.html";
    atualizarResumoSalvarPeca();
    return null;
  }

  const [entradas, pecas] = await Promise.all([
    carregarEntradasEstoque(),
    carregarPecas()
  ]);
  const entradasValidas = Array.isArray(entradas) ? entradas : [];
  const pecasValidas = Array.isArray(pecas) ? pecas : [];
  const entradasDaOrigem = entradasValidas.filter(entrada => Number(entrada.origemId || 0) === origemId);
  const pecasDaOrigem = pecasValidas.filter(peca => Number(peca.origemId || 0) === origemId);
  const valorTotal = Number(origem.custoTotal || origem.valorPago || 0);
  const temQuantidadeTotal = origemTemQuantidadeTotalDefinida(origem);
  const quantidadeTotal = Number(origem.quantidadeTotal || 0);
  const valorDistribuido = entradasDaOrigem.reduce((total, entrada) => total + calcularValorEntrada(entrada), 0);
  const quantidadeDistribuida = entradasDaOrigem.reduce((total, entrada) => total + Number(entrada.quantidadeTotal || 0), 0);
  const valorRestante = valorTotal - valorDistribuido;
  const quantidadeRestante = quantidadeTotal - quantidadeDistribuida;
  const situacaoDistribuicao = obterSituacaoDistribuicao(valorTotal, valorDistribuido);

  resumoOrigemValorTotal.textContent = formatarMoeda(valorTotal);
  resumoOrigemValorDistribuido.textContent = formatarMoeda(valorDistribuido);
  resumoOrigemValorRestante.textContent = formatarMoeda(valorRestante);
  resumoOrigemPecasVinculadas.textContent = String(pecasDaOrigem.length);
  resumoOrigemSituacao.textContent = situacaoDistribuicao;
  atualizarVisualQuantidadeRestante(quantidadeRestante, temQuantidadeTotal);
  resumoOrigemCadastro.hidden = false;
  linkDetalhesOrigem.href = `detalhes-origem.html?origemId=${encodeURIComponent(origemId)}`;
  atualizarResumoSalvarPeca();

  return {
    valorTotal,
    valorDistribuido,
    valorRestante,
    quantidadeTotal,
    quantidadeDistribuida,
    quantidadeRestante,
    quantidadeRestanteTexto: formatarQuantidadeRestante(quantidadeRestante, temQuantidadeTotal),
    temQuantidadeTotal,
    situacaoDistribuicao
  };
}

function lerPecaDoFormulario() {
  const quantidade = lerNumeroDoCampo("quantidade");
  const custoUnitario = lerNumeroDoCampo("custoUnitarioEntrada");
  const valorAtribuidoEntrada = Number(quantidade || 0) * Number(custoUnitario || 0);

  return {
    id: Date.now(),
    nome: document.getElementById("nome").value.trim(),
    sku: document.getElementById("sku").value.trim().toUpperCase(),
    quantidade,
    custoUnitarioEntrada: custoUnitario,
    valorAtribuidoEntrada,
    quantidadeVendida: 0,
    custo: 0,
    custoTotal: 0,
    tipoCusto: "rateado",
    precoVenda: 0,
    origemId: Number(document.getElementById("origemId").value),
    imagemUrl: "",
    status: "em_estoque",
    observacoes: document.getElementById("observacoesPeca").value.trim()
  };
}

function obterArquivoImagemPeca() {
  return document.getElementById("imagemPeca")?.files?.[0] || null;
}

function validarArquivoImagem(arquivo) {
  if (!arquivo) {
    return "";
  }

  if (!arquivo.type.startsWith("image/")) {
    return "Selecione um arquivo de imagem valido.";
  }

  if (!(window.supabaseService && window.supabaseService.estaConfigurado())) {
    return "Configure o Supabase antes de enviar imagem da peca.";
  }

  return "";
}

function validarPeca(peca) {
  if (!peca.origemId) {
    return "Selecione a origem da peca.";
  }

  if (!peca.nome) {
    return "Informe o nome da peca.";
  }

  if (!peca.sku) {
    return "Informe o SKU da peca.";
  }

  if (!Number.isFinite(peca.quantidade) || peca.quantidade < 1) {
    return "A quantidade deve ser maior ou igual a 1.";
  }

  if (!Number.isInteger(peca.quantidade)) {
    return "A quantidade deve ser um numero inteiro.";
  }

  if (!Number.isFinite(peca.custoUnitarioEntrada) || peca.custoUnitarioEntrada < 0) {
    return "Informe um custo unitario maior ou igual a zero.";
  }

  if (!Number.isFinite(peca.valorAtribuidoEntrada) || peca.valorAtribuidoEntrada < 0) {
    return "O custo total calculado deve ser maior ou igual a zero.";
  }

  return "";
}

function montarEntradaEstoque(peca, origem, quantidade, custoUnitario) {
  return {
    id: Date.now(),
    pecaId: Number(peca.id),
    origemId: Number(origem.id),
    quantidadeTotal: quantidade,
    quantidadeConsumida: 0,
    custoUnitario,
    dataEntrada: campoDataEntrada?.value || obterDataLocalHoje(),
    sku: peca.sku,
    nomePeca: peca.nome,
    origemDescricao: origem.descricao || "",
    observacoes: document.getElementById("observacoesEntrada")?.value.trim() || ""
  };
}

function limparCamposDaPeca() {
  document.getElementById("nome").value = "";
  document.getElementById("sku").value = "";
  document.getElementById("imagemPeca").value = "";
  document.getElementById("quantidade").value = "";
  document.getElementById("custoUnitarioEntrada").value = "";
  document.getElementById("custoTotalEntrada").value = "";
  document.getElementById("observacoesPeca").value = "";
  document.getElementById("observacoesEntrada").value = "";
  preencherDataEntradaPadrao();
  atualizarPreviewImagemPeca();
  atualizarResumoSalvarPeca();
  document.getElementById("sku").focus();
}

function preencherDataEntradaPadrao() {
  if (campoDataEntrada) {
    campoDataEntrada.value = obterDataLocalHoje();
  }
}

function atualizarPreviewImagemPeca() {
  const arquivo = obterArquivoImagemPeca();

  if (!previewImagemPeca) {
    return;
  }

  if (!arquivo) {
    previewImagemPeca.innerHTML = "<span>Prévia</span><strong>Imagem da peça</strong>";
    return;
  }

  const urlImagem = URL.createObjectURL(arquivo);
  previewImagemPeca.innerHTML = `<img src="${urlImagem}" alt="Prévia da imagem selecionada">`;
}

function atualizarResumoSalvarPeca() {
  const origemId = Number(selectOrigem.value || 0);
  const origem = origensCadastro.find(item => Number(item.id) === origemId);
  const nome = document.getElementById("nome").value.trim();
  const sku = document.getElementById("sku").value.trim().toUpperCase();
  const quantidade = lerNumeroDoCampo("quantidade") || 0;
  const custoUnitario = lerNumeroDoCampo("custoUnitarioEntrada") || 0;
  const valorAtribuido = Number(quantidade || 0) * Number(custoUnitario || 0);

  resumoSalvarOrigem.textContent = obterTextoOrigem(origem);
  resumoSalvarNome.textContent = nome || "Não informado";
  resumoSalvarSku.textContent = sku || "Não informado";
  resumoSalvarQuantidade.textContent = String(quantidade || 0);
  resumoSalvarCustoUnitario.textContent = formatarMoeda(custoUnitario);
  resumoSalvarValorAtribuido.textContent = formatarMoeda(valorAtribuido);
}

function definirBotoesSalvando(salvando) {
  [
    document.getElementById("btnSalvarPeca"),
    document.getElementById("btnSalvarOutraPeca")
  ].forEach(botao => {
    if (botao) {
      botao.disabled = salvando;
    }
  });
}

async function salvarPeca() {
  const peca = lerPecaDoFormulario();
  const erroValidacao = validarPeca(peca);
  const arquivoImagem = obterArquivoImagemPeca();

  if (erroValidacao) {
    mostrarMensagem(erroValidacao, "warning");
    return;
  }

  const erroImagem = validarArquivoImagem(arquivoImagem);

  if (erroImagem) {
    mostrarMensagem(erroImagem, "warning");
    return;
  }

  if (origensCadastro.length === 0) {
    origensCadastro = await carregarOrigens();
  }

  const origemSelecionada = origensCadastro.find(origem => Number(origem.id) === Number(peca.origemId));

  if (!origemSelecionada) {
    mostrarMensagem("A origem selecionada nao foi encontrada.", "warning");
    return;
  }

  definirBotoesSalvando(true);
  mostrarMensagem("Salvando peca...", "success");

  try {
    const quantidadeEntrada = Number(peca.quantidade || 0);
    const valorAtribuidoEntrada = Number(peca.valorAtribuidoEntrada || 0);
    const custoUnitario = Number(peca.custoUnitarioEntrada || 0);
    let pecaSalva = {
      ...peca,
      quantidade: 0,
      custo: custoUnitario,
      custoTotal: custoUnitario
    };

    if (arquivoImagem && window.supabaseService && window.supabaseService.estaConfigurado()) {
      pecaSalva.imagemUrl = await window.supabaseService.uploadImagemPeca(arquivoImagem, peca);
    }

    if (window.supabaseService && window.supabaseService.estaConfigurado()) {
      const resultado = await window.supabaseService.criarPecaComEntrada({
        ...pecaSalva,
        quantidade: quantidadeEntrada,
        valorAtribuidoEntrada,
        tipoCusto: "rateado",
        status: "em_estoque"
      });
      const pecaAtualizada = resultado.peca;
      const entradaSalva = resultado.entrada;

      salvarEntradaNoCache(entradaSalva);
      salvarPecaNoCache(pecaAtualizada);
    } else {
      const pecaLocal = {
        ...peca,
        custo: custoUnitario,
        custoTotal: custoUnitario
      };
      const entradaLocal = montarEntradaEstoque(pecaLocal, origemSelecionada, quantidadeEntrada, custoUnitario);

      salvarPecaNoCache(pecaLocal);
      salvarEntradaNoCache(entradaLocal);
    }

    pecasCadastro = await carregarPecas();
    limparCamposDaPeca();
    const resumoAtualizado = await atualizarResumoOrigemSelecionada();
    const complementoQuantidade = resumoAtualizado
      ? ` Quantidade da origem: ${resumoAtualizado.quantidadeRestanteTexto}.`
      : "";

    mostrarMensagem(`Peca cadastrada com sucesso.${complementoQuantidade} Voce pode cadastrar outra peca para a mesma origem.`, "success");
  } catch (erro) {
    console.error("Erro ao cadastrar peca:", erro);
    mostrarMensagem(`Nao foi possivel salvar a peca: ${obterMensagemErroSupabase(erro)}`, "warning");
  } finally {
    definirBotoesSalvando(false);
  }
}

preencherDataEntradaPadrao();
preencherSelectOrigens();
selectOrigem.addEventListener("change", atualizarResumoOrigemSelecionada);
document.getElementById("quantidade").addEventListener("input", calcularCustoTotalEntrada);
document.getElementById("custoUnitarioEntrada").addEventListener("input", calcularCustoTotalEntrada);
["nome", "sku", "observacoesPeca", "observacoesEntrada"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", atualizarResumoSalvarPeca);
});
document.getElementById("imagemPeca")?.addEventListener("change", atualizarPreviewImagemPeca);
