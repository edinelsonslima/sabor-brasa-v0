import { logAudit } from '@/lib/audit'
import { generateUUID } from '@/lib/utils'
import type { Tenant } from '@/types'
import { createStore } from './useStore'

type State = {
  tenant: Tenant
}

type Actions = {
  get: () => Tenant
  update: (name: string) => void
}

// Migra somente o nome padrão antigo, preservando nomes personalizados.
;(() => {
  if (typeof localStorage === 'undefined') return

  const key = 'jhp-store-store-tenant'
  const raw = localStorage.getItem(key)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw)
    if (parsed?.data?.tenant?.name !== 'JHP Produtos') return

    parsed.data.tenant.name = 'Sabor & Brasa'
    parsed.updatedAt = Date.now()
    localStorage.setItem(key, JSON.stringify(parsed))
  } catch {
    // Mantém o estado atual caso o valor persistido seja inválido.
  }
})()

export const tenantStore = createStore<State, Actions>({
  persist: { key: 'tenant' },

  createState: () => ({
    tenant: { id: generateUUID(), name: 'Sabor & Brasa' },
  }),

  createActions: (set, get) => ({
    get: () => {
      return get().tenant
    },

    update: (name) => {
      const tenant = get().tenant

      set({ ...get(), tenant: { ...tenant, name } })
      logAudit('tenant_updated', `Tenant atualizado: ${name}`)
    },
  }),
})