function buscarPecas() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function salvarPecas(pecas) {
  localStorage.setItem("produtos", JSON.stringify(pecas));
}

function buscarVendas() {
  return JSON.parse(localStorage.getItem("vendas")) || [];
}

function buscarEntradasLocais() {
  return JSON.parse(localStorage.getItem("entradasEstoque")) || [];
}

const campoBuscaPecaVenda = document.getElementById("buscaPecaVenda");
const sugestoesPecaVenda = document.getElementById("sugestoesPecaVenda");
const campoDataVenda = document.getElementById("dataVenda");
const listaCustosVenda = document.getElementById("listaCustosVenda");
const botaoAdicionarCustoVenda = document.getElementById("botaoAdicionarCustoVenda");
const botaoNovoTipoCustoVenda = document.getElementById("botaoNovoTipoCustoVenda");
const mensagemVenda = document.getElementById("mensagemVenda");
const resumoVendaValorUnitario = document.getElementById("resumoVendaValorUnitario");
const resumoVendaQuantidade = document.getElementById("resumoVendaQuantidade");
const resumoVendaTotal = document.getElementById("resumoVendaTotal");
const resumoVendaCustos = document.getElementById("resumoVendaCustos");
const resumoPecaVenda = document.getElementById("resumoPecaVenda");
let pecasVendaCarregadas = [];
let entradasVendaCarregadas = [];
let tiposCustoVendaCarregados = [];
let sugestoesVendaAtuais = [];
let indiceSugestaoVenda = -1;
const tiposCustoVendaPadrao = ["Embalagem", "Frete", "Comissão", "Taxa marketplace", "Taxa cartão", "Coleta", "Etiqueta", "Outros"];

function salvarVendas(vendas) {
  localStorage.setItem("vendas", JSON.stringify(vendas));
}

function normalizarPeca(peca) {
  const quantidade = Number(peca.quantidade || 1);
  const quantidadeVendida = Number(peca.quantidadeVendida || peca.quantidade_vendida || 0);
  const quantidadeDisponivel = Math.max(quantidade - quantidadeVendida, 0);

  return {
    ...peca,
    id: Number(peca.id),
    nome: peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`,
    sku: peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "",
    quantidade,
    quantidadeVendida,
    origemId: Number(peca.origemId || peca.origem_id || 0),
    status: quantidadeDisponivel <= 0 ? "vendida" : "em_estoque"
  };
}

function formatarNomePeca(peca) {
  const nome = peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`;
  const sku = String(peca.sku || "").trim();

  return sku ? `${sku} - ${nome}` : nome;
}

function escaparHtml(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escaparRegex(texto) {
  return String(texto || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatarMoedaVenda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function obterPrecoVendaPeca(peca) {
  return Number(peca.precoVenda || peca.preco_venda || peca.valorVenda || peca.valor_venda || peca.preco_sugerido || 0);
}

function obterImagemPecaVenda(peca) {
  return String(peca.imagemUrl || peca.imagem_url || "").trim();
}

function renderizarImagemPecaVenda(peca) {
  const imagemUrl = obterImagemPecaVenda(peca);
  const nome = peca.nome || peca.nome_peca || "peca";

  if (imagemUrl) {
    return `<img src="${escaparHtml(imagemUrl)}" alt="Imagem de ${escaparHtml(nome)}" loading="lazy">`;
  }

  return "<span>IMG</span>";
}

function obterStatusEstoqueVenda(quantidadeDisponivel) {
  if (quantidadeDisponivel <= 0) {
    return {
      texto: "Sem estoque",
      classe: "sale-stock-badge sale-stock-badge--empty"
    };
  }

  if (quantidadeDisponivel <= 2) {
    return {
      texto: "Estoque baixo",
      classe: "sale-stock-badge sale-stock-badge--low"
    };
  }

  return {
    texto: "Em estoque",
    classe: "sale-stock-badge sale-stock-badge--ok"
  };
}

function destacarBusca(texto) {
  const termo = String(campoBuscaPecaVenda?.value || "").trim();
  const textoSeguro = escaparHtml(texto);

  if (!termo) {
    return textoSeguro;
  }

  return textoSeguro.replace(new RegExp(`(${escaparRegex(termo)})`, "gi"), "<mark>$1</mark>");
}

function padronizarNomeTipoCusto(nome) {
  const texto = String(nome || "").trim().replace(/\s+/g, " ").toLowerCase();

  if (!texto) {
    return "";
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function normalizarNomeTipoCusto(nome) {
  return String(nome || "").trim().toLowerCase();
}

function buscarTiposCustoVendaLocais() {
  const tipos = JSON.parse(localStorage.getItem("tiposCusto")) || [];

  if (tipos.length > 0) {
    return tipos;
  }

  return tiposCustoVendaPadrao.map((nome, indice) => ({
    id: `local-venda-${indice + 1}`,
    nome,
    categoria: "venda",
    ativo: true
  }));
}

function salvarTiposCustoVendaLocais(tipos) {
  localStorage.setItem("tiposCusto", JSON.stringify(tipos));
}

function criarOpcoesTiposCustoVenda(tipoSelecionado = "") {
  return [
    '<option value="">Tipo de custo</option>',
    ...tiposCustoVendaCarregados
      .filter(tipo => tipo.ativo !== false && ["venda", "ambos"].includes(tipo.categoria || "ambos"))
      .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"))
      .map(tipo => {
        const selecionado = tipo.nome === tipoSelecionado ? " selected" : "";
        return `<option value="${escaparHtml(tipo.nome)}" data-tipo-id="${escaparHtml(tipo.id)}"${selecionado}>${escaparHtml(tipo.nome)}</option>`;
      })
  ].join("");
}

function atualizarSelectsTiposCustoVenda() {
  listaCustosVenda?.querySelectorAll("[data-campo='tipo']").forEach(select => {
    const valorAtual = select.value;
    select.innerHTML = criarOpcoesTiposCustoVenda(valorAtual);
    select.value = valorAtual;
  });
}

function renderizarEstadoCustosVenda() {
  if (!listaCustosVenda) {
    return;
  }

  const temCustos = listaCustosVenda.querySelector(".cost-line");
  const estadoVazio = listaCustosVenda.querySelector(".sale-costs-empty");

  if (temCustos) {
    estadoVazio?.remove();
    return;
  }

  if (!estadoVazio) {
    listaCustosVenda.innerHTML = `
      <div class="sale-costs-empty">
        Nenhum custo da venda adicionado.
      </div>
    `;
  }
}

function limparCustosVenda() {
  if (!listaCustosVenda) {
    return;
  }

  listaCustosVenda.innerHTML = "";
  renderizarEstadoCustosVenda();
}

async function carregarTiposCustoVenda() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    try {
      tiposCustoVendaCarregados = await window.supabaseService.listarTiposCusto("venda") || [];
      salvarTiposCustoVendaLocais(tiposCustoVendaCarregados);
      atualizarSelectsTiposCustoVenda();
      return;
    } catch (erro) {
      console.error("Erro ao carregar tipos de custo da venda:", erro);
    }
  }

  tiposCustoVendaCarregados = buscarTiposCustoVendaLocais();
  atualizarSelectsTiposCustoVenda();
}

function adicionarLinhaCustoVenda(custo = {}) {
  if (!listaCustosVenda) {
    return;
  }

  listaCustosVenda.querySelector(".sale-costs-empty")?.remove();

  const linha = document.createElement("div");
  linha.className = "cost-line";
  linha.innerHTML = `
    <select data-campo="tipo" aria-label="Tipo de custo da venda">
      ${criarOpcoesTiposCustoVenda(custo.tipoCusto || custo.tipo || "")}
    </select>
    <input data-campo="valor" type="number" min="0" step="0.01" placeholder="Valor" value="${custo.valor || ""}">
    <input data-campo="descricao" type="text" placeholder="Observacao" value="${escaparHtml(custo.descricao || "")}">
    <button type="button" class="button-secondary" data-acao="remover-custo">Remover</button>
  `;

  listaCustosVenda.appendChild(linha);
  atualizarResumoVenda();
  renderizarEstadoCustosVenda();
}

async function criarNovoTipoCustoVenda() {
  const nomeDigitado = prompt("Nome do novo tipo de custo da venda:");
  const nomePadronizado = padronizarNomeTipoCusto(nomeDigitado);

  if (!nomeDigitado) {
    return;
  }

  if (!nomePadronizado) {
    alert("Informe um nome valido para o tipo de custo.");
    return;
  }

  const tipoExistente = tiposCustoVendaCarregados.find(tipo => (
    normalizarNomeTipoCusto(tipo.nome) === normalizarNomeTipoCusto(nomePadronizado)
  ));

  if (tipoExistente) {
    atualizarSelectsTiposCustoVenda();
    alert(`Tipo "${tipoExistente.nome}" ja existe.`);
    return;
  }

  const categoriaDigitada = prompt("Categoria do tipo: peca, venda ou ambos", "venda");
  const categoria = normalizarNomeTipoCusto(categoriaDigitada || "venda");

  if (!["peca", "venda", "ambos"].includes(categoria)) {
    alert("Categoria invalida. Use peca, venda ou ambos.");
    return;
  }

  try {
    const novoTipo = window.supabaseService && window.supabaseService.estaConfigurado()
      ? await window.supabaseService.criarTipoCusto(nomePadronizado, categoria)
      : {
          id: `local-venda-${Date.now()}`,
          nome: nomePadronizado,
          categoria,
          ativo: true
        };

    tiposCustoVendaCarregados.push(novoTipo);
    salvarTiposCustoVendaLocais(tiposCustoVendaCarregados);
    atualizarSelectsTiposCustoVenda();
    adicionarLinhaCustoVenda({ tipoCusto: novoTipo.nome });
  } catch (erro) {
    console.error("Erro ao criar tipo de custo da venda:", erro);
    alert("Nao foi possivel criar o tipo de custo.");
  }
}

function formatarNomePecaDestacado(peca) {
  const nome = peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`;
  const sku = String(peca.sku || "").trim();

  return sku
    ? `${destacarBusca(sku)} - ${destacarBusca(nome)}`
    : destacarBusca(nome);
}

function filtrarPecasPorBusca(pecas) {
  const termo = String(campoBuscaPecaVenda?.value || "").trim().toLowerCase();

  if (!termo) {
    return pecas;
  }

  return pecas.filter(peca => {
    const nome = String(peca.nome || peca.nome_peca || peca.nomeProduto || "").toLowerCase();
    const sku = String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").toLowerCase();

    return nome.includes(termo) || sku.includes(termo);
  });
}

function calcularQuantidadeDisponivel(peca) {
  return Math.max(Number(peca.quantidade || 1) - Number(peca.quantidadeVendida || 0), 0);
}

function renderizarResumoPecaVenda(peca) {
  if (!resumoPecaVenda) {
    return;
  }

  if (!peca) {
    resumoPecaVenda.innerHTML = "";
    return;
  }

  const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);
  const precoVenda = obterPrecoVendaPeca(peca);
  const statusEstoque = obterStatusEstoqueVenda(quantidadeDisponivel);

  resumoPecaVenda.innerHTML = `
    <article class="sale-selected-product">
      <div class="sale-selected-product__image">${renderizarImagemPecaVenda(peca)}</div>
      <div class="sale-selected-product__info">
        <span>SKU ${escaparHtml(peca.sku || "-")}</span>
        <strong>${escaparHtml(peca.nome || "-")}</strong>
        <small>Preco de venda: ${precoVenda > 0 ? formatarMoedaVenda(precoVenda) : "Nao informado"}</small>
      </div>
      <div class="sale-selected-product__stock">
        <span>Estoque disponivel</span>
        <strong>${quantidadeDisponivel}</strong>
      </div>
      <span class="${statusEstoque.classe}">${statusEstoque.texto}</span>
    </article>
  `;
}

function obterCampoPeca() {
  return document.getElementById("pecaId");
}

function salvarPecaNoCache(pecaAtualizada) {
  const pecas = buscarPecas().map(normalizarPeca);
  const indice = pecas.findIndex(peca => Number(peca.id) === Number(pecaAtualizada.id));

  if (indice >= 0) {
    pecas[indice] = normalizarPeca(pecaAtualizada);
  } else {
    pecas.push(normalizarPeca(pecaAtualizada));
  }

  salvarPecas(pecas);
}

function salvarVendaNoCache(venda) {
  const vendas = buscarVendas().filter(item => Number(item.id) !== Number(venda.id));
  vendas.push(venda);
  salvarVendas(vendas);
}

function lerValorCampo(id) {
  const campo = document.getElementById(id);

  if (!campo || campo.value === "") {
    return 0;
  }

  return Number(campo.value);
}

function obterDataLocalHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function preencherDataVendaPadrao() {
  if (campoDataVenda && !campoDataVenda.value) {
    campoDataVenda.value = obterDataLocalHoje();
  }
}

function criarCustoVenda(tipo, descricao, valor) {
  return {
    tipo,
    tipoCusto: tipo,
    descricao,
    valor,
    data: obterDataLocalHoje(),
    dataCusto: obterDataLocalHoje()
  };
}

function lerCustosVendaDoFormulario() {
  if (!listaCustosVenda) {
    return [];
  }

  return Array.from(listaCustosVenda.querySelectorAll(".cost-line"))
    .map(linha => {
      const selectTipo = linha.querySelector("[data-campo='tipo']");
      const tipo = selectTipo?.value || "";
      const tipoCustoId = selectTipo?.selectedOptions[0]?.dataset?.tipoId || null;
      const valor = Number(linha.querySelector("[data-campo='valor']")?.value || 0);
      const descricao = linha.querySelector("[data-campo='descricao']")?.value.trim() || tipo;

      return {
        ...criarCustoVenda(tipo, descricao, valor),
        tipoCustoId
      };
    })
    .filter(custo => custo.tipo && Number(custo.valor || 0) > 0);
}

function somarCustosVenda(custosVenda) {
  return custosVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0);
}

function zerarResumoVenda() {
  if (resumoVendaValorUnitario) {
    resumoVendaValorUnitario.textContent = formatarMoedaVenda(0);
  }

  if (resumoVendaQuantidade) {
    resumoVendaQuantidade.textContent = "0";
  }

  if (resumoVendaTotal) {
    resumoVendaTotal.textContent = formatarMoedaVenda(0);
  }

  if (resumoVendaCustos) {
    resumoVendaCustos.textContent = formatarMoedaVenda(0);
  }
}

function limparCamposOperacionaisVenda() {
  document.getElementById("pecaId").value = "";
  document.getElementById("valorVenda").value = "";
  document.getElementById("quantidadeVendidaNaVenda").value = "";
  document.getElementById("canalVenda").value = "";
  document.getElementById("observacoesVenda").value = "";

  if (campoBuscaPecaVenda) {
    campoBuscaPecaVenda.value = "";
  }

  if (campoDataVenda) {
    campoDataVenda.value = obterDataLocalHoje();
  }
}

function atualizarResumoVenda() {
  const pecaId = Number(obterCampoPeca()?.value || 0);

  if (!pecaId) {
    zerarResumoVenda();
    return;
  }

  const quantidade = Number(document.getElementById("quantidadeVendidaNaVenda")?.value || 0);
  const valorUnitario = Number(document.getElementById("valorVenda")?.value || 0);
  const custosVenda = lerCustosVendaDoFormulario();
  const totalVenda = quantidade * valorUnitario;

  if (resumoVendaValorUnitario) {
    resumoVendaValorUnitario.textContent = formatarMoedaVenda(valorUnitario);
  }

  if (resumoVendaQuantidade) {
    resumoVendaQuantidade.textContent = String(quantidade || 0);
  }

  if (resumoVendaTotal) {
    resumoVendaTotal.textContent = formatarMoedaVenda(totalVenda);
  }

  if (resumoVendaCustos) {
    resumoVendaCustos.textContent = formatarMoedaVenda(somarCustosVenda(custosVenda));
  }
}

function existeCustoVendaNegativo() {
  if (!listaCustosVenda) {
    return false;
  }

  return Array.from(listaCustosVenda.querySelectorAll("[data-campo='valor']"))
    .some(campo => Number(campo.value || 0) < 0);
}

function existeCustoVendaIncompleto() {
  if (!listaCustosVenda) {
    return false;
  }

  return Array.from(listaCustosVenda.querySelectorAll(".cost-line"))
    .some(linha => {
      const tipo = linha.querySelector("[data-campo='tipo']")?.value || "";
      const valor = Number(linha.querySelector("[data-campo='valor']")?.value || 0);
      return valor > 0 && !tipo;
    });
}

function calcularResultadoFinanceiroVenda(venda, consumosEstoque, custosVenda = venda?.custosVenda || []) {
  if (window.financeiroUtils?.calcularLucroVenda) {
    return window.financeiroUtils.calcularLucroVenda(
      {
        ...venda,
        custosVenda
      },
      consumosEstoque || [],
      custosVenda || []
    );
  }

  return {
    calculado: false,
    motivo: "financeiro indisponivel",
    receita: Number(venda?.valorTotal || venda?.valorVenda || 0),
    custoConsumido: null,
    custosVenda: somarCustosVenda(custosVenda || []),
    lucro: null,
    margem: null
  };
}

async function buscarPecaParaVenda(pecaId) {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    const peca = await window.supabaseService.buscarPecaPorId(pecaId);

    if (peca) {
      salvarPecaNoCache(peca);
    }

    return peca;
  }

  return buscarPecas()
    .map(normalizarPeca)
    .find(item => Number(item.id) === Number(pecaId));
}

async function carregarPecasParaVenda() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    const pecas = await window.supabaseService.listarPecas();
    salvarPecas(pecas.map(normalizarPeca));
    return pecas.map(normalizarPeca);
  }

  return buscarPecas().map(normalizarPeca);
}

function selecionarPeca(peca) {
  const campoPeca = obterCampoPeca();
  const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);

  if (!campoPeca) {
    return;
  }

  campoBuscaPecaVenda.value = formatarNomePeca(peca);
  fecharSugestoesVenda();
  renderizarResumoPecaVenda(peca);

  if (quantidadeDisponivel <= 0) {
    document.getElementById("quantidadeVendidaNaVenda")?.removeAttribute("max");
    campoPeca.value = "";
    return;
  }

  campoPeca.value = String(peca.id);
  atualizarLimiteQuantidadeSelecionada();
}

function fecharSugestoesVenda() {
  sugestoesPecaVenda.innerHTML = "";
  sugestoesPecaVenda.classList.remove("is-open");
  indiceSugestaoVenda = -1;
}

function mostrarMensagemVenda(texto, tipo = "success") {
  if (!mensagemVenda) {
    return;
  }

  mensagemVenda.textContent = texto;
  mensagemVenda.className = texto ? `form-message form-message--${tipo}` : "form-message";
}

function obterPrimeiroIndiceDisponivel(pecas) {
  return pecas.findIndex(peca => calcularQuantidadeDisponivel(peca) > 0);
}

function renderizarSugestoesVenda(pecas) {
  if (!String(campoBuscaPecaVenda?.value || "").trim()) {
    fecharSugestoesVenda();
    return;
  }

  sugestoesVendaAtuais = pecas;
  sugestoesPecaVenda.innerHTML = "";
  indiceSugestaoVenda = obterPrimeiroIndiceDisponivel(pecas);

  if (pecas.length === 0) {
    const item = document.createElement("div");
    item.className = "autocomplete-option";
    item.textContent = "Nenhuma peça encontrada";
    sugestoesPecaVenda.appendChild(item);
    sugestoesPecaVenda.classList.add("is-open");
    return;
  }

  pecas.forEach((peca, indice) => {
    const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);
    const botao = document.createElement("button");
    const textoQuantidade = quantidadeDisponivel > 0
      ? `${quantidadeDisponivel} disponível${quantidadeDisponivel === 1 ? "" : "s"}`
      : "SEM ESTOQUE";

    botao.type = "button";
    botao.className = `autocomplete-option${indice === indiceSugestaoVenda ? " is-active" : ""}${quantidadeDisponivel <= 0 ? " autocomplete-option--unavailable" : ""}`;
    botao.disabled = quantidadeDisponivel <= 0;
    botao.innerHTML = `
      <span>${formatarNomePecaDestacado(peca)}</span>
      <span class="autocomplete-option__meta">${textoQuantidade}</span>
    `;
    botao.addEventListener("click", () => selecionarPeca(peca));

    sugestoesPecaVenda.appendChild(botao);
  });

  sugestoesPecaVenda.classList.add("is-open");
}

function atualizarDestaqueSugestoesVenda() {
  Array.from(sugestoesPecaVenda.querySelectorAll(".autocomplete-option")).forEach((item, indice) => {
    item.classList.toggle("is-active", indice === indiceSugestaoVenda);
  });
}

function moverDestaqueSugestoesVenda(direcao) {
  const indicesDisponiveis = sugestoesVendaAtuais
    .map((peca, indice) => calcularQuantidadeDisponivel(peca) > 0 ? indice : -1)
    .filter(indice => indice >= 0);

  if (indicesDisponiveis.length === 0) {
    indiceSugestaoVenda = -1;
    atualizarDestaqueSugestoesVenda();
    return;
  }

  const posicaoAtual = indicesDisponiveis.indexOf(indiceSugestaoVenda);
  const proximaPosicao = posicaoAtual < 0
    ? 0
    : (posicaoAtual + direcao + indicesDisponiveis.length) % indicesDisponiveis.length;

  indiceSugestaoVenda = indicesDisponiveis[proximaPosicao];
  atualizarDestaqueSugestoesVenda();
}

function atualizarSugestoesVenda() {
  const campoPeca = obterCampoPeca();

  if (campoPeca) {
    campoPeca.value = "";
  }

  renderizarResumoPecaVenda(null);
  renderizarSugestoesVenda(filtrarPecasPorBusca(pecasVendaCarregadas));
  atualizarLimiteQuantidadeSelecionada();
  atualizarResumoVenda();
}

function atualizarLimiteQuantidadeSelecionada() {
  const campoPeca = obterCampoPeca();
  const campoQuantidade = document.getElementById("quantidadeVendidaNaVenda");

  if (!campoPeca || !campoQuantidade) {
    return;
  }

  const peca = buscarPecas()
    .map(normalizarPeca)
    .find(item => Number(item.id) === Number(campoPeca.value));

  if (!peca) {
    campoQuantidade.removeAttribute("max");
    renderizarResumoPecaVenda(null);
    atualizarResumoVenda();
    return;
  }

  campoQuantidade.max = calcularQuantidadeDisponivel(peca);
  renderizarResumoPecaVenda(peca);
}

function obterPecaIdDaUrl() {
  const params = new URLSearchParams(window.location.search);
  const pecaIdUrl = Number(params.get("pecaId"));

  return pecaIdUrl || null;
}

function selecionarPecaDaUrl() {
  const pecaIdUrl = obterPecaIdDaUrl();
  const campoPeca = obterCampoPeca();

  if (!campoPeca) {
    return;
  }

  if (!pecaIdUrl) {
    campoPeca.value = "";
    renderizarResumoPecaVenda(null);
    atualizarResumoVenda();
    return;
  }

  const pecaEncontrada = pecasVendaCarregadas.find(peca => Number(peca.id) === pecaIdUrl);

  if (!pecaEncontrada) {
    console.warn(`Peca com id ${pecaIdUrl} nao foi encontrada no dropdown de venda.`);
    return;
  }

  selecionarPeca(pecaEncontrada);
}

async function inicializarFormularioVenda() {
  const campoPeca = obterCampoPeca();

  preencherDataVendaPadrao();
  await carregarTiposCustoVenda();
  renderizarEstadoCustosVenda();

  if (!campoPeca) {
    return;
  }

  try {
    const [pecas, entradas] = await Promise.all([
      carregarPecasParaVenda(),
      window.supabaseService && window.supabaseService.estaConfigurado()
        ? window.supabaseService.listarEntradasEstoque()
        : Promise.resolve(buscarEntradasLocais())
    ]);

    pecasVendaCarregadas = pecas;
    entradasVendaCarregadas = entradas || [];
    selecionarPecaDaUrl();
    atualizarLimiteQuantidadeSelecionada();
  } catch (erro) {
    console.error("Erro ao carregar peças para venda:", erro);
    pecasVendaCarregadas = buscarPecas().map(normalizarPeca);
    entradasVendaCarregadas = buscarEntradasLocais();
    selecionarPecaDaUrl();
    atualizarLimiteQuantidadeSelecionada();
    alert("Não foi possível carregar as peças do Supabase. Verifique a configuração e tente novamente.");
  }

  campoBuscaPecaVenda?.addEventListener("input", atualizarSugestoesVenda);
  document.getElementById("valorVenda")?.addEventListener("input", atualizarResumoVenda);
  document.getElementById("quantidadeVendidaNaVenda")?.addEventListener("input", atualizarResumoVenda);
  listaCustosVenda?.addEventListener("input", atualizarResumoVenda);
  atualizarResumoVenda();

  campoBuscaPecaVenda?.addEventListener("focus", () => {
    if (!campoPeca.value && String(campoBuscaPecaVenda.value || "").trim()) {
      renderizarSugestoesVenda(filtrarPecasPorBusca(pecasVendaCarregadas));
    }
  });

  campoBuscaPecaVenda?.addEventListener("keydown", evento => {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      moverDestaqueSugestoesVenda(1);
      return;
    }

    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      moverDestaqueSugestoesVenda(-1);
      return;
    }

    if (evento.key === "Escape") {
      fecharSugestoesVenda();
      return;
    }

    if (evento.key !== "Enter") {
      return;
    }

    evento.preventDefault();
    const peca = sugestoesVendaAtuais[indiceSugestaoVenda] || sugestoesVendaAtuais[0];

    if (peca) {
      selecionarPeca(peca);
    }
  });

  botaoAdicionarCustoVenda?.addEventListener("click", () => adicionarLinhaCustoVenda());
  botaoNovoTipoCustoVenda?.addEventListener("click", criarNovoTipoCustoVenda);
  listaCustosVenda?.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-acao='remover-custo']");

    if (botao) {
      botao.closest(".cost-line")?.remove();
      atualizarResumoVenda();
      renderizarEstadoCustosVenda();
    }
  });
}

function lerVendaDoFormulario() {
  const quantidadeVendida = Number(document.getElementById("quantidadeVendidaNaVenda").value);
  const valorUnitario = Number(document.getElementById("valorVenda").value);
  const custosVenda = lerCustosVendaDoFormulario();
  const totalCustosVenda = somarCustosVenda(custosVenda);

  return {
    id: Date.now(),
    pecaId: Number(document.getElementById("pecaId").value),
    quantidadeVendida,
    quantidadeVendidaNaVenda: quantidadeVendida,
    valorUnitario,
    valorVendaUnitario: valorUnitario,
    valorVenda: quantidadeVendida * valorUnitario,
    valorTotal: quantidadeVendida * valorUnitario,
    canalVenda: document.getElementById("canalVenda").value.trim(),
    observacoes: document.getElementById("observacoesVenda")?.value.trim() || "",
    dataVenda: campoDataVenda?.value || obterDataLocalHoje(),
    custosVenda,
    totalCustosVenda
  };
}

function validarVenda(venda) {
  if (!venda.pecaId) {
    return "Selecione uma peça.";
  }

  if (!venda.quantidadeVendida || venda.quantidadeVendida <= 0) {
    return "Informe uma quantidade vendida maior que zero.";
  }

  if (!Number.isFinite(venda.valorUnitario) || venda.valorUnitario < 0) {
    return "Informe um valor unitario valido para a venda.";
  }

  if (!venda.dataVenda) {
    return "Informe a data da venda.";
  }

  if (existeCustoVendaNegativo()) {
    return "Os custos da venda devem ser maiores ou iguais a zero.";
  }

  if (existeCustoVendaIncompleto()) {
    return "Selecione o tipo de custo em todas as linhas com valor.";
  }

  return "";
}

function atualizarPecaVendidaLocalmente(peca, quantidadeVendida) {
  const pecaAtualizada = normalizarPeca({
    ...peca,
    quantidadeVendida: Number(peca.quantidadeVendida || 0) + quantidadeVendida
  });

  pecaAtualizada.status = pecaAtualizada.quantidadeVendida >= Number(pecaAtualizada.quantidade || 1)
    ? "vendida"
    : "em_estoque";

  salvarPecaNoCache(pecaAtualizada);
  return pecaAtualizada;
}

function atualizarPecaNaListaVenda(pecaAtualizada) {
  const pecaNormalizada = normalizarPeca(pecaAtualizada);
  const indice = pecasVendaCarregadas.findIndex(peca => Number(peca.id) === Number(pecaNormalizada.id));

  if (indice >= 0) {
    pecasVendaCarregadas[indice] = pecaNormalizada;
    return;
  }

  pecasVendaCarregadas.push(pecaNormalizada);
}

function limparFormularioVenda(opcoes = {}) {
  limparCamposOperacionaisVenda();
  limparCustosVenda();
  renderizarResumoPecaVenda(null);
  fecharSugestoesVenda();
  zerarResumoVenda();

  if (!opcoes.manterMensagem) {
    mostrarMensagemVenda("");
  }
  campoBuscaPecaVenda?.focus();

  if (window.location.search) {
    window.history.replaceState({}, "", window.location.pathname);
  }
}

async function salvarVenda() {
  const venda = lerVendaDoFormulario();
  const erroValidacao = validarVenda(venda);
  const botaoSalvar = document.querySelector("button[onclick='salvarVenda()']");

  if (erroValidacao) {
    alert(erroValidacao);
    return;
  }

  botaoSalvar.disabled = true;

  try {
    const peca = await buscarPecaParaVenda(venda.pecaId);

    if (!peca) {
      alert("Peca nao encontrada.");
      return;
    }

    const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);

    if (venda.quantidadeVendida > quantidadeDisponivel) {
      alert("Quantidade vendida maior que o estoque disponivel.");
      return;
    }

    if (window.supabaseService && window.supabaseService.estaConfigurado()) {
      const resultado = await window.supabaseService.salvarVenda(venda);
      const consumosEstoque = await window.supabaseService.listarConsumosEstoque();
      const resultadoFinanceiro = calcularResultadoFinanceiroVenda(
        resultado.venda,
        consumosEstoque,
        resultado.venda.custosVenda || []
      );
      const vendaComLucro = {
        ...resultado.venda,
        resultadoFinanceiro,
        lucroVenda: resultadoFinanceiro.calculado ? resultadoFinanceiro.lucro : null
      };

      salvarVendaNoCache(vendaComLucro);
      salvarPecaNoCache(resultado.peca);
      atualizarPecaNaListaVenda(resultado.peca);
      mostrarMensagemVenda("Venda e custos da venda cadastrados com sucesso.", "success");
    } else {
      const pecaAtualizada = atualizarPecaVendidaLocalmente(peca, venda.quantidadeVendida);
      const resultadoFinanceiro = calcularResultadoFinanceiroVenda(venda, [], venda.custosVenda || []);
      salvarVendaNoCache({
        ...venda,
        produtoNome: pecaAtualizada.nome,
        sku: pecaAtualizada.sku || "",
        resultadoFinanceiro,
        lucroVenda: resultadoFinanceiro.calculado ? resultadoFinanceiro.lucro : null
      });
      atualizarPecaNaListaVenda(pecaAtualizada);
      mostrarMensagemVenda("Venda cadastrada no armazenamento temporario. Configure o Supabase para salvar no banco.", "warning");
    }

    limparFormularioVenda({ manterMensagem: true });
  } catch (erro) {
    console.error("Erro ao cadastrar venda:", erro);
    mostrarMensagemVenda(`Nao foi possivel salvar a venda: ${erro.message || "erro desconhecido"}`, "warning");
  } finally {
    botaoSalvar.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", inicializarFormularioVenda);
