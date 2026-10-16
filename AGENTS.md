# Architecture
- Domain stores under `src/stores` persist only raw state and immutable CRUD, never import other stores; services coordinate workflows to avoid hidden side effects.
- Inventory services own all stock and weighted-cost changes; comanda additions reserve stock and closed sales are independent snapshots.
- Finance selectors accept arrays and explicit date ranges; date-to-string conversion belongs only to `src/lib/date.ts` to avoid UTC drift.
- `createStore` uses versioned migration envelopes and legacy key fallbacks so schema refactors retain existing browser data.
- UI calls services for cross-store operations and subscribes to raw arrays; date-sensitive views use a rollover hook to refresh at local midnight.