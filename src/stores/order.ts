import { createStore } from '@/hooks/useStore'
import { generateUUID } from '@/lib/utils'
import type { Order, OrderItem } from '@/types'
export const orderStore = createStore({
  persist: { key: 'orders', version: 2 },
  createState: (): Order[] => [],
  createActions: (set, get) => ({
    get: (id: string) => get().find((o) => o.id === id),
    create: (name: string, products: OrderItem[] = []) => {
      const order: Order = { id: generateUUID(), name, products, openedAt: Date.now() }
      set([...get(), order])
      return order
    },
    update: (id: string, data: Partial<Pick<Order, 'name' | 'products'>>) => {
      set(get().map((o) => (o.id === id ? { ...o, ...data } : o)))
    },
    delete: (id: string) => {
      set(get().filter((o) => o.id !== id))
    },
    setProducts: (id: string, products: OrderItem[]) => {
      set(get().map((o) => (o.id === id ? { ...o, products } : o)))
    },
    replaceAll: (orders: Order[]) => {
      set(orders)
    },
  }),
})
