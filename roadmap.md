# Roadmap — Sabor & Brasa

## Current state
- Client-only PWA; all data in localStorage via `createStore` (`sabor-brasa-store-<key>`).
- Layout: `src/stores` (raw persisted CRUD), `src/services` (inventory, comandas, sales, purchases, records, auth, audit), `src/selectors/finance.ts` (pure derived totals), `src/lib/date.ts` (only Date→string).
- Auth: salted SHA-256 (`crypto.subtle`).

## Stock policy
- Adding to a comanda reserves stock; editing/removing/deleting a comanda releases it.
- Closing creates an independent `Sale` snapshot (no second deduction); sale edit applies only deltas, atomically; sale delete releases.
- Purchase delete is blocked when its quantity was already consumed.
- Badge: stock ≤ 0 error, ≤ LOW_STOCK warning.

## Cost model
- Each stock entry records qty/unit cost, updates weighted average cost and auto-creates an expense.
- Sale items snapshot `unitCost`; estimated margin = Σ(price − cost)·qty, separate from cash profit (sales − staff payments − expenses).

## Done
- [x] Phase 1 store refactor + tests (inventory, comandas, purchases, sales, date TZ)
- [x] Phase 2 fixes: stock badge, item-count label, password hashing, package name, bugs A–G

## Open
- [ ] Stock entry history screen (list/delete)
