import { logAudit } from '@/lib/audit'
import { generateUUID } from '@/lib/utils'
import type { Order, OrderProduct } from '@/types'
import { createStore } from './useStore'

type Actions = {
  get: (id: string) => Order | undefined
  create: (name: string) => Order
  update: (id: string, updateOrder: Partial<Order>) => void
  delete: (id: string) => void

  setProducts: (id: string, items: OrderProduct[]) => void
  getProducts: (id: string) => OrderProduct[]
}

export const orderStore = createStore<Order[], Actions>({
  persist: { key: 'orders' },

  createState: () => [],

  createActions: (set, get) => ({
    get: (orderId) => {
      return get().find((order) => order.id === orderId)
    },

    create: (name) => {
      const order: Order = {
        id: generateUUID(),
        name: name,
        status: 'open',
        openedAt: new Date().getTime(),
        products: [],
      }

      set((prev) => [...prev, order])
      logAudit('order_opened', `Comanda aberta: ${name}`)

      return order
    },

    update: (orderId, updateOrder) => {
      const orders = [...get()]
      const orderIndex = orders.findIndex((order) => order.id === orderId)

      if (orderIndex === -1) {
        return
      }

      orders[orderIndex].id = updateOrder?.id ?? orders[orderIndex]?.id
      orders[orderIndex].name = updateOrder?.name ?? orders[orderIndex]?.name
      orders[orderIndex].products = updateOrder?.products ?? orders[orderIndex]?.products
      orders[orderIndex].status = updateOrder?.status ?? orders[orderIndex]?.status
      orders[orderIndex].openedAt = updateOrder?.openedAt ?? orders[orderIndex]?.openedAt
      orders[orderIndex].paymentMethod = updateOrder?.paymentMethod ?? orders[orderIndex]?.paymentMethod
      orders[orderIndex].closedAt = updateOrder?.closedAt ?? orders[orderIndex]?.closedAt

      if (orders[orderIndex].price) {
        orders[orderIndex].price.cash = updateOrder?.price?.cash ?? orders[orderIndex]?.price?.cash
        orders[orderIndex].price.pix = updateOrder?.price?.pix ?? orders[orderIndex]?.price?.pix
        orders[orderIndex].price.total = updateOrder?.price?.total ?? orders[orderIndex]?.price?.total
      }

      set(orders)

      if (updateOrder?.status === 'closed') {
        logAudit('order_closed', `Comanda fechada: ${orders[orderIndex].name ?? orderId}`)
        return
      }

      if (updateOrder?.status === 'open') {
        logAudit('order_opened', `Comanda aberta: ${orders[orderIndex].name ?? orderId}`)
        return
      }

      logAudit('order_updated', `Comanda atualizada: ${orders[orderIndex].name ?? orderId}`)
    },

    delete: (orderId) => {
      const order = get().find((o) => o.id === orderId)
      set((prev) => [...prev.filter((o) => o.id !== orderId)])
      logAudit('order_deleted', `Comanda excluída: ${order?.name ?? orderId}`)
    },

    getProducts: (orderId) => {
      const order = get().find((o) => o.id === orderId)
      return order?.products ?? []
    },

    setProducts: (orderId, products) => {
      const orders = [...get()]
      const orderIndex = orders.findIndex((o) => o.id === orderId)

      if (orderIndex === -1) {
        return
      }

      orders[orderIndex].products = products

      set(orders)
    },
  }),
})
