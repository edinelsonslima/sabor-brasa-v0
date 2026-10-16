import { productStore } from '@/stores/product'
import { expenseStore } from '@/stores/expense'
import { stockEntryStore } from '@/stores/stockEntry'
import { localDateKey } from '@/lib/date'
import { receive, revertReceive } from './inventory'
import type { Result } from './inventory'
import type { StockEntry } from '@/types'
import { logAudit } from './audit'
type Cost = { totalPaid: number } | { unitCost: number }
export function addStockEntry(productId: string, qty: number, cost: Cost): Result & { entry?: StockEntry } {
  const product = productStore.action.get(productId)
  const unitCost = 'unitCost' in cost ? cost.unitCost : cost.totalPaid / qty
  if (!product || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unitCost) || unitCost < 0) {
    return { ok: false, reason: 'Produto, quantidade ou custo inválido' }
  }
  const date = Date.now()
  const totalCost = qty * unitCost
  const expense = expenseStore.action.add({ description: `Compra de estoque: ${qty}x ${product.name}`,
    category: 'bebidas_comida', amount: totalCost, date: localDateKey(date) })
  receive(productId, qty, unitCost)
  const entry = stockEntryStore.action.add({ productId, quantity: qty, unitCost, totalCost, date, expenseId: expense.id })
  logAudit('expense_created', `Gasto: ${expense.description} - ${totalCost}`)
  logAudit('stock_entry_created', `Estoque lançado: ${qty}x ${product.name} - Total: ${totalCost}`)
  return { ok: true, entry }
}
export function deleteStockEntry(id: string): Result {
  const entry = stockEntryStore.action.get(id)
  if (!entry) { return { ok: false, reason: 'Compra não encontrada' } }
  const result = revertReceive(entry)
  if (!result.ok) { return result }
  if (entry.expenseId) {
    expenseStore.action.delete(entry.expenseId)
    logAudit('expense_deleted', `Gasto excluído: ${entry.expenseId}`)
  }
  stockEntryStore.action.delete(id)
  logAudit('stock_entry_deleted', `Lançamento de estoque excluído: ${entry.quantity}`)
  return { ok: true }
}
