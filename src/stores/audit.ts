import { createStore } from '@/hooks/useStore'
export interface AuditEntry {
  id: string
  action: string
  details: string
  userName: string
  userId: string
  timestamp: number
}
export const auditStore = createStore({
  persist: { key: 'audit' },
  createState: (): AuditEntry[] => [],
  createActions: (set, get) => ({
    add: (entry: AuditEntry) => {
      set([entry, ...get()].slice(0, 500))
    },
    delete: (id: string) => {
      set(get().filter((e) => e.id !== id))
    },
  }),
})
