# Backlog inicial

Itens derivados de lacunas ou riscos observáveis no código. Não representam autorização para alterar o sistema.

## Crítica

- Confirmar que todas as migrations SQL, RPCs, FKs, índices e a coluna `pecas.imagem_url` estão aplicados no Supabase remoto.
- Auditar RLS, grants, autenticação e política do bucket público `pecas`; configuração atual não documenta essas políticas.
- Definir e testar recuperação para venda sem consumo, falha após RPC e divergência entre `pecas` e entradas.

## Alta

- Remover, após decisão formal, ambiguidades entre persistência Supabase e fallbacks de dados em `localStorage`; hoje várias telas ainda contêm caminhos locais.
- Definir processo de cancelamento, devolução e estorno preservando FIFO e histórico de consumo.
- Validar unicidade e política de geração/alteração de SKU.
- Criar testes de regressão para `financeiro-utils.js`, `criar_peca_com_entrada` e `registrar_venda_fifo`.

## Média

- Confirmar o uso ou descontinuação de campos legados/sem fluxo claro: `produto_id`, `cliente_id`, `fornecedor_id`, `created_at`/`criado_em` e duplicidades de custo na peça/origem.
- Confirmar se `vw_saldos_entradas_estoque` deve ser consumida pela aplicação.
- Consolidar tratamento visual de erro, vazio e `Custo não calculado` entre telas.
- Validar acessibilidade, responsividade e navegação por teclado nas páginas operacionais.

## Baixa

- Revisar páginas e scripts legados (`dashboard`, `lotes`, `relatorios`) e definir política de compatibilidade.
- Definir se a área visual de marketplace permanece como placeholder ou sai da interface até planejamento.
- Documentar navegadores suportados, convenções de release, suporte e treinamento.
- Padronizar acentuação e nomenclatura de títulos sem alterar significado operacional.
