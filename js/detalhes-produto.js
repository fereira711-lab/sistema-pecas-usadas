const tituloProduto = document.getElementById("tituloProduto");
const subtituloProduto = document.getElementById("subtituloProduto");
const mensagemProdutoNaoEncontrado = document.getElementById("mensagemProdutoNaoEncontrado");
const secaoEntradasProduto = document.getElementById("secaoEntradasProduto");
const dadosProduto = document.getElementById("dadosProduto");
const resumoFinanceiro = document.getElementById("resumoFinanceiro");
const mensagemEntradasProduto = document.getElementById("mensagemEntradasProduto");
const tabelaEntradasProduto = document.getElementById("tabelaEntradasProduto");
const mensagemCustosProduto = document.getElementById("mensagemCustosProduto");
const tabelaCustosProduto = document.getElementById("tabelaCustosProduto");
const mensagemVendasProduto = document.getElementById("mensagemVendasProduto");
const tabelaVendasProduto = document.getElementById("tabelaVendasProduto");
const botaoImagemProduto = document.getElementById("botaoImagemProduto");
const botaoVenderProduto = document.getElementById("botaoVenderProduto");
const linkVerVendaProduto = document.getElementById("linkVerVendaProduto");
const botaoAdicionarEstoqueProduto = document.getElementById("botaoAdicionarEstoqueProduto");
const botaoLancamentoCustoProduto = document.getElementById("botaoLancamentoCustoProduto");
const acoesProduto = document.getElementById("acoesProduto");
const linkLancarCustoProduto = document.getElementById("linkLancarCustoProduto");
const campoImagemProdutoDetalhe = document.getElementById("imagemProdutoDetalhe");
const botaoEditarProduto = document.getElementById("botaoEditarProduto");
const botaoExcluirProduto = document.getElementById("botaoExcluirProduto");
const formEditarProduto = document.getElementById("formEditarProduto");
const editarProdutoNome = document.getElementById("editarProdutoNome");
const editarProdutoSku = document.getElementById("editarProdutoSku");
const editarProdutoPreco = document.getElementById("editarProdutoPreco");
const editarProdutoObservacoes = document.getElementById("editarProdutoObservacoes");
const editarProdutoCompatibilidade = document.getElementById("editarProdutoCompatibilidade");
const cancelarEdicaoProduto = document.getElementById("cancelarEdicaoProduto");
const formEditarCustoProduto = document.getElementById("formEditarCustoProduto");
const editarCustoId = document.getElementById("editarCustoId");
const editarCustoTipo = document.getElementById("editarCustoTipo");
const editarCustoValor = document.getElementById("editarCustoValor");
const editarCustoDescricao = document.getElementById("editarCustoDescricao");
const editarCustoData = document.getElementById("editarCustoData");
const editarCustoObservacoes = document.getElementById("editarCustoObservacoes");
const cancelarEdicaoCusto = document.getElementById("cancelarEdicaoCusto");
const botaoAbrirEntradaProduto = document.getElementById("botaoAbrirEntradaProduto");
const formAdicionarEstoqueProduto = document.getElementById("formAdicionarEstoqueProduto");
const entradaProdutoOrigemId = document.getElementById("entradaProdutoOrigemId");
const entradaProdutoQuantidade = document.getElementById("entradaProdutoQuantidade");
const entradaProdutoCustoUnitario = document.getElementById("entradaProdutoCustoUnitario");
const entradaProdutoData = document.getElementById("entradaProdutoData");
const cancelarEntradaProduto = document.getElementById("cancelarEntradaProduto");
const mensagemAdicionarEstoqueProduto = document.getElementById("mensagemAdicionarEstoqueProduto");
const formEditarEntradaProduto = document.getElementById("formEditarEntradaProduto");
const editarEntradaProdutoId = document.getElementById("editarEntradaProdutoId");
const editarEntradaProdutoOrigemId = document.getElementById("editarEntradaProdutoOrigemId");
const editarEntradaProdutoQuantidade = document.getElementById("editarEntradaProdutoQuantidade");
const editarEntradaProdutoCustoUnitario = document.getElementById("editarEntradaProdutoCustoUnitario");
const editarEntradaProdutoData = document.getElementById("editarEntradaProdutoData");
const mensagemEditarEntradaProduto = document.getElementById("mensagemEditarEntradaProduto");
const cancelarEdicaoEntradaProduto = document.getElementById("cancelarEdicaoEntradaProduto");

let contextoProduto = {
  produto: null,
  entradas: [],
  custosPeca: [],
  vendas: [],
  custosVenda: [],
  consumosEstoque: [],
  origemPrincipal: "",
  origens: []
};
let tiposCustoProduto = [];

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatarMoeda(valor) {
  if (window.moedaUtils?.formatarMoedaBR) {
    return window.moedaUtils.formatarMoedaBR(valor);
  }

  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function converterNumero(valor) {
  if (window.moedaUtils?.parseMoedaBR) {
    return window.moedaUtils.parseMoedaBR(valor);
  }

  return Number(String(valor || "0").replace(",", "."));
}

function normalizarNomeTipoCusto(nome) {
  return String(nome || "").trim().toLowerCase();
}

function garantirTipoCustoDisponivel(nome) {
  const texto = String(nome || "").trim();

  if (!texto) {
    return;
  }

  const existe = tiposCustoProduto.some(tipo => (
    normalizarNomeTipoCusto(tipo.nome) === normalizarNomeTipoCusto(texto)
  ));

  if (!existe) {
    tiposCustoProduto.push({
      id: "",
      nome: texto,
      ativo: true
    });
  }
}

function renderizarTiposCustoProduto(tipoSelecionado = "") {
  if (!editarCustoTipo) {
    return;
  }

  editarCustoTipo.innerHTML = '<option value="">Selecione o tipo</option>';

  tiposCustoProduto
    .filter(tipo => tipo.ativo !== false && ["peca", "ambos"].includes(tipo.categoria || "ambos"))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"))
    .forEach(tipo => {
      const opcao = document.createElement("option");
      opcao.value = tipo.nome;
      opcao.textContent = tipo.nome;
      opcao.dataset.tipoId = tipo.id;
      editarCustoTipo.appendChild(opcao);
    });

  if (tipoSelecionado) {
    editarCustoTipo.value = tipoSelecionado;
  }
}

async function carregarTiposCustoProduto() {
  if (window.supabaseService?.estaConfigurado()) {
    try {
      tiposCustoProduto = await window.supabaseService.listarTiposCusto("peca") || [];
      renderizarTiposCustoProduto();
      return;
    } catch (erro) {
      console.error("Erro ao carregar tipos de custo:", erro);
    }
  }

  tiposCustoProduto = [];
  renderizarTiposCustoProduto();
}

function formatarData(data) {
  if (!data) {
    return "-";
  }

  const dataIso = String(data).slice(0, 10);
  const partes = dataIso.split("-");

  if (partes.length !== 3) {
    return dataIso;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || "").slice(0, 10);
}

function formatarNomePeca(peca) {
  const nome = peca.nome || peca.nome_peca || peca.nomeProduto || peca.produtoNome || peca.descricao || `Peça ${peca.id || peca.pecaId}`;
  const sku = String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim();

  return sku ? `${sku} - ${nome}` : nome;
}

function formatarSku(peca) {
  return String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim() || "-";
}

function normalizarTextoChave(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Vínculo pelo id da peça (os dados vêm do Supabase). O vínculo antigo por nome/SKU saiu junto com o
// modo localStorage: duas peças com o mesmo nome misturavam vendas e custos uma da outra.
function pertenceAPeca(registro, produto, pecaId) {
  return Number(registro?.pecaId || registro?.peca_id || 0) === Number(pecaId);
}

function obterImagemUrlProduto(produto) {
  return String(produto.imagemUrl || produto.imagem_url || "").trim();
}

function obterPecaIdDaUrl() {
  const parametros = new URLSearchParams(window.location.search);
  return Number(parametros.get("pecaId") || parametros.get("id"));
}

function deveAbrirEdicaoProduto() {
  const parametros = new URLSearchParams(window.location.search);
  return parametros.get("editar") === "1";
}

function valorVenda(venda) {
  if (window.financeiroUtils?.calcularReceitaVenda) {
    return window.financeiroUtils.calcularReceitaVenda(venda);
  }

  const quantidade = Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || venda.quantidade_vendida || 0);
  const unitario = Number(venda.valorUnitario || venda.precoUnitario || venda.valor_unitario || 0);
  return Number(venda.valorTotal || venda.valor_total || venda.valorVenda || unitario * quantidade || 0);
}

function quantidadeVendida(venda) {
  return Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || venda.quantidade_vendida || 0);
}

function obterValorUnitarioVenda(venda) {
  const quantidade = quantidadeVendida(venda);
  const valorUnitario = Number(venda.valorUnitario || venda.precoUnitario || venda.valor_unitario || venda.valorVendaUnitario || 0);

  if (valorUnitario > 0) {
    return valorUnitario;
  }

  return quantidade > 0 ? valorVenda(venda) / quantidade : 0;
}

function ordenarVendasPorData(vendas) {
  return [...vendas].sort((a, b) => {
    const dataA = obterDataVenda(a);
    const dataB = obterDataVenda(b);

    if (dataA !== dataB) {
      return dataB.localeCompare(dataA);
    }

    return Number(b.id || 0) - Number(a.id || 0);
  });
}

function calcularDiasSemVenda(ultimaVenda) {
  if (!ultimaVenda) {
    return "-";
  }

  const hoje = new Date();
  const data = new Date(`${ultimaVenda}T00:00:00`);
  const hojeLocal = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dataLocal = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const diferenca = hojeLocal.getTime() - dataLocal.getTime();

  return Math.max(Math.floor(diferenca / 86400000), 0);
}

function calcularResultado() {
  const financeiro = window.financeiroUtils?.calcularLucroPeca
    ? window.financeiroUtils.calcularLucroPeca(
        contextoProduto.produto,
        contextoProduto.vendas,
        contextoProduto.consumosEstoque,
        contextoProduto.custosPeca,
        contextoProduto.custosVenda,
        contextoProduto.entradas
      )
    : null;
  const receitaTotal = financeiro
    ? financeiro.receita
    : contextoProduto.vendas.reduce((total, venda) => total + valorVenda(venda), 0);
  const custosDaPeca = financeiro
    ? financeiro.custosPeca
    : contextoProduto.custosPeca.reduce((total, custo) => total + Number(custo.valor || 0), 0);
  const custosDaVenda = financeiro
    ? financeiro.custosVenda
    : contextoProduto.custosVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0);
  const quantidadeTotalVendida = contextoProduto.vendas.reduce((total, venda) => total + quantidadeVendida(venda), 0);
  const vendasOrdenadas = ordenarVendasPorData(contextoProduto.vendas);
  const ultimaVenda = vendasOrdenadas.length > 0 ? obterDataVenda(vendasOrdenadas[0]) : "";
  const vendasSemCusto = financeiro
    ? financeiro.vendasSemCusto
    : contextoProduto.vendas.filter(venda => obterConsumosDaVenda(venda.id).length === 0).length;
  const custoCalculado = financeiro ? financeiro.calculado : contextoProduto.vendas.length === 0 || vendasSemCusto === 0;

  return {
    receitaTotal,
    custoEntradasConsumidas: custoCalculado ? financeiro?.custoConsumido ?? contextoProduto.consumosEstoque.reduce((total, consumo) => total + Number(consumo.custoTotal || 0), 0) : null,
    custosDaPeca,
    custosDaVenda,
    lucroPeca: custoCalculado ? financeiro?.lucro ?? receitaTotal - contextoProduto.consumosEstoque.reduce((total, consumo) => total + Number(consumo.custoTotal || 0), 0) - custosDaPeca - custosDaVenda : null,
    margem: custoCalculado ? financeiro?.margem ?? null : null,
    quantidadeTotalVendida,
    ultimaVenda,
    diasSemVenda: calcularDiasSemVenda(ultimaVenda),
    custoCalculado,
    vendasSemCusto
  };
}

function formatarValorOuNaoCalculado(valor) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return "Custo não calculado";
  }

  return formatarMoeda(Number(valor || 0));
}

function obterQuantidadeTotal(produto) {
  const totalEntradas = contextoProduto.entradas.reduce((total, entrada) => total + Number(entrada.quantidadeTotal || 0), 0);
  return totalEntradas > 0 ? totalEntradas : Number(produto.quantidade || 0);
}

function obterQuantidadeVendida(produto) {
  const consumidaEntradas = contextoProduto.entradas.reduce((total, entrada) => total + Number(entrada.quantidadeConsumida || 0), 0);

  if (consumidaEntradas > 0) {
    return consumidaEntradas;
  }

  return Number(produto.quantidadeVendida || 0);
}

function obterQuantidadeDisponivel(produto) {
  const quantidadeTotal = obterQuantidadeTotal(produto);
  const quantidadeVendidaTotal = obterQuantidadeVendida(produto);
  return Math.max(quantidadeTotal - quantidadeVendidaTotal, 0);
}

function obterOrigemPrincipal(produto) {
  if (contextoProduto.origemPrincipal) {
    return contextoProduto.origemPrincipal;
  }

  if (produto.origem) {
    return produto.origem;
  }

  const primeiraEntrada = contextoProduto.entradas.find(entrada => entrada.origemDescricao);
  return primeiraEntrada?.origemDescricao || "-";
}

function obterDescricaoOrigem(entrada) {
  return String(entrada?.origemDescricao || entrada?.origem || "").trim() || (entrada?.origemId ? `Origem ${entrada.origemId}` : "-");
}

function obterOrigensUtilizadas(produto) {
  const mapa = new Map();
  const origemIdProduto = Number(produto?.origemId || produto?.origem_id || 0);
  const descricaoProduto = String(produto?.origem || "").trim();

  contextoProduto.entradas.forEach(entrada => {
    const origemId = Number(entrada.origemId || 0);
    const descricao = obterDescricaoOrigem(entrada);
    const chave = origemId > 0 ? `id:${origemId}` : `texto:${descricao}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        id: origemId,
        descricao
      });
    }
  });

  if (mapa.size === 0 && (origemIdProduto > 0 || descricaoProduto)) {
    mapa.set(origemIdProduto > 0 ? `id:${origemIdProduto}` : `texto:${descricaoProduto}`, {
      id: origemIdProduto,
      descricao: descricaoProduto || (origemIdProduto ? `Origem ${origemIdProduto}` : "-")
    });
  }

  return Array.from(mapa.values());
}

function obterOrigemIdPrincipal(produto) {
  const origemIdProduto = Number(produto.origemId || produto.origem_id || 0);

  if (origemIdProduto) {
    return origemIdProduto;
  }

  const primeiraEntrada = contextoProduto.entradas.find(entrada => Number(entrada.origemId || 0) > 0);
  return Number(primeiraEntrada?.origemId || 0);
}

function abrirFormularioEdicaoProduto() {
  if (!contextoProduto.produto || !formEditarProduto) {
    return;
  }

  editarProdutoNome.value = contextoProduto.produto.nome || contextoProduto.produto.nomePeca || "";
  editarProdutoSku.value = formatarSku(contextoProduto.produto) === "-" ? "" : formatarSku(contextoProduto.produto);
  editarProdutoPreco.value = Number(contextoProduto.produto.precoVenda || 0) > 0 ? formatarMoeda(contextoProduto.produto.precoVenda) : "";
  editarProdutoObservacoes.value = contextoProduto.produto.observacoes || "";
  if (editarProdutoCompatibilidade) editarProdutoCompatibilidade.value = contextoProduto.produto.compatibilidade || "";
  window.moedaUtils?.registrarCampoMoeda?.(editarProdutoPreco);
  formEditarProduto.hidden = false;
  // Vindo de "Definir preço" (Produtos), o foco já cai no campo de preço.
  const focarPreco = new URLSearchParams(window.location.search).get("campo") === "preco";
  (focarPreco ? editarProdutoPreco : editarProdutoNome).focus();
}

function fecharFormularioEdicaoProduto() {
  if (formEditarProduto) {
    formEditarProduto.hidden = true;
  }
}

async function salvarEdicaoProduto(evento) {
  evento.preventDefault();

  if (!contextoProduto.produto || !window.supabaseService?.estaConfigurado()) {
    mensagemProdutoNaoEncontrado.textContent = "Configure o Supabase antes de editar a peça.";
    return;
  }

  const nome = editarProdutoNome.value.trim();
  const sku = editarProdutoSku.value.trim();
  const precoVenda = converterNumero(editarProdutoPreco.value);

  if (!nome || !sku) {
    mensagemProdutoNaoEncontrado.textContent = "Informe nome e SKU para salvar a edição.";
    return;
  }

  if (Number.isNaN(precoVenda) || precoVenda < 0) {
    mensagemProdutoNaoEncontrado.textContent = "Informe um preço válido.";
    return;
  }

  try {
    await window.supabaseService.validarSkuDisponivel(sku, contextoProduto.produto.id);
  } catch (erro) {
    mensagemProdutoNaoEncontrado.textContent = erro?.message || "Já existe uma peça cadastrada com este SKU.";
    return;
  }

  const botaoSalvar = formEditarProduto.querySelector("button[type='submit']");
  botaoSalvar.disabled = true;
  mensagemProdutoNaoEncontrado.textContent = "Salvando dados da peça...";

  try {
    await window.supabaseService.atualizarDadosPeca({
      id: contextoProduto.produto.id,
      nome,
      sku,
      precoVenda,
      observacoes: editarProdutoObservacoes.value.trim(),
      compatibilidade: editarProdutoCompatibilidade ? editarProdutoCompatibilidade.value.trim() : undefined
    });

    const contextoAtualizado = await recarregarContextoProduto(contextoProduto.produto.id);

    if (!contextoAtualizado?.produto) {
      throw new Error("Não foi possível recarregar os dados da peça.");
    }

    contextoProduto = contextoAtualizado;
    fecharFormularioEdicaoProduto();
    renderizarTela();
    mostrarMensagemPeca("Dados da peça atualizados.", "success");
  } catch (erro) {
    console.error("Erro ao editar peça:", erro);
    mensagemProdutoNaoEncontrado.textContent = erro?.message || "Não foi possível atualizar os dados da peça.";
  } finally {
    botaoSalvar.disabled = false;
  }
}

function abrirFormularioEdicaoCusto(custoId) {
  const custo = contextoProduto.custosPeca.find(item => Number(item.id) === Number(custoId));

  if (!custo || !formEditarCustoProduto) {
    return;
  }

  editarCustoId.value = custo.id;
  garantirTipoCustoDisponivel(custo.tipoCusto || custo.tipo);
  renderizarTiposCustoProduto(custo.tipoCusto || custo.tipo || "");
  editarCustoValor.value = formatarMoeda(Number(custo.valor || 0));
  editarCustoDescricao.value = custo.descricao || "";
  editarCustoData.value = String(custo.dataCusto || custo.data || "").slice(0, 10);
  editarCustoObservacoes.value = custo.observacoes || custo.observacao || "";
  window.moedaUtils?.registrarCampoMoeda?.(editarCustoValor);
  formEditarCustoProduto.hidden = false;
  editarCustoTipo.focus();
}

function fecharFormularioEdicaoCusto() {
  if (formEditarCustoProduto) {
    formEditarCustoProduto.hidden = true;
  }
}

async function salvarEdicaoCusto(evento) {
  evento.preventDefault();

  if (!window.supabaseService?.estaConfigurado()) {
    mensagemCustosProduto.textContent = "Configure o Supabase antes de editar custos.";
    return;
  }

  const id = Number(editarCustoId.value);
  const tipo = editarCustoTipo.value.trim();
  const tipoCustoId = editarCustoTipo.selectedOptions[0]?.dataset?.tipoId || null;
  const descricao = editarCustoDescricao.value.trim();
  const dataCusto = editarCustoData.value;
  const observacoes = editarCustoObservacoes.value.trim();
  const valor = converterNumero(editarCustoValor.value);

  if (!id || !tipo) {
    mensagemCustosProduto.textContent = "Informe o tipo do custo.";
    return;
  }

  if (Number.isNaN(valor) || valor < 0) {
    mensagemCustosProduto.textContent = "Informe um valor de custo válido.";
    return;
  }

  const botaoSalvar = formEditarCustoProduto.querySelector("button[type='submit']");
  botaoSalvar.disabled = true;
  mensagemCustosProduto.textContent = "Salvando custo...";

  try {
    const custoAtualizado = await window.supabaseService.atualizarCustoPeca({
      id,
      tipoCusto: tipo,
      tipoCustoId,
      descricao,
      dataCusto,
      observacoes,
      valor
    });

    contextoProduto.custosPeca = contextoProduto.custosPeca.map(custo => (
      Number(custo.id) === id ? custoAtualizado : custo
    ));
    fecharFormularioEdicaoCusto();
    renderizarResumo();
    renderizarCustos();
    mensagemCustosProduto.textContent = "Custo atualizado com sucesso.";
  } catch (erro) {
    console.error("Erro ao editar custo:", erro);
    mensagemCustosProduto.textContent = "Não foi possível atualizar o custo.";
  } finally {
    botaoSalvar.disabled = false;
  }
}

function validarArquivoImagem(arquivo) {
  if (!arquivo) {
    return "Selecione uma imagem.";
  }

  if (!arquivo.type.startsWith("image/")) {
    return "Selecione um arquivo de imagem válido.";
  }

  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    return "Configure o Supabase antes de enviar imagens.";
  }

  return "";
}

function abrirSeletorImagemProduto() {
  if (!contextoProduto.produto) {
    mostrarMensagemPeca("Peça não encontrada para atualizar a imagem.");
    return;
  }

  campoImagemProdutoDetalhe.value = "";
  campoImagemProdutoDetalhe.click();
}

async function salvarImagemProdutoDetalhe(arquivo) {
  const erroImagem = validarArquivoImagem(arquivo);

  if (erroImagem) {
    alert(erroImagem);
    return;
  }

  mostrarMensagemPeca("Enviando imagem da peça…");

  if (botaoImagemProduto) {
    botaoImagemProduto.disabled = true;
  }

  try {
    const imagemUrl = await window.supabaseService.uploadImagemPeca(arquivo, contextoProduto.produto);
    const produtoAtualizado = await window.supabaseService.atualizarPeca({
      ...contextoProduto.produto,
      imagemUrl
    });

    contextoProduto.produto = produtoAtualizado;
    mostrarMensagemPeca("Imagem da peça atualizada.", "success");
    renderizarDadosProduto(contextoProduto.produto);
  } catch (erro) {
    console.error("Erro ao atualizar imagem da peca:", erro);
    mostrarMensagemPeca("Não foi possível atualizar a imagem da peça.");
  } finally {
    if (botaoImagemProduto) {
      botaoImagemProduto.disabled = false;
    }

    campoImagemProdutoDetalhe.value = "";
  }
}

function obterCustosVendaDaVenda(vendaId) {
  return contextoProduto.custosVenda.filter(custo => Number(custo.vendaId) === Number(vendaId));
}

function obterConsumosDaVenda(vendaId) {
  return contextoProduto.consumosEstoque.filter(consumo => Number(consumo.vendaId) === Number(vendaId));
}

function entradaPossuiConsumo(contextoEntrada, consumos = contextoProduto.consumosEstoque) {
  if (Number(contextoEntrada?.quantidadeConsumida || 0) > 0) {
    return true;
  }

  return (consumos || []).some(consumo => Number(consumo.entradaEstoqueId || 0) === Number(contextoEntrada?.id || 0));
}

async function carregarContextoSupabase(pecaId) {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    return null;
  }

  const [
    produto,
    origens,
    entradas,
    custosPeca,
    vendas,
    custosVenda,
    consumosEstoque
  ] = await Promise.all([
    window.supabaseService.buscarPecaPorId(pecaId),
    window.supabaseService.listarOrigens(),
    window.supabaseService.listarEntradasEstoque(),
    window.supabaseService.listarCustosPeca(),
    window.supabaseService.listarVendas(),
    window.supabaseService.listarCustosVenda(),
    window.supabaseService.listarConsumosEstoque()
  ]);

  if (!produto) {
    return { produto: null };
  }

  const entradasProduto = (entradas || []).filter(entrada => pertenceAPeca(entrada, produto, pecaId));
  const custosPecaProduto = (custosPeca || []).filter(custo => pertenceAPeca(custo, produto, pecaId));
  const vendasProduto = (vendas || []).filter(venda => pertenceAPeca(venda, produto, pecaId));
  const vendaIds = new Set(vendasProduto.map(venda => Number(venda.id)));
  const custosVendaProduto = (custosVenda || []).filter(custo => vendaIds.has(Number(custo.vendaId)));
  const consumosProduto = (consumosEstoque || []).filter(consumo => vendaIds.has(Number(consumo.vendaId)));

  return {
    produto,
    entradas: entradasProduto,
    custosPeca: custosPecaProduto,
    vendas: vendasProduto,
    custosVenda: custosVendaProduto,
    consumosEstoque: consumosProduto,
    origemPrincipal: produto.origem || entradasProduto.find(entrada => entrada.origemDescricao)?.origemDescricao || "",
    origens: origens || []
  };
}

function preencherDataEntradaPadraoProduto() {
  if (!entradaProdutoData) {
    return;
  }

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  entradaProdutoData.value = `${ano}-${mes}-${dia}`;
}

function renderizarOpcoesOrigensEntradaProduto() {
  if (!entradaProdutoOrigemId) {
    return;
  }

  const valorAtual = entradaProdutoOrigemId.value;
  entradaProdutoOrigemId.innerHTML = '<option value="">Selecione a origem</option>';

  (contextoProduto.origens || [])
    .slice()
    .sort((a, b) => String(a.descricao || "").localeCompare(String(b.descricao || ""), "pt-BR"))
    .forEach(origem => {
      const opcao = document.createElement("option");
      opcao.value = origem.id;
      opcao.textContent = origem.descricao || origem.codigoOrigem || `Origem ${origem.id}`;
      entradaProdutoOrigemId.appendChild(opcao);
    });

  const origemPrincipal = obterOrigemIdPrincipal(contextoProduto.produto || {});
  entradaProdutoOrigemId.value = valorAtual || (origemPrincipal ? String(origemPrincipal) : "");
}

function renderizarOpcoesOrigensEdicaoEntradaProduto() {
  if (!editarEntradaProdutoOrigemId) {
    return;
  }

  const valorAtual = editarEntradaProdutoOrigemId.value;
  editarEntradaProdutoOrigemId.innerHTML = '<option value="">Selecione a origem</option>';

  (contextoProduto.origens || [])
    .slice()
    .sort((a, b) => String(a.descricao || "").localeCompare(String(b.descricao || ""), "pt-BR"))
    .forEach(origem => {
      const opcao = document.createElement("option");
      opcao.value = origem.id;
      opcao.textContent = origem.descricao || origem.codigoOrigem || `Origem ${origem.id}`;
      editarEntradaProdutoOrigemId.appendChild(opcao);
    });

  editarEntradaProdutoOrigemId.value = valorAtual || "";
}

function mostrarMensagemEntradaProduto(texto, tipo = "success") {
  if (!mensagemAdicionarEstoqueProduto) {
    return;
  }

  mensagemAdicionarEstoqueProduto.textContent = texto;
  mensagemAdicionarEstoqueProduto.className = `page-message${texto && tipo === "success" ? " page-message--success" : ""}`;
}

function mostrarMensagemEdicaoEntradaProduto(texto, tipo = "success") {
  if (!mensagemEditarEntradaProduto) {
    return;
  }

  mensagemEditarEntradaProduto.textContent = texto;
  mensagemEditarEntradaProduto.className = `page-message${texto && tipo === "success" ? " page-message--success" : ""}`;
}

function limparFormularioEntradaProduto() {
  if (entradaProdutoQuantidade) {
    entradaProdutoQuantidade.value = "";
  }

  if (entradaProdutoCustoUnitario) {
    entradaProdutoCustoUnitario.value = "";
  }

  preencherDataEntradaPadraoProduto();
  renderizarOpcoesOrigensEntradaProduto();
  mostrarMensagemEntradaProduto("");
}

function abrirFormularioEntradaProduto() {
  if (!contextoProduto.produto || !formAdicionarEstoqueProduto) {
    return;
  }

  limparFormularioEntradaProduto();
  formAdicionarEstoqueProduto.hidden = false;
  entradaProdutoOrigemId?.focus();
}

function fecharFormularioEntradaProduto() {
  if (formAdicionarEstoqueProduto) {
    formAdicionarEstoqueProduto.hidden = true;
  }

  mostrarMensagemEntradaProduto("");
}

function fecharFormularioEdicaoEntradaProduto() {
  if (formEditarEntradaProduto) {
    formEditarEntradaProduto.hidden = true;
  }

  mostrarMensagemEdicaoEntradaProduto("");
}

function abrirFormularioEdicaoEntradaProduto(entradaId) {
  const entrada = contextoProduto.entradas.find(item => Number(item.id) === Number(entradaId));

  if (!entrada) {
    mensagemEntradasProduto.textContent = "Entrada de estoque não encontrada.";
    return;
  }

  if (entradaPossuiConsumo(entrada)) {
    mensagemEntradasProduto.textContent = "Esta entrada já possui movimentação e não pode ser editada.";
    return;
  }

  renderizarOpcoesOrigensEdicaoEntradaProduto();
  editarEntradaProdutoId.value = entrada.id;
  editarEntradaProdutoOrigemId.value = String(entrada.origemId || "");
  editarEntradaProdutoQuantidade.value = Number(entrada.quantidadeTotal || 0);
  editarEntradaProdutoCustoUnitario.value = formatarMoeda(Number(entrada.custoUnitario || 0));
  editarEntradaProdutoData.value = String(entrada.dataEntrada || "").slice(0, 10);
  window.moedaUtils?.registrarCampoMoeda?.(editarEntradaProdutoCustoUnitario);
  formEditarEntradaProduto.hidden = false;
  mostrarMensagemEdicaoEntradaProduto("");
  editarEntradaProdutoOrigemId?.focus();
}

async function salvarEntradaProduto(evento) {
  evento.preventDefault();

  if (!window.supabaseService?.estaConfigurado() || !contextoProduto.produto?.id) {
    mostrarMensagemEntradaProduto("Configure o Supabase antes de adicionar estoque.", "warning");
    return;
  }

  const origemId = Number(entradaProdutoOrigemId?.value || 0);
  const quantidadeTotal = Number(entradaProdutoQuantidade?.value || 0);
  const custoUnitario = converterNumero(entradaProdutoCustoUnitario?.value);
  const dataEntrada = entradaProdutoData?.value || "";

  if (!origemId) {
    mostrarMensagemEntradaProduto("Selecione a origem da nova entrada.", "warning");
    return;
  }

  if (!Number.isInteger(quantidadeTotal) || quantidadeTotal <= 0) {
    mostrarMensagemEntradaProduto("Informe uma quantidade válida para a entrada.", "warning");
    return;
  }

  if (Number.isNaN(custoUnitario) || custoUnitario < 0) {
    mostrarMensagemEntradaProduto("Informe um custo unitário válido.", "warning");
    return;
  }

  if (!dataEntrada) {
    mostrarMensagemEntradaProduto("Informe a data da entrada.", "warning");
    return;
  }

  const botaoSalvar = formAdicionarEstoqueProduto.querySelector("button[type='submit']");
  botaoSalvar.disabled = true;
  mostrarMensagemEntradaProduto("Salvando entrada de estoque...", "success");

  try {
    await window.supabaseService.salvarEntradaEstoque({
      pecaId: contextoProduto.produto.id,
      origemId,
      quantidadeTotal,
      quantidadeConsumida: 0,
      custoUnitario,
      dataEntrada
    });

    const contextoAtualizado = await recarregarContextoProduto(contextoProduto.produto.id);

    if (!contextoAtualizado?.produto) {
      throw new Error("Não foi possível recarregar os dados da peça.");
    }

    contextoProduto = contextoAtualizado;
    renderizarTela();
    renderizarOpcoesOrigensEntradaProduto();
    fecharFormularioEntradaProduto();
    mensagemEntradasProduto.textContent = "Entrada de estoque adicionada com sucesso.";
  } catch (erro) {
    console.error("Erro ao adicionar estoque da peça:", erro);
    mostrarMensagemEntradaProduto(erro?.message || "Não foi possível adicionar a entrada de estoque.", "warning");
  } finally {
    botaoSalvar.disabled = false;
  }
}

async function salvarEdicaoEntradaProduto(evento) {
  evento.preventDefault();

  if (!window.supabaseService?.estaConfigurado() || !contextoProduto.produto?.id) {
    mostrarMensagemEdicaoEntradaProduto("Configure o Supabase antes de editar a entrada.", "warning");
    return;
  }

  const entradaId = Number(editarEntradaProdutoId?.value || 0);
  const origemId = Number(editarEntradaProdutoOrigemId?.value || 0);
  const quantidadeTotal = Number(editarEntradaProdutoQuantidade?.value || 0);
  const custoUnitario = converterNumero(editarEntradaProdutoCustoUnitario?.value);
  const dataEntrada = editarEntradaProdutoData?.value || "";
  const entradaAtual = contextoProduto.entradas.find(item => Number(item.id) === entradaId);

  if (!entradaAtual) {
    mostrarMensagemEdicaoEntradaProduto("Entrada de estoque não encontrada.", "warning");
    return;
  }

  const consumosAtualizados = await window.supabaseService.listarConsumosEstoque();

  if (entradaPossuiConsumo(entradaAtual, consumosAtualizados || [])) {
    mostrarMensagemEdicaoEntradaProduto("Esta entrada já possui movimentação e não pode ser editada.", "warning");
    return;
  }

  if (!origemId) {
    mostrarMensagemEdicaoEntradaProduto("Selecione a origem da entrada.", "warning");
    return;
  }

  if (!Number.isInteger(quantidadeTotal) || quantidadeTotal <= 0) {
    mostrarMensagemEdicaoEntradaProduto("Informe uma quantidade válida para a entrada.", "warning");
    return;
  }

  if (Number.isNaN(custoUnitario) || custoUnitario < 0) {
    mostrarMensagemEdicaoEntradaProduto("Informe um custo unitário válido.", "warning");
    return;
  }

  if (!dataEntrada) {
    mostrarMensagemEdicaoEntradaProduto("Informe a data da entrada.", "warning");
    return;
  }

  const botaoSalvar = formEditarEntradaProduto.querySelector("button[type='submit']");
  botaoSalvar.disabled = true;
  mostrarMensagemEdicaoEntradaProduto("Salvando edição da entrada...", "success");

  try {
    await window.supabaseService.atualizarEntradaEstoque({
      id: entradaId,
      pecaId: contextoProduto.produto.id,
      origemId,
      quantidadeTotal,
      quantidadeConsumida: 0,
      custoUnitario,
      dataEntrada
    });

    const contextoAtualizado = await recarregarContextoProduto(contextoProduto.produto.id);

    if (!contextoAtualizado?.produto) {
      throw new Error("Não foi possível recarregar os dados da peça.");
    }

    contextoProduto = contextoAtualizado;
    renderizarTela();
    renderizarOpcoesOrigensEntradaProduto();
    renderizarOpcoesOrigensEdicaoEntradaProduto();
    fecharFormularioEdicaoEntradaProduto();
    mensagemEntradasProduto.textContent = "Entrada de estoque atualizada com sucesso.";
  } catch (erro) {
    console.error("Erro ao editar entrada de estoque:", erro);
    mostrarMensagemEdicaoEntradaProduto(erro?.message || "Não foi possível editar a entrada de estoque.", "warning");
  } finally {
    botaoSalvar.disabled = false;
  }
}

async function recarregarContextoProduto(pecaId) {
  const contextoSupabase = await carregarContextoSupabase(pecaId);
  return contextoSupabase?.produto ? contextoSupabase : null;
}

function mostrarMensagemPeca(texto, tipo = "") {
  mensagemProdutoNaoEncontrado.textContent = texto;
  mensagemProdutoNaoEncontrado.className = `page-message${tipo === "success" ? " page-message--success" : ""}`;
}

function renderizarTela() {
  const produto = contextoProduto.produto;

  mostrarMensagemPeca("");
  renderizarDadosProduto(produto);
  renderizarEntradas();
  renderizarCustos();
  renderizarVendas();
  renderizarResumo();
}

function renderizarNaoEncontrado(mensagem) {
  mensagemProdutoNaoEncontrado.textContent = mensagem;
  subtituloProduto.textContent = "";
  dadosProduto.hidden = true;
  dadosProduto.innerHTML = "";
  resumoFinanceiro.innerHTML = "";
  acoesProduto.hidden = true;
  tabelaEntradasProduto.innerHTML = "";
  tabelaCustosProduto.innerHTML = "";
  tabelaVendasProduto.innerHTML = "";
}

function mostrarOrientacaoExclusaoProduto(mensagem, opcoes = {}) {
  if (!mensagemProdutoNaoEncontrado) {
    return;
  }

  mensagemProdutoNaoEncontrado.innerHTML = "";
  mensagemProdutoNaoEncontrado.textContent = mensagem;

  if (!opcoes.rolarParaEntradas) {
    return;
  }

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn btn--secondary btn--compact";
  botao.textContent = "Ir para entradas";
  botao.addEventListener("click", () => {
    secaoEntradasProduto?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  mensagemProdutoNaoEncontrado.appendChild(document.createTextNode(" "));
  mensagemProdutoNaoEncontrado.appendChild(botao);
}

// Situação com as mesmas regras e prioridade de Produtos: Vendida; Preço abaixo do custo > Parada > Em estoque.
function calcularSituacaoProduto(produto, quantidadeDisponivel, margem) {
  if (quantidadeDisponivel <= 0) {
    return contextoProduto.vendas.length ? { texto: "Vendida", pilula: "pill--neutral" } : { texto: "Sem estoque", pilula: "pill--neutral" };
  }

  if (margem !== null && margem < 0) return { texto: "Preço abaixo do custo", pilula: "pill--warning" };

  const parada = window.alertasRegras?.calcularPecasParadas({
    pecas: [produto],
    vendas: contextoProduto.vendas,
    entradasEstoque: contextoProduto.entradas
  })?.[0];

  if (parada) return { texto: `Parada há ${formatarNumero(parada.dias)} dias`, pilula: "pill--warning" };
  return { texto: "Em estoque", pilula: "pill--success" };
}

function formatarPercentual(valor) {
  if (window.moedaUtils?.formatarPercentualBR) return window.moedaUtils.formatarPercentualBR(valor, 1);
  return `${Number(valor || 0).toFixed(1).replace(".", ",")}%`;
}

function renderizarDadosProduto(produto) {
  const financeiro = window.financeiroUtils;
  const nome = produto.nome || `Peça ${produto.id}`;
  const sku = formatarSku(produto) === "-" ? "" : formatarSku(produto);
  const imagemUrl = obterImagemUrlProduto(produto);
  const quantidadeDisponivel = obterQuantidadeDisponivel(produto);
  const precoVenda = Number(produto.precoVenda || 0);
  // Custo da próxima unidade a sair (ou da última vendida), a mesma regra de Produtos. Sem custo médio.
  const custo = financeiro
    ? financeiro.calcularCustoReferenciaPeca(produto.id, contextoProduto.entradas, contextoProduto.consumosEstoque, contextoProduto.custosPeca)
    : { calculado: false, valor: null };
  const margem = financeiro && custo.calculado ? financeiro.calcularMargemPreco(precoVenda, custo.valor) : null;
  const situacao = calcularSituacaoProduto(produto, quantidadeDisponivel, margem);
  const origensUtilizadas = obterOrigensUtilizadas(produto);
  const compatibilidade = String(produto.compatibilidade || "").trim();
  const observacoes = String(produto.observacoes || "").trim();
  const linkOrigens = origensUtilizadas.length
    ? origensUtilizadas.map(origem => (
      origem.id
        ? `<a href="detalhes-origem.html?origemId=${encodeURIComponent(origem.id)}">${escaparHtml(origem.descricao)}</a>`
        : escaparHtml(origem.descricao)
    )).join(", ")
    : "—";

  document.title = `${nome} · Detalhes da peça`;
  tituloProduto.textContent = nome;
  subtituloProduto.innerHTML = [
    sku ? `<span class="mono">${escaparHtml(sku)}</span>` : "",
    origensUtilizadas[0]?.descricao ? escaparHtml(origensUtilizadas[0].descricao) : ""
  ].filter(Boolean).join(" · ") || "Peça sem SKU";

  // Peça vendida (sem saldo e com venda): no lugar do "Vender" desabilitado, "Ver venda" (a mais recente).
  const ultimaVenda = ordenarVendasPorData(contextoProduto.vendas)[0] || null;
  const vendida = quantidadeDisponivel <= 0 && Boolean(ultimaVenda);
  acoesProduto.hidden = false;
  botaoVenderProduto.hidden = vendida;
  botaoVenderProduto.disabled = quantidadeDisponivel <= 0;
  botaoVenderProduto.title = quantidadeDisponivel <= 0 ? "Peça sem estoque" : "";
  linkVerVendaProduto.hidden = !vendida;
  if (vendida) linkVerVendaProduto.href = `detalhes-venda.html?vendaId=${encodeURIComponent(ultimaVenda.id)}`;
  if (linkLancarCustoProduto) linkLancarCustoProduto.href = `cadastro-custo.html?pecaId=${encodeURIComponent(produto.id)}`;
  if (botaoImagemProduto) botaoImagemProduto.textContent = imagemUrl ? "Trocar imagem" : "Adicionar imagem";

  dadosProduto.hidden = false;
  dadosProduto.innerHTML = `
    <div class="peca-principal__foto">
      ${imagemUrl
        ? `<img src="${escaparHtml(imagemUrl)}" alt="Foto de ${escaparHtml(nome)}">`
        : '<i class="ri-image-line" aria-hidden="true"></i>'}
    </div>
    <div class="peca-principal__info">
      <span class="pill ${situacao.pilula}">${escaparHtml(situacao.texto)}</span>
      ${compatibilidade ? `<p class="peca-principal__compat"><span class="peca-principal__rotulo">Compatível com</span> ${escaparHtml(compatibilidade)}</p>` : ""}
      ${observacoes ? `<p class="peca-principal__obs">${escaparHtml(observacoes)}</p>` : ""}
    </div>
    ${vendida ? montarResultadoVendaHtml(linkOrigens, origensUtilizadas.length) : `
    <dl class="peca-principal__dados">
      <div><dt>Preço de venda</dt><dd class="${precoVenda > 0 ? "" : "text-warning"}">${precoVenda > 0 ? formatarMoeda(precoVenda) : "Sem preço"}</dd></div>
      <div><dt>Custo da peça</dt><dd>${custo.calculado ? formatarMoeda(custo.valor) : "Custo não calculado"}</dd></div>
      <div><dt>Margem prevista</dt><dd class="${margem === null ? "" : margem < 0 ? "text-danger" : "text-success"}">${margem === null ? "—" : formatarPercentual(margem)}</dd></div>
      <div><dt>${origensUtilizadas.length > 1 ? "Origens" : "Origem"}</dt><dd>${linkOrigens}</dd></div>
    </dl>`}
  `;
}

// Peça vendida: o bloco do topo mostra o resultado das vendas dela (financeiro-utils.calcularLucroPeca,
// com os custos lançados na peça rateados) no lugar da margem prevista.
function montarResultadoVendaHtml(linkOrigens, quantidadeOrigens) {
  const resultado = calcularResultado();
  const lucro = resultado.lucroPeca;
  const classe = lucro === null ? "" : lucro < 0 ? "text-danger" : "text-success";
  const linhaNegativa = valor => (Number(valor || 0) > 0 ? `− ${formatarMoeda(valor)}` : formatarMoeda(0));

  return `
    <div class="peca-principal__resultado">
      <span class="peca-principal__rotulo">Resultado da venda</span>
      <dl class="peca-principal__dados">
        <div><dt>Vendida por</dt><dd>${formatarMoeda(resultado.receitaTotal)}</dd></div>
        <div><dt>Custo da peça</dt><dd>${resultado.custoEntradasConsumidas === null ? "Custo não calculado" : linhaNegativa(resultado.custoEntradasConsumidas)}</dd></div>
        <div><dt>Custos da peça</dt><dd>${linhaNegativa(resultado.custosDaPeca)}</dd></div>
        <div><dt>Custos da venda</dt><dd>${linhaNegativa(resultado.custosDaVenda)}</dd></div>
        <div class="peca-principal__lucro"><dt>Lucro</dt><dd class="${classe}">${lucro === null ? "Custo não calculado" : formatarMoeda(lucro)}</dd></div>
        <div><dt>Margem</dt><dd class="${classe}">${resultado.margem === null ? "—" : formatarPercentual(resultado.margem)}</dd></div>
        <div><dt>${quantidadeOrigens > 1 ? "Origens" : "Origem"}</dt><dd>${linkOrigens}</dd></div>
      </dl>
    </div>
  `;
}

function criarKpi({ rotulo, valor, nota = "", classeValor = "" }) {
  return `
    <article class="kpi">
      <span class="kpi__label">${escaparHtml(rotulo)}</span>
      <span class="kpi__value kpi__value--tight ${classeValor}">${escaparHtml(valor)}</span>
      <span class="kpi__note">${escaparHtml(nota)}</span>
    </article>
  `;
}

function pluralizar(quantidade, singular, plural) {
  return `${formatarNumero(quantidade)} ${quantidade === 1 ? singular : plural}`;
}

// Resumo operacional: estoque, vendidas, receita e custo consumido. Lucro detalhado fica no extrato e nas Análises.
function renderizarResumo() {
  const resultado = calcularResultado();
  const produto = contextoProduto.produto || {};
  const disponivel = obterQuantidadeDisponivel(produto);

  resumoFinanceiro.innerHTML = [
    criarKpi({
      rotulo: "Em estoque",
      valor: pluralizar(disponivel, "unidade", "unidades"),
      nota: `${pluralizar(contextoProduto.entradas.length, "entrada", "entradas")} de estoque`
    }),
    criarKpi({
      rotulo: "Vendidas",
      valor: pluralizar(resultado.quantidadeTotalVendida, "unidade", "unidades"),
      nota: resultado.ultimaVenda ? `Última em ${formatarData(resultado.ultimaVenda)}` : "Nenhuma venda ainda"
    }),
    criarKpi({
      rotulo: "Receita das vendas",
      valor: formatarMoeda(resultado.receitaTotal),
      nota: pluralizar(contextoProduto.vendas.length, "venda", "vendas")
    }),
    criarKpi({
      rotulo: "Custo consumido",
      valor: resultado.custoCalculado ? formatarMoeda(resultado.custoEntradasConsumidas || 0) : "Custo não calculado",
      classeValor: resultado.custoCalculado ? "" : "kpi__value--muted",
      nota: resultado.custoCalculado
        ? "Entradas baixadas pelas vendas"
        : `${pluralizar(resultado.vendasSemCusto, "venda", "vendas")} sem consumo registrado`
    })
  ].join("");
}

function renderizarEntradas() {
  if (contextoProduto.entradas.length === 0) {
    tabelaEntradasProduto.innerHTML = '<tr class="data-table__empty"><td colspan="8">Nenhuma entrada de estoque para esta peça.</td></tr>';
    return;
  }

  tabelaEntradasProduto.innerHTML = contextoProduto.entradas.map(entrada => {
    const saldo = Math.max(Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0), 0);
    const valorAtribuido = Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0);
    // Entrada com consumo não pode ser editada nem excluída (ela sustenta o custo de uma venda).
    const bloqueada = entradaPossuiConsumo(entrada);
    const travada = bloqueada ? 'disabled title="Entrada já consumida por venda"' : "";
    const origemId = Number(entrada.origemId || 0);
    const origem = escaparHtml(obterDescricaoOrigem(entrada));

    return `
      <tr>
        <td class="cell-nowrap" data-label="Data">${formatarData(entrada.dataEntrada)}</td>
        <td data-label="Origem">${origemId ? `<a href="detalhes-origem.html?origemId=${encodeURIComponent(origemId)}">${origem}</a>` : origem}</td>
        <td class="num" data-label="Qtd.">${formatarNumero(entrada.quantidadeTotal)}</td>
        <td class="num cell-muted" data-label="Consumida">${formatarNumero(entrada.quantidadeConsumida)}</td>
        <td class="num cell-strong" data-label="Saldo">${formatarNumero(saldo)}</td>
        <td class="num" data-label="Custo unitário">${formatarMoeda(entrada.custoUnitario)}</td>
        <td class="num" data-label="Valor atribuído">${formatarMoeda(valorAtribuido)}</td>
        <td class="cell-acoes">
          <div class="row-actions">
            <button type="button" class="btn btn--secondary btn--compact" data-acao="editar-entrada" data-entrada-id="${escaparHtml(entrada.id)}" ${travada}>Editar</button>
            <button type="button" class="btn btn--quiet btn--compact text-danger" data-acao="excluir-entrada" data-entrada-id="${escaparHtml(entrada.id)}" ${travada}>Excluir</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

async function excluirEntradaProduto(entradaId) {
  if (!window.supabaseService?.estaConfigurado()) {
    mensagemEntradasProduto.textContent = "Configure o Supabase antes de excluir entradas.";
    return;
  }

  const entrada = contextoProduto.entradas.find(item => Number(item.id) === Number(entradaId));

  if (!entrada) {
    mensagemEntradasProduto.textContent = "Entrada de estoque não encontrada.";
    return;
  }

  const consumosAtualizados = await window.supabaseService.listarConsumosEstoque();

  if (entradaPossuiConsumo(entrada, consumosAtualizados || [])) {
    mensagemEntradasProduto.textContent = "Esta entrada já possui movimentação e não pode ser excluída.";
    return;
  }

  const confirmar = window.confirm("Excluir esta entrada de estoque?");

  if (!confirmar) {
    return;
  }

  mensagemEntradasProduto.textContent = "Excluindo entrada de estoque...";

  try {
    await window.supabaseService.excluirEntradaEstoque(entradaId);
    const contextoAtualizado = await recarregarContextoProduto(contextoProduto.produto.id);

    if (!contextoAtualizado?.produto) {
      throw new Error("Não foi possível recarregar os dados da peça.");
    }

    contextoProduto = contextoAtualizado;
    renderizarTela();
    renderizarOpcoesOrigensEntradaProduto();
    mensagemEntradasProduto.textContent = "Entrada de estoque excluída com sucesso.";
  } catch (erro) {
    console.error("Erro ao excluir entrada de estoque:", erro);
    mensagemEntradasProduto.textContent = erro?.message || "Não foi possível excluir a entrada de estoque.";
  }
}

function renderizarCustos() {
  if (contextoProduto.custosPeca.length === 0) {
    tabelaCustosProduto.innerHTML = '<tr class="data-table__empty"><td colspan="5">Nenhum custo lançado para esta peça.</td></tr>';
    return;
  }

  tabelaCustosProduto.innerHTML = contextoProduto.custosPeca.map(custo => {
    const observacao = String(custo.observacoes || custo.observacao || "").trim();

    return `
      <tr>
        <td class="cell-nowrap" data-label="Data">${formatarData(custo.dataCusto || custo.data)}</td>
        <td data-label="Tipo">${escaparHtml(custo.tipoCusto || custo.tipo || "—")}</td>
        <td data-label="Descrição">
          <div class="item-cell__text">
            <span>${escaparHtml(custo.descricao || "—")}</span>
            ${observacao ? `<span class="item-cell__meta">${escaparHtml(observacao)}</span>` : ""}
          </div>
        </td>
        <td class="num cell-strong" data-label="Valor">${formatarMoeda(custo.valor)}</td>
        <td class="cell-acoes">
          <div class="row-actions">
            <button type="button" class="btn btn--secondary btn--compact" data-acao="editar-custo" data-custo-id="${escaparHtml(custo.id)}">Editar</button>
            <button type="button" class="btn btn--quiet btn--compact text-danger" data-acao="excluir-custo" data-custo-id="${escaparHtml(custo.id)}">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderizarVendas() {
  if (contextoProduto.vendas.length === 0) {
    tabelaVendasProduto.innerHTML = '<tr class="data-table__empty"><td colspan="6">Nenhuma venda registrada para esta peça.</td></tr>';
    return;
  }

  tabelaVendasProduto.innerHTML = ordenarVendasPorData(contextoProduto.vendas).map(venda => {
    const href = `detalhes-venda.html?vendaId=${encodeURIComponent(venda.id)}`;
    const resultado = window.financeiroUtils?.calcularLucroVenda(venda, contextoProduto.consumosEstoque, contextoProduto.custosVenda, {
      custosPeca: contextoProduto.custosPeca,
      entradas: contextoProduto.entradas
    });
    const lucro = resultado?.calculado
      ? `<td class="num cell-strong ${resultado.lucro < 0 ? "text-danger" : "text-success"}" data-label="Lucro">${formatarMoeda(resultado.lucro)}</td>`
      : '<td class="num cell-muted" data-label="Lucro">Custo não calculado</td>';

    return `
      <tr>
        <td class="cell-nowrap" data-label="Data">${formatarData(obterDataVenda(venda))}</td>
        <td class="cell-muted" data-label="Canal">${escaparHtml(venda.canalVenda || "—")}</td>
        <td class="num" data-label="Qtd.">${formatarNumero(quantidadeVendida(venda))}</td>
        <td class="num cell-strong" data-label="Valor">${formatarMoeda(valorVenda(venda))}</td>
        ${lucro}
        <td class="cell-acoes"><a class="btn btn--secondary btn--compact" href="${href}">Ver venda</a></td>
      </tr>
    `;
  }).join("");
}

async function excluirCustoProduto(custoId) {
  if (!window.supabaseService?.estaConfigurado()) {
    mensagemCustosProduto.textContent = "Configure o Supabase antes de excluir custos.";
    return;
  }

  const confirmar = window.confirm("Excluir este custo da peça?");

  if (!confirmar) {
    return;
  }

  mensagemCustosProduto.textContent = "Excluindo custo...";

  try {
    await window.supabaseService.excluirCustoPeca(custoId);
    contextoProduto.custosPeca = contextoProduto.custosPeca.filter(custo => Number(custo.id) !== Number(custoId));
    fecharFormularioEdicaoCusto();
    renderizarCustos();
    renderizarResumo();
    mensagemCustosProduto.textContent = "Custo excluído com sucesso.";
  } catch (erro) {
    console.error("Erro ao excluir custo:", erro);
    mensagemCustosProduto.textContent = "Não foi possível excluir o custo.";
  }
}

async function excluirProdutoAtual() {
  if (!window.supabaseService?.estaConfigurado() || !contextoProduto.produto?.id) {
    mensagemProdutoNaoEncontrado.textContent = "Configure o Supabase antes de excluir a peça.";
    return;
  }

  const entradasDaPeca = contextoProduto.entradas || [];
  const vendasDaPeca = contextoProduto.vendas || [];
  const custosDaPeca = contextoProduto.custosPeca || [];
  const consumosDaPeca = contextoProduto.consumosEstoque || [];

  if (entradasDaPeca.length > 0) {
    const existeEntradaSemConsumo = entradasDaPeca.some(entrada => !entradaPossuiConsumo(entrada, consumosDaPeca));

    if (existeEntradaSemConsumo) {
      mostrarOrientacaoExclusaoProduto("Exclua as entradas desta peça antes de excluir o produto.", {
        rolarParaEntradas: true
      });
      return;
    }
  }

  if (vendasDaPeca.length > 0 || custosDaPeca.length > 0 || consumosDaPeca.length > 0) {
    mostrarOrientacaoExclusaoProduto("Esta peça possui movimentações e não pode ser excluída.");
    return;
  }

  const confirmar = window.confirm("Excluir esta peça?");

  if (!confirmar) {
    return;
  }

  mensagemProdutoNaoEncontrado.textContent = "Excluindo peça...";

  try {
    await window.supabaseService.excluirPeca(contextoProduto.produto.id);
    window.location.href = "produtos.html";
  } catch (erro) {
    console.error("Erro ao excluir peça:", erro);
    mensagemProdutoNaoEncontrado.textContent = erro?.message || "Não foi possível excluir a peça.";
  }
}

async function iniciarDetalhes() {
  await carregarTiposCustoProduto();
  const pecaId = obterPecaIdDaUrl();

  if (!pecaId) {
    renderizarNaoEncontrado("Abra uma peça pela tela Produtos.");
    return;
  }

  try {
    contextoProduto = await recarregarContextoProduto(pecaId) || { produto: null };

    if (!contextoProduto.produto) {
      renderizarNaoEncontrado("Peça não encontrada.");
      return;
    }

    renderizarTela();
    renderizarOpcoesOrigensEntradaProduto();
    if (deveAbrirEdicaoProduto()) {
      abrirFormularioEdicaoProduto();
    }

    // "Excluir peça" no menu de Produtos abre esta tela com #excluir: começa a exclusão (com as travas e a confirmação).
    if (window.location.hash === "#excluir") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
      excluirProdutoAtual();
    }
  } catch (erro) {
    console.error(erro);
    renderizarNaoEncontrado("Não foi possível carregar a peça.");
  }
}

botaoImagemProduto?.addEventListener("click", abrirSeletorImagemProduto);

botaoVenderProduto?.addEventListener("click", () => {
  if (contextoProduto.produto?.id) {
    window.location.href = `cadastro-venda.html?pecaId=${encodeURIComponent(contextoProduto.produto.id)}`;
  }
});

botaoAdicionarEstoqueProduto?.addEventListener("click", abrirFormularioEntradaProduto);
botaoAbrirEntradaProduto?.addEventListener("click", abrirFormularioEntradaProduto);

botaoLancamentoCustoProduto?.addEventListener("click", () => {
  if (contextoProduto.produto?.id) {
    window.location.href = `cadastro-custo.html?pecaId=${encodeURIComponent(contextoProduto.produto.id)}`;
  }
});

campoImagemProdutoDetalhe?.addEventListener("change", evento => {
  const arquivo = evento.target.files?.[0];

  if (arquivo) {
    salvarImagemProdutoDetalhe(arquivo);
  }
});

botaoEditarProduto?.addEventListener("click", abrirFormularioEdicaoProduto);
botaoExcluirProduto?.addEventListener("click", excluirProdutoAtual);
cancelarEdicaoProduto?.addEventListener("click", fecharFormularioEdicaoProduto);
formEditarProduto?.addEventListener("submit", salvarEdicaoProduto);
cancelarEdicaoCusto?.addEventListener("click", fecharFormularioEdicaoCusto);
formEditarCustoProduto?.addEventListener("submit", salvarEdicaoCusto);
cancelarEntradaProduto?.addEventListener("click", fecharFormularioEntradaProduto);
formAdicionarEstoqueProduto?.addEventListener("submit", salvarEntradaProduto);
cancelarEdicaoEntradaProduto?.addEventListener("click", fecharFormularioEdicaoEntradaProduto);
formEditarEntradaProduto?.addEventListener("submit", salvarEdicaoEntradaProduto);
window.moedaUtils?.registrarCampoMoeda?.(entradaProdutoCustoUnitario);
window.moedaUtils?.registrarCampoMoeda?.(editarEntradaProdutoCustoUnitario);
preencherDataEntradaPadraoProduto();

tabelaCustosProduto?.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-acao]");

  if (!botao) {
    return;
  }

  if (botao.dataset.acao === "editar-custo") {
    abrirFormularioEdicaoCusto(botao.dataset.custoId);
    return;
  }

  if (botao.dataset.acao === "excluir-custo") {
    excluirCustoProduto(botao.dataset.custoId);
  }
});

tabelaEntradasProduto?.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-acao]");

  if (!botao) {
    return;
  }

  if (botao.dataset.acao === "editar-entrada") {
    abrirFormularioEdicaoEntradaProduto(botao.dataset.entradaId);
    return;
  }

  if (botao.dataset.acao === "excluir-entrada") {
    excluirEntradaProduto(botao.dataset.entradaId);
  }
});

document.querySelector(".page-head .action-menu")?.addEventListener("click", evento => {
  if (evento.target.closest(".action-menu__item")) evento.currentTarget.removeAttribute("open");
});

iniciarDetalhes();
