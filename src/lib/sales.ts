import { productStore } from '@/hooks/useProducts'
import type { OrderProduct, PaymentMethod, SaleItem } from '@/types'

/** Congela nome e preço atuais de cada produto para a venda */
export function snapshotItems(products: OrderProduct[]): SaleItem[] {
  return products
    .filter((p) => p.quantity > 0)
    .map((p) => {
      const product = productStore.action.get(p.productId)
      return {
        productId: product ? p.productId : null,
        name: product?.name ?? 'Produto removido',
        unitPrice: product?.price ?? 0,
        unitCost: product?.averageCost ?? 0,
        quantity: p.quantity,
      }
    })
}

export function itemsTotal(items: SaleItem[]) {
  return items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0)
}

export function splitPayment(method: PaymentMethod, total: number, cash = 0, pix = 0) {
  if (method === 'dinheiro') return { cash: total, pix: 0 }
  if (method === 'pix') return { cash: 0, pix: total }
  return { cash, pix }
}

/** Margem estimada: soma de (preço − custo) × quantidade dos itens vendidos */
export function salesMargin(sales: { items: SaleItem[] }[]) {
  return sales.reduce(
    (acc, s) => acc + s.items.reduce((a, i) => a + (i.unitPrice - (i.unitCost ?? 0)) * i.quantity, 0),
    0,
  )
}
