import { logAudit } from '@/lib/audit'
import { generateUUID } from '@/lib/utils'
import type { Product, SaleProducts } from '@/types'
import { createStore } from './useStore'

type CreateProduct = Omit<Product, 'id'>

type Actions = {
  get: (id: string) => Product | undefined
  add: (data: CreateProduct) => Product
  update: (id: string, data: Partial<CreateProduct>) => void
  delete: (id: string) => void
  adjustStock: (items: SaleProducts, direction: 1 | -1) => void
  migrate: () => void
}

type State = {
  products: Product[]
}

export const productStore = createStore<State, Actions>({
  persist: { key: 'products' },

  createState: () => ({
    products: [],
    customProducts: [],
  }),

  createActions: (set, get) => ({
    get: (id) => {
      return get().products.find((p) => p.id === id)
    },

    add: (data) => {
      const products = get().products

      const productItem: Product = {
        ...data,
        id: generateUUID(),
        category: data.category ?? 'bebida',
        stock: data.stock ?? 0,
      }

      set({ ...get(), products: [...products, productItem] })

      logAudit('product_created', `Produto cadastrado: ${data.name}`)

      return productItem
    },

    update: (id, data) => {
      const products = get().products

      set({
        ...get(),
        products: products.map((p) => {
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
      })

      logAudit('product_edited', `Produto editado: ${id}`)
    },

    delete: (id) => {
      const products = get().products
      const product = products.find((p) => p.id === id)

      if (!product) {
        return
      }

      set({
        ...get(),
        products: products.filter((p) => p.id !== id),
      })

      logAudit('product_deleted', `Produto excluído: ${product?.name ?? '?'}`)
    },

    adjustStock: (items, direction) => {
      const sold = new Map(items.regular.map((r) => [r.id, r.quantity]))

      if (!sold.size) {
        return
      }

      set({
        ...get(),
        products: get().products.map((p) => {
          const quantity = sold.get(p.id)

          if (!quantity) {
            return p
          }

          return { ...p, stock: (p.stock ?? 0) + quantity * direction }
        }),
      })
    },

    migrate: () => {
      const products = get().products

      if (!products.length || products.every((p) => !!p.category && p.stock !== undefined)) {
        return
      }

      set({
        ...get(),
        products: products.map((p) => ({ ...p, category: p.category ?? 'bebida', stock: p.stock ?? 0 })),
      })
    },
  }),
})

// Migração: produtos criados antes de categoria/estoque existirem recebem valores padrão
productStore.action.migrate()
