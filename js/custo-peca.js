function buscarCustosLocais() {
  return JSON.parse(localStorage.getItem("custosDiversos")) || [];
}

function salvarCustoLocal(custo) {
  const custos = buscarCustosLocais();
  custos.push(custo);
  localStorage.setItem("custosDiversos", JSON.stringify(custos));
  return custo;
}

function salvarCustoNoCache(custo) {
  const custos = buscarCustosLocais().filter(item => Number(item.id) !== Number(custo.id));
  custos.push(custo);
  localStorage.setItem("custosDiversos", JSON.stringify(custos));
}

function lerCustoDoFormulario() {
  const hoje = new Date().toISOString().slice(0, 10);

  return {
    id: Date.now(),
    pecaId: Number(document.getElementById("pecaId").value),
    tipo: document.getElementById("tipo").value.trim(),
    tipoCusto: document.getElementById("tipo").value.trim(),
    descricao: document.getElementById("descricao").value.trim(),
    valor: Number(document.getElementById("valor").value),
    data: hoje,
    dataCusto: hoje
  };
}

function validarCusto(custo) {
  if (!custo.pecaId) {
    return "Informe o ID da peca.";
  }

  if (!custo.tipo) {
    return "Informe o tipo do custo.";
  }

  if (Number.isNaN(custo.valor) || custo.valor < 0) {
    return "O valor do custo deve ser maior ou igual a zero.";
  }

  return "";
}

function preencherPecaPelaUrl() {
  const params = new URLSearchParams(window.location.search);
  const pecaId = params.get("pecaId");
  const campoPeca = document.getElementById("pecaId");

  if (pecaId && campoPeca) {
    campoPeca.value = pecaId;
  }
}

async function salvarCusto() {
  const custo = lerCustoDoFormulario();
  const erroValidacao = validarCusto(custo);
  const botaoSalvar = document.querySelector("button[onclick='salvarCusto()']");

  if (erroValidacao) {
    alert(erroValidacao);
    return;
  }

  botaoSalvar.disabled = true;

  try {
    if (window.supabaseService && window.supabaseService.estaConfigurado()) {
      const custoSalvo = await window.supabaseService.salvarCustoPeca(custo);
      salvarCustoNoCache(custoSalvo);
      alert("Custo da peca cadastrado no Supabase com sucesso.");
    } else {
      const custoLocal = salvarCustoLocal(custo);
      console.warn("Supabase nao configurado. Custo da peca salvo no armazenamento temporario.");
      if (!custoLocal) {
        throw new Error("Falha ao salvar custo da peca no armazenamento temporario.");
      }
      alert("Custo da peca cadastrado no armazenamento temporario. Configure o Supabase para salvar no banco.");
    }

    window.location.href = "estoque.html";
  } catch (erro) {
    console.error("Erro ao cadastrar custo da peca:", erro);
    try {
      const custoLocal = salvarCustoLocal(custo);
      if (!custoLocal) {
        throw new Error("Falha ao salvar custo da peca no armazenamento temporario.");
      }
      alert("Nao foi possivel salvar no Supabase. O custo da peca foi cadastrado no armazenamento temporario.");
      window.location.href = "estoque.html";
    } catch (erroFallback) {
      console.error("Erro ao salvar custo da peca no armazenamento temporario:", erroFallback);
      alert("Nao foi possivel salvar o custo da peca no Supabase nem no armazenamento temporario.");
    }
  } finally {
    botaoSalvar.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", preencherPecaPelaUrl);
