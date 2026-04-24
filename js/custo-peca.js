function buscarCustosLocais() {
  return JSON.parse(localStorage.getItem("custosDiversos")) || [];
}

function salvarCustoLocal(custo) {
  const custos = buscarCustosLocais();
  custos.push(custo);
  localStorage.setItem("custosDiversos", JSON.stringify(custos));
}

function salvarCustoNoCache(custo) {
  const custos = buscarCustosLocais().filter(item => Number(item.id) !== Number(custo.id));
  custos.push(custo);
  localStorage.setItem("custosDiversos", JSON.stringify(custos));
}

function lerCustoDoFormulario() {
  return {
    id: Date.now(),
    pecaId: Number(document.getElementById("pecaId").value),
    tipo: document.getElementById("tipo").value.trim(),
    tipoCusto: document.getElementById("tipo").value.trim(),
    descricao: document.getElementById("descricao").value.trim(),
    valor: Number(document.getElementById("valor").value),
    data: new Date().toISOString().slice(0, 10),
    dataCusto: new Date().toISOString().slice(0, 10)
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
    const custoSalvo = window.supabaseService && window.supabaseService.estaConfigurado()
      ? await window.supabaseService.salvarCustoPeca(custo)
      : null;

    if (custoSalvo) {
      salvarCustoNoCache(custoSalvo);
      alert("Custo da peca cadastrado no Supabase com sucesso.");
    } else {
      salvarCustoLocal(custo);
      alert("Custo da peca cadastrado no armazenamento temporario. Configure o Supabase para salvar no banco.");
    }

    window.location.href = "estoque.html";
  } catch (erro) {
    console.error("Erro ao cadastrar custo da peca:", erro);
    alert("Nao foi possivel salvar o custo da peca no Supabase. Verifique se a peca existe e se a tabela custos_peca foi criada.");
  } finally {
    botaoSalvar.disabled = false;
  }
}
