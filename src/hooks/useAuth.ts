import { logAudit } from '@/lib/audit'
import { generateUUID } from '@/lib/utils'
import type { Module } from '@/types'
import { createStore } from './useStore'

export interface AppUser {
  id: string
  name: string
  email: string
  password: string
  initials: string
  modules: Module[]
}

const ALL_MODULES: Module[] = ['sale', 'stock', 'payments', 'manager', 'audit', 'admin']

type State = {
  user: AppUser | null
  users: AppUser[]
}

type Actions = {
  getCurrentUser: () => AppUser | null
  login: (email: string, password: string) => string | null
  logout: () => void
  register: (name: string, email: string, password: string) => string | null
  update: (user: Partial<Omit<AppUser, 'id'>>) => void
}

// Migração: usuários persistidos antes do campo `modules` recebem todos os módulos.
// Executa antes da criação do store para que o estado carregado já venha corrigido.
;(() => {
  if (typeof localStorage === 'undefined') {
    return
  }

  const key = 'jhp-store-store-auth'
  const raw = localStorage.getItem(key)
  if (!raw) {
    return
  }

  try {
    const parsed = JSON.parse(raw)
    const data = parsed?.data as Partial<State> | undefined
    if (!data) {
      return
    }

    const users = Array.isArray(data.users) ? (data.users as AppUser[]) : []
    const user = (data.user ?? null) as AppUser | null

    const needs = users.some((u) => !Array.isArray(u.modules)) || (user !== null && !Array.isArray(user.modules))
    if (!needs) {
      return
    }

    const migratedUsers = users.map((u) => (Array.isArray(u.modules) ? u : { ...u, modules: [...ALL_MODULES] }))
    const migratedUser = user && !Array.isArray(user.modules) ? { ...user, modules: [...ALL_MODULES] } : user

    parsed.data = { ...data, users: migratedUsers, user: migratedUser }
    parsed.updatedAt = new Date().getTime()
    localStorage.setItem(key, JSON.stringify(parsed))
  } catch {
    // noop
  }
})()

export const authStore = createStore<State, Actions>({
  persist: { key: 'auth' },

  createState: () => ({
    user: null,
    users: [],
  }),

  createActions: (set, get) => ({
    getCurrentUser: () => {
      return get().user
    },

    login: (email, password) => {
      const users = get().users

      const found = users.find((u) => u.email === email)

      if (!found) {
        return 'Usuário não encontrado'
      }

      if (found.password !== password) {
        return 'Senha incorreta'
      }

      set({ ...get(), user: found })
      logAudit('login', `Login realizado: ${found.name} (${found.email})`)

      return null
    },

    logout: () => {
      const userName = get().user?.name ?? '?'

      set({ ...get(), user: null })
      logAudit('logout', `Logout: ${userName}`)
    },

    register: (name, email, password) => {
      const users = get().users

      if (users.some((u) => u.email === email)) {
        return 'E-mail já cadastrado'
      }

      const user = {
        id: generateUUID(),
        password,
        name,
        email,
        modules: users.length === 0 ? [...ALL_MODULES] : [],
        initials: !name
          ? '?'
          : name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
      }

      set({ users: [...get().users, user], user })
      logAudit('user_registered', `Novo usuário: ${name} (${email})`)

      return null
    },

    update: (data) => {
      const user = get().user

      if (!user) {
        return 'Usuário não autenticado'
      }

      set({ ...get(), user: { ...user, ...data } })
      logAudit('user_updated', `Usuário atualizado: ${user.name} (${user.email})`)
    },
  }),
})
