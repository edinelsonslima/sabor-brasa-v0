import { Title } from '@/components/_layout/title'
import { Button } from '@/components/_ui/button'
import { Card } from '@/components/_ui/card'
import { Label } from '@/components/_ui/label'
import { toast } from '@/components/_ui/toast'
import { Calculator } from '@/components/calculator'
import { CurrencyInput } from '@/components/currency/Input'
import { SaleCelebration } from '@/components/sales/celebration'
import { orderStore } from '@/hooks/useOrders'
import { productStore } from '@/hooks/useProducts'
import { cn, formatCurrency } from '@/lib/utils'
import type { PaymentMethod } from '@/types'
import { AnimatePresence, m } from 'framer-motion'
import { BanknoteIcon, Plus, SmartphoneIcon, Trash2 } from 'lucide-react'
import type { SubmitEvent } from 'react'
import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

export function Component() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()

  const celebration = useRef<{ celebrate: () => void }>(null)

  const [cashAmount, setCashAmount] = useState(0)
  const [pixAmount, setPixAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro')

  const orders = orderStore.useStore((state) => state)
  const order = orders.find((order) => order.id === params.id)

  const isOpen = order?.status === 'open'
  const totalPaymentCombined = cashAmount + pixAmount

  const orderProducts = order?.products.map((prd) => {
    const product = productStore.action.get(prd.productId)
    return product ? { ...product, quantity: prd.quantity } : null
  })

  const products = orderProducts?.filter((p): p is NonNullable<typeof p> => !!p) ?? []
  const total = products.reduce((acc, p) => acc + p.price * p.quantity, 0)

  const handleDelete = () => {
    if (!order?.id) {
      toast.error('Comanda não encontrada')
      return
    }

    orderStore.action.delete(order.id)
    toast.success('Comanda excluída')
    navigate('/comandas')
  }

  const handleCloseOrder = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!products.length) {
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

    setCashAmount(0)
    setPixAmount(0)
    setPaymentMethod('dinheiro')

    celebration.current?.celebrate()

    if (!order?.id) {
      toast.error('Comanda não encontrada')
      return
    }

    orderStore.action.update(order.id, {
      price: { cash, pix, total },
      paymentMethod: paymentMethod,
      status: 'closed',
      closedAt: new Date().getTime(),
    })

    toast.success('Comanda fechada!')
    setTimeout(() => navigate('/comandas'), 600)
  }

  if (!order) {
    return (
      <>
        <Title title='Comanda' subtitle='Comanda não encontrada' />
        <Link to='/comandas' className={Button.getStyle(undefined, { variant: 'primary' })}>
          Voltar para comandas
        </Link>
      </>
    )
  }

  return (
    <>
      <SaleCelebration ref={celebration} />

      <Title
        title={order.name}
        subtitle={
          isOpen
            ? `Aberta às ${new Date(order.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
            : `Fechada em ${order.closedAt ? new Date(order.closedAt).toLocaleString('pt-BR') : ''}`
        }
      />

      <Card>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p className='text-xs text-base-content/60 uppercase tracking-wide font-semibold'>Total da comanda</p>
            <p className='text-3xl font-extrabold font-mono mt-1'>{formatCurrency(total)}</p>
          </div>
          <span
            className={cn(
              'text-xs font-bold px-2 py-1 rounded-full',
              isOpen ? 'bg-success/15 text-success' : 'bg-base-content/10 text-base-content/60',
            )}
          >
            {isOpen ? 'ABERTA' : 'FECHADA'}
          </span>
        </div>
      </Card>

      <Card>
        <Card.Title>PEDIDOS DA MESA ({products.length})</Card.Title>

        {products.length === 0 && (
          <p className='text-sm text-base-content/60 text-center py-6'>Nenhum pedido lançado ainda</p>
        )}

        {products.length > 0 && (
          <div className='divide-y divide-base-300'>
            {products.map((product) => (
              <div key={product.id} className='py-3 flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='text-sm font-semibold truncate'>{product.name}</p>
                  <p className='text-xs text-base-content/60 font-mono'>
                    {formatCurrency(product.price)} × {product.quantity} ({product.unit === 'litro' ? 'litro' : 'un'})
                  </p>
                </div>
                <span className='font-mono text-sm font-bold shrink-0'>
                  {formatCurrency(product.price * product.quantity)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <form
        data-swipe-ignore
        onSubmit={handleCloseOrder}
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
            <BanknoteIcon size={16} /> Dinheiro
          </Button>

          <Button
            type='button'
            className='flex-1'
            appearance='outline'
            active={paymentMethod === 'pix'}
            variant={paymentMethod === 'pix' ? 'success' : undefined}
            onClick={() => setPaymentMethod('pix')}
          >
            <SmartphoneIcon size={16} /> Pix
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
                  <BanknoteIcon size={14} className='text-warning' />
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
                  <SmartphoneIcon size={14} className='text-success' />
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
          <Button.Confirm
            type='button'
            variant='error'
            size='lg'
            modifier='square'
            appearance='soft'
            onConfirm={handleDelete}
          >
            <Trash2 size={16} />
          </Button.Confirm>

          <Calculator saleTotal={total} />

          <Button type='submit' size='lg' variant='primary' className='flex-1' disabled={total <= 0}>
            <Plus size={18} /> Fechar Comanda
          </Button>
        </div>
      </form>
    </>
  )
}
