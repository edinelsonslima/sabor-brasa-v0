import { authStore, ALL_MODULES } from '@/stores/auth'
import { generateUUID } from '@/lib/utils'
import { logAudit } from './audit'
export function login(email: string, password: string): string | null {
  const user = authStore.getState().users.find((u) => u.email === email)
  if (!user) {
    return 'Usuário não encontrado'
  }
  if (user.password !== password) {
    return 'Senha incorreta'
  }
  authStore.action.setUser(user)
  logAudit('login', `Login realizado: ${user.name} (${user.email})`)
  return null
}
export function logout() {
  const name = authStore.getState().user?.name ?? '?'
  logAudit('logout', `Logout: ${name}`)
  authStore.action.setUser(null)
}
export function register(name: string, email: string, password: string): string | null {
  const users = authStore.getState().users
  if (users.some((u) => u.email === email)) {
    return 'E-mail já cadastrado'
  }
  authStore.action.add({
    id: generateUUID(),
    name,
    email,
    password,
    modules: users.length === 0 ? [...ALL_MODULES] : [],
    initials: name
      ? name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '?',
  })
  logAudit('user_registered', `Novo usuário: ${name} (${email})`)
  return null
}
