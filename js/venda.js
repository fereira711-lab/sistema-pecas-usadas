function buscarPecas() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function salvarPecas(pecas) {
  localStorage.setItem("produtos", JSON.stringify(pecas));
}

function buscarVendas() {
  return JSON.parse(localStorage.getItem("vendas")) || [];
}

function buscarOrigens() {
  return JSON.parse(localStorage.getItem("origens")) || [];
}

function salvarOrigens(origens) {
  localStorage.setItem("origens", JSON.stringify(origens));
}

const campoBuscaPecaVenda = document.getElementById("buscaPecaVenda");
const sugestoesPecaVenda = document.getElementById("sugestoesPecaVenda");
const campoDataVenda = document.getElementById("dataVenda");
let pecasVendaCarregadas = [];
let origensVendaCarregadas = [];
let sugestoesVendaAtuais = [];
let indiceSugestaoVenda = -1;

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

function destacarBusca(texto) {
  const termo = String(campoBuscaPecaVenda?.value || "").trim();
  const textoSeguro = escaparHtml(texto);

  if (!termo) {
    return textoSeguro;
  }

  return textoSeguro.replace(new RegExp(`(${escaparRegex(termo)})`, "gi"), "<mark>$1</mark>");
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

function obterDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function preencherDataVendaPadrao() {
  if (campoDataVenda && !campoDataVenda.value) {
    campoDataVenda.value = obterDataHoje();
  }
}

function criarCustoVenda(tipo, descricao, valor) {
  return {
    tipo,
    tipoCusto: tipo,
    descricao,
    valor,
    data: new Date().toISOString().slice(0, 10),
    dataCusto: new Date().toISOString().slice(0, 10)
  };
}

function lerCustosVendaDoFormulario() {
  const custos = [
    criarCustoVenda("embalagem", "Custo de embalagem", lerValorCampo("custoEmbalagem")),
    criarCustoVenda("comissao", "Custo de comissao", lerValorCampo("custoComissao")),
    criarCustoVenda("frete", "Custo de frete", lerValorCampo("custoFrete")),
    criarCustoVenda("outros", "Outros custos", lerValorCampo("custoOutros"))
  ];

  return custos.filter(custo => Number(custo.valor || 0) > 0);
}

function somarCustosVenda(custosVenda) {
  return custosVenda.reduce((total, custo) => total + Number(custo.valor || 0), 0);
}

function existeCustoVendaNegativo() {
  return ["custoEmbalagem", "custoComissao", "custoFrete", "custoOutros"]
    .some(id => lerValorCampo(id) < 0);
}

function normalizarSku(sku) {
  return String(sku || "").trim().toUpperCase();
}

function obterOrigensDoProduto(peca) {
  const sku = normalizarSku(peca.sku);
  const origensPorSku = origensVendaCarregadas.filter(origem => normalizarSku(origem.produtoSku || origem.produto_sku) === sku);

  return origensPorSku.length > 0
    ? origensPorSku
    : origensVendaCarregadas.filter(origem => Number(origem.id) === Number(peca.origemId || 0));
}

function calcularCustoBasePeca(peca) {
  const origensDoProduto = obterOrigensDoProduto(peca);

  const totalUnidades = origensDoProduto.reduce((total, origem) => {
    return total + Number(origem.quantidadeTotal || origem.quantidade_total || 0);
  }, 0);
  const totalInvestido = origensDoProduto.reduce((total, origem) => {
    return total + Number(origem.valorPago || origem.valor_pago || origem.custoTotal || origem.custo_total || 0);
  }, 0);

  if (totalUnidades <= 0 || totalInvestido <= 0) {
    return Number(peca.custoTotal || peca.custo || 0);
  }

  return totalInvestido / totalUnidades;
}

function calcularLucroVenda(venda, peca) {
  const valorTotal = Number(venda.valorTotal || venda.valorVenda || 0);
  const custoUnitario = calcularCustoBasePeca(peca);
  const custoPeca = custoUnitario * Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || 0);
  const totalCustosVenda = somarCustosVenda(venda.custosVenda || []);

  return valorTotal - custoPeca - totalCustosVenda;
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

async function carregarOrigensParaVenda() {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    const origens = await window.supabaseService.listarOrigens();
    salvarOrigens(origens);
    return origens;
  }

  return buscarOrigens();
}

function selecionarPeca(peca) {
  const campoPeca = obterCampoPeca();
  const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);

  if (!campoPeca || quantidadeDisponivel <= 0) {
    return;
  }

  campoPeca.value = String(peca.id);
  campoBuscaPecaVenda.value = formatarNomePeca(peca);
  fecharSugestoesVenda();
  atualizarLimiteQuantidadeSelecionada();
}

function fecharSugestoesVenda() {
  sugestoesPecaVenda.innerHTML = "";
  sugestoesPecaVenda.classList.remove("is-open");
  indiceSugestaoVenda = -1;
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

  renderizarSugestoesVenda(filtrarPecasPorBusca(pecasVendaCarregadas));
  atualizarLimiteQuantidadeSelecionada();
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
    return;
  }

  campoQuantidade.max = calcularQuantidadeDisponivel(peca);
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

  if (!campoPeca) {
    return;
  }

  try {
    const [pecas, origens] = await Promise.all([
      carregarPecasParaVenda(),
      carregarOrigensParaVenda()
    ]);

    pecasVendaCarregadas = pecas;
    origensVendaCarregadas = origens;
    selecionarPecaDaUrl();
    atualizarLimiteQuantidadeSelecionada();
  } catch (erro) {
    console.error("Erro ao carregar peças para venda:", erro);
    pecasVendaCarregadas = buscarPecas().map(normalizarPeca);
    origensVendaCarregadas = buscarOrigens();
    selecionarPecaDaUrl();
    atualizarLimiteQuantidadeSelecionada();
    alert("Não foi possível carregar as peças do Supabase. Verifique a configuração e tente novamente.");
  }

  campoBuscaPecaVenda?.addEventListener("input", atualizarSugestoesVenda);

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
    dataVenda: campoDataVenda?.value || obterDataHoje(),
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
      const vendaComLucro = {
        ...resultado.venda,
        lucroVenda: calcularLucroVenda(resultado.venda, resultado.peca)
      };

      salvarVendaNoCache(vendaComLucro);
      salvarPecaNoCache(resultado.peca);
      alert("Venda e custos da venda cadastrados no Supabase com sucesso.");
    } else {
      const pecaAtualizada = atualizarPecaVendidaLocalmente(peca, venda.quantidadeVendida);
      salvarVendaNoCache({
        ...venda,
        produtoNome: pecaAtualizada.nome,
        sku: pecaAtualizada.sku || "",
        lucroVenda: calcularLucroVenda(venda, pecaAtualizada)
      });
      alert("Venda e custos da venda cadastrados no armazenamento temporario. Configure o Supabase para salvar no banco.");
    }

    window.location.href = "produtos.html";
  } catch (erro) {
    console.error("Erro ao cadastrar venda:", erro);
    alert(`Nao foi possivel salvar a venda no Supabase: ${erro.message || "erro desconhecido"}`);
  } finally {
    botaoSalvar.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", inicializarFormularioVenda);
