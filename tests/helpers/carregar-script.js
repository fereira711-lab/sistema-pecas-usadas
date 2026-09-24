// Carrega um script feito para o navegador (sem export) dentro de um contexto isolado do Node.
// Os arquivos de producao nao precisam mudar: o contexto recebe um `window` e um `document`
// minimos, e as funcoes declaradas no topo do script ficam acessiveis pelo objeto retornado.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const raizProjeto = path.resolve(__dirname, "..", "..");

function criarDocumentoFalso(elementos = {}) {
  return {
    getElementById: id => elementos[id] || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ classList: { add() {}, remove() {}, contains: () => false } }),
    addEventListener: () => {}
  };
}

function carregarScript(caminhoRelativo, { elementos = {} } = {}) {
  const arquivo = path.join(raizProjeto, caminhoRelativo);
  const codigo = fs.readFileSync(arquivo, "utf8");
  const contexto = {
    console,
    document: criarDocumentoFalso(elementos)
  };

  contexto.window = contexto;
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto, { filename: arquivo });

  return contexto;
}

module.exports = { carregarScript };
