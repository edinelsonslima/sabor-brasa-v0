import { logAudit } from '@/lib/audit'
import { formatCurrency, generateUUID, localDateKey } from '@/lib/utils'
import type { StockEntry } from '@/types'
import { expenseStore } from './useExpenses'
import { productStore } from './useProducts'
import { createStore } from './useStore'

type Actions = {
  add: (productId: string, quantity: number, unitCost: number) => StockEntry | undefined
  delete: (id: string) => void
}

export const stockEntryStore = createStore<StockEntry[], Actions>({
  persist: { key: 'stock-entries' },

  createState: () => [],

  createActions: (set, get) => ({
    add: (productId, quantity, unitCost) => {
      const product = productStore.action.get(productId)
      if (!product || quantity <= 0 || unitCost < 0) return undefined

      const totalCost = quantity * unitCost
      const date = Date.now()

      productStore.action.receiveStock(productId, quantity, unitCost)

      expenseStore.action.add({
        description: `Compra de estoque: ${quantity}x ${product.name}`,
        category: 'bebidas_comida',
        amount: totalCost,
        date: localDateKey(date),
      })
      const expenseId = expenseStore.getState().expenses[0]?.id

      const entry: StockEntry = { id: generateUUID(), productId, quantity, unitCost, totalCost, date, expenseId }
      set((prev) => [entry, ...prev])

      logAudit(
        'stock_entry_created',
        `Estoque lançado: ${quantity}x ${product.name} a ${formatCurrency(unitCost)} (total ${formatCurrency(totalCost)})`,
      )
      return entry
    },

    delete: (id) => {
      const entry = get().find((e) => e.id === id)
      if (!entry) return

      productStore.action.changeStock(entry.productId, -entry.quantity)
      if (entry.expenseId) expenseStore.action.delete(entry.expenseId)
      set((prev) => prev.filter((e) => e.id !== id))

      const name = productStore.action.get(entry.productId)?.name ?? '?'
      logAudit('stock_entry_deleted', `Lançamento de estoque excluído: ${entry.quantity}x ${name}`)
    },
  }),
})
