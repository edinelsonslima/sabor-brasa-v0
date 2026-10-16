import { authStore } from '@/stores/auth'
import { auditStore } from '@/stores/audit'
import { generateUUID } from '@/lib/utils'
export function logAudit(action: string, details: string) {
  const user = authStore.getState().user
  auditStore.action.add({ id: generateUUID(), action, details, userName: user?.name ?? 'Sistema',
    userId: user?.id ?? 'system', timestamp: Date.now() })
}
export function getAuditLog() { return auditStore.getState() }
