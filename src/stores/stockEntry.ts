import { createStore } from '@/hooks/useStore'
import { generateUUID } from '@/lib/utils'
import type { StockEntry } from '@/types'
export const stockEntryStore = createStore({
  persist: { key: 'stock-entries', version: 2 },
  createState: (): StockEntry[] => [],
  createActions: (set, get) => ({
    get: (id: string) => get().find((e) => e.id === id),
    add: (data: Omit<StockEntry, 'id'>) => {
      const entry = { ...data, id: generateUUID() }
      set([entry, ...get()])
      return entry
    },
    delete: (id: string) => {
      set(get().filter((e) => e.id !== id))
    },
  }),
})
