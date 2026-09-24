// Nova peça (redesenho, seção 7 da especificação): origem com a barra de distribuição, dados da peça
// (com compatibilidade e SKU automático quando em branco), estoque e custo, foto e resumo lateral
// com margem e lucro previstos e quanto a origem fica a distribuir depois.
// A peça continua nascendo pela função criar_peca_com_entrada (peça + entrada de estoque juntas).
const formNovaPeca = document.getElementById("formNovaPeca");
const mensagemPeca = document.getElementById("mensagemPeca");
const selectOrigem = document.getElementById("origemId");
const campoNome = document.getElementById("nome");
const campoSku = document.getElementById("sku");
const campoCompatibilidade = document.getElementById("compatibilidade");
const campoPreco = document.getElementById("precoVenda");
const campoObservacoes = document.getElementById("observacoesPeca");
const campoQuantidade = document.getElementById("quantidade");
const campoCustoUnitario = document.getElementById("custoUnitarioEntrada");
const campoValorAtribuido = document.getElementById("custoTotalEntrada");
const campoDataEntrada = document.getElementById("dataEntrada");
const campoImagem = document.getElementById("imagemPeca");
const areaFoto = document.getElementById("areaFoto");
const previewImagemPeca = document.getElementById("previewImagemPeca");
const fotoTitulo = document.getElementById("fotoTitulo");
const botaoSalvar = document.getElementById("btnSalvarPeca");
const botaoSalvarOutra = document.getElementById("btnSalvarOutraPeca");

const distribuicaoOrigem = document.getElementById("distribuicaoOrigem");
const distribuicaoTexto = document.getElementById("distribuicaoTexto");
const distribuicaoFalta = document.getElementById("distribuicaoFalta");
const distribuicaoBarra = document.getElementById("distribuicaoBarra");
const distribuicaoPreenchimento = document.getElementById("distribuicaoPreenchimento");

const resumoOrigem = document.getElementById("resumoOrigem");
const resumoQuantidade = document.getElementById("resumoQuantidade");
const resumoCusto = document.getElementById("resumoCusto");
const resumoPreco = document.getElementById("resumoPreco");
const resumoMargemLinha = document.getElementById("resumoMargemLinha");
const resumoMargem = document.getElementById("resumoMargem");
const resumoLucroRotulo = document.getElementById("resumoLucroRotulo");
const resumoLucro = document.getElementById("resumoLucro");
const resumoRestanteOrigem = document.getElementById("resumoRestanteOrigem");

let origensCadastro = [];
let entradasCadastro = [];
let arquivoImagemSelecionado = null;
let salvando = false;

// ---- Formatação ----

function formatarMoeda(valor) {
  if (window.moedaUtils?.formatarMoedaBR) return window.moedaUtils.formatarMoedaBR(Number(valor || 0));
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarPercentualInteiro(valor) {
  if (window.moedaUtils?.formatarPercentualBR) return window.moedaUtils.formatarPercentualBR(valor, 0);
  return `${Math.round(Number(valor || 0))}%`;
}

function formatarData(valor) {
  const [ano, mes, dia] = String(valor || "").slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : "—";
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function lerMoeda(campo) {
  const texto = String(campo?.value || "").trim();
  if (!texto) return null;
  const valor = window.moedaUtils?.parseMoedaBR ? window.moedaUtils.parseMoedaBR(texto) : Number(texto.replace(",", "."));
  return Number.isFinite(valor) ? valor : NaN;
}

function lerQuantidade() {
  const texto = String(campoQuantidade.value || "").trim();
  return texto === "" ? null : Number(texto);
}

function mostrarMensagem(texto, tipo = "warning") {
  mensagemPeca.textContent = texto;
  mensagemPeca.classList.toggle("page-message--success", tipo === "success");
}

// ---- Cálculos da prévia (sem tocar no DOM, para poder testar) ----

// Distribuição da origem: quanto do valor pago já virou custo de peças (entradas de estoque).
function calcularDistribuicaoOrigem(origem, entradas) {
  const valorPago = Number(origem?.valorPago || origem?.custoTotal || 0);
  const valorDistribuido = (entradas || [])
    .filter(entrada => Number(entrada.origemId || 0) === Number(origem?.id))
    .reduce((total, entrada) => total + Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0), 0);

  return { valorPago, valorDistribuido, restante: valorPago - valorDistribuido };
}

// Prévia do resumo lateral: valor atribuído, margem e lucro previstos pelo preço cadastrado
// e quanto a origem fica a distribuir depois desta peça. Margem pela mesma regra de Produtos.
function calcularPreviaPeca({ quantidade, custoUnitario, preco, distribuicao }) {
  const qtd = Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 0;
  const custo = Number.isFinite(custoUnitario) && custoUnitario >= 0 ? custoUnitario : null;
  const precoValido = Number.isFinite(preco) && preco > 0 ? preco : null;
  const valorAtribuido = custo === null ? 0 : qtd * custo;
  const margem = precoValido !== null && custo !== null
    ? (window.financeiroUtils?.calcularMargemPreco
      ? window.financeiroUtils.calcularMargemPreco(precoValido, custo)
      : ((precoValido - custo) / precoValido) * 100)
    : null;

  return {
    valorAtribuido,
    margem,
    lucro: margem === null ? null : (precoValido - custo) * qtd,
    restanteDepois: distribuicao ? distribuicao.restante - valorAtribuido : null
  };
}

// ---- Carga ----

function obterOrigemSelecionada() {
  return origensCadastro.find(origem => Number(origem.id) === Number(selectOrigem.value || 0)) || null;
}

function textoOrigem(origem) {
  return `${origem.descricao || `Origem ${origem.id}`} · ${origem.codigoOrigem || `ORI-${String(origem.id).padStart(6, "0")}`}`;
}

async function carregarDados() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mostrarMensagem("Configure o Supabase para cadastrar peças.");
    return false;
  }

  try {
    const [origens, entradas] = await Promise.all([
      window.supabaseService.listarOrigens(),
      window.supabaseService.listarEntradasEstoque()
    ]);

    // Mais recentes primeiro: quem está cadastrando costuma usar a origem que acabou de chegar.
    origensCadastro = (origens || []).slice().sort((a, b) =>
      String(b.dataCompra || "").localeCompare(String(a.dataCompra || "")) || Number(b.id) - Number(a.id));
    entradasCadastro = entradas || [];
    return true;
  } catch (erro) {
    console.error("Erro ao carregar origens:", erro);
    mostrarMensagem("Não foi possível carregar as origens do Supabase.");
    return false;
  }
}

function preencherOrigens() {
  const preSelecionada = Number(new URLSearchParams(window.location.search).get("origemId") || 0);

  selectOrigem.innerHTML = '<option value="">Selecione a origem</option>' + origensCadastro
    .map(origem => `<option value="${origem.id}">${escaparHtml(textoOrigem(origem))}</option>`)
    .join("");

  if (preSelecionada) selectOrigem.value = String(preSelecionada);
}

// ---- Tela ----

function atualizarDistribuicao() {
  const origem = obterOrigemSelecionada();

  if (!origem) {
    distribuicaoOrigem.hidden = true;
    campoDataEntrada.value = "—";
    return null;
  }

  const distribuicao = calcularDistribuicaoOrigem(origem, entradasCadastro);
  const percentual = distribuicao.valorPago > 0 ? Math.min(distribuicao.valorDistribuido / distribuicao.valorPago, 1) : 0;

  distribuicaoTexto.textContent = `${formatarMoeda(distribuicao.valorDistribuido)} distribuídos de ${formatarMoeda(distribuicao.valorPago)}`;
  distribuicaoFalta.classList.remove("nova-peca__distribuicao-falta--acima", "nova-peca__distribuicao-falta--ok");

  if (distribuicao.valorPago <= 0) {
    distribuicaoFalta.textContent = "Origem sem valor pago";
  } else if (distribuicao.restante > 0.009) {
    distribuicaoFalta.textContent = `Falta distribuir ${formatarMoeda(distribuicao.restante)}`;
  } else if (distribuicao.restante < -0.009) {
    distribuicaoFalta.textContent = `${formatarMoeda(Math.abs(distribuicao.restante))} acima do pago`;
    distribuicaoFalta.classList.add("nova-peca__distribuicao-falta--acima");
  } else {
    distribuicaoFalta.textContent = "Totalmente distribuída";
    distribuicaoFalta.classList.add("nova-peca__distribuicao-falta--ok");
  }

  distribuicaoPreenchimento.style.width = `${Math.round(percentual * 100)}%`;
  distribuicaoBarra.setAttribute("aria-valuenow", String(Math.round(percentual * 100)));
  distribuicaoOrigem.hidden = false;
  // A função do banco usa a data da compra da origem como data da entrada.
  campoDataEntrada.value = formatarData(origem.dataCompra);

  return distribuicao;
}

function atualizarResumo() {
  const origem = obterOrigemSelecionada();
  const distribuicao = origem ? calcularDistribuicaoOrigem(origem, entradasCadastro) : null;
  const quantidade = lerQuantidade();
  const custoUnitario = lerMoeda(campoCustoUnitario);
  const preco = lerMoeda(campoPreco);
  const previa = calcularPreviaPeca({ quantidade, custoUnitario, preco, distribuicao });
  const qtd = Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 0;

  campoValorAtribuido.value = formatarMoeda(previa.valorAtribuido);

  resumoOrigem.textContent = origem ? origem.descricao || `Origem ${origem.id}` : "—";
  resumoQuantidade.textContent = `${qtd} un.`;
  resumoCusto.textContent = Number.isFinite(custoUnitario) && custoUnitario !== null
    ? `${formatarMoeda(custoUnitario)}${qtd > 1 ? " /un." : ""}`
    : "—";
  resumoPreco.textContent = Number.isFinite(preco) && preco > 0 ? `${formatarMoeda(preco)}${qtd > 1 ? " /un." : ""}` : "Sem preço";

  resumoMargemLinha.classList.remove("summary-side__result--success", "summary-side__result--danger", "summary-side__result--neutral");
  const lucroLinha = resumoLucro.closest(".summary-side__row");
  lucroLinha.classList.remove("nova-peca__lucro--success", "nova-peca__lucro--danger");

  if (previa.margem === null) {
    resumoMargem.textContent = "—";
    resumoLucro.textContent = "—";
    resumoMargemLinha.classList.add("summary-side__result--neutral");
  } else {
    const estado = previa.margem < 0 ? "danger" : "success";
    resumoMargem.textContent = formatarPercentualInteiro(previa.margem);
    resumoLucro.textContent = formatarMoeda(previa.lucro);
    resumoMargemLinha.classList.add(`summary-side__result--${estado}`);
    lucroLinha.classList.add(`nova-peca__lucro--${estado}`);
  }

  resumoLucroRotulo.textContent = qtd > 1 ? `Lucro previsto (${qtd} un.)` : "Lucro previsto";

  resumoRestanteOrigem.classList.remove("nova-peca__resumo-origem--danger");
  if (!distribuicao) {
    resumoRestanteOrigem.textContent = "Escolha a origem para ver quanto fica a distribuir.";
  } else if (distribuicao.valorPago <= 0) {
    resumoRestanteOrigem.textContent = "Origem sem valor pago: não há valor a distribuir.";
  } else if (previa.restanteDepois > 0.009) {
    resumoRestanteOrigem.innerHTML = `Depois desta peça, a origem fica com <strong>${escaparHtml(formatarMoeda(previa.restanteDepois))}</strong> a distribuir.`;
  } else if (previa.restanteDepois < -0.009) {
    resumoRestanteOrigem.innerHTML = `Com esta peça, a distribuição passa do valor pago em <strong>${escaparHtml(formatarMoeda(Math.abs(previa.restanteDepois)))}</strong>.`;
    resumoRestanteOrigem.classList.add("nova-peca__resumo-origem--danger");
  } else {
    resumoRestanteOrigem.textContent = "Com esta peça, a origem fica totalmente distribuída.";
  }
}

function atualizarTela() {
  atualizarDistribuicao();
  atualizarResumo();
}

// ---- Foto ----

function definirImagem(arquivo) {
  if (arquivo && !arquivo.type.startsWith("image/")) {
    mostrarMensagem("Selecione um arquivo de imagem (JPG ou PNG).");
    return;
  }

  arquivoImagemSelecionado = arquivo || null;

  if (!arquivoImagemSelecionado) {
    previewImagemPeca.innerHTML = '<i class="ri-image-line" aria-hidden="true"></i>';
    fotoTitulo.textContent = "Arraste a foto aqui";
    return;
  }

  previewImagemPeca.innerHTML = `<img src="${URL.createObjectURL(arquivoImagemSelecionado)}" alt="">`;
  fotoTitulo.textContent = arquivoImagemSelecionado.name;
}

// ---- Salvar ----

function lerFormulario() {
  return {
    origemId: Number(selectOrigem.value || 0),
    nome: campoNome.value.trim(),
    sku: campoSku.value.trim().toUpperCase(),
    compatibilidade: campoCompatibilidade.value.trim(),
    precoVenda: lerMoeda(campoPreco),
    observacoes: campoObservacoes.value.trim(),
    quantidade: lerQuantidade(),
    custoUnitario: lerMoeda(campoCustoUnitario)
  };
}

function validarFormulario(dados) {
  if (!dados.origemId) return { campo: selectOrigem, mensagem: "Selecione a origem da peça." };
  if (!dados.nome) return { campo: campoNome, mensagem: "Informe o nome da peça." };
  if (Number.isNaN(dados.precoVenda) || (dados.precoVenda !== null && dados.precoVenda < 0)) {
    return { campo: campoPreco, mensagem: "Informe um preço de venda válido." };
  }
  if (!Number.isInteger(dados.quantidade) || dados.quantidade < 1) {
    return { campo: campoQuantidade, mensagem: "A quantidade deve ser um número inteiro maior ou igual a 1." };
  }
  if (dados.custoUnitario === null || !Number.isFinite(dados.custoUnitario) || dados.custoUnitario < 0) {
    return { campo: campoCustoUnitario, mensagem: "Informe o custo por unidade (pode ser R$ 0,00)." };
  }
  return null;
}

function definirSalvando(ativo) {
  salvando = ativo;
  botaoSalvar.disabled = ativo;
  botaoSalvarOutra.disabled = ativo;
}

function limparCamposDaPeca() {
  [campoNome, campoSku, campoCompatibilidade, campoPreco, campoObservacoes, campoCustoUnitario].forEach(campo => {
    campo.value = "";
  });
  campoQuantidade.value = "1";
  campoImagem.value = "";
  definirImagem(null);
}

async function salvarPeca(continuarCadastrando) {
  if (salvando) return;

  const dados = lerFormulario();
  const erro = validarFormulario(dados);

  if (erro) {
    mostrarMensagem(erro.mensagem);
    erro.campo.focus();
    return;
  }

  if (!window.supabaseService?.estaConfigurado()) {
    mostrarMensagem("Configure o Supabase para cadastrar peças.");
    return;
  }

  definirSalvando(true);
  mostrarMensagem("Salvando peça…", "success");

  try {
    // SKU livre: só gera o automático quando o campo ficou em branco.
    const skuGerado = !dados.sku;
    const sku = dados.sku || await window.supabaseService.gerarSkuAutomatico();
    await window.supabaseService.validarSkuDisponivel(sku);

    const peca = {
      origemId: dados.origemId,
      nome: dados.nome,
      sku,
      compatibilidade: dados.compatibilidade,
      precoVenda: dados.precoVenda || 0,
      observacoes: dados.observacoes,
      quantidade: dados.quantidade,
      valorAtribuidoEntrada: dados.quantidade * dados.custoUnitario,
      imagemUrl: ""
    };

    if (arquivoImagemSelecionado) {
      peca.imagemUrl = await window.supabaseService.uploadImagemPeca(arquivoImagemSelecionado, peca);
    }

    const { peca: pecaSalva, entrada } = await window.supabaseService.criarPecaComEntrada(peca);

    if (!continuarCadastrando) {
      window.location.href = `detalhes-produto.html?pecaId=${encodeURIComponent(pecaSalva.id)}`;
      return;
    }

    entradasCadastro = [...entradasCadastro, entrada];
    limparCamposDaPeca();
    atualizarTela();
    mostrarMensagem(
      `${pecaSalva.nome} salva${skuGerado ? ` com o SKU ${pecaSalva.sku}` : ""}. Pode cadastrar a próxima peça desta origem.`,
      "success"
    );
    campoNome.focus();
  } catch (erroSalvar) {
    console.error("Erro ao cadastrar peça:", erroSalvar);
    mostrarMensagem(`Não foi possível salvar a peça: ${erroSalvar?.message || "erro desconhecido"}`);
  } finally {
    definirSalvando(false);
  }
}

// ---- Início ----

async function iniciarNovaPeca() {
  window.moedaUtils?.registrarCampoMoeda?.(campoCustoUnitario);
  window.moedaUtils?.registrarCampoMoeda?.(campoPreco);

  if (await carregarDados()) {
    preencherOrigens();
  }

  atualizarTela();
}

selectOrigem?.addEventListener("change", atualizarTela);
[campoQuantidade, campoCustoUnitario, campoPreco].forEach(campo => campo?.addEventListener("input", atualizarResumo));
[campoCustoUnitario, campoPreco].forEach(campo => campo?.addEventListener("blur", atualizarResumo));

campoImagem?.addEventListener("change", () => definirImagem(campoImagem.files?.[0] || null));

areaFoto?.addEventListener("dragover", evento => {
  evento.preventDefault();
  areaFoto.classList.add("dropzone--ativa");
});

areaFoto?.addEventListener("dragleave", () => areaFoto.classList.remove("dropzone--ativa"));

areaFoto?.addEventListener("drop", evento => {
  evento.preventDefault();
  areaFoto.classList.remove("dropzone--ativa");
  definirImagem(evento.dataTransfer?.files?.[0] || null);
});

formNovaPeca?.addEventListener("submit", evento => {
  evento.preventDefault();
  salvarPeca(false);
});

botaoSalvarOutra?.addEventListener("click", () => salvarPeca(true));

document.addEventListener("DOMContentLoaded", iniciarNovaPeca);
