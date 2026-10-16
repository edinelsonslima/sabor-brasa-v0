import { createStore } from '@/hooks/useStore'
import { generateUUID } from '@/lib/utils'
import type { Product } from '@/types'
type CreateProduct = Omit<Product, 'id' | 'averageCost'> & { averageCost?: number }
export const productStore = createStore({
  persist: { key: 'products', version: 2, migrate: (data: unknown) => (data as Product[]).map((p) => ({
    ...p, category: p.category ?? 'bebida', stock: p.stock ?? 0, averageCost: p.averageCost ?? 0,
  })) },
  createState: (): Product[] => [],
  createActions: (set, get) => ({
    get: (id: string) => get().find((p) => p.id === id),
    add: (data: CreateProduct) => {
      const product: Product = { ...data, id: generateUUID(), category: data.category ?? 'bebida',
        stock: data.stock ?? 0, averageCost: data.averageCost ?? 0 }
      set([product, ...get()]); return product
    },
    update: (id: string, data: Partial<CreateProduct>) => {
      set(get().map((p) => p.id === id ? { ...p, ...data, id } : p))
    },
    setStock: (id: string, stock: number, averageCost?: number) => {
      set(get().map((p) => p.id === id ? { ...p, stock, averageCost: averageCost ?? p.averageCost } : p))
    },
    delete: (id: string) => { set(get().filter((p) => p.id !== id)) },
  }),
})
