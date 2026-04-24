const params = new URLSearchParams(window.location.search);
const origemId = Number(params.get("origemId"));

const tituloOrigem = document.getElementById("tituloOrigem");
const subtituloOrigem = document.getElementById("subtituloOrigem");
const mensagemOrigemNaoEncontrada = document.getElementById("mensagemOrigemNaoEncontrada");
const dadosOrigem = document.getElementById("dadosOrigem");
const resumoOrigem = document.getElementById("resumoOrigem");
const mensagemProdutosOrigem = document.getElementById("mensagemProdutosOrigem");
const tabelaProdutosOrigem = document.getElementById("tabelaProdutosOrigem");

const TIPOS_CUSTO_PECA = ["real", "rateado", "simbolico"];
const TIPO_CUSTO_PADRAO = "real";

function buscarLista(chave) {
  return JSON.parse(localStorage.getItem(chave)) || [];
}

function salvarLista(chave, lista) {
  localStorage.setItem(chave, JSON.stringify(lista));
}

function garantirIdsDasOrigens(origens) {
  const origensComId = origens.map((origem, indice) => ({
    ...origem,
    id: origem.id || Date.now() + indice
  }));

  salvarLista("origens", origensComId);
  return origensComId;
}

function normalizarTipoCusto(tipoCusto) {
  return TIPOS_CUSTO_PECA.includes(tipoCusto) ? tipoCusto : TIPO_CUSTO_PADRAO;
}

function garantirDadosDasPecas(pecas) {
  const pecasNormalizadas = pecas.map((peca, indice) => {
    return {
      ...peca,
      id: peca.id || Date.now() + indice,
      origemId: Number(peca.origemId || 0),
      tipoCusto: normalizarTipoCusto(peca.tipoCusto)
    };
  });

  salvarLista("produtos", pecasNormalizadas);
  return pecasNormalizadas;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function somarCustosPorSku(custos, sku) {
  return custos
    .filter(custo => custo.sku === sku)
    .reduce((total, custo) => total + Number(custo.valor || 0), 0);
}

function somarCampo(lista, campo) {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

function lucroVenda(venda) {
  return Number(venda.lucroBruto || 0);
}

function calcularCustoPeca(peca, pecasDaOrigem, origem) {
  if (peca.tipoCusto !== "rateado") {
    return Number(peca.custo || 0);
  }

  if (!origem || pecasDaOrigem.length === 0) {
    return Number(peca.custo || 0);
  }

  return Number(origem.valorPago || 0) / pecasDaOrigem.length;
}

function renderizarDadosOrigem(origem) {
  tituloOrigem.textContent = origem.descricao;
  subtituloOrigem.textContent = `${origem.tipo} - ${origem.dataCompra}`;

  dadosOrigem.innerHTML = `
    <article class="detail-card">
      <span>ID</span>
      <strong>${origem.id}</strong>
    </article>
    <article class="detail-card">
      <span>Tipo</span>
      <strong>${origem.tipo}</strong>
    </article>
    <article class="detail-card">
      <span>Descrição</span>
      <strong>${origem.descricao}</strong>
    </article>
    <article class="detail-card">
      <span>Valor pago</span>
      <strong>${formatarMoeda(origem.valorPago)}</strong>
    </article>
    <article class="detail-card">
      <span>Data da compra</span>
      <strong>${origem.dataCompra}</strong>
    </article>
    <article class="detail-card">
      <span>Observações</span>
      <strong>${origem.observacoes || "-"}</strong>
    </article>
  `;
}

function renderizarResumo(origem, pecas, custos, vendas) {
  const skus = pecas.map(peca => peca.sku);
  const vendasDaOrigem = vendas.filter(venda => skus.includes(venda.sku));
  const custosDosProdutos = pecas.reduce((total, peca) => total + somarCustosPorSku(custos, peca.sku), 0);
  const custoBaseProdutos = pecas.reduce((total, peca) => {
    return total + calcularCustoPeca(peca, pecas, origem);
  }, 0);
  const faturamento = somarCampo(vendasDaOrigem, "valorTotal");
  const lucroBruto = vendasDaOrigem.reduce((total, venda) => total + lucroVenda(venda), 0);

  resumoOrigem.innerHTML = `
    <article class="summary-card">
      <span>Valor pago na origem</span>
      <strong>${formatarMoeda(origem.valorPago)}</strong>
    </article>
    <article class="summary-card">
      <span>Peças vinculadas</span>
      <strong>${pecas.length}</strong>
    </article>
    <article class="summary-card">
      <span>Custo base das peças</span>
      <strong>${formatarMoeda(custoBaseProdutos)}</strong>
    </article>
    <article class="summary-card">
      <span>Custos diversos</span>
      <strong>${formatarMoeda(custosDosProdutos)}</strong>
    </article>
    <article class="summary-card">
      <span>Faturamento da origem</span>
      <strong>${formatarMoeda(faturamento)}</strong>
    </article>
    <article class="summary-card">
      <span>Lucro bruto da origem</span>
      <strong>${formatarMoeda(lucroBruto)}</strong>
    </article>
  `;
}

function renderizarPecas(origem, pecas, custos, vendas) {
  tabelaProdutosOrigem.innerHTML = "";

  if (pecas.length === 0) {
    mensagemProdutosOrigem.textContent = "Nenhuma peça vinculada a esta origem.";
    return;
  }

  mensagemProdutosOrigem.textContent = "";

  pecas.forEach(peca => {
    const custoBase = calcularCustoPeca(peca, pecas, origem);
    const custosDiversos = somarCustosPorSku(custos, peca.sku);
    const vendasProduto = vendas.filter(venda => venda.sku === peca.sku);
    const faturamento = somarCampo(vendasProduto, "valorTotal");
    const lucroBruto = vendasProduto.reduce((total, venda) => total + lucroVenda(venda), 0);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td data-label="Produto">${peca.nome}</td>
      <td data-label="SKU">${peca.sku || "-"}</td>
      <td data-label="Categoria">${peca.categoria || "-"}</td>
      <td data-label="Quantidade">${peca.quantidade || 0}</td>
      <td data-label="Custo base">${formatarMoeda(custoBase)}</td>
      <td data-label="Custos diversos">${formatarMoeda(custosDiversos)}</td>
      <td data-label="Faturamento">${formatarMoeda(faturamento)}</td>
      <td data-label="Lucro bruto">${formatarMoeda(lucroBruto)}</td>
      <td data-label="Ações">
        <div class="table-actions">
          <a class="table-link" href="detalhes-produto.html?sku=${encodeURIComponent(peca.sku)}">Ver peça</a>
        </div>
      </td>
    `;

    tabelaProdutosOrigem.appendChild(linha);
  });
}

function iniciarDetalhesOrigem() {
  const origens = garantirIdsDasOrigens(buscarLista("origens"));
  const pecas = garantirDadosDasPecas(buscarLista("produtos"));
  const custos = buscarLista("custosDiversos");
  const vendas = buscarLista("vendas");
  const origem = origens.find(o => o.id === origemId);

  if (!origem) {
    mensagemOrigemNaoEncontrada.textContent = "Origem não encontrada.";
    dadosOrigem.innerHTML = "";
    resumoOrigem.innerHTML = "";
    return;
  }

  const pecasDaOrigem = pecas.filter(p => p.origemId === origemId);

  mensagemOrigemNaoEncontrada.textContent = "";
  renderizarDadosOrigem(origem);
  renderizarResumo(origem, pecasDaOrigem, custos, vendas);
  renderizarPecas(origem, pecasDaOrigem, custos, vendas);
}

iniciarDetalhesOrigem();
