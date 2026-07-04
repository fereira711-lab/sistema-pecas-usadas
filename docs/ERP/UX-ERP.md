# UX do ERP

## Organização

- **Painel Geral**: entrada operacional, indicadores e alertas.
- **Produtos**: busca e lista compacta de estoque; ações principais `Detalhes` e `Vender`.
- **Cadastros**: fluxos verticais e diretos para origem, peça, venda e custo.
- **Detalhes**: centrais completas de produto, origem e venda, abertas a partir do contexto correto.
- **Análises**: produto, período e custos; concentram o conteúdo financeiro.
- **Sidebar**: navegação principal, agrupada em Painel, Produtos, Vendas, Estoque, Origens, Custos, Análises e Sistema.

## Padrões confirmados

- Interface compacta, operacional e sem textos tutoriais repetitivos.
- Tema lateral escuro; dourado apenas como detalhe; item ativo visível.
- Labels, obrigatoriedade, validações e alertas importantes permanecem explícitos.
- Termos internos como FIFO não devem dominar a interface. Preferir `Custo da peça`, `Custo calculado`, `Custo não calculado` e `Entrada consumida`.
- Tabelas/listas compactas priorizam SKU, nome, saldo, status, datas, valores e ações.
- Detalhes não substituem análises financeiras; Produtos não exibe lucro ou margem.
- Estados vazios e erros devem explicar a ausência ou falha sem fabricar valores.

## Navegação atual

`painel.html` é a entrada após login. Detalhes de produto, venda e origem não são itens diretos da sidebar. `previews/` não pertence à aplicação real. Lotes e Relatórios encaminham para as superfícies substitutas.

## Prioridades de UX

1. Integridade visível: saldo, custo calculado/pendente e erro de persistência.
2. Velocidade operacional: busca, filtros, listas compactas e ações contextuais.
3. Rastreabilidade: origem → peça → entrada → venda → consumo.
4. Separação: operação nas listas/cadastros, contexto nos detalhes e finanças nas análises.

Responsividade alvo, acessibilidade formal, navegadores suportados, métricas de usabilidade e identidade comercial final são **pendentes de confirmação**.
