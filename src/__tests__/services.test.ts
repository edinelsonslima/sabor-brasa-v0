/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest'
import { productStore } from '@/stores/product'
import { orderStore } from '@/stores/order'
import { saleStore } from '@/stores/sale'
import { expenseStore } from '@/stores/expense'
import { reserve, receive, release } from '@/services/inventory'
import { addItem, close, createOpen, deleteOpen, reopen } from '@/services/comandas'
import { addStockEntry, deleteStockEntry } from '@/services/purchases'
import { editSale, removeSale } from '@/services/sales'
import { snapshotItems } from '@/lib/sales'
import { convertLegacySale } from '@/lib/migrations'
import { hashPassword, verifyPassword } from '@/services/auth'

const stockOf = (id: string) => productStore.action.get(id)?.stock
function product(stock = 10, price = 10) {
  return productStore.action.add({ name: 'Stella', unit: 'unidade', price, stock, category: 'bebida' })
}

beforeEach(() => {
  for (const p of productStore.getState()) {
    productStore.action.delete(p.id)
  }
  for (const o of orderStore.getState()) {
    orderStore.action.delete(o.id)
  }
  saleStore.action.replaceAll([])
})

describe('inventory', () => {
  it('reserve/release adjust stock and reject overdraw', () => {
    const p = product(5)
    expect(reserve(p.id, 3).ok).toBe(true)
    expect(stockOf(p.id)).toBe(2)
    expect(reserve(p.id, 3).ok).toBe(false)
    expect(stockOf(p.id)).toBe(2)
    release(p.id, 3)
    expect(stockOf(p.id)).toBe(5)
  })
  it('receive computes weighted average', () => {
    const p = product(0)
    receive(p.id, 24, 10)
    receive(p.id, 12, 8)
    expect(stockOf(p.id)).toBe(36)
    expect(productStore.action.get(p.id)?.averageCost).toBeCloseTo(9.333, 2)
  })
})

describe('comandas', () => {
  it('A: deleteOpen releases reserved stock', () => {
    const p = product(10)
    const o = createOpen('Mesa 1')
    addItem(o.id, p.id, 4)
    expect(stockOf(p.id)).toBe(6)
    deleteOpen(o.id)
    expect(stockOf(p.id)).toBe(10)
  })
  it('rejects insufficient stock without touching stock', () => {
    const p = product(2)
    const o = createOpen('Mesa 2')
    expect(addItem(o.id, p.id, 3).ok).toBe(false)
    expect(stockOf(p.id)).toBe(2)
    expect(orderStore.action.get(o.id)?.products).toHaveLength(0)
  })
  it('close creates a sale without double-deducting; C: reopen keeps all items', () => {
    const a = product(10)
    const b = product(10, 5)
    const o = createOpen('Mesa 3')
    addItem(o.id, a.id, 2)
    addItem(o.id, b.id, 1)
    const res = close(o.id, { paymentMethod: 'pix' })
    expect(res.ok).toBe(true)
    expect(stockOf(a.id)).toBe(8)
    const sale = saleStore.action.get(res.saleId!)!
    expect(sale.total).toBe(25)
    const r = reopen(sale.id)
    expect(r.order?.products.map((i) => i.quantity)).toEqual([2, 1])
    expect(stockOf(a.id)).toBe(8)
  })
})

describe('purchases', () => {
  it('B: blocks deleting an entry whose stock was already consumed', () => {
    const p = product(0)
    const { entry } = addStockEntry(p.id, 5, { totalPaid: 50 })
    expect(expenseStore.action.get(entry!.expenseId!)?.amount).toBe(50)
    reserve(p.id, 3)
    expect(deleteStockEntry(entry!.id).ok).toBe(false)
    expect(stockOf(p.id)).toBe(2)
    expect(expenseStore.action.get(entry!.expenseId!)).toBeDefined()
  })
})

describe('sales edit/delete', () => {
  it('applies only the quantity delta and releases on delete', () => {
    const p = product(10)
    const o = createOpen('Mesa 4')
    addItem(o.id, p.id, 2)
    const { saleId } = close(o.id, { paymentMethod: 'dinheiro' })
    const items = saleStore.action.get(saleId!)!.items.map((i) => ({ ...i, quantity: 5 }))
    expect(editSale(saleId!, items, { paymentMethod: 'dinheiro' }).ok).toBe(true)
    expect(stockOf(p.id)).toBe(5)
    const tooMany = items.map((i) => ({ ...i, quantity: 50 }))
    expect(editSale(saleId!, tooMany, { paymentMethod: 'dinheiro' }).ok).toBe(false)
    expect(stockOf(p.id)).toBe(5)
    removeSale(saleId!)
    expect(stockOf(p.id)).toBe(10)
  })
})

describe('G: removed product snapshots', () => {
  it('keeps prior snapshot price', () => {
    const [item] = snapshotItems([{ productId: 'gone', name: 'X', unitPrice: 12, unitCost: 4, quantity: 1 }])
    expect(item.unitPrice).toBe(12)
    expect(item.productId).toBeNull()
  })
  it('legacy sale with removed product derives price from total', () => {
    const sale = convertLegacySale(
      { id: 's', price: { total: 30 }, products: { regular: [{ id: 'gone', quantity: 3 }] } },
      () => undefined,
    )
    expect(sale.items[0].unitPrice).toBe(10)
  })
})

describe('auth', () => {
  it('hashes with salt and verifies', async () => {
    const h = await hashPassword('1234')
    expect(h).not.toContain('1234')
    expect(await hashPassword('1234')).not.toBe(h)
    expect(await verifyPassword('1234', h)).toBe(true)
    expect(await verifyPassword('x', h)).toBe(false)
  })
})
