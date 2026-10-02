import { logAudit } from '@/lib/audit'
import { formatCurrency, generateUUID, localDateKey } from '@/lib/utils'
import type { Sale, SaleItem } from '@/types'
import { productStore } from './useProducts'
import { createStore } from './useStore'

export type CreateSale = Omit<Sale, 'id'>

type Stats = { saleId: string[]; total: number; pix: number; cash: number }

type Actions = {
  get: (id: string) => Sale | undefined
  /** `skipStock` só para importação de dados legados que nunca mexeram no estoque */
  add: (data: CreateSale, options?: { skipStock?: boolean }) => string
  update: (id: string, data: Partial<CreateSale>) => void
  delete: (id: string) => void
  /** Substitui todas as vendas sem mexer no estoque (migração de dados) */
  replaceAll: (sales: Sale[]) => void
  /** Recalcula today/month (ex.: virada do dia com o app aberto) */
  refreshStats: () => void
}

type State = {
  sales: Sale[]
  today: Stats
  month: Stats
}

/** direction -1 = baixa no estoque (venda); +1 = devolve ao estoque */
function applyStock(items: SaleItem[], direction: 1 | -1) {
  for (const item of items) {
    if (item.productId) {
      productStore.action.changeStock(item.productId, direction * item.quantity)
    }
  }
}

function withStats(sales: Sale[]): State {
  return { sales, today: calculateStats(sales, 'today'), month: calculateStats(sales, 'month') }
}

export const saleStore = createStore<State, Actions>({
  persist: { key: 'sales' },

  createState: () => withStats([]),

  createActions: (set, get) => ({
    get: (id) => get().sales.find((s) => s.id === id),

    add: (data, options) => {
      const id = generateUUID()
      const sale: Sale = { ...data, id }
      const sales = [sale, ...get().sales].sort((a, b) => b.closedAt - a.closedAt)

      if (!options?.skipStock) {
        applyStock(sale.items, -1)
      }

      set(withStats(sales))

      const count = sale.items.reduce((s, i) => s + i.quantity, 0)
      logAudit('sale_created', `Venda "${sale.name}" de ${count} itens - Total: ${formatCurrency(sale.total)}`)

      return id
    },

    update: (id, data) => {
      const previous = get().sales.find((s) => s.id === id)

      if (!previous) {
        return
      }

      if (data.items) {
        applyStock(previous.items, 1)
        applyStock(data.items, -1)
      }

      set(withStats(get().sales.map((s) => (s.id === id ? { ...s, ...data, id } : s))))

      logAudit('sale_updated', `Venda editada: ${previous.name}`)
    },

    delete: (id) => {
      const sale = get().sales.find((s) => s.id === id)

      if (!sale) {
        return
      }

      applyStock(sale.items, 1)
      set(withStats(get().sales.filter((s) => s.id !== id)))

      logAudit('sale_deleted', `Venda excluída: ${sale.name} - Total: ${formatCurrency(sale.total)}`)
    },

    replaceAll: (sales) => set(withStats([...sales].sort((a, b) => b.closedAt - a.closedAt))),

    refreshStats: () => set(withStats(get().sales)),
  }),
})

function calculateStats(sales: Sale[], period: 'today' | 'month'): Stats {
  const today = localDateKey()
  const prefix = period === 'today' ? today : today.slice(0, 7)

  const stats: Stats = { saleId: [], total: 0, pix: 0, cash: 0 }

  for (const s of sales) {
    if (!localDateKey(s.closedAt).startsWith(prefix)) {
      continue
    }

    stats.saleId.push(s.id)
    stats.total += s.total
    stats.pix += s.pix
    stats.cash += s.cash
  }

  return stats
}
