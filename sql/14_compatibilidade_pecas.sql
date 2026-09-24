-- Compatibilidade da peça (redesenho, seção 9 da especificação).
-- Texto livre e opcional: modelos/anos em que a peça serve (ex.: "Onix 2013–2019; Prisma 2013–2019").
-- Só acrescenta a coluna; nenhum dado existente muda. Entra na busca de Produtos.
-- O campo no cadastro e na edição da peça vem na Fase 5.

alter table public.pecas
  add column if not exists compatibilidade text null;
