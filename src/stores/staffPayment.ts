import { createStore } from '@/hooks/useStore'
import { generateUUID } from '@/lib/utils'
import { localDateKey } from '@/lib/date'
import type { StaffPayment } from '@/types'
type Create = Omit<StaffPayment, 'id' | 'timestamp'>
export const staffPaymentStore = createStore({
  persist: { key: 'payments', version: 2, migrate: (data: unknown) => ({ payments: (data as { payments: StaffPayment[] }).payments.map((p) => ({ ...p, date: localDateKey(p.date) })) }) },
  createState: (): { payments: StaffPayment[] } => ({ payments: [] }),
  createActions: (set, get) => ({
    get: (id: string) => get().payments.find((p) => p.id === id),
    add: (data: Create): StaffPayment => {
      const entry = { ...data, id: generateUUID(), timestamp: Date.now() }
      set({ payments: [entry, ...get().payments] }); return entry
    },
    update: (id: string, data: Partial<Create>) => {
      set({ payments: get().payments.map((p) => p.id === id ? { ...p, ...data, id } : p) })
    },
    delete: (id: string) => { set({ payments: get().payments.filter((p) => p.id !== id) }) },
  }),
})
