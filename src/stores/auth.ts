import { createStore } from '@/hooks/useStore'
import type { Module } from '@/types'
export interface AppUser { id: string; name: string; email: string; password: string; initials: string; modules: Module[] }
export const ALL_MODULES: Module[] = ['sale', 'stock', 'payments', 'manager', 'audit', 'admin']
type State = { user: AppUser | null; users: AppUser[] }
export const authStore = createStore({
  persist: { key: 'auth', version: 2, migrate: (data: unknown): State => {
    const state = data as State
    const migrateUser = (u: AppUser) => ({ ...u, modules: u.modules ?? [...ALL_MODULES] })
    return { users: (state.users ?? []).map(migrateUser), user: state.user ? migrateUser(state.user) : null }
  } },
  createState: (): State => ({ user: null, users: [] }),
  createActions: (set, get) => ({
    getCurrentUser: () => get().user,
    setUser: (user: AppUser | null) => { set({ ...get(), user }) },
    add: (user: AppUser) => { set({ users: [...get().users, user], user }) },
    update: (id: string, data: Partial<Omit<AppUser, 'id'>>) => {
      const current = get()
      set({ users: current.users.map((u) => u.id === id ? { ...u, ...data } : u),
        user: current.user?.id === id ? { ...current.user, ...data } : current.user })
    },
  }),
})
