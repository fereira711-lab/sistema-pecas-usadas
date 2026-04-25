function buscarPecas() {
  return JSON.parse(localStorage.getItem("produtos")) || [];
}

function salvarPecas(pecas) {
  localStorage.setItem("produtos", JSON.stringify(pecas));
}

function buscarVendas() {
  return JSON.parse(localStorage.getItem("vendas")) || [];
}

function salvarVendas(vendas) {
  localStorage.setItem("vendas", JSON.stringify(vendas));
}

function normalizarPeca(peca) {
  const quantidade = Number(peca.quantidade || 1);
  const quantidadeVendida = Number(peca.quantidadeVendida || 0);
  const quantidadeDisponivel = Math.max(quantidade - quantidadeVendida, 0);

  return {
    ...peca,
    quantidade,
    quantidadeVendida,
    origemId: Number(peca.origemId || 0),
    status: quantidadeDisponivel <= 0 ? "vendida" : "em_estoque"
  };
}

function calcularQuantidadeDisponivel(peca) {
  return Math.max(Number(peca.quantidade || 1) - Number(peca.quantidadeVendida || 0), 0);
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

function calcularLucroVenda(venda, peca) {
  const valorTotal = Number(venda.valorTotal || venda.valorVenda || 0);
  const custoUnitario = Number(peca.custoTotal || peca.custo || 0);
  const custoPeca = custoUnitario * Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || 0);
  const totalCustosVenda = somarCustosVenda(venda.custosVenda || []);

  return valorTotal - custoPeca - totalCustosVenda;
}

async function buscarPecaParaVenda(pecaId) {
  if (window.supabaseService && window.supabaseService.estaConfigurado()) {
    const peca = await window.supabaseService.buscarPecaPorId(pecaId);
    salvarPecaNoCache(peca);
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

function renderizarDropdownPecas(pecas) {
  const campoPeca = document.getElementById("pecaId");

  if (!campoPeca) {
    return;
  }

  campoPeca.innerHTML = '<option value="">Selecione uma peça</option>';

  if (pecas.length === 0) {
    campoPeca.innerHTML = '<option value="">Nenhuma peça cadastrada</option>';
    campoPeca.disabled = true;
    return;
  }

  campoPeca.disabled = false;

  pecas.forEach(peca => {
    const quantidadeDisponivel = calcularQuantidadeDisponivel(peca);
    const opcao = document.createElement("option");

    opcao.value = peca.id;
    opcao.textContent = `${peca.nome} - ${quantidadeDisponivel} disponíveis`;
    opcao.disabled = quantidadeDisponivel <= 0;

    campoPeca.appendChild(opcao);
  });
}

function atualizarLimiteQuantidadeSelecionada() {
  const campoPeca = document.getElementById("pecaId");
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
  return params.get("pecaId");
}

function selecionarPecaDaUrl() {
  const pecaId = obterPecaIdDaUrl();
  const campoPeca = document.getElementById("pecaId");

  if (pecaId && campoPeca) {
    campoPeca.value = pecaId;
  }
}

async function inicializarFormularioVenda() {
  const campoPeca = document.getElementById("pecaId");

  if (!campoPeca) {
    return;
  }

  try {
    const pecas = await carregarPecasParaVenda();
    renderizarDropdownPecas(pecas);
    selecionarPecaDaUrl();
    atualizarLimiteQuantidadeSelecionada();
  } catch (erro) {
    console.error("Erro ao carregar peças para venda:", erro);
    renderizarDropdownPecas(buscarPecas().map(normalizarPeca));
    selecionarPecaDaUrl();
    alert("Não foi possível carregar as peças do Supabase. Verifique a configuração e tente novamente.");
  }

  campoPeca.addEventListener("change", atualizarLimiteQuantidadeSelecionada);
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

    window.location.href = "estoque.html";
  } catch (erro) {
    console.error("Erro ao cadastrar venda:", erro);
    alert("Nao foi possivel salvar a venda no Supabase. Verifique se a peca existe e se a tabela vendas foi criada.");
  } finally {
    botaoSalvar.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", inicializarFormularioVenda);
