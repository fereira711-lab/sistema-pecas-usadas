const tituloProduto = document.getElementById("tituloProduto");
const subtituloProduto = document.getElementById("subtituloProduto");
const mensagemProdutoNaoEncontrado = document.getElementById("mensagemProdutoNaoEncontrado");
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
const botaoAdicionarEstoqueProduto = document.getElementById("botaoAdicionarEstoqueProduto");
const botaoLancamentoCustoProduto = document.getElementById("botaoLancamentoCustoProduto");
const origemVinculadaProduto = document.getElementById("origemVinculadaProduto");
const campoImagemProdutoDetalhe = document.getElementById("imagemProdutoDetalhe");
const botaoEditarProduto = document.getElementById("botaoEditarProduto");
const formEditarProduto = document.getElementById("formEditarProduto");
const editarProdutoNome = document.getElementById("editarProdutoNome");
const editarProdutoSku = document.getElementById("editarProdutoSku");
const editarProdutoPreco = document.getElementById("editarProdutoPreco");
const editarProdutoObservacoes = document.getElementById("editarProdutoObservacoes");
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
const entradaProdutoObservacoes = document.getElementById("entradaProdutoObservacoes");
const cancelarEntradaProduto = document.getElementById("cancelarEntradaProduto");
const mensagemAdicionarEstoqueProduto = document.getElementById("mensagemAdicionarEstoqueProduto");

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
const tiposCustoPadraoProduto = ["Limpeza", "Solda", "Pintura", "Conserto", "Preparo"];

function buscarProdutosLocais() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function buscarOrigensLocais() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function buscarCustosLocais() {
  return JSON.parse(localStorage.getItem("custosDiversos")) || [];
}

function buscarVendasLocais() {
  return JSON.parse(localStorage.getItem("vendas")) || [];
}

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

function buscarTiposCustoLocais() {
  return tiposCustoPadraoProduto.map((nome, indice) => ({
    id: `local-${indice + 1}`,
    nome,
    categoria: "peca",
    ativo: true
  }));
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

  tiposCustoProduto = buscarTiposCustoLocais();
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

function obterNomeChavePeca(peca) {
  return normalizarTextoChave(peca?.nome || peca?.nome_peca || peca?.nomeProduto || peca?.produtoNome || peca?.descricao);
}

function pertenceAPeca(registro, produto, pecaId) {
  if (Number(registro?.pecaId || registro?.peca_id || 0) === Number(pecaId)) {
    return true;
  }

  const skuProduto = normalizarTextoChave(formatarSku(produto));
  const skuRegistro = normalizarTextoChave(registro?.sku || registro?.codigo || registro?.codigo_peca);

  if (skuProduto && skuProduto !== "-" && skuProduto === skuRegistro) {
    return true;
  }

  const nomeProduto = obterNomeChavePeca(produto);
  const nomeRegistro = normalizarTextoChave(registro?.produtoNome || registro?.nomeProduto || registro?.nome || registro?.descricao);

  return Boolean(nomeProduto && nomeProduto === nomeRegistro);
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

function obterStatusEntrada(entrada) {
  const total = Number(entrada.quantidadeTotal || 0);
  const consumida = Number(entrada.quantidadeConsumida || 0);
  const saldo = Math.max(total - consumida, 0);

  if (saldo <= 0 && total > 0) {
    return "esgotada";
  }

  if (consumida > 0) {
    return "parcial";
  }

  return "disponível";
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
        contextoProduto.custosVenda
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

function alternarTabelaVazia(tabela, vazia) {
  const wrapper = tabela?.closest(".table-wrapper");

  if (wrapper) {
    wrapper.hidden = vazia;
  }
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

function obterStatusProduto(produto) {
  if (produto.status) {
    return produto.status;
  }

  return obterQuantidadeDisponivel(produto) > 0 ? "em_estoque" : "vendida";
}

function formatarStatusProduto(status) {
  const texto = String(status || "").replaceAll("_", " ").trim();

  if (!texto) {
    return "-";
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function obterClasseStatusProduto(status, quantidadeDisponivel = 0) {
  const statusNormalizado = normalizarTextoChave(status);

  if (quantidadeDisponivel <= 0 || statusNormalizado.includes("vendida") || statusNormalizado.includes("sem estoque")) {
    return "status-badge--empty";
  }

  if (quantidadeDisponivel <= 1 || statusNormalizado.includes("baixo")) {
    return "status-badge--warning";
  }

  return "status-badge--stock";
}

function obterClasseStatusEntrada(status) {
  if (status === "esgotada") {
    return "status-badge--empty";
  }

  if (status === "parcial") {
    return "status-badge--warning";
  }

  return "status-badge--stock";
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
  editarProdutoPreco.value = Number(contextoProduto.produto.precoVenda || 0);
  editarProdutoObservacoes.value = contextoProduto.produto.observacoes || "";
  window.moedaUtils?.registrarCampoMoeda?.(editarProdutoPreco);
  formEditarProduto.hidden = false;
  editarProdutoNome.focus();
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
      observacoes: editarProdutoObservacoes.value.trim()
    });

    const contextoAtualizado = await recarregarContextoProduto(contextoProduto.produto.id);

    if (!contextoAtualizado?.produto) {
      throw new Error("Não foi possível recarregar os dados da peça.");
    }

    contextoProduto = contextoAtualizado;
    fecharFormularioEdicaoProduto();
    renderizarTela();
    mensagemProdutoNaoEncontrado.textContent = "Dados da peça atualizados com sucesso.";
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
  editarCustoValor.value = Number(custo.valor || 0);
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
    return "Selecione um arquivo de imagem valido.";
  }

  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    return "Configure o Supabase antes de enviar imagens.";
  }

  return "";
}

function abrirSeletorImagemProduto() {
  if (!contextoProduto.produto) {
    alert("Produto nao encontrado para atualizar imagem.");
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

  mensagemProdutoNaoEncontrado.textContent = "Enviando imagem da peca...";

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
    mensagemProdutoNaoEncontrado.textContent = "Imagem da peca atualizada com sucesso.";
    renderizarDadosProduto(contextoProduto.produto);
  } catch (erro) {
    console.error("Erro ao atualizar imagem da peca:", erro);
    mensagemProdutoNaoEncontrado.textContent = "Nao foi possivel atualizar a imagem da peca.";
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

function carregarContextoLocal(pecaId) {
  const produto = buscarProdutosLocais().find(item => Number(item.id) === Number(pecaId));

  if (!produto) {
    return { produto: null };
  }

  const vendas = buscarVendasLocais().filter(venda => pertenceAPeca(venda, produto, pecaId));
  const vendaIds = new Set(vendas.map(venda => Number(venda.id)));
  const custosPeca = buscarCustosLocais().filter(custo => pertenceAPeca(custo, produto, pecaId));
  const origens = buscarOrigensLocais();
  const origemPrincipal = origens.find(origem => Number(origem.id) === Number(produto.origemId || produto.origem_id))?.descricao || produto.origem || "";

  return {
    produto,
    entradas: [],
    custosPeca,
    vendas,
    custosVenda: vendas.flatMap(venda => {
      if (!Array.isArray(venda.custosVenda)) {
        return [];
      }

      return venda.custosVenda.map(custo => ({
        ...custo,
        vendaId: venda.id
      }));
    }).filter(custo => !custo.vendaId || vendaIds.has(Number(custo.vendaId))),
    consumosEstoque: [],
    origemPrincipal,
    origens
  };
}

function mesclarPorIdOuAssinatura(principal, complemento, criarAssinatura) {
  const mapa = new Map();

  [...(principal || []), ...(complemento || [])].forEach(item => {
    const chave = item?.id ? `id:${item.id}` : criarAssinatura(item);

    if (chave && !mapa.has(chave)) {
      mapa.set(chave, item);
    }
  });

  return Array.from(mapa.values());
}

function mesclarContextoComDadosLocais(contexto, pecaId) {
  const contextoLocal = carregarContextoLocal(pecaId);

  if (!contexto?.produto || !contextoLocal?.produto) {
    return contexto;
  }

  const vendas = mesclarPorIdOuAssinatura(contexto.vendas, contextoLocal.vendas, venda => (
    `venda:${obterDataVenda(venda)}:${quantidadeVendida(venda)}:${valorVenda(venda)}:${venda.canalVenda || venda.cliente || ""}`
  ));
  const vendaIds = new Set(vendas.map(venda => Number(venda.id)));
  const custosVendaLocais = contextoLocal.custosVenda.filter(custo => !custo.vendaId || vendaIds.has(Number(custo.vendaId)));

  return {
    ...contexto,
    custosPeca: mesclarPorIdOuAssinatura(contexto.custosPeca, contextoLocal.custosPeca, custo => (
      `custo-peca:${custo.tipoCusto || custo.tipo}:${custo.descricao || ""}:${custo.valor || 0}:${custo.dataCusto || custo.data || ""}`
    )),
    vendas,
    custosVenda: mesclarPorIdOuAssinatura(contexto.custosVenda, custosVendaLocais, custo => (
      `custo-venda:${custo.vendaId || ""}:${custo.tipoCusto || custo.tipo}:${custo.valor || 0}:${custo.descricao || ""}`
    ))
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

function mostrarMensagemEntradaProduto(texto, tipo = "success") {
  if (!mensagemAdicionarEstoqueProduto) {
    return;
  }

  mensagemAdicionarEstoqueProduto.textContent = texto;
  mensagemAdicionarEstoqueProduto.className = texto ? `form-message form-message--${tipo}` : "form-message";
}

function limparFormularioEntradaProduto() {
  if (entradaProdutoQuantidade) {
    entradaProdutoQuantidade.value = "";
  }

  if (entradaProdutoCustoUnitario) {
    entradaProdutoCustoUnitario.value = "";
  }

  if (entradaProdutoObservacoes) {
    entradaProdutoObservacoes.value = "";
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
      dataEntrada,
      observacoes: entradaProdutoObservacoes?.value.trim() || ""
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

async function recarregarContextoProduto(pecaId) {
  const contextoSupabase = await carregarContextoSupabase(pecaId);

  if (!contextoSupabase?.produto) {
    return null;
  }

  return mesclarContextoComDadosLocais(contextoSupabase, pecaId);
}

function renderizarTela() {
  const produto = contextoProduto.produto;

  mensagemProdutoNaoEncontrado.textContent = "";
  renderizarDadosProduto(produto);
  renderizarOrigemVinculada(produto);
  renderizarEntradas();
  renderizarCustos();
  renderizarVendas();
  renderizarResumo();
}

function renderizarNaoEncontrado(mensagem) {
  mensagemProdutoNaoEncontrado.textContent = mensagem;
  dadosProduto.innerHTML = "";
  resumoFinanceiro.innerHTML = "";
  if (origemVinculadaProduto) {
    origemVinculadaProduto.innerHTML = "";
  }
  tabelaEntradasProduto.innerHTML = "";
  tabelaCustosProduto.innerHTML = "";
  tabelaVendasProduto.innerHTML = "";
}

function renderizarDadosProduto(produto) {
  const nomePeca = formatarNomePeca(produto);
  const nomeBase = produto.nome || produto.nome_peca || produto.nomeProduto || produto.produtoNome || produto.descricao || nomePeca;
  const resultado = calcularResultado();
  const quantidadeVendidaTotal = resultado.quantidadeTotalVendida;
  const quantidadeDisponivel = obterQuantidadeDisponivel(produto);
  const imagemUrl = obterImagemUrlProduto(produto);
  const statusProduto = obterStatusProduto(produto);
  const precoVenda = Number(produto.precoVenda || produto.preco_venda || 0);
  const observacoes = String(produto.observacoes || "").trim();

  tituloProduto.textContent = nomePeca;
  subtituloProduto.textContent = `ID ${produto.id} - ${produto.categoria || "Sem categoria"}`;

  if (botaoImagemProduto) {
    botaoImagemProduto.textContent = imagemUrl ? "Trocar imagem" : "Adicionar imagem";
  }

  dadosProduto.innerHTML = `
    <section class="product-detail-main-card" aria-label="Dados principais da peça">
      <div class="product-detail-photo">
        ${
          imagemUrl
            ? `<img src="${escaparHtml(imagemUrl)}" alt="Imagem de ${escaparHtml(nomePeca)}">`
            : `<span>Sem imagem cadastrada</span>`
        }
      </div>

      <div class="product-detail-main-info">
        <span class="product-detail-eyebrow">${escaparHtml(formatarSku(produto))}</span>
        <h3>${escaparHtml(nomeBase)}</h3>
        <p>${escaparHtml(observacoes || "Sem observações cadastradas.")}</p>
        <div class="product-detail-badges">
        <span class="status-badge ${obterClasseStatusProduto(statusProduto, quantidadeDisponivel)}">${escaparHtml(formatarStatusProduto(statusProduto))}</span>
          <span class="status-badge status-badge--info">ID ${escaparHtml(produto.id)}</span>
        </div>
      </div>

      <aside class="product-detail-main-metrics" aria-label="Resumo operacional do produto">
        <article class="detail-card">
          <span>Preço de venda</span>
          <strong>${precoVenda > 0 ? formatarMoeda(precoVenda) : "Sem preço"}</strong>
        </article>
        <article class="detail-card">
          <span>Disponível</span>
          <strong>${formatarNumero(quantidadeDisponivel)}</strong>
        </article>
        <article class="detail-card">
          <span>Total vendido</span>
          <strong>${formatarNumero(quantidadeVendidaTotal)}</strong>
        </article>
      </aside>
    </section>
  `;
}

function renderizarOrigemVinculada(produto) {
  if (!origemVinculadaProduto) {
    return;
  }

  const origemId = obterOrigemIdPrincipal(produto);
  const descricaoOrigem = obterOrigemPrincipal(produto);
  const primeiraEntrada = contextoProduto.entradas[0] || {};
  const tipoOrigem = produto.origemTipo || produto.tipoOrigem || produto.tipo_origem || primeiraEntrada.origemTipo || primeiraEntrada.tipoOrigem || primeiraEntrada.tipo_origem || "Origem vinculada";
  const origensUtilizadas = obterOrigensUtilizadas(produto);
  const listaOrigens = origensUtilizadas.length > 0
    ? origensUtilizadas.map(origem => (
      origem.id
        ? `<a class="table-link" href="detalhes-origem.html?origemId=${encodeURIComponent(origem.id)}">${escaparHtml(origem.descricao)}</a>`
        : `<span>${escaparHtml(origem.descricao)}</span>`
    )).join("<br>")
    : "-";

  origemVinculadaProduto.innerHTML = `
    <div class="stock-header product-detail-section__header">
      <div>
        <span class="product-detail-eyebrow">Origem vinculada</span>
        <h2>Origem vinculada</h2>
        <p>Rastreio operacional da peça.</p>
      </div>
      <div class="form-actions">
        <a class="button-secondary${origemId ? "" : " is-disabled"}" href="${origemId ? `detalhes-origem.html?origemId=${encodeURIComponent(origemId)}` : "#"}" ${origemId ? "" : "aria-disabled=\"true\""}>Ver origem</a>
      </div>
    </div>
    <div class="detail-grid">
      <article class="detail-card">
        <span>Código/nome</span>
        <strong>${escaparHtml(descricaoOrigem)}</strong>
      </article>
      <article class="detail-card">
        <span>Tipo</span>
        <strong>${escaparHtml(tipoOrigem)}</strong>
      </article>
      <article class="detail-card detail-card--wide">
        <span>Descrição</span>
        <strong>${escaparHtml(descricaoOrigem || "-")}</strong>
      </article>
      <article class="detail-card">
        <span>ID</span>
        <strong>${origemId || "-"}</strong>
      </article>
      <article class="detail-card detail-card--wide">
        <span>Origens utilizadas</span>
        <strong>${listaOrigens}</strong>
      </article>
    </div>
  `;
}

function renderizarResumo() {
  const resultado = calcularResultado();
  const produto = contextoProduto.produto || {};

  resumoFinanceiro.innerHTML = `
    <article class="summary-card">
      <span>Estoque atual</span>
      <strong>${formatarNumero(obterQuantidadeDisponivel(produto))}</strong>
    </article>
    <article class="summary-card">
      <span>Total vendido</span>
      <strong>${formatarNumero(resultado.quantidadeTotalVendida)}</strong>
    </article>
    <article class="summary-card summary-card--muted">
      <span>Receita relacionada</span>
      <strong>${formatarMoeda(resultado.receitaTotal)}</strong>
    </article>
    <article class="summary-card summary-card--muted">
      <span>Custo consumido</span>
      <strong>${formatarValorOuNaoCalculado(resultado.custoEntradasConsumidas)}</strong>
    </article>
    <article class="summary-card summary-card--muted">
      <span>Custo da peça</span>
      <strong>${resultado.custoCalculado ? "Custo calculado" : "Custo não calculado"}</strong>
    </article>
  `;
}

function renderizarEntradas() {
  tabelaEntradasProduto.innerHTML = "";

  if (contextoProduto.entradas.length === 0) {
    mensagemEntradasProduto.textContent = "Nenhuma entrada de estoque encontrada para esta peça.";
    alternarTabelaVazia(tabelaEntradasProduto, true);
    return;
  }

  mensagemEntradasProduto.textContent = "";
  alternarTabelaVazia(tabelaEntradasProduto, false);

  contextoProduto.entradas.forEach(entrada => {
    const saldo = Math.max(Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0), 0);
    const valorAtribuido = Number(
      entrada.valorAtribuido ?? entrada.valor_atribuido ?? entrada.valorAtribuidoEntrada ?? entrada.valor_atribuido_entrada ?? 0
    ) || Number(entrada.quantidadeTotal || 0) * Number(entrada.custoUnitario || 0);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${formatarData(entrada.dataEntrada)}</td>
      <td data-label="Origem">${escaparHtml(obterDescricaoOrigem(entrada))}</td>
      <td data-label="Quantidade total">${formatarNumero(entrada.quantidadeTotal)}</td>
      <td data-label="Consumida">${formatarNumero(entrada.quantidadeConsumida)}</td>
      <td data-label="Saldo">${formatarNumero(saldo)}</td>
      <td data-label="Custo unitário">${formatarMoeda(entrada.custoUnitario)}</td>
      <td data-label="Valor atribuído">${formatarMoeda(valorAtribuido)}</td>
    `;

    tabelaEntradasProduto.appendChild(linha);
  });
}

function renderizarCustos() {
  tabelaCustosProduto.innerHTML = "";

  if (contextoProduto.custosPeca.length === 0) {
    mensagemCustosProduto.textContent = "Nenhum custo cadastrado para esta peça.";
    alternarTabelaVazia(tabelaCustosProduto, true);
    return;
  }

  mensagemCustosProduto.textContent = "";
  alternarTabelaVazia(tabelaCustosProduto, false);

  contextoProduto.custosPeca.forEach(custo => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${formatarData(custo.dataCusto || custo.data)}</td>
      <td data-label="Tipo">${escaparHtml(custo.tipoCusto || custo.tipo || "-")}</td>
      <td data-label="Descrição">${escaparHtml(custo.descricao || "-")}</td>
      <td data-label="Valor">${formatarMoeda(custo.valor)}</td>
      <td data-label="Observações">${escaparHtml(custo.observacoes || custo.observacao || "-")}</td>
      <td data-label="Ações">
        <div class="table-actions">
          <button type="button" data-acao="editar-custo" data-custo-id="${escaparHtml(custo.id)}">Editar</button>
          <button type="button" class="button-danger-soft" data-acao="excluir-custo" data-custo-id="${escaparHtml(custo.id)}">Excluir</button>
        </div>
      </td>
    `;

    tabelaCustosProduto.appendChild(linha);
  });
}

function renderizarVendas() {
  tabelaVendasProduto.innerHTML = "";

  if (contextoProduto.vendas.length === 0) {
    mensagemVendasProduto.textContent = "Nenhuma venda registrada para esta peça.";
    alternarTabelaVazia(tabelaVendasProduto, true);
    return;
  }

  mensagemVendasProduto.textContent = "";
  alternarTabelaVazia(tabelaVendasProduto, false);

  ordenarVendasPorData(contextoProduto.vendas).forEach(venda => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${formatarData(obterDataVenda(venda))}</td>
      <td data-label="Canal">${escaparHtml(venda.canalVenda || "-")}</td>
      <td data-label="Quantidade">${formatarNumero(quantidadeVendida(venda))}</td>
      <td data-label="Valor vendido">${formatarMoeda(valorVenda(venda))}</td>
      <td data-label="Ações">
        <div class="table-actions table-actions--single">
          <a class="table-link" href="detalhes-venda.html?vendaId=${encodeURIComponent(venda.id)}">Ver detalhes da venda</a>
        </div>
      </td>
    `;

    tabelaVendasProduto.appendChild(linha);
  });
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

async function iniciarDetalhes() {
  await carregarTiposCustoProduto();
  const pecaId = obterPecaIdDaUrl();

  if (!pecaId) {
    renderizarNaoEncontrado("Selecione uma peca pela tela Produtos para abrir os detalhes.");
    return;
  }

  try {
    contextoProduto = await recarregarContextoProduto(pecaId) || carregarContextoLocal(pecaId);

    if (!contextoProduto.produto) {
      renderizarNaoEncontrado("Produto não encontrado.");
      return;
    }

    renderizarTela();
    renderizarOpcoesOrigensEntradaProduto();
    if (deveAbrirEdicaoProduto()) {
      abrirFormularioEdicaoProduto();
    }
  } catch (erro) {
    console.error(erro);
    renderizarNaoEncontrado("Não foi possível carregar os detalhes da peça pelo Supabase.");
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
cancelarEdicaoProduto?.addEventListener("click", fecharFormularioEdicaoProduto);
formEditarProduto?.addEventListener("submit", salvarEdicaoProduto);
cancelarEdicaoCusto?.addEventListener("click", fecharFormularioEdicaoCusto);
formEditarCustoProduto?.addEventListener("submit", salvarEdicaoCusto);
cancelarEntradaProduto?.addEventListener("click", fecharFormularioEntradaProduto);
formAdicionarEstoqueProduto?.addEventListener("submit", salvarEntradaProduto);
window.moedaUtils?.registrarCampoMoeda?.(entradaProdutoCustoUnitario);
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

iniciarDetalhes();
