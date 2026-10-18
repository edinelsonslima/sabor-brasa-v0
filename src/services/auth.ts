import { authStore, ALL_MODULES } from '@/stores/auth'
import type { AppUser } from '@/stores/auth'
import { generateUUID } from '@/lib/utils'
import { logAudit } from './audit'

const HASH_PREFIX = 'sha256$'

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt = generateUUID()): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`))
  return `${HASH_PREFIX}${salt}$${toHex(digest)}`
}

export function isHashed(stored: string) {
  return stored.startsWith(HASH_PREFIX)
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!isHashed(stored)) {
    return stored === password
  }
  const [, salt] = stored.split('$')
  return (await hashPassword(password, salt)) === stored
}

export async function login(email: string, password: string): Promise<string | null> {
  const user = authStore.getState().users.find((u) => u.email === email)
  if (!user) {
    return 'Usuário não encontrado'
  }
  if (!(await verifyPassword(password, user.password))) {
    return 'Senha incorreta'
  }
  let current: AppUser = user
  if (!isHashed(user.password)) {
    // Legacy plaintext password: upgrade on first successful login.
    authStore.action.update(user.id, { password: await hashPassword(password) })
    current = authStore.getState().users.find((u) => u.id === user.id) ?? user
  }
  authStore.action.setUser(current)
  logAudit('login', `Login realizado: ${user.name} (${user.email})`)
  return null
}
export function logout() {
  const name = authStore.getState().user?.name ?? '?'
  logAudit('logout', `Logout: ${name}`)
  authStore.action.setUser(null)
}
export async function register(name: string, email: string, password: string): Promise<string | null> {
  const users = authStore.getState().users
  if (users.some((u) => u.email === email)) {
    return 'E-mail já cadastrado'
  }
  authStore.action.add({
    id: generateUUID(),
    name,
    email,
    password: await hashPassword(password),
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
