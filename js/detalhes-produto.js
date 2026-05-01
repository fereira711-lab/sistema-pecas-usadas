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
const cancelarEdicaoCusto = document.getElementById("cancelarEdicaoCusto");

let contextoProduto = {
  produto: null,
  entradas: [],
  custosPeca: [],
  vendas: [],
  custosVenda: [],
  consumosEstoque: [],
  origemPrincipal: ""
};

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
  return Number(String(valor || "0").replace(",", "."));
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
  const quantidade = Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || venda.quantidade_vendida || 0);
  const unitario = Number(venda.valorUnitario || venda.precoUnitario || venda.valor_unitario || 0);
  return Number(venda.valorTotal || venda.valor_total || venda.valorVenda || unitario * quantidade || 0);
}

function quantidadeVendida(venda) {
  return Number(venda.quantidadeVendidaNaVenda || venda.quantidadeVendida || venda.quantidade_vendida || 0);
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
  const receitaTotal = contextoProduto.vendas.reduce((total, venda) => total + valorVenda(venda), 0);
  const custoEntradasConsumidas = contextoProduto.consumosEstoque.reduce((total, consumo) => total + Number(consumo.custoTotal || 0), 0);
  const custosDaPeca = contextoProduto.custosPeca.reduce((total, custo) => total + Number(custo.valor || 0), 0);
  const custosDaVenda = contextoProduto.custosVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0);
  const quantidadeTotalVendida = contextoProduto.vendas.reduce((total, venda) => total + quantidadeVendida(venda), 0);
  const vendasOrdenadas = ordenarVendasPorData(contextoProduto.vendas);
  const ultimaVenda = vendasOrdenadas.length > 0 ? obterDataVenda(vendasOrdenadas[0]) : "";

  return {
    receitaTotal,
    custoEntradasConsumidas,
    custosDaPeca,
    custosDaVenda,
    lucroPeca: receitaTotal - custoEntradasConsumidas - custosDaPeca - custosDaVenda,
    quantidadeTotalVendida,
    ultimaVenda,
    diasSemVenda: calcularDiasSemVenda(ultimaVenda)
  };
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

function renderizarDadosProduto(produto) {
  const nomePeca = formatarNomePeca(produto);
  const quantidadeTotal = obterQuantidadeTotal(produto);
  const quantidadeVendidaTotal = obterQuantidadeVendida(produto);
  const quantidadeDisponivel = obterQuantidadeDisponivel(produto);
  const imagemUrl = obterImagemUrlProduto(produto);

  tituloProduto.textContent = nomePeca;
  subtituloProduto.textContent = `ID ${produto.id} - ${produto.categoria || "Sem categoria"}`;

  if (botaoImagemProduto) {
    botaoImagemProduto.textContent = imagemUrl ? "Trocar imagem" : "Adicionar imagem";
  }

  dadosProduto.innerHTML = `
    <article class="detail-card detail-card--image">
      <span>Imagem da peÃ§a</span>
      ${
        imagemUrl
          ? `<img src="${escaparHtml(imagemUrl)}" alt="Imagem de ${escaparHtml(nomePeca)}">`
          : `<strong>Sem imagem cadastrada</strong>`
      }
    </article>
    <article class="detail-card">
      <span>SKU</span>
      <strong>${escaparHtml(formatarSku(produto))}</strong>
    </article>
    <article class="detail-card">
      <span>Nome da peça</span>
      <strong>${escaparHtml(produto.nome || produto.nome_peca || produto.nomeProduto || "-")}</strong>
    </article>
    <article class="detail-card">
      <span>ID da peça</span>
      <strong>${escaparHtml(produto.id || "-")}</strong>
    </article>
    <article class="detail-card">
      <span>Origem principal</span>
      <strong>${escaparHtml(obterOrigemPrincipal(produto))}</strong>
    </article>
    <article class="detail-card">
      <span>Quantidade total</span>
      <strong>${formatarNumero(quantidadeTotal)}</strong>
    </article>
    <article class="detail-card">
      <span>Quantidade vendida</span>
      <strong>${formatarNumero(quantidadeVendidaTotal)}</strong>
    </article>
    <article class="detail-card">
      <span>Quantidade disponível</span>
      <strong>${formatarNumero(quantidadeDisponivel)}</strong>
    </article>
    <article class="detail-card">
      <span>Status</span>
      <strong>${escaparHtml(obterStatusProduto(produto))}</strong>
    </article>
    <article class="detail-card">
      <span>Preço sugerido</span>
      <strong>${formatarMoeda(produto.precoVenda)}</strong>
    </article>
    <article class="detail-card">
      <span>Observações</span>
      <strong>${escaparHtml(produto.observacoes || "-")}</strong>
    </article>
  `;
}

function abrirFormularioEdicaoProduto() {
  if (!contextoProduto.produto || !formEditarProduto) {
    return;
  }

  editarProdutoNome.value = contextoProduto.produto.nome || contextoProduto.produto.nomePeca || "";
  editarProdutoSku.value = formatarSku(contextoProduto.produto) === "-" ? "" : formatarSku(contextoProduto.produto);
  editarProdutoPreco.value = Number(contextoProduto.produto.precoVenda || 0);
  editarProdutoObservacoes.value = contextoProduto.produto.observacoes || "";
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

  const botaoSalvar = formEditarProduto.querySelector("button[type='submit']");
  botaoSalvar.disabled = true;
  mensagemProdutoNaoEncontrado.textContent = "Salvando dados da peça...";

  try {
    const produtoAtualizado = await window.supabaseService.atualizarDadosPeca({
      id: contextoProduto.produto.id,
      nome,
      sku,
      precoVenda,
      observacoes: editarProdutoObservacoes.value.trim()
    });

    contextoProduto.produto = produtoAtualizado;
    fecharFormularioEdicaoProduto();
    renderizarTela();
    mensagemProdutoNaoEncontrado.textContent = "Dados da peça atualizados com sucesso.";
  } catch (erro) {
    console.error("Erro ao editar peça:", erro);
    mensagemProdutoNaoEncontrado.textContent = "Não foi possível atualizar os dados da peça.";
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
  editarCustoTipo.value = custo.tipoCusto || custo.tipo || "";
  editarCustoValor.value = Number(custo.valor || 0);
  editarCustoDescricao.value = custo.descricao || "";
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
  const descricao = editarCustoDescricao.value.trim();
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
      descricao,
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

function renderizarResumo() {
  const resultado = calcularResultado();

  resumoFinanceiro.innerHTML = `
    <article class="summary-card">
      <span>Receita total</span>
      <strong>${formatarMoeda(resultado.receitaTotal)}</strong>
    </article>
    <article class="summary-card">
      <span>Custo das entradas consumidas</span>
      <strong>${formatarMoeda(resultado.custoEntradasConsumidas)}</strong>
    </article>
    <article class="summary-card">
      <span>Custos da peça</span>
      <strong>${formatarMoeda(resultado.custosDaPeca)}</strong>
    </article>
    <article class="summary-card">
      <span>Custos da venda</span>
      <strong>${formatarMoeda(resultado.custosDaVenda)}</strong>
    </article>
    <article class="summary-card">
      <span>Lucro da peça</span>
      <strong>${formatarMoeda(resultado.lucroPeca)}</strong>
    </article>
    <article class="summary-card">
      <span>Última venda</span>
      <strong>${formatarData(resultado.ultimaVenda)}</strong>
    </article>
    <article class="summary-card">
      <span>Dias sem venda</span>
      <strong>${escaparHtml(resultado.diasSemVenda)}</strong>
    </article>
    <article class="summary-card">
      <span>Quantidade vendida</span>
      <strong>${formatarNumero(resultado.quantidadeTotalVendida)}</strong>
    </article>
  `;
}

function renderizarEntradas() {
  tabelaEntradasProduto.innerHTML = "";

  if (contextoProduto.entradas.length === 0) {
    mensagemEntradasProduto.textContent = "Nenhuma entrada de estoque encontrada para esta peça.";
    return;
  }

  mensagemEntradasProduto.textContent = "";

  contextoProduto.entradas.forEach(entrada => {
    const saldo = Math.max(Number(entrada.quantidadeTotal || 0) - Number(entrada.quantidadeConsumida || 0), 0);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Origem">${escaparHtml(entrada.origemDescricao || entrada.origemId || "-")}</td>
      <td data-label="Data entrada">${formatarData(entrada.dataEntrada)}</td>
      <td data-label="Quantidade total">${formatarNumero(entrada.quantidadeTotal)}</td>
      <td data-label="Quantidade consumida">${formatarNumero(entrada.quantidadeConsumida)}</td>
      <td data-label="Saldo disponível">${formatarNumero(saldo)}</td>
      <td data-label="Custo unitário">${formatarMoeda(entrada.custoUnitario)}</td>
      <td data-label="Status">${escaparHtml(obterStatusEntrada(entrada))}</td>
    `;

    tabelaEntradasProduto.appendChild(linha);
  });
}

function renderizarCustos() {
  tabelaCustosProduto.innerHTML = "";

  if (contextoProduto.custosPeca.length === 0) {
    mensagemCustosProduto.textContent = "Nenhum custo cadastrado para esta peça.";
    return;
  }

  mensagemCustosProduto.textContent = "";

  contextoProduto.custosPeca.forEach(custo => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${formatarData(custo.dataCusto || custo.data)}</td>
      <td data-label="Tipo">${escaparHtml(custo.tipoCusto || custo.tipo || "-")}</td>
      <td data-label="Descrição">${escaparHtml(custo.descricao || "-")}</td>
      <td data-label="Valor">${formatarMoeda(custo.valor)}</td>
      <td data-label="Observações">${escaparHtml(custo.observacoes || custo.observacao || "-")}</td>
      <td data-label="Ações">
        <div class="table-actions table-actions--single">
          <button type="button" data-acao="editar-custo" data-custo-id="${escaparHtml(custo.id)}">Editar</button>
        </div>
      </td>
    `;

    tabelaCustosProduto.appendChild(linha);
  });
}

function obterCustosVendaDaVenda(vendaId) {
  return contextoProduto.custosVenda.filter(custo => Number(custo.vendaId) === Number(vendaId));
}

function obterConsumosDaVenda(vendaId) {
  return contextoProduto.consumosEstoque.filter(consumo => Number(consumo.vendaId) === Number(vendaId));
}

function renderizarVendas() {
  tabelaVendasProduto.innerHTML = "";

  if (contextoProduto.vendas.length === 0) {
    mensagemVendasProduto.textContent = "Nenhuma venda registrada para esta peça.";
    return;
  }

  mensagemVendasProduto.textContent = "";

  ordenarVendasPorData(contextoProduto.vendas).forEach(venda => {
    const custosVenda = obterCustosVendaDaVenda(venda.id);
    const consumosVenda = obterConsumosDaVenda(venda.id);
    const totalCustosVenda = custosVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0);
    const totalCustoEntradas = consumosVenda.reduce((total, consumo) => total + Number(consumo.custoTotal || 0), 0);
    const lucroVenda = valorVenda(venda) - totalCustoEntradas - totalCustosVenda;
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Data">${formatarData(obterDataVenda(venda))}</td>
      <td data-label="Quantidade">${formatarNumero(quantidadeVendida(venda))}</td>
      <td data-label="Valor unitário">${formatarMoeda(venda.valorUnitario || venda.precoUnitario)}</td>
      <td data-label="Valor total">${formatarMoeda(valorVenda(venda))}</td>
      <td data-label="Canal">${escaparHtml(venda.canalVenda || "-")}</td>
      <td data-label="Custo entradas">${formatarMoeda(totalCustoEntradas)}</td>
      <td data-label="Custos venda">${formatarMoeda(totalCustosVenda)}</td>
      <td data-label="Lucro venda">${formatarMoeda(lucroVenda)}</td>
      <td data-label="Ações">
        <div class="table-actions">
          <a class="table-link" href="detalhes-venda.html?vendaId=${encodeURIComponent(venda.id)}">Ver detalhes</a>
        </div>
      </td>
    `;

    tabelaVendasProduto.appendChild(linha);
  });
}

async function carregarContextoSupabase(pecaId) {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    return null;
  }

  const [
    produto,
    entradas,
    custosPeca,
    vendas,
    custosVenda,
    consumosEstoque
  ] = await Promise.all([
    window.supabaseService.buscarPecaPorId(pecaId),
    window.supabaseService.listarEntradasEstoque(),
    window.supabaseService.listarCustosPeca(),
    window.supabaseService.listarVendas(),
    window.supabaseService.listarCustosVenda(),
    window.supabaseService.listarConsumosEstoque()
  ]);

  if (!produto) {
    return { produto: null };
  }

  const entradasProduto = (entradas || []).filter(entrada => Number(entrada.pecaId) === Number(pecaId));
  const custosPecaProduto = (custosPeca || []).filter(custo => Number(custo.pecaId) === Number(pecaId));
  const vendasProduto = (vendas || []).filter(venda => Number(venda.pecaId) === Number(pecaId));
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
    origemPrincipal: produto.origem || entradasProduto.find(entrada => entrada.origemDescricao)?.origemDescricao || ""
  };
}

function carregarContextoLocal(pecaId) {
  const produto = buscarProdutosLocais().find(item => Number(item.id) === Number(pecaId));

  if (!produto) {
    return { produto: null };
  }

  const vendas = buscarVendasLocais().filter(venda => Number(venda.pecaId || 0) === Number(pecaId));
  const vendaIds = new Set(vendas.map(venda => Number(venda.id)));
  const custosPeca = buscarCustosLocais().filter(custo => Number(custo.pecaId || 0) === Number(pecaId));
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
    origemPrincipal
  };
}

function renderizarTela() {
  const produto = contextoProduto.produto;

  mensagemProdutoNaoEncontrado.textContent = "";
  renderizarDadosProduto(produto);
  renderizarResumo();
  renderizarEntradas();
  renderizarCustos();
  renderizarVendas();
}

function renderizarNaoEncontrado(mensagem) {
  mensagemProdutoNaoEncontrado.textContent = mensagem;
  dadosProduto.innerHTML = "";
  resumoFinanceiro.innerHTML = "";
  tabelaEntradasProduto.innerHTML = "";
  tabelaCustosProduto.innerHTML = "";
  tabelaVendasProduto.innerHTML = "";
}

async function iniciarDetalhes() {
  const pecaId = obterPecaIdDaUrl();

  if (!pecaId) {
    renderizarNaoEncontrado("Produto não encontrado.");
    return;
  }

  try {
    const contextoSupabase = await carregarContextoSupabase(pecaId);
    contextoProduto = contextoSupabase || carregarContextoLocal(pecaId);

    if (!contextoProduto.produto) {
      renderizarNaoEncontrado("Produto não encontrado.");
      return;
    }

    renderizarTela();
    if (deveAbrirEdicaoProduto()) {
      abrirFormularioEdicaoProduto();
    }
  } catch (erro) {
    console.error(erro);
    renderizarNaoEncontrado("Não foi possível carregar os detalhes da peça pelo Supabase.");
  }
}

botaoImagemProduto?.addEventListener("click", abrirSeletorImagemProduto);

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

tabelaCustosProduto?.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-acao='editar-custo']");

  if (botao) {
    abrirFormularioEdicaoCusto(botao.dataset.custoId);
  }
});

iniciarDetalhes();
