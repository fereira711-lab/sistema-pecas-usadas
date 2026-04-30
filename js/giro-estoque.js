const mensagemGiroEstoque = document.getElementById("mensagemGiroEstoque");
const resumoGiroEstoque = document.getElementById("resumoGiroEstoque");
const tabelaGiroEstoque = document.getElementById("tabelaGiroEstoque");

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

function formatarSku(peca) {
  return String(peca.sku || peca.codigo || peca.codigo_peca || peca.cod || "").trim() || "-";
}

function formatarNome(peca) {
  return peca.nome || peca.nome_peca || peca.nomeProduto || peca.descricao || `Peca ${peca.id}`;
}

function obterDataVenda(venda) {
  return String(venda.dataVenda || venda.data_venda || venda.createdAt || venda.created_at || "").slice(0, 10);
}

function agruparPorId(lista, campo) {
  return lista.reduce((mapa, item) => {
    const id = Number(item[campo] || 0);

    if (!mapa[id]) {
      mapa[id] = [];
    }

    mapa[id].push(item);
    return mapa;
  }, {});
}

function somarQuantidadeVendida(vendas) {
  return vendas.reduce((total, venda) => {
    return total + Number(venda.quantidadeVendida || venda.quantidadeVendidaNaVenda || venda.quantidade_vendida || 0);
  }, 0);
}

function obterUltimaVenda(vendas) {
  return vendas.reduce((ultimaData, venda) => {
    const dataVenda = obterDataVenda(venda);

    if (!dataVenda) {
      return ultimaData;
    }

    return !ultimaData || dataVenda > ultimaData ? dataVenda : ultimaData;
  }, "");
}

function obterDataEntradaOuCadastro(peca, entradasDaPeca) {
  const datasEntrada = entradasDaPeca
    .map(entrada => String(entrada.dataEntrada || entrada.createdAt || "").slice(0, 10))
    .filter(Boolean)
    .sort();

  return String(peca.createdAt || peca.created_at || datasEntrada[0] || "").slice(0, 10);
}

function calcularDiasDesde(dataIso) {
  if (!dataIso) {
    return null;
  }

  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const partes = String(dataIso).slice(0, 10).split("-").map(Number);

  if (partes.length !== 3 || partes.some(Number.isNaN)) {
    return null;
  }

  const data = new Date(partes[0], partes[1] - 1, partes[2]);
  const milissegundosPorDia = 24 * 60 * 60 * 1000;

  return Math.max(0, Math.floor((inicioHoje - data) / milissegundosPorDia));
}

function classificarGiro(quantidadeVendida, diasSemVenda) {
  if (quantidadeVendida <= 0) {
    return "sem venda";
  }

  if (diasSemVenda <= 15) {
    return "rapido";
  }

  if (diasSemVenda <= 30) {
    return "atencao";
  }

  return "parado";
}

function obterClasseClassificacao(classificacao) {
  const classes = {
    rapido: "status-badge status-badge--fast",
    atencao: "status-badge status-badge--attention",
    parado: "status-badge status-badge--stopped",
    "sem venda": "status-badge status-badge--no-sale"
  };

  return classes[classificacao] || "status-badge";
}

function formatarClassificacao(classificacao) {
  const nomes = {
    rapido: "Rapido",
    atencao: "Atencao",
    parado: "Parado",
    "sem venda": "Sem venda"
  };

  return nomes[classificacao] || classificacao;
}

function criarCard(titulo, valor, classe = "") {
  const classeCard = classe ? `summary-card ${classe}` : "summary-card";

  return `
    <article class="${classeCard}">
      <span>${titulo}</span>
      <strong>${valor}</strong>
    </article>
  `;
}

function calcularGiro(dados) {
  const vendasPorPeca = agruparPorId(dados.vendas, "pecaId");
  const entradasPorPeca = agruparPorId(dados.entradasEstoque, "pecaId");

  return dados.pecas.map(peca => {
    const pecaId = Number(peca.id);
    const vendasDaPeca = vendasPorPeca[pecaId] || [];
    const entradasDaPeca = entradasPorPeca[pecaId] || [];
    const quantidadeVendidaPorVendas = somarQuantidadeVendida(vendasDaPeca);
    const quantidadeVendidaPeca = Number(peca.quantidadeVendida || peca.quantidade_vendida || 0);
    const quantidadeVendida = quantidadeVendidaPorVendas || quantidadeVendidaPeca;
    const estoqueDisponivel = Math.max(0, Number(peca.quantidade || 0) - quantidadeVendida);
    const ultimaVenda = obterUltimaVenda(vendasDaPeca);
    const dataBaseSemVenda = ultimaVenda || obterDataEntradaOuCadastro(peca, entradasDaPeca);
    const diasSemVenda = calcularDiasDesde(dataBaseSemVenda);
    const classificacao = classificarGiro(quantidadeVendidaPorVendas, diasSemVenda);

    return {
      sku: formatarSku(peca),
      nome: formatarNome(peca),
      estoqueDisponivel,
      quantidadeVendida,
      ultimaVenda,
      diasSemVenda,
      classificacao
    };
  }).sort((a, b) => {
    const prioridade = { parado: 1, atencao: 2, "sem venda": 3, rapido: 4 };
    return prioridade[a.classificacao] - prioridade[b.classificacao] || b.diasSemVenda - a.diasSemVenda;
  });
}

function renderizarResumo(linhas) {
  const totais = linhas.reduce((mapa, linha) => {
    mapa[linha.classificacao] = (mapa[linha.classificacao] || 0) + 1;
    return mapa;
  }, {});

  resumoGiroEstoque.innerHTML =
    criarCard("Rapido", totais.rapido || 0, "summary-card--profit") +
    criarCard("Atencao", totais.atencao || 0) +
    criarCard("Parado", totais.parado || 0, "summary-card--loss") +
    criarCard("Sem venda", totais["sem venda"] || 0);
}

function renderizarTabela(linhas) {
  tabelaGiroEstoque.innerHTML = "";

  if (linhas.length === 0) {
    mensagemGiroEstoque.textContent = "Nenhuma peca cadastrada para analisar.";
    return;
  }

  mensagemGiroEstoque.textContent = "";

  linhas.forEach(linha => {
    const tr = document.createElement("tr");
    const diasSemVenda = linha.diasSemVenda === null ? "-" : linha.diasSemVenda;

    tr.innerHTML = `
      <td data-label="SKU">${linha.sku}</td>
      <td data-label="Nome da peca"><strong class="product-name">${linha.nome}</strong></td>
      <td data-label="Estoque disponivel">${linha.estoqueDisponivel}</td>
      <td data-label="Qtd. vendida">${linha.quantidadeVendida}</td>
      <td data-label="Ultima venda">${formatarData(linha.ultimaVenda)}</td>
      <td data-label="Dias sem venda">${diasSemVenda}</td>
      <td data-label="Classificacao">
        <span class="${obterClasseClassificacao(linha.classificacao)}">${formatarClassificacao(linha.classificacao)}</span>
      </td>
    `;

    tabelaGiroEstoque.appendChild(tr);
  });
}

async function carregarDados() {
  if (!window.supabaseService || !window.supabaseService.estaConfigurado()) {
    mensagemGiroEstoque.textContent = "Configure o Supabase para carregar o giro de estoque.";
    return null;
  }

  try {
    const [pecas, vendas, entradasEstoque] = await Promise.all([
      window.supabaseService.listarPecas(),
      window.supabaseService.listarVendas(),
      window.supabaseService.listarEntradasEstoque()
    ]);

    return {
      pecas: pecas || [],
      vendas: vendas || [],
      entradasEstoque: entradasEstoque || []
    };
  } catch (erro) {
    console.error("Erro ao carregar giro de estoque:", erro);
    mensagemGiroEstoque.textContent = "Nao foi possivel carregar os dados do giro de estoque.";
    return null;
  }
}

async function iniciarGiroEstoque() {
  const dados = await carregarDados();

  if (!dados) {
    resumoGiroEstoque.innerHTML = "";
    tabelaGiroEstoque.innerHTML = "";
    return;
  }

  const linhas = calcularGiro(dados);
  renderizarResumo(linhas);
  renderizarTabela(linhas);
}

document.addEventListener("DOMContentLoaded", iniciarGiroEstoque);
