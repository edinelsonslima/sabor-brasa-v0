import { logAudit } from '@/lib/audit'
import { generateUUID } from '@/lib/utils'
import type { Product, OrderProduct } from '@/types'
import { createStore } from './useStore'

type CreateProduct = Omit<Product, 'id'>

type Actions = {
  get: (id: string) => Product | undefined
  add: (data: CreateProduct) => Product
  update: (id: string, data: Partial<CreateProduct>) => void
  delete: (id: string) => void
  changeStock: (orderProducts: OrderProduct[]) => void
}

export const productStore = createStore<Product[], Actions>({
  persist: { key: 'products' },

  createState: () => [],

  createActions: (set, get) => ({
    get: (id) => {
      return get().find((p) => p.id === id)
    },

    add: (data) => {
      const productItem: Product = {
        ...data,
        id: generateUUID(),
        category: data.category ?? 'bebida',
        stock: data.stock ?? 0,
      }

      set((prev) => [productItem, ...prev])

      logAudit('product_created', `Produto cadastrado: ${data.name}`)

      return productItem
    },

    update: (id, data) => {
      set((prev) =>
        prev.map((p) => {
          if (p.id !== id) {
            return p
          }

          return {
            ...p,
            ...data,
            category: data.category ?? p.category ?? 'bebida',
            stock: data.stock ?? p.stock ?? 0,
          }
        }),
      )

      logAudit('product_edited', `Produto editado: ${id}`)
    },

    delete: (id) => {
      const product = get().find((p) => p.id === id)

      if (!product) {
        return
      }

      set((prev) => prev.filter((product) => product.id !== id))

      logAudit('product_deleted', `Produto excluído: ${product?.name ?? '?'}`)
    },

    changeStock: (orderProducts) => {
      if (!orderProducts.length) {
        return
      }

      set((prev) =>
        prev.map((product) => {
          const quantity = orderProducts.find((op) => op.productId === product.id)?.quantity

          if (quantity === undefined) {
            return product
          }

          return { ...product, stock: (product.stock ?? 0) + quantity }
        }),
      )
    },
  }),
})
