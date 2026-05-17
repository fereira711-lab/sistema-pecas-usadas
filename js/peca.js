const mensagemPeca = document.getElementById("mensagemPeca");
const selectOrigem = document.getElementById("origemId");
const resumoOrigemCadastro = document.getElementById("resumoOrigemCadastro");
const resumoOrigemValorTotal = document.getElementById("resumoOrigemValorTotal");
const resumoOrigemValorDistribuido = document.getElementById("resumoOrigemValorDistribuido");
const resumoOrigemValorRestante = document.getElementById("resumoOrigemValorRestante");
const resumoOrigemQuantidadeRestante = document.getElementById("resumoOrigemQuantidadeRestante");
const linkDetalhesOrigem = document.getElementById("linkDetalhesOrigem");

let origensCadastro = [];

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

function formatarCodigoOrigem(origem) {
  return origem?.codigoOrigem || `ORI-${String(origem?.id || "").padStart(6, "0")}`;
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
  resumoOrigemQuantidadeRestante.classList.remove(
    "summary-value--neutral",
    "summary-value--attention"
  );

  if (!temQuantidadeTotal) {
    resumoOrigemQuantidadeRestante.classList.add("summary-value--neutral");
    return;
  }

  if (quantidadeRestante < 0) {
    resumoOrigemQuantidadeRestante.classList.add("summary-value--attention");
  }
}

async function atualizarResumoOrigemSelecionada() {
  const origemId = Number(selectOrigem.value || 0);
  const origem = origensCadastro.find(item => Number(item.id) === origemId);

  if (!origem) {
    resumoOrigemCadastro.hidden = true;
    linkDetalhesOrigem.href = "cadastro-origem.html";
    return null;
  }

  const entradas = await carregarEntradasEstoque();
  const entradasValidas = Array.isArray(entradas) ? entradas : [];
  const entradasDaOrigem = entradasValidas.filter(entrada => Number(entrada.origemId || 0) === origemId);
  const valorTotal = Number(origem.custoTotal || origem.valorPago || 0);
  const temQuantidadeTotal = origemTemQuantidadeTotalDefinida(origem);
  const quantidadeTotal = Number(origem.quantidadeTotal || 0);
  const valorDistribuido = entradasDaOrigem.reduce((total, entrada) => total + calcularValorEntrada(entrada), 0);
  const quantidadeDistribuida = entradasDaOrigem.reduce((total, entrada) => total + Number(entrada.quantidadeTotal || 0), 0);
  const valorRestante = valorTotal - valorDistribuido;
  const quantidadeRestante = quantidadeTotal - quantidadeDistribuida;

  resumoOrigemValorTotal.textContent = formatarMoeda(valorTotal);
  resumoOrigemValorDistribuido.textContent = formatarMoeda(valorDistribuido);
  resumoOrigemValorRestante.textContent = formatarMoeda(valorRestante);
  resumoOrigemQuantidadeRestante.textContent = formatarQuantidadeRestante(quantidadeRestante, temQuantidadeTotal);
  atualizarVisualQuantidadeRestante(quantidadeRestante, temQuantidadeTotal);
  resumoOrigemCadastro.hidden = false;
  linkDetalhesOrigem.href = `detalhes-origem.html?origemId=${encodeURIComponent(origemId)}`;

  return {
    valorTotal,
    valorDistribuido,
    valorRestante,
    quantidadeTotal,
    quantidadeDistribuida,
    quantidadeRestante,
    quantidadeRestanteTexto: formatarQuantidadeRestante(quantidadeRestante, temQuantidadeTotal),
    temQuantidadeTotal
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
    dataEntrada: origem.dataCompra || obterDataLocalHoje(),
    sku: peca.sku,
    nomePeca: peca.nome,
    origemDescricao: origem.descricao || ""
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
  document.getElementById("sku").focus();
}

async function salvarPeca() {
  const peca = lerPecaDoFormulario();
  const erroValidacao = validarPeca(peca);
  const botaoSalvar = document.querySelector("button[onclick='salvarPeca()']");
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

  botaoSalvar.disabled = true;
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
    botaoSalvar.disabled = false;
  }
}

preencherSelectOrigens();
selectOrigem.addEventListener("change", atualizarResumoOrigemSelecionada);
document.getElementById("quantidade").addEventListener("input", calcularCustoTotalEntrada);
document.getElementById("custoUnitarioEntrada").addEventListener("input", calcularCustoTotalEntrada);
