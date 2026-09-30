import { logAudit } from '@/lib/audit'
import { generateUUID } from '@/lib/utils'
import type { Payment } from '@/types'
import { employeeStore } from './useEmployees'
import { createStore } from './useStore'

type CreatePayment = Omit<Payment, 'id' | 'timestamp'>

type Actions = {
  get: (id: string) => Payment | undefined
  add: (data: CreatePayment) => void
  update: (id: string, data: Partial<CreatePayment>) => void
  delete: (id: string) => void
}

type State = {
  payments: Payment[]
  today: { paymentId: string[]; total: number }
  month: { paymentId: string[]; total: number }
}

export const paymentStore = createStore<State, Actions>({
  persist: { key: 'payments' },

  createState: () => ({
    payments: [],
    today: { paymentId: [], total: 0 },
    month: { paymentId: [], total: 0 },
  }),

  createActions: (set, get) => ({
    get: (id) => {
      return get().payments.find((p) => p.id === id)
    },

    add: (data) => {
      const payments = [{ ...data, id: generateUUID(), timestamp: new Date().getTime() }, ...get().payments]

      set({
        payments,
        month: calculateStats(payments, 'month'),
        today: calculateStats(payments, 'today'),
      })

      let receiver = data.receiver?.id ?? '?'
      if (data.receiver?.type === 'employee') {
        receiver = employeeStore.action.get(data.receiver.id)?.name ?? receiver
      }

      logAudit('payment_created', `Diária de R$ ${data.amount} para ${receiver}`)
    },

    update: (id, data) => {
      const currentPayments = get().payments.map((p) => {
        return p.id === id ? { ...p, ...data } : p
      })

      set({
        payments: currentPayments,
        today: calculateStats(currentPayments, 'today'),
        month: calculateStats(currentPayments, 'month'),
      })

      logAudit('payment_updated', `Diária editada - ID: ${id}`)
    },

    delete: (id) => {
      const payments = get().payments
      const payment = payments.find((p) => p.id === id)

      const currentPayments = payments.filter((p) => p.id !== id)

      set({
        payments: currentPayments,
        today: calculateStats(currentPayments, 'today'),
        month: calculateStats(currentPayments, 'month'),
      })

      logAudit(
        'payment_deleted',
        `Diária excluída - R$ ${payment?.amount.toFixed(2) ?? '?'} de ${payment?.receiver?.id ?? '?'}`,
      )
    },
  }),
})

function calculateStats(payments: Payment[], period: 'today' | 'month') {
  const now = new Date()

  const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  const today = now.toISOString().split('T')[0]

  let total = 0

  const paymentId = payments
    .filter((p) => p.date.startsWith(period === 'today' ? today : month))
    .map((p) => {
      total += p.amount ?? 0

      return p.id
    })

  return { paymentId, total }
}
