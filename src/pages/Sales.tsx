import { Title } from '@/components/_layout/title'
import { Button } from '@/components/_ui/button'
import { Card } from '@/components/_ui/card'
import { Collapse } from '@/components/_ui/collapse'
import { Label } from '@/components/_ui/label'
import { toast } from '@/components/_ui/toast'
import { Calculator } from '@/components/calculator'
import { CurrencyInput } from '@/components/currency/Input'
import { CurrencyMonitor } from '@/components/currency/monitor'
import { ProductItem } from '@/components/product/item'
import { SaleCelebration } from '@/components/sales/celebration'
import { SaleItem } from '@/components/sales/item'
import { productStore } from '@/hooks/useProducts'
import { saleStore } from '@/hooks/useSales'
import { cn, formatCurrency, generateUUID, vibrate } from '@/lib/utils'
import type { PaymentMethod, Product, SaleProducts } from '@/types'
import { AnimatePresence, m } from 'framer-motion'
import { Banknote, Plus, Smartphone, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { orderStore } from '@/hooks/useOrders'

export function Component() {
  const sales = saleStore.useStore((state) => state.sales)
  const products = productStore.useStore((state) => state.products)
  const celebration = useRef<{ celebrate: () => void }>(null)
  const navigate = useNavigate()
  const { id: orderId } = useParams()
  const order = orderStore.useStore((state) => (orderId ? state.orders.find((o) => o.id === orderId) : undefined))
  const isOrder = !!orderId

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro')
  const [selected, setSelected] = useState<SaleProducts>(() => order?.items ?? { custom: [], regular: [] })

  useEffect(() => {
    if (orderId && order?.status === 'open' && order.items !== selected) {
      orderStore.action.setItems(orderId, selected)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  const [cashAmount, setCashAmount] = useState(0)
  const [pixAmount, setPixAmount] = useState(0)

  const handleAddProduct = (product: Product, quantity: number) => {
    setSelected((prev) => {
      const list = [...prev.regular]
      const idx = list.findIndex((p) => p.id === product.id)

      if (idx === -1) {
        const found = products.find((p) => p.id === product.id)
        if (!found) {
          toast.error('Produto não encontrado')
          return prev
        }
        return { ...prev, regular: [...list, { id: found.id, quantity: 1 }] }
      }

      if (quantity === 0) {
        list.splice(idx, 1)
        return { ...prev, regular: list }
      }

      list[idx] = { ...list[idx], quantity }
      return { ...prev, regular: [...list] }
    })
  }

  const handleDeleteSale = (id: string) => {
    saleStore.action.delete(id)
    toast.success('Venda excluída')
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selected.regular.length && !selected.custom.length) {
      toast.error('Adicione pelo menos um produto à venda')
      return
    }

    const isCombined = paymentMethod === 'combinado'

    if (isCombined && totalPaymentCombined <= 0) {
      toast.error('Informe os valores em dinheiro e/ou PIX')
      return
    }

    if (isCombined && Math.abs(totalPaymentCombined - total) > 0.01) {
      toast.error('Valores em Dinheiro e PIX devem ser igual ao total da venda')
      return
    }

    let cash = 0
    let pix = 0

    if (paymentMethod === 'dinheiro') {
      cash = total
    }
    if (paymentMethod === 'pix') {
      pix = total
    }
    if (paymentMethod === 'combinado') {
      cash = cashAmount
      pix = pixAmount
    }

    const saleId = saleStore.action.add({
      paymentMethod,
      products: selected,
      price: { total, cash, pix },
      date: new Date().toISOString(),
    })

    setCashAmount(0)
    setPixAmount(0)
    setPaymentMethod('dinheiro')
    setSelected({ custom: [], regular: [] })
    celebration.current?.celebrate()

    if (orderId) {
      orderStore.action.close(orderId, saleId)
      toast.success('Comanda fechada!')
      setTimeout(() => navigate('/comandas'), 600)
      return
    }

    toast.success('Venda registrada!')
  }

  const handleAddCustomItem = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const brutPrice = formData.get('price')?.toString().replace(/\D/g, '')
    const price = parseInt(brutPrice || '0', 10) / 100
    const name = formData.get('name')?.toString().trim() || ''
    const quantity = formData.get('quantity')?.toString().trim() || '1'

    if (price <= 0) {
      toast.warn('Informe um preço válido para o item personalizado')
      return
    }

    const qty = parseInt(quantity) || 1
    if (qty <= 0) {
      toast.warn('Quantidade deve ser maior que zero')
      return
    }

    const customProductItem: SaleProducts['custom'][number] = {
      name: name || `Item Personalizado (${formatCurrency(price)})`,
      id: generateUUID(),
      unit: 'unidade',
      quantity: qty,
      price: price,
    }

    setSelected((prev) => ({
      ...prev,
      custom: [...prev.custom, customProductItem],
    }))

    toast.success(`Item ${customProductItem.name} adicionado`)
  }

  const handleDeleteCustomItem = (id: string) => {
    setSelected((prev) => ({
      ...prev,
      custom: prev.custom.filter((c) => c.id !== id),
    }))
  }

  const totalPaymentCombined = cashAmount + pixAmount

  const showFooter = (selected.regular.length > 0 || selected.custom.length > 0) && products.length > 0

  const total =
    selected.custom.reduce((acc, p) => acc + p.price * p.quantity, 0) +
    selected.regular.reduce((acc, p) => {
      return acc + (productStore.action.get(p.id)?.price ?? 0) * p.quantity
    }, 0)

  if (isOrder && (!order || order.status !== 'open')) {
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
      <Title
        title={isOrder ? `Comanda: ${order?.name}` : 'Venda rápida'}
        subtitle={isOrder ? 'Adicione pedidos; feche quando o cliente pagar' : 'Venda direta, sem comanda'}
      />

      <SaleCelebration ref={celebration} />

      <CurrencyMonitor
        className={cn(
          'fixed top-20 right-4 bg-base-100 shadow-sm p-2 pr-4 rounded-lg z-10',
          'text-3xl font-extrabold font-mono',
        )}
      >
        {total}
      </CurrencyMonitor>

      <Card appearance='ghost'>
        <Card.Title>SELECIONE UM PRODUTO</Card.Title>

        {!!products.length && (
          <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto overflow-x-hidden'>
            {products.map((p) => (
              <ProductItem
                key={p.id}
                product={p}
                onSelect={handleAddProduct}
                quantity={selected.regular.find((s) => s.id === p.id)?.quantity}
              />
            ))}
          </div>
        )}

        {!products.length && (
          <div className='p-8 text-center text-base-content/60 text-sm'>Nenhum produto cadastrado</div>
        )}
      </Card>

      <Collapse icon='plus'>
        <Collapse.Summary className='text-sm font-semibold text-base-content/80 tracking-wider'>
          ITEM PERSONALIZADO
        </Collapse.Summary>

        <Collapse.Content>
          <m.form onSubmit={handleAddCustomItem}>
            <CurrencyInput name='price' label='Preço' />

            <div className='flex gap-4 items-end'>
              <div className='flex-2'>
                <Label className='daisy-label'>Produto</Label>
                <input
                  name='name'
                  type='text'
                  placeholder='Descrição do item personalizado'
                  maxLength={100}
                  className='daisy-input w-full font-mono'
                />
              </div>

              <div className='flex-1'>
                <Label className='daisy-label mt-4 mb-1'>Quantidade</Label>
                <input
                  name='quantity'
                  type='number'
                  step='1'
                  min='1'
                  placeholder='1'
                  className='daisy-input w-full font-mono'
                />
              </div>
            </div>

            <Button appearance='soft' modifier='block' className='mt-4' type='submit' onClick={() => vibrate(10)}>
              <Plus size={16} /> Adicionar Item Personalizado
            </Button>
          </m.form>
        </Collapse.Content>
      </Collapse>

      <AnimatePresence>
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className={Card.getStyle('p-3')}
        >
          <h3 className='text-sm font-semibold text-base-content/80 uppercase tracking-wider mb-3'>Itens</h3>

          {selected.regular.length === 0 && selected.custom.length === 0 && (
            <div className='p-4 text-center text-base-content/60 text-sm'>Nenhum item adicionado</div>
          )}

          <div className='space-y-2 max-h-80 overflow-y-auto overflow-x-hidden py-2'>
            {selected.regular
              .map((prd) => ({
                ...productStore.action.get(prd.id)!,
                quantity: prd.quantity,
                type: 'regular',
              }))
              .concat(selected.custom.map((c) => ({ ...c, type: 'custom' })))
              .map((product) => (
                <div key={product.id} className='flex items-end justify-between gap-2'>
                  <div className='w-full'>
                    <div className='flex justify-between items-end w-full'>
                      <p className='text-sm truncate'>{product?.name}</p>
                    </div>

                    <div className='flex items-center'>
                      <p className='text-sm text-base-content/60'>
                        {formatCurrency(product?.price ?? 0)} x {product?.quantity}
                      </p>
                      <span className='flex-1 mx-2 border-b border-dotted border-base-content/20 translate-y-1' />
                      <span className='font-mono text-sm'>
                        {formatCurrency((product?.price ?? 0) * (product?.quantity ?? 0))}
                      </span>
                    </div>
                  </div>

                  <Button
                    size='xs'
                    variant='error'
                    appearance='soft'
                    onClick={() => (
                      vibrate(10),
                      product.type === 'regular' ? handleAddProduct(product, 0) : handleDeleteCustomItem(product.id)
                    )}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              ))}
          </div>
        </m.div>
      </AnimatePresence>

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(showFooter && total > 0 ? 'mb-36' : 'mb-0')}
      >
        <h3 className='text-sm font-semibold text-base-content/80 uppercase tracking-wider mb-3'>Últimas Vendas</h3>

        {sales.length === 0 ? (
          <Card className='p-8 text-center text-base-content/60 text-sm'>Nenhuma venda registrada</Card>
        ) : (
          <div className='space-y-2'>
            {sales.slice(0, 20).map((sale) => (
              <SaleItem key={sale.id} saleId={sale.id} onDelete={handleDeleteSale} />
            ))}
          </div>
        )}
      </m.div>

      <form
        data-swipe-ignore
        onSubmit={handleSubmit}
        hidden={!showFooter || total <= 0}
        className='daisy-glass fixed bottom-16 space-y-3 p-4 border-t border-base-300 right-0 left-0 animate-fade-in-up z-30'
      >
        <div className='flex gap-2'>
          <Button
            type='button'
            className='flex-1'
            appearance='outline'
            active={paymentMethod === 'dinheiro'}
            variant={paymentMethod === 'dinheiro' ? 'warning' : undefined}
            onClick={() => setPaymentMethod('dinheiro')}
          >
            <Banknote size={16} /> Dinheiro
          </Button>

          <Button
            type='button'
            className='flex-1'
            appearance='outline'
            active={paymentMethod === 'pix'}
            variant={paymentMethod === 'pix' ? 'success' : undefined}
            onClick={() => setPaymentMethod('pix')}
          >
            <Smartphone size={16} /> Pix
          </Button>

          <Button
            type='button'
            className='flex-1'
            appearance='outline'
            active={paymentMethod === 'combinado'}
            variant={paymentMethod === 'combinado' ? 'primary' : undefined}
            onClick={() => setPaymentMethod('combinado')}
          >
            <Plus size={16} /> Combinado
          </Button>
        </div>

        <AnimatePresence>
          {paymentMethod === 'combinado' && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className='grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden p-1'
            >
              <div className='space-y-2'>
                <Label className='flex items-center gap-2'>
                  <Banknote size={14} className='text-warning' />
                  Valor em Dinheiro
                </Label>
                <CurrencyInput
                  value={cashAmount}
                  onValueChange={setCashAmount}
                  className='border-warning/30 focus:border-warning'
                />
              </div>
              <div className='space-y-2'>
                <Label className='flex items-center gap-2'>
                  <Smartphone size={14} className='text-success' />
                  Valor em PIX
                </Label>
                <CurrencyInput
                  value={pixAmount}
                  onValueChange={setPixAmount}
                  className='border-success/30 focus:border-success'
                />
              </div>
              {totalPaymentCombined > 0 && (
                <div className='col-span-full text-center p-2 rounded-lg bg-base-200/50'>
                  <span className='text-sm text-base-content/60'>Total combinado: </span>
                  <span className='font-mono font-bold'>{formatCurrency(totalPaymentCombined)}</span>
                  {total > 0 && Math.abs(totalPaymentCombined - total) > 0.01 && (
                    <span className={cn('text-xs ml-2', totalPaymentCombined < total ? 'text-error' : 'text-success')}>
                      (diferença de {formatCurrency(Math.abs(total - totalPaymentCombined))})
                    </span>
                  )}
                </div>
              )}
            </m.div>
          )}
        </AnimatePresence>

        <div className='flex gap-2'>
          <Button type='submit' size='lg' variant='primary' className='flex-1' disabled={total <= 0}>
            <Plus size={18} /> {isOrder ? 'Fechar Comanda' : 'Registrar Venda'}
          </Button>

          <Calculator saleTotal={total} />
        </div>
      </form>
    </>
  )
}
