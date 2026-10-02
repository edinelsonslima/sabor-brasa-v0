import { logAudit } from '@/lib/audit'
import { formatCurrency, generateUUID, localDateKey } from '@/lib/utils'
import type { Sale } from '@/types'
import { createStore } from './useStore'

export type CreateSale = Omit<Sale, 'id'>

type Stats = { saleId: string[]; total: number; pix: number; cash: number }

type Actions = {
  get: (id: string) => Sale | undefined
  add: (data: CreateSale, options?: { skipStock?: boolean }) => string
  update: (id: string, data: Partial<CreateSale>) => void
  delete: (id: string) => void
  replaceAll: (sales: Sale[]) => void
  refreshStats: () => void
}

type State = {
  sales: Sale[]
  today: Stats
  month: Stats
}

function withStats(sales: Sale[]): State {
  return { sales, today: calculateStats(sales, 'today'), month: calculateStats(sales, 'month') }
}

export const saleStore = createStore<State, Actions>({
  persist: { key: 'sales' },

  createState: () => withStats([]),

  createActions: (set, get) => ({
    get: (id) => get().sales.find((s) => s.id === id),

    add: (data, _options) => {
      const id = generateUUID()
      const sale: Sale = { ...data, id }
      const sales = [sale, ...get().sales].sort((a, b) => b.closedAt - a.closedAt)

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

      set(withStats(get().sales.map((s) => (s.id === id ? { ...s, ...data, id } : s))))

      logAudit('sale_updated', `Venda editada: ${previous.name}`)
    },

    delete: (id) => {
      const sale = get().sales.find((s) => s.id === id)

      if (!sale) {
        return
      }

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
