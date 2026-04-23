import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dallfhhzoibxwcpgagsl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhbGxmaGh6b2lieHdjcGdhZ3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODI4NjUsImV4cCI6MjA5MjM1ODg2NX0.ol0MxVpWxHyy3m1A6da_XBf5OLw-wSh2XFKzBpHQGHs"
);

// formato moeda
function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

// carregar resumo geral
async function carregarResumo() {
  const { data, error } = await supabase
    .from("vw_lucro_geral")
    .select("*")
    .single();

  if (error) {
    console.error(error);
    alert("Erro no resumo");
    return;
  }

  document.getElementById("totalInvestido").innerText =
    "Investido: " + moeda(data.total_investido_geral);

  document.getElementById("totalVendido").innerText =
    "Vendido: " + moeda(data.total_vendido);

  document.getElementById("lucroGeral").innerText =
    "Lucro: " + moeda(data.lucro_geral);
}

// carregar origens
async function carregarOrigens() {
  const { data } = await supabase
    .from("vw_lucro_origem")
    .select("*");

  const tabela = document.getElementById("tabelaOrigens");
  tabela.innerHTML = "";

  data.forEach(o => {
    tabela.innerHTML += `
      <tr>
        <td>${o.origem_id}</td>
        <td>${o.descricao}</td>
        <td>${moeda(o.lucro_origem)}</td>
      </tr>
    `;
  });
}

// carregar peças
async function carregarPecas() {
  const { data } = await supabase
    .from("vw_lucro_peca")
    .select("*");

  const tabela = document.getElementById("tabelaPecas");
  tabela.innerHTML = "";

  data.forEach(p => {
    tabela.innerHTML += `
      <tr>
        <td>${p.peca_id}</td>
        <td>${p.nome_peca}</td>
        <td>${p.status}</td>
        <td>${p.lucro_peca == null ? "-" : moeda(p.lucro_peca)}</td>
      </tr>
    `;
  });
}

// iniciar tudo
async function iniciar() {
  await carregarResumo();
  await carregarOrigens();
  await carregarPecas();
}

iniciar();