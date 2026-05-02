const mensagemPeca = document.getElementById("mensagemPeca");

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

function obterMensagemErroSupabase(erro) {
  return erro?.message || erro?.details || erro?.hint || "erro desconhecido";
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

function formatarCodigoOrigem(origem) {
  return origem?.codigoOrigem || `ORI-${String(origem?.id || "").padStart(6, "0")}`;
}

async function preencherSelectOrigens() {
  const selectOrigem = document.getElementById("origemId");
  const origens = await carregarOrigens();
  const origemPreselecionada = obterOrigemIdDaUrl();

  selectOrigem.innerHTML = '<option value="">Selecione a origem</option>';

  origens.forEach(origem => {
    const opcao = document.createElement("option");
    opcao.value = origem.id;
    opcao.textContent = `${formatarCodigoOrigem(origem)} - ${origem.descricao || `Origem ${origem.id}`}`;
    selectOrigem.appendChild(opcao);
  });

  if (origemPreselecionada) {
    selectOrigem.value = String(origemPreselecionada);
  }
}

function lerPecaDoFormulario() {
  const quantidade = Number(document.getElementById("quantidade").value);
  const valorAtribuidoBruto = document.getElementById("valorAtribuidoEntrada").value.trim();
  const valorAtribuidoEntrada = valorAtribuidoBruto === "" ? 0 : Number(valorAtribuidoBruto);

  return {
    id: Date.now(),
    nome: document.getElementById("nome").value.trim(),
    sku: document.getElementById("sku").value.trim().toUpperCase(),
    quantidade,
    valorAtribuidoEntrada,
    valorAtribuidoInformado: valorAtribuidoBruto !== "",
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

  if (!peca.quantidade || peca.quantidade < 1) {
    return "A quantidade deve ser maior ou igual a 1.";
  }

  if (!Number.isFinite(peca.valorAtribuidoEntrada) || peca.valorAtribuidoEntrada < 0) {
    return "O valor atribuido para a entrada deve ser maior ou igual a zero.";
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
    dataEntrada: origem.dataCompra || new Date().toISOString().slice(0, 10),
    sku: peca.sku,
    nomePeca: peca.nome,
    origemDescricao: origem.descricao || ""
  };
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

  const origens = await carregarOrigens();
  const origemSelecionada = origens.find(origem => Number(origem.id) === Number(peca.origemId));

  if (!origemSelecionada) {
    mostrarMensagem("A origem selecionada nao foi encontrada.", "warning");
    return;
  }

  botaoSalvar.disabled = true;
  mostrarMensagem("Salvando peca...", "success");

  try {
    const quantidadeEntrada = Number(peca.quantidade || 0);
    const valorAtribuidoEntrada = Number(peca.valorAtribuidoEntrada || 0);
    const custoUnitario = quantidadeEntrada > 0 ? valorAtribuidoEntrada / quantidadeEntrada : 0;
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
      mostrarMensagem(
        peca.valorAtribuidoInformado
          ? "Peca cadastrada e entrada de estoque criada com sucesso."
          : "Peca cadastrada com entrada de estoque em custo zerado. Preencha o valor atribuido quando quiser ratear este custo.",
        peca.valorAtribuidoInformado ? "success" : "warning"
      );
    } else {
      const pecaLocal = {
        ...peca,
        custo: custoUnitario,
        custoTotal: custoUnitario
      };
      const entradaLocal = montarEntradaEstoque(pecaLocal, origemSelecionada, quantidadeEntrada, custoUnitario);

      salvarPecaNoCache(pecaLocal);
      salvarEntradaNoCache(entradaLocal);
      mostrarMensagem(
        peca.valorAtribuidoInformado
          ? "Peca salva no armazenamento local com entrada de estoque vinculada."
          : "Peca salva no armazenamento local com entrada em custo zerado.",
        peca.valorAtribuidoInformado ? "success" : "warning"
      );
    }

    setTimeout(() => {
      window.location.href = "produtos.html";
    }, 700);
  } catch (erro) {
    console.error("Erro ao cadastrar peca:", erro);
    mostrarMensagem(`Nao foi possivel salvar a peca: ${obterMensagemErroSupabase(erro)}`, "warning");
  } finally {
    botaoSalvar.disabled = false;
  }
}

preencherSelectOrigens();
