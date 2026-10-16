import type { Expense, Sale, StaffPayment } from '@/types'
import { inMonth, isSameDay } from '@/lib/date'
export type Range = { day: string } | { month: string }
function matches(date: number | string, range: Range) {
  return 'day' in range ? isSameDay(date, range.day) : inMonth(date, range.month)
}
export function salesInRange(sales: Sale[], range: Range) {
  return sales.filter((s) => matches(s.closedAt, range))
}
export function expensesTotal(expenses: Expense[], range: Range) {
  return expenses.filter((e) => matches(e.date, range)).reduce((sum, e) => sum + e.amount, 0)
}
export function staffPaymentsInRange(payments: StaffPayment[], range: Range) {
  return payments.filter((p) => matches(p.date, range))
}
export function staffPaymentsTotal(payments: StaffPayment[], range: Range) {
  return staffPaymentsInRange(payments, range).reduce((sum, p) => sum + p.amount, 0)
}
export function margin(sales: Sale[]) {
  return sales.reduce(
    (sum, s) => sum + s.items.reduce((subtotal, i) => subtotal + (i.unitPrice - (i.unitCost ?? 0)) * i.quantity, 0),
    0,
  )
}
export function netCash(sales: Sale[], payments: StaffPayment[], expenses: Expense[], range: Range) {
  return (
    salesInRange(sales, range).reduce((sum, s) => sum + s.total, 0) -
    staffPaymentsTotal(payments, range) -
    expensesTotal(expenses, range)
  )
}
export function salesTotals(sales: Sale[]) {
  return sales.reduce(
    (stats, s) => ({
      saleId: [...stats.saleId, s.id],
      total: stats.total + s.total,
      pix: stats.pix + s.pix,
      cash: stats.cash + s.cash,
    }),
    { saleId: [] as string[], total: 0, pix: 0, cash: 0 },
  )
}
