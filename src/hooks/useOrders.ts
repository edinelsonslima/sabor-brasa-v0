import { logAudit } from '@/lib/audit'
import { generateUUID } from '@/lib/utils'
import type { Order, SaleProducts } from '@/types'
import { createStore } from './useStore'

type Actions = {
  get: (id: string) => Order | undefined
  open: (name: string) => Order
  setItems: (id: string, items: SaleProducts) => void
  close: (id: string, saleId: string) => void
  delete: (id: string) => void
}

type State = {
  orders: Order[]
}

export const orderStore = createStore<State, Actions>({
  persist: { key: 'orders' },

  createState: () => ({ orders: [] }),

  createActions: (set, get) => ({
    get: (id) => get().orders.find((o) => o.id === id),

    open: (name) => {
      const order: Order = {
        id: generateUUID(),
        name,
        status: 'open',
        openedAt: Date.now(),
        items: { regular: [], custom: [] },
      }

      set({ orders: [order, ...get().orders] })
      logAudit('order_opened', `Comanda aberta: ${name}`)

      return order
    },

    setItems: (id, items) => {
      set({ orders: get().orders.map((o) => (o.id === id ? { ...o, items } : o)) })
    },

    close: (id, saleId) => {
      const order = get().orders.find((o) => o.id === id)
      set({
        orders: get().orders.map((o) =>
          o.id === id ? { ...o, status: 'closed', closedAt: Date.now(), saleId } : o,
        ),
      })
      logAudit('order_closed', `Comanda fechada: ${order?.name ?? id}`)
    },

    delete: (id) => {
      const order = get().orders.find((o) => o.id === id)
      set({ orders: get().orders.filter((o) => o.id !== id) })
      logAudit('order_deleted', `Comanda excluída: ${order?.name ?? id}`)
    },
  }),
})
