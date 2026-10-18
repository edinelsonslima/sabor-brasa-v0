import { createStore } from '@/hooks/useStore'
import { generateUUID } from '@/lib/utils'

import type { Employee } from '@/types'
type Create = Omit<Employee, 'id'>
export const employeeStore = createStore({
  persist: { key: 'employees' },
  createState: (): { employees: Employee[] } => ({ employees: [] }),
  createActions: (set, get) => ({
    get: (id: string) => get().employees.find((p) => p.id === id),
    add: (data: Create): Employee => {
      const entry = { ...data, id: generateUUID() }
      set({ employees: [entry, ...get().employees] })
      return entry
    },
    update: (id: string, data: Partial<Create>) => {
      set({ employees: get().employees.map((p) => (p.id === id ? { ...p, ...data, id } : p)) })
    },
    delete: (id: string) => {
      set({ employees: get().employees.filter((p) => p.id !== id) })
    },
  }),
})
