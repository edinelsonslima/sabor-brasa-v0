import { logAudit } from '@/lib/audit'
import { generateUUID } from '@/lib/utils'
import type { Order, OrderProduct } from '@/types'
import { createStore } from './useStore'

type Actions = {
  get: (id: string) => Order | undefined
  create: (name: string, products?: OrderProduct[]) => Order
  update: (id: string, data: Partial<Pick<Order, 'name' | 'products'>>) => void
  /** Remove a comanda. `silent` evita log de exclusão quando ela foi fechada (virou venda). */
  delete: (id: string, options?: { silent?: boolean }) => void

  setProducts: (id: string, items: OrderProduct[]) => void
  getProducts: (id: string) => OrderProduct[]
}

/** Só comandas abertas vivem aqui; ao fechar, viram `Sale` no saleStore. */
export const orderStore = createStore<Order[], Actions>({
  persist: { key: 'orders' },

  createState: () => [],

  createActions: (set, get) => ({
    get: (orderId) => get().find((order) => order.id === orderId),

    create: (name, products = []) => {
      const order: Order = { id: generateUUID(), name, openedAt: Date.now(), products }

      set((prev) => [...prev, order])
      logAudit('order_opened', `Comanda aberta: ${name}`)

      return order
    },

    update: (orderId, data) => {
      const order = get().find((o) => o.id === orderId)

      if (!order) {
        return
      }

      set((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...data } : o)))
      logAudit('order_updated', `Comanda atualizada: ${data.name ?? order.name}`)
    },

    delete: (orderId, options) => {
      const order = get().find((o) => o.id === orderId)
      set((prev) => prev.filter((o) => o.id !== orderId))

      if (!options?.silent) {
        logAudit('order_deleted', `Comanda excluída: ${order?.name ?? orderId}`)
      }
    },

    getProducts: (orderId) => get().find((o) => o.id === orderId)?.products ?? [],

    setProducts: (orderId, products) => {
      set((prev) => prev.map((o) => (o.id === orderId ? { ...o, products } : o)))
    },
  }),
})
