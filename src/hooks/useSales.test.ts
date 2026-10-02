/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from 'vitest'
import { productStore } from './useProducts'
import { saleStore } from './useSales'

describe('saleStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('does not change product stock when a sale snapshot is created or deleted', () => {
    const product = productStore.action.add({
      name: 'Café',
      unit: 'unidade',
      price: 10,
      stock: 10,
      category: 'bebida',
    })

    const saleId = saleStore.action.add({
      orderId: 'order-1',
      name: 'Mesa 1',
      items: [
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: 2,
        },
      ],
      paymentMethod: 'dinheiro',
      total: 20,
      cash: 20,
      pix: 0,
      closedAt: Date.now(),
    })

    expect(productStore.action.get(product.id)?.stock).toBe(10)

    saleStore.action.delete(saleId)

    expect(productStore.action.get(product.id)?.stock).toBe(10)
  })
})
