import { productStore } from '@/stores/product'
import type { StockEntry } from '@/types'
export type Result = { ok: true } | { ok: false; reason: string }
const invalid = (qty: number) => !Number.isFinite(qty) || qty < 0
export function weightedAverage(stock: number, avg: number, qty: number, unitCost: number) {
  return stock > 0 ? (stock * avg + qty * unitCost) / (stock + qty) : unitCost
}
export function canReserve(productId: string, qty: number): Result {
  const product = productStore.action.get(productId)
  if (!product) { return { ok: false, reason: 'Produto não encontrado' } }
  if (invalid(qty)) { return { ok: false, reason: 'Quantidade inválida' } }
  if ((product.stock ?? 0) < qty) { return { ok: false, reason: `Estoque insuficiente: ${product.name}` } }
  return { ok: true }
}
export function reserve(productId: string, qty: number): Result {
  const result = canReserve(productId, qty)
  if (!result.ok) { return result }
  const product = productStore.action.get(productId)
  if (!product) { return { ok: false, reason: 'Produto não encontrado' } }
  productStore.action.setStock(productId, (product.stock ?? 0) - qty)
  return { ok: true }
}
export function release(productId: string, qty: number): Result {
  const product = productStore.action.get(productId)
  if (!product) { return { ok: true } }
  if (invalid(qty)) { return { ok: false, reason: 'Quantidade inválida' } }
  productStore.action.setStock(productId, (product.stock ?? 0) + qty)
  return { ok: true }
}
export function receive(productId: string, qty: number, unitCost: number): Result {
  const product = productStore.action.get(productId)
  if (!product) { return { ok: false, reason: 'Produto não encontrado' } }
  if (invalid(qty) || qty === 0 || !Number.isFinite(unitCost) || unitCost < 0) {
    return { ok: false, reason: 'Compra inválida' }
  }
  const stock = product.stock ?? 0
  const avg = weightedAverage(stock, product.averageCost, qty, unitCost)
  productStore.action.setStock(productId, stock + qty, avg)
  return { ok: true }
}
export function revertReceive(entry: StockEntry): Result {
  const product = productStore.action.get(entry.productId)
  if (!product || (product.stock ?? 0) < entry.quantity) {
    return { ok: false, reason: 'Estoque insuficiente para excluir esta compra' }
  }
  const stock = product.stock ?? 0
  const remaining = stock - entry.quantity
  const avg = remaining > 0 ? (stock * product.averageCost - entry.quantity * entry.unitCost) / remaining : product.averageCost
  productStore.action.setStock(product.id, remaining, avg)
  return { ok: true }
}
