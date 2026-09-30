import { authStore } from '@/hooks/useAuth'
import { generateUUID, storage } from './utils'

interface AuditEntry {
  id: string
  action: string
  details: string
  userName: string
  userId: string
  timestamp: number
}

const auditStorage = storage(['audit-log'])

function getCurrentUser() {
  const user = authStore.action.getCurrentUser()

  if (!user) {
    return { id: 'system', name: 'Sistema' }
  }

  return { id: user.id, name: user.name }
}

export function logAudit(action: string, details: string) {
  const user = getCurrentUser()
  const entry: AuditEntry = {
    id: generateUUID(),
    action,
    details,
    userName: user.name,
    userId: user.id,
    timestamp: new Date().getTime(),
  }

  const log = getAuditLog()

  log.unshift(entry)

  if (log.length > 500) {
    log.length = 500
  }

  auditStorage.save('audit-log', log)
}

export function getAuditLog() {
  return auditStorage.load<AuditEntry[]>('audit-log', [])
}
