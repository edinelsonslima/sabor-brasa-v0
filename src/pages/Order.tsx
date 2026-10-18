import { itemCountLabel } from '@/lib/sales'
import { addItem, setQty } from '@/services/comandas'
import { itemsTotal, snapshotItems } from '@/lib/sales'
import { Title } from '@/components/_layout/title'
import { Button } from '@/components/_ui/button'
import { Card } from '@/components/_ui/card'
import { toast } from '@/components/_ui/toast'
import { CurrencyMonitor } from '@/components/currency/monitor'
import { ProductItem } from '@/components/product/item'
import { SaleCelebration } from '@/components/sales/celebration'
import { productStore } from '@/stores/product'
import { cn, vibrate } from '@/lib/utils'
import type { Product, ProductCategory } from '@/types'
import { ChevronRightIcon, ReceiptTextIcon } from 'lucide-react'
import { useRef } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { orderStore } from '@/stores/order'

export function Component() {
  const params = useParams<{ id: string }>()
  const celebration = useRef<{ celebrate: () => void }>(null)

  const products = productStore.useStore((state) => state)
  const orders = orderStore.useStore((state) => state)

  const [searchParams, setSearchParams] = useSearchParams({
    category: 'bebida',
  })

  const categoryFilter = searchParams.get('category') as ProductCategory
  const filteredProducts = products.filter((p) => p.category === categoryFilter)
  const order = orders.find((o) => o.id === params.id)

  const setCategoryFilter = (category: ProductCategory) => {
    setSearchParams((prev) => {
      prev.set('category', category)
      return prev
    })
  }

  const handleAddProduct = (product: Product, quantity: number) => {
    if (!order?.id) {
      toast.error('Comanda não encontrada')
      return
    }

    const previous = order.products.find((p) => p.productId === product.id)?.quantity ?? 0
    const result =
      quantity > previous ? addItem(order.id, product.id, quantity - previous) : setQty(order.id, product.id, quantity)
    if (!result.ok) {
      toast.error(result.reason)
    }
  }

  const totalOrder = itemsTotal(snapshotItems(order?.products ?? []))

  if (!order) {
    return (
      <>
        <Title title='Comanda' subtitle='Comanda não encontrada ou já fechada' />
        <Link to='/comandas' className={Button.getStyle(undefined, { variant: 'primary' })}>
          Voltar para comandas
        </Link>
      </>
    )
  }

  return (
    <>
      <Title title={`Comanda: ${order?.name}`} subtitle={'Adicione pedidos; feche quando o cliente pagar'} />

      <SaleCelebration ref={celebration} />

      <div className='daisy-tabs daisy-tabs-box'>
        {(['bebida', 'comida'] as const).map((c) => (
          <input
            key={c}
            type='radio'
            name='my_tabs_1'
            className={cn(
              'daisy-tab flex-1',
              categoryFilter === c && 'daisy-tab-active text-primary-content [--daisy-tab-bg:var(--color-primary)]',
            )}
            aria-label={c}
            onClick={() => (vibrate(10), setCategoryFilter(c))}
          />
        ))}
      </div>

      {!!products.length && (
        <>
          {!!filteredProducts.length && (
            <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-10'>
              {filteredProducts.map((p) => (
                <ProductItem
                  key={p.id}
                  product={p}
                  onSelect={handleAddProduct}
                  quantity={order.products.find((prd) => prd.productId === p.id)?.quantity}
                />
              ))}
            </div>
          )}

          {!filteredProducts.length && (
            <div className='p-8 text-center text-base-content/60 text-sm'>Nenhum produto nessa categoria</div>
          )}
        </>
      )}

      {!products.length && (
        <div className='p-8 text-center text-base-content/60 text-sm'>Nenhum produto cadastrado</div>
      )}

      <Link
        to={`/comandas/${order?.id}/itens`}
        className={Card.getStyle(
          'fixed w-[92.5%] bottom-20 flex flex-row justify-between items-center gap-2 px-2 py-3 shadow-xs',
          { appearance: 'dash' },
        )}
      >
        <span className='flex items-center gap-2'>
          <ReceiptTextIcon size={16} />
          <span>
            {itemCountLabel(order.products)}
          </span>
        </span>

        <span className='flex items-center gap-2'>
          <CurrencyMonitor className='font-extrabold font-mono'>{totalOrder}</CurrencyMonitor>
          <ChevronRightIcon size={16} />
        </span>
      </Link>
    </>
  )
}
