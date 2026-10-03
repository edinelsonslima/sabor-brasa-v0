import { Title } from '@/components/_layout/title'
import { Button } from '@/components/_ui/button'
import { Card } from '@/components/_ui/card'
import { toast } from '@/components/_ui/toast'
import { orderStore } from '@/hooks/useOrders'
import { productStore } from '@/hooks/useProducts'
import { saleStore } from '@/hooks/useSales'
import { formatCurrency, vibrate } from '@/lib/utils'
import { ChevronRight, Plus, ReceiptTextIcon } from 'lucide-react'
import type { SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function Component() {
  const navigate = useNavigate()

  const orders = orderStore.useStore((state) => state)

  const open = orders
  const closed = saleStore.useStore((state) => state.sales).slice(0, 15)

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    const form = new FormData(e.currentTarget)
    const orderName = form.get('name')?.toString().trim() ?? ''

    if (!orderName) {
      toast.warn('Digite um nome para a comanda')
      return
    }

    vibrate(10)

    const order = orderStore.action.create(orderName)

    toast.success(`Comanda "${order.name}" aberta`)
    navigate(`/comandas/${order.id}`)
  }

  const getOrderTotal = (orderId: string) => {
    const order = orderStore.action.get(orderId) ?? { products: [] }

    return order.products.reduce((acc, p) => {
      const productPrice = productStore.action.get(p.productId)?.price ?? 0
      return acc + productPrice * p.quantity
    }, 0)
  }

  return (
    <>
      <Title title='Comandas' subtitle='Abra comandas e adicione pedidos' />

      <form onSubmit={handleSubmit} className='flex gap-2 items-center'>
        <input
          name='name'
          type='text'
          maxLength={60}
          placeholder='Mesa 3, João, balcão...'
          className='daisy-input flex-1 w-full min-w-0 text-base'
        />
        <Button type='submit' variant='primary' size='md'>
          <Plus size={16} /> Abrir
        </Button>
      </form>

      <Card appearance='ghost'>
        <Card.Title>ABERTAS ({open.length})</Card.Title>
        {open.length === 0 && <Card className='p-8 text-center text-base-content/60'>Nenhuma comanda aberta</Card>}

        {open.length > 0 && (
          <div className='grid grid-cols-2 gap-3'>
            {open.map((order) => (
              <Link key={order.id} to={`/comandas/${order.id}`} className={Card.getStyle('min-w-0 flex-1 p-3')}>
                <div className='flex items-center justify-between gap-1'>
                  <span className='flex items-center gap-1 flex-1 min-w-0'>
                    <ReceiptTextIcon className='text-primary shrink-0' size={16} />
                    <p className='font-semibold truncate text-lg'>{order.name}</p>
                  </span>
                  <span className='font-mono font-bold shrink-0'>{formatCurrency(getOrderTotal(order.id))}</span>
                </div>

                <div className='flex items-center'>
                  <p className='text-xs text-base-content/60'>
                    {order.products.length} itens · aberta às{' '}
                    {new Date(order.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <ChevronRight size={18} className='opacity-40' />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {closed.length > 0 && (
        <Card appearance='ghost'>
          <Card.Title>FECHADAS RECENTEMENTE</Card.Title>

          <div className='space-y-2'>
            {closed.map((order) => (
              <Link
                key={order.id}
                to={`/vendas/${order.id}/editar`}
                className={Card.getStyle('p-3 flex flex-row justify-between items-center opacity-70')}
              >
                <div className='min-w-0'>
                  <p className='text-sm font-semibold truncate'>{order.name}</p>
                  <p className='text-xs text-base-content/60 truncate'>
                    Fechada {new Date(order.closedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span className='font-mono text-sm shrink-0'>{formatCurrency(order.total)}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}
