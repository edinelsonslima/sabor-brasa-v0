import { productStore } from '@/hooks/useProducts'
import { orderStore } from '@/hooks/useOrders'
import { saleStore } from '@/hooks/useSales'
import type { PaymentMethod, Sale, SaleItem } from '@/types'
import { snapshotItems } from './sales'

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
  saleStore.action.refreshStats()
}

function migrateLegacySales() {
  const sales = (saleStore.getState().sales ?? []) as unknown as (Sale | LegacySale)[]
  const hasLegacy = sales.some((s) => !Array.isArray((s as Sale).items))

  if (!hasLegacy) {
    return
  }

  saleStore.action.replaceAll(
    sales.map((s) => (Array.isArray((s as Sale).items) ? (s as Sale) : convertLegacySale(s as LegacySale, productStore.action.get))),
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
    orderStore.action.delete(order.id, { silent: true })
  }
}

export function convertLegacySale(s: LegacySale, productName: (id: string) => { name: string; price: number } | undefined,): Sale {
  const items: SaleItem[] = [
    ...(s.products?.regular ?? []).map((p) => {
      const product = productName(p.id)
      return {
        productId: product ? p.id : null,
        name: product?.name ?? 'Produto removido',
        unitPrice: product?.price ?? 0,
        unitCost: 0,
        quantity: p.quantity,
      }
    }),
    ...(s.products?.custom ?? []).map((p) => ({ productId: null, name: p.name, unitPrice: p.price, unitCost: 0, quantity: p.quantity })),
  ]
  const total = s.price?.total ?? 0
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
    closedAt: s.timestamp ?? (s.date ? new Date(s.date).getTime() : Date.now()),
  }
}
