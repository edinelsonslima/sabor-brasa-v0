# Roadmap

## Phase 1: store refactor
- [ ] Versioned persisted CRUD stores and compatible data migration
- [ ] Inventory, comanda, sale, purchase and audit/auth services
- [ ] Shared local date library and pure finance selectors; update consumers without redesign
- [ ] Regression tests, lint cleanup and end-to-end verification
- [ ] Phase 2 bugfixes: blocked until user supplies phase 2

## Correções pendentes
- [ ] `vibrate` defensivo (`window?.navigator?.vibrate?.(pattern)`) em `src/lib/utils.ts`
- [ ] Input do nome da comanda (`Orders.tsx`) maior/padrão visual

## Novos pedidos (após ajustes do usuário)
- [ ] Editar produto cadastrado (tela de produtos)
- [ ] Quantidade (estoque) e valor total ao cadastrar produto
- [ ] Adicionar ao estoque (na edição de produto)
- [ ] Deduzir estoque automaticamente quando produto vendido
- [ ] Categoria de produto: bebida e comida
- [ ] Filtro da página de vendas por bebida/comida funcionando
- [ ] Finalizar tela de detalhes da comanda (pedidos da mesa)
