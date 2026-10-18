import { productStore } from '@/stores/product'
import { orderStore } from '@/stores/order'
import { saleStore } from '@/stores/sale'
import type { PaymentMethod, Sale, SaleItem } from '@/types'
import { snapshotItems } from './sales'
import { localDateKey } from './date'

type LegacyOrder = {
  id: string
  name: string
  products: { productId: string; quantity: number }[]
  openedAt: number
  status?: 'open' | 'closed'
  paymentMethod?: PaymentMethod
  price?: { total?: number; cash?: number; pix?: number }
  closedAt?: number
}

type LegacySale = {
  id: string
  date?: string
  timestamp?: number
  paymentMethod?: PaymentMethod
  price?: { total?: number; cash?: number; pix?: number }
  products?: {
    regular?: { id: string; quantity: number }[]
    custom?: { name: string; price: number; quantity: number }[]
  }
}

/**
 * Roda uma vez por carga do app, antes do render.
 * 1) Vendas antigas (formato products.regular/custom + date) → formato Sale.
 * 2) Comandas fechadas presas no orderStore → Sale (com baixa no estoque) e saem da lista.
 */
export function runMigrations() {
  migrateLegacySales()
  migrateClosedOrders()
}

function migrateLegacySales() {
  const sales = (saleStore.getState().sales ?? []) as unknown as (Sale | LegacySale)[]
  const hasLegacy = sales.some((s) => !Array.isArray((s as Sale).items))

  if (!hasLegacy) {
    return
  }

  saleStore.action.replaceAll(
    sales.map((s) =>
      Array.isArray((s as Sale).items) ? (s as Sale) : convertLegacySale(s as LegacySale, productStore.action.get),
    ),
  )
}

function migrateClosedOrders() {
  const orders = orderStore.getState() as unknown as LegacyOrder[]
  const closed = orders.filter((o) => o.status === 'closed')

  for (const order of closed) {
    const items = snapshotItems(order.products)
    const total = order.price?.total ?? items.reduce((a, i) => a + i.unitPrice * i.quantity, 0)
    const method = order.paymentMethod ?? 'dinheiro'

    saleStore.action.add({
      orderId: order.id,
      name: order.name,
      items,
      paymentMethod: method,
      total,
      cash: order.price?.cash ?? (method === 'dinheiro' ? total : 0),
      pix: order.price?.pix ?? (method === 'pix' ? total : 0),
      closedAt: order.closedAt ?? order.openedAt,
    })
    for (const item of items) {
      const product = item.productId ? productStore.action.get(item.productId) : undefined
      if (product) {
        productStore.action.setStock(product.id, Math.max(0, (product.stock ?? 0) - item.quantity))
      }
    }
    orderStore.action.delete(order.id)
  }
}

export function convertLegacySale(
  s: LegacySale,
  productName: (id: string) => { name: string; price: number } | undefined,
): Sale {
  const items: SaleItem[] = [
    ...(s.products?.regular ?? []).map((p) => {
      const product = productName(p.id)
      return {
        productId: product ? p.id : null,
        name: product?.name ?? 'Produto removido',
        unitPrice: product?.price ?? NaN,
        unitCost: 0,
        quantity: p.quantity,
      }
    }),
    ...(s.products?.custom ?? []).map((p) => ({
      productId: null,
      name: p.name,
      unitPrice: p.price,
      unitCost: 0,
      quantity: p.quantity,
    })),
  ]
  const known = items.filter((i) => Number.isFinite(i.unitPrice)).reduce((a, i) => a + i.unitPrice * i.quantity, 0)
  const unknownQty = items.filter((i) => !Number.isFinite(i.unitPrice)).reduce((a, i) => a + i.quantity, 0)
  const total = s.price?.total ?? known
  // Removed products get their share of the recorded total instead of a zero price.
  const fallback = unknownQty > 0 ? Math.max(0, total - known) / unknownQty : 0
  for (const item of items) {
    if (!Number.isFinite(item.unitPrice)) {
      item.unitPrice = fallback
    }
  }
  const method = s.paymentMethod ?? 'dinheiro'

  return {
    id: s.id,
    orderId: '',
    name: 'Venda',
    items,
    paymentMethod: method,
    total,
    cash: s.price?.cash ?? (method === 'dinheiro' ? total : 0),
    pix: s.price?.pix ?? (method === 'pix' ? total : 0),
    closedAt: s.timestamp ?? (s.date ? new Date(`${localDateKey(s.date)}T12:00:00`).getTime() : Date.now()),
  }
}
