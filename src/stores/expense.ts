import { createStore } from '@/hooks/useStore'
import { generateUUID } from '@/lib/utils'
import type { Expense } from '@/types'
type Create = Omit<Expense, 'id' | 'timestamp'>
export const expenseStore = createStore({
  persist: { key: 'expenses' },
  createState: (): { expenses: Expense[] } => ({ expenses: [] }),
  createActions: (set, get) => ({
    get: (id: string) => get().expenses.find((p) => p.id === id),
    add: (data: Create): Expense => {
      const entry = { ...data, id: generateUUID(), timestamp: Date.now() }
      set({ expenses: [entry, ...get().expenses] })
      return entry
    },
    update: (id: string, data: Partial<Create>) => {
      set({ expenses: get().expenses.map((p) => (p.id === id ? { ...p, ...data, id } : p)) })
    },
    delete: (id: string) => {
      set({ expenses: get().expenses.filter((p) => p.id !== id) })
    },
  }),
})
