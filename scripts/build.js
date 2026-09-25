// Build para publicação (Netlify): copia para dist/ só o que o navegador precisa.
// Uso: node scripts/build.js
// Sem dependências: só módulos do Node.
const fs = require("node:fs");
const path = require("node:path");

const raiz = path.resolve(__dirname, "..");
const destino = path.join(raiz, "dist");

// O que vai para o navegador.
const ARQUIVOS = ["index.html", "painel.html"];
const PASTAS = ["paginas", "css", "js"];
// Imagens locais usadas pelas telas (hoje nenhuma: as fotos das peças ficam no Storage do Supabase).
const PASTAS_IMAGENS = ["img", "imagens"];
// Arquivos dessas pastas que só a documentação interna usa.
const FORA_DO_BUILD = new Set(["css/mapa-mental.css"]);
const EXTENSOES_PERMITIDAS = new Set([".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".svg", ".webp", ".ico"]);

// Nunca pode aparecer em dist/.
const EXTENSOES_PROIBIDAS = new Set([".md", ".bat", ".ps1", ".log", ".sql", ".toml", ".xml", ".env", ".err"]);
const NOMES_PROIBIDOS = [/^\.env/i, /backup/i, /^supabaseconfig\.js$/i];

function copiarPasta(origem, alvo) {
  fs.mkdirSync(alvo, { recursive: true });
  for (const item of fs.readdirSync(origem, { withFileTypes: true })) {
    const de = path.join(origem, item.name);
    const para = path.join(alvo, item.name);
    if (item.isDirectory()) {
      copiarPasta(de, para);
    } else if (EXTENSOES_PERMITIDAS.has(path.extname(item.name).toLowerCase())
      && !FORA_DO_BUILD.has(path.relative(raiz, de).split(path.sep).join("/"))) {
      fs.copyFileSync(de, para);
    }
  }
}

function listarArquivos(pasta) {
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap(item => {
    const caminho = path.join(pasta, item.name);
    return item.isDirectory() ? listarArquivos(caminho) : [caminho];
  });
}

// Confere o resultado: nada proibido e toda referência local das páginas existe em dist/.
function conferir(arquivos) {
  const problemas = [];

  for (const arquivo of arquivos) {
    const nome = path.basename(arquivo);
    if (EXTENSOES_PROIBIDAS.has(path.extname(nome).toLowerCase()) || NOMES_PROIBIDOS.some(regra => regra.test(nome))) {
      problemas.push(`arquivo que não deveria estar em dist/: ${path.relative(destino, arquivo)}`);
    }
  }

  for (const arquivo of arquivos.filter(caminho => caminho.endsWith(".html"))) {
    const html = fs.readFileSync(arquivo, "utf8");
    for (const [, referencia] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      if (/^(https?:|mailto:|tel:|data:|\/\/)/i.test(referencia)) continue;
      const caminho = path.resolve(path.dirname(arquivo), referencia.split("?")[0]);
      if (!fs.existsSync(caminho)) {
        problemas.push(`${path.relative(destino, arquivo)} aponta para ${referencia}, que não está em dist/`);
      }
    }
  }

  return problemas;
}

fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino);

ARQUIVOS.forEach(arquivo => fs.copyFileSync(path.join(raiz, arquivo), path.join(destino, arquivo)));
PASTAS.forEach(pasta => copiarPasta(path.join(raiz, pasta), path.join(destino, pasta)));
PASTAS_IMAGENS
  .filter(pasta => fs.existsSync(path.join(raiz, pasta)))
  .forEach(pasta => copiarPasta(path.join(raiz, pasta), path.join(destino, pasta)));

const arquivos = listarArquivos(destino);
const problemas = conferir(arquivos);

if (problemas.length) {
  problemas.forEach(problema => console.error(`ERRO: ${problema}`));
  process.exit(1);
}

console.log(`dist/ pronta: ${arquivos.length} arquivos.`);
