import { logAudit } from '@/lib/audit'
import { formatCurrency, generateUUID } from '@/lib/utils'
import type { Expense, ExpenseCategory } from '@/types'
import { createStore } from './useStore'

type CreateExpense = Omit<Expense, 'id' | 'timestamp'>

export const expenseCategories: Record<ExpenseCategory, string> = {
  bebidas_comida: 'Bebidas e comida',
  funcionarios: 'Funcionários',
  outros: 'Outros',
}

type Actions = {
  add: (data: CreateExpense) => void
  delete: (id: string) => void
}

type State = {
  expenses: Expense[]
}

export const expenseStore = createStore<State, Actions>({
  persist: { key: 'expenses' },

  createState: () => ({ expenses: [] }),

  createActions: (set, get) => ({
    add: (data) => {
      set({ expenses: [{ ...data, id: generateUUID(), timestamp: Date.now() }, ...get().expenses] })
      logAudit('expense_created', `Gasto: ${data.description} - ${formatCurrency(data.amount)}`)
    },

    delete: (id) => {
      const e = get().expenses.find((x) => x.id === id)
      set({ expenses: get().expenses.filter((x) => x.id !== id) })
      logAudit('expense_deleted', `Gasto excluído: ${e?.description ?? id}`)
    },
  }),
})

export function sumExpenses(expenses: Expense[], period: 'today' | 'month') {
  const now = new Date()
  const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  const today = now.toISOString().split('T')[0]
  const prefix = period === 'today' ? today : month

  return expenses.filter((e) => e.date.startsWith(prefix)).reduce((s, e) => s + e.amount, 0)
}
