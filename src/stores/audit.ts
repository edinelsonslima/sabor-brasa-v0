import { createStore } from '@/hooks/useStore'
export interface AuditEntry { id: string; action: string; details: string; userName: string; userId: string; timestamp: number }
export const auditStore = createStore({
  persist: { key: 'audit', version: 2, legacyKeys: ['sabor-brasa-audit-log', 'jhp-store-audit-log', 'jhp-audit-log'] },
  createState: (): AuditEntry[] => [],
  createActions: (set, get) => ({
    add: (entry: AuditEntry) => { set([entry, ...get()].slice(0, 500)) },
    delete: (id: string) => { set(get().filter((e) => e.id !== id)) },
  }),
})
