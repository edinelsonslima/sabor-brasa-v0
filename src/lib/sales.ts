import { productStore } from '@/stores/product'
import type { OrderItem, PaymentMethod, SaleItem } from '@/types'

/** Closed sales retain current product values, or the prior snapshot when a product was removed. */
export function snapshotItems(products: OrderItem[]): SaleItem[] {
  return products
    .filter((p) => p.quantity > 0)
    .map((p) => {
      const product = p.productId ? productStore.action.get(p.productId) : undefined
      return {
        productId: product ? product.id : null,
        name: product?.name ?? p.name ?? 'Produto removido',
        unitPrice: product?.price ?? p.unitPrice ?? 0,
        unitCost: product?.averageCost ?? p.unitCost ?? 0,
        quantity: p.quantity,
      }
    })
}
export function itemsTotal(items: SaleItem[]) {
  return items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0)
}
export function splitPayment(method: PaymentMethod, total: number, cash = 0, pix = 0) {
  if (method === 'dinheiro') {
    return { cash: total, pix: 0 }
  }
  if (method === 'pix') {
    return { cash: 0, pix: total }
  }
  return { cash, pix }
}
export type SalePayment = { paymentMethod: PaymentMethod; cash?: number; pix?: number }
