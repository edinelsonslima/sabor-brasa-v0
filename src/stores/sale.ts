import { createStore } from '@/hooks/useStore'
import { generateUUID } from '@/lib/utils'
import type { Sale } from '@/types'
export type CreateSale = Omit<Sale, 'id'>
export const saleStore = createStore({
  persist: { key: 'sales' },
  createState: (): { sales: Sale[] } => ({ sales: [] }),
  createActions: (set, get) => ({
    get: (id: string) => get().sales.find((s) => s.id === id),
    add: (data: CreateSale) => {
      const sale: Sale = { ...data, id: generateUUID() }
      set({ sales: [sale, ...get().sales].sort((a, b) => b.closedAt - a.closedAt) })
      return sale.id
    },
    update: (id: string, data: Partial<CreateSale>) => {
      set({
        sales: get()
          .sales.map((s) => (s.id === id ? { ...s, ...data, id } : s))
          .sort((a, b) => b.closedAt - a.closedAt),
      })
    },
    delete: (id: string) => {
      set({ sales: get().sales.filter((s) => s.id !== id) })
    },
    replaceAll: (sales: Sale[]) => {
      set({ sales: [...sales].sort((a, b) => b.closedAt - a.closedAt) })
    },
  }),
})
