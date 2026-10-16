import { orderStore } from '@/stores/order'
import { productStore } from '@/stores/product'
import { saleStore } from '@/stores/sale'
import { itemsTotal, snapshotItems, splitPayment } from '@/lib/sales'
import type { SalePayment } from '@/lib/sales'
import type { Order, OrderItem } from '@/types'
import { reserve, release } from './inventory'
import type { Result } from './inventory'
import { logAudit } from './audit'
export function createOpen(name: string): Order {
  const order = orderStore.action.create(name)
  logAudit('order_opened', `Comanda aberta: ${name}`)
  return order
}
export function addItem(orderId: string, productId: string, qty: number, note?: string): Result {
  const order = orderStore.action.get(orderId)
  const product = productStore.action.get(productId)
  if (!order || !product) {
    return { ok: false, reason: 'Comanda ou produto não encontrado' }
  }
  if (!Number.isFinite(qty) || qty <= 0) {
    return { ok: false, reason: 'Quantidade inválida' }
  }
  const result = reserve(productId, qty)
  if (!result.ok) {
    return result
  }
  const previous = order.products.find((p) => p.productId === productId)
  const item: OrderItem = {
    productId,
    quantity: (previous?.quantity ?? 0) + qty,
    name: product.name,
    unitPrice: product.price,
    unitCost: product.averageCost,
    note: note ?? previous?.note,
  }
  orderStore.action.setProducts(
    orderId,
    previous ? order.products.map((p) => (p === previous ? item : p)) : [...order.products, item],
  )
  logAudit('order_updated', `Pedido adicionado: ${order.name} - ${product.name}`)
  return { ok: true }
}
export function setQty(orderId: string, productId: string | null, qty: number, itemIndex?: number): Result {
  const order = orderStore.action.get(orderId)
  if (!order) {
    return { ok: false, reason: 'Comanda não encontrada' }
  }
  if (!Number.isFinite(qty) || qty < 0) {
    return { ok: false, reason: 'Quantidade inválida' }
  }
  const index = itemIndex ?? order.products.findIndex((p) => p.productId === productId)
  const item = order.products[index]
  if (!item) {
    return productId ? addItem(orderId, productId, qty) : { ok: false, reason: 'Item não encontrado' }
  }
  const delta = qty - item.quantity
  if (item.productId && productStore.action.get(item.productId)) {
    const result = delta > 0 ? reserve(item.productId, delta) : release(item.productId, -delta)
    if (!result.ok) {
      return result
    }
  }
  orderStore.action.setProducts(
    orderId,
    order.products.map((p, i) => (i === index ? { ...p, quantity: qty } : p)).filter((p) => p.quantity > 0),
  )
  logAudit('order_updated', `Quantidade alterada: ${order.name}`)
  return { ok: true }
}
export function removeItem(orderId: string, productId: string | null, itemIndex?: number) {
  return setQty(orderId, productId, 0, itemIndex)
}
export function deleteOpen(orderId: string): Result {
  const order = orderStore.action.get(orderId)
  if (!order) {
    return { ok: false, reason: 'Comanda não encontrada' }
  }
  for (const item of order.products) {
    if (item.productId) {
      release(item.productId, item.quantity)
    }
  }
  orderStore.action.delete(orderId)
  logAudit('order_deleted', `Comanda excluída: ${order.name}`)
  return { ok: true }
}
export function close(orderId: string, payment: SalePayment): Result & { saleId?: string } {
  const order = orderStore.action.get(orderId)
  if (!order) {
    return { ok: false, reason: 'Comanda não encontrada' }
  }
  const items = snapshotItems(order.products)
  if (!items.length) {
    return { ok: false, reason: 'Adicione pelo menos um produto à venda' }
  }
  const total = itemsTotal(items)
  const split = splitPayment(payment.paymentMethod, total, payment.cash, payment.pix)
  if (Math.abs(split.cash + split.pix - total) > 0.01) {
    return { ok: false, reason: 'Valores em Dinheiro e PIX devem ser igual ao total da venda' }
  }
  const saleId = saleStore.action.add({
    orderId,
    name: order.name,
    items,
    total,
    paymentMethod: payment.paymentMethod,
    ...split,
    closedAt: Date.now(),
  })
  orderStore.action.delete(orderId)
  logAudit('sale_created', `Venda: ${order.name} - Total: ${total}`)
  return { ok: true, saleId }
}
export function reopen(saleId: string): Result & { order?: Order } {
  const sale = saleStore.action.get(saleId)
  if (!sale) {
    return { ok: false, reason: 'Venda não encontrada' }
  }
  const order = orderStore.action.create(
    sale.name,
    sale.items.map((item) => ({ ...item })),
  )
  saleStore.action.delete(saleId)
  logAudit('order_opened', `Comanda reaberta: ${order.name}`)
  return { ok: true, order }
}
