import { saleStore } from '@/stores/sale'
import { productStore } from '@/stores/product'
import type { SaleItem } from '@/types'
import { itemsTotal, splitPayment } from '@/lib/sales'
import type { SalePayment } from '@/lib/sales'
import { canReserve, release, reserve } from './inventory'
import type { Result } from './inventory'
import { logAudit } from './audit'
function quantities(items: SaleItem[]) {
  const result = new Map<string, number>()
  for (const item of items) {
    if (item.productId && productStore.action.get(item.productId)) {
      result.set(item.productId, (result.get(item.productId) ?? 0) + item.quantity)
    }
  }
  return result
}
export function removeSale(id: string): Result {
  const sale = saleStore.action.get(id)
  if (!sale) {
    return { ok: false, reason: 'Venda não encontrada' }
  }
  for (const [productId, qty] of quantities(sale.items)) {
    release(productId, qty)
  }
  saleStore.action.delete(id)
  logAudit('sale_deleted', `Venda excluída: ${sale.name} - Total: ${sale.total}`)
  return { ok: true }
}
export function editSale(id: string, items: SaleItem[], payment: SalePayment): Result {
  const sale = saleStore.action.get(id)
  if (!sale) {
    return { ok: false, reason: 'Venda não encontrada' }
  }
  if (!items.length || items.some((i) => !Number.isFinite(i.quantity) || i.quantity <= 0)) {
    return { ok: false, reason: 'Quantidade inválida' }
  }
  const total = itemsTotal(items)
  const split = splitPayment(payment.paymentMethod, total, payment.cash, payment.pix)
  if (Math.abs(split.cash + split.pix - total) > 0.01) {
    return { ok: false, reason: 'Valores em dinheiro e PIX devem ser igual ao total' }
  }
  const before = quantities(sale.items)
  const after = quantities(items)
  const deltas = [...new Set([...before.keys(), ...after.keys()])].map((productId) => ({
    productId,
    qty: (after.get(productId) ?? 0) - (before.get(productId) ?? 0),
  }))
  // Preflight every positive delta before mutating anything: failed edits are atomic.
  for (const { productId, qty } of deltas) {
    if (qty > 0) {
      const result = canReserve(productId, qty)
      if (!result.ok) {
        return result
      }
    }
  }
  for (const { productId, qty } of deltas) {
    if (qty > 0) {
      reserve(productId, qty)
    } else if (qty < 0) {
      release(productId, -qty)
    }
  }
  saleStore.action.update(id, { items, total, paymentMethod: payment.paymentMethod, ...split })
  logAudit('sale_updated', `Venda editada: ${sale.name}`)
  return { ok: true }
}
