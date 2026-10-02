import { Title } from '@/components/_layout/title'
import { Button } from '@/components/_ui/button'
import { Card } from '@/components/_ui/card'
import { Label } from '@/components/_ui/label'
import { toast } from '@/components/_ui/toast'
import { CurrencyInput } from '@/components/currency/Input'
import { CurrencyMonitor } from '@/components/currency/monitor'
import { orderStore } from '@/hooks/useOrders'
import { productStore } from '@/hooks/useProducts'
import { cn, formatCurrency, vibrate } from '@/lib/utils'
import { saleStore } from '@/hooks/useSales'
import { itemsTotal, splitPayment } from '@/lib/sales'
import type { PaymentMethod, SaleItem } from '@/types'
import { Banknote, Minus, PackageIcon, Plus, Save, Smartphone, Trash2, UndoDotIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

export function Component() {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()

  const order = saleStore.useStore((state) => state.sales.find((s) => s.id === params.id))

  const [cashAmount, setCashAmount] = useState(order?.cash ?? 0)
  const [pixAmount, setPixAmount] = useState(order?.pix ?? 0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order?.paymentMethod ?? 'dinheiro')
  const [items, setItems] = useState<SaleItem[]>(() => order?.items.map((i) => ({ ...i })) ?? [])

  const mixedTotal = cashAmount + pixAmount
  const total = itemsTotal(items)

  const updateQuantity = (index: number, delta: number) => {
    vibrate(10)
    setItems((prev) => prev.map((i, idx) => (idx === index ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)))
  }

  const handleSave = () => {
    if (!order) return
    const kept = items.filter((i) => i.quantity > 0)

    if (!kept.length) {
      toast.error('A venda precisa ter pelo menos um produto')
      return
    }

    if (paymentMethod === 'combinado' && Math.abs(mixedTotal - total) > 0.01) {
      toast.error('Valores em dinheiro e PIX devem ser igual ao total')
      return
    }

    saleStore.action.update(order.id, {
      items: kept,
      paymentMethod,
      total,
      ...splitPayment(paymentMethod, total, cashAmount, pixAmount),
    })

    toast.success('Venda atualizada!')
    navigate(-1)
  }

  const handleDelete = () => {
    if (!order) return
    saleStore.action.delete(order.id)
    toast.success('Venda excluída')
    navigate(-1)
  }

  const handleReopen = () => {
    if (!order) return
    const products = order.items
      .filter((i): i is SaleItem & { productId: string } => !!i.productId && !!productStore.action.get(i.productId))
      .map((i) => ({ productId: i.productId, quantity: i.quantity }))

    saleStore.action.delete(order.id)
    const reopened = orderStore.action.create(order.name, products)

    toast.success('Comanda reaberta!')
    navigate(`/comandas/${reopened.id}`)
  }

  if (!order) {
    return (
      <div className='text-center py-20'>
        <p className='text-base-content/60'>Venda não encontrada</p>
        <Link to='/' className='text-primary underline mt-4 inline-block'>
          Voltar ao Dashboard
        </Link>
      </div>
    )
  }

  return (
    <>
      <Title title={`Editar Venda: ${order.name}`} subtitle={new Date(order.closedAt).toLocaleString('pt-BR')} />

      <Card>
        <p className='text-xs text-base-content/60 uppercase tracking-wide font-semibold'>Total</p>

        <CurrencyMonitor className='text-3xl font-extrabold font-mono mt-1'>{total}</CurrencyMonitor>
      </Card>

      <Card>
        <Card.Title>Produtos ({items.length})</Card.Title>

        {items.map((product, index) => (
          <div
            key={`${product.productId ?? product.name}-${index}`}
            className='flex items-center justify-between py-2 border-b border-base-300 last:border-0'
          >
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-semibold truncate'>{product.name}</p>
              <p className='text-xs text-base-content/60 font-mono'>
                {formatCurrency(product.unitPrice)}
              </p>
            </div>

            <div className='flex items-center gap-1'>
              <Button type='button' size='sm' modifier='square' onClick={() => updateQuantity(index, -1)}>
                <Minus size={14} />
              </Button>

              <span className='w-8 text-center font-mono font-bold whitespace-nowrap'>{product.quantity}</span>

              <Button type='button' size='sm' modifier='square' onClick={() => updateQuantity(index, 1)}>
                <Plus size={14} />
              </Button>
            </div>
          </div>
        ))}

        {items.every((i) => i.quantity === 0) && (
          <p className='text-sm text-base-content/60 text-center py-4'>Todos os produtos foram removidos</p>
        )}
      </Card>

      <Card>
        <Card.Title>Forma de Pagamento</Card.Title>

        <div className='flex gap-2 mt-2'>
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

        {paymentMethod === 'combinado' && (
          <div className='grid grid-cols-2 gap-3 mt-3'>
            <div className='space-y-1'>
              <Label className='flex items-center gap-2 text-xs'>
                <Banknote size={12} className='text-warning' /> Dinheiro
              </Label>
              <CurrencyInput value={cashAmount} onValueChange={setCashAmount} />
            </div>

            <div className='space-y-1'>
              <Label className='flex items-center gap-2 text-xs'>
                <Smartphone size={12} className='text-success' /> PIX
              </Label>
              <CurrencyInput value={pixAmount} onValueChange={setPixAmount} />
            </div>

            {mixedTotal > 0 && Math.abs(mixedTotal - total) > 0.01 && (
              <div className='col-span-full text-center p-2 rounded-lg bg-base-200/50'>
                <span className='text-sm text-base-content/60'>Total combinado: </span>
                <span className='font-mono font-bold'>{formatCurrency(mixedTotal)}</span>
                <span className={cn('text-xs ml-2', mixedTotal < total ? 'text-error' : 'text-success')}>
                  (diferença de {formatCurrency(Math.abs(total - mixedTotal))})
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Spacer so content doesn't hide behind the sticky action bar */}
      <div aria-hidden className='h-24' />

      <div
        data-swipe-ignore
        className='daisy-glass fixed bottom-16 left-0 right-0 flex gap-3 p-4 border-t border-base-300 z-30'
      >
        <Button.Confirm size='lg' variant='error' appearance='soft' modifier='square' onConfirm={handleDelete}>
          <Trash2 size={20} />
        </Button.Confirm>

        <Button.Confirm size='lg' variant='neutral' appearance='soft' modifier='square' onConfirm={handleReopen}>
          <UndoDotIcon size={20} />
        </Button.Confirm>

        <Button size='lg' variant='primary' className='flex-1' onClick={handleSave}>
          <Save size={20} /> Salvar Alterações
        </Button>
      </div>
    </>
  )
}
