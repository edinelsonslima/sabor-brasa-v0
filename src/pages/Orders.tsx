import { Title } from '@/components/_layout/title'
import { Button } from '@/components/_ui/button'
import { ConfirmButton } from '@/components/_ui/button/confirm'
import { Card } from '@/components/_ui/card'
import { toast } from '@/components/_ui/toast'
import { orderStore } from '@/hooks/useOrders'
import { productStore } from '@/hooks/useProducts'
import { formatCurrency, vibrate } from '@/lib/utils'
import type { Order } from '@/types'
import { ChevronRight, Plus, ReceiptText, ShoppingCart, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function Component() {
  const orders = orderStore.useStore((s) => s.orders)
  const navigate = useNavigate()

  const open = orders.filter((o) => o.status === 'open')
  const closed = orders.filter((o) => o.status === 'closed').slice(0, 15)

  const handleOpen = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = new FormData(e.currentTarget).get('name')?.toString().trim() ?? ''
    if (!name) {
      toast.warn('Digite um nome para a comanda')
      return
    }
    vibrate(10)
    const order = orderStore.action.open(name)
    toast.success(`Comanda "${name}" aberta`)
    navigate(`/comandas/${order.id}`)
  }

  return (
    <>
      <Title
        title='Comandas'
        subtitle='Abra comandas e adicione pedidos'
        suffix={
          <Link to='/vendas' className={Button.getStyle('', { appearance: 'outline' })}>
            <ShoppingCart size={16} /> Venda rápida
          </Link>
        }
      />

      <form onSubmit={handleOpen} className={Card.getStyle('p-4 flex gap-2')}>
        <input
          name='name'
          type='text'
          maxLength={60}
          placeholder='Mesa 3, João, balcão...'
          className='daisy-input daisy-input-bordered w-full'
        />
        <Button type='submit' variant='primary'>
          <Plus size={16} /> Abrir
        </Button>
      </form>

      <Card appearance='ghost'>
        <Card.Title>ABERTAS ({open.length})</Card.Title>
        {open.length === 0 ? (
          <Card className='p-8 text-center text-base-content/60 text-sm'>Nenhuma comanda aberta</Card>
        ) : (
          <div className='space-y-2'>
            {open.map((o) => {
              const count =
                o.items.regular.reduce((s, p) => s + p.quantity, 0) + o.items.custom.reduce((s, p) => s + p.quantity, 0)
              return (
                <div key={o.id} className={Card.getStyle('p-3 flex flex-row items-center gap-3')}>
                  <Link to={`/comandas/${o.id}`} className='flex flex-1 items-center gap-3 min-w-0'>
                    <ReceiptText className='text-primary shrink-0' size={22} />
                    <div className='min-w-0 flex-1'>
                      <p className='font-semibold truncate'>{o.name}</p>
                      <p className='text-xs text-base-content/60'>
                        {count} itens · aberta às{' '}
                        {new Date(o.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className='font-mono font-bold'>{formatCurrency(orderTotal(o))}</span>
                    <ChevronRight size={18} className='opacity-40' />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {closed.length > 0 && (
        <Card appearance='ghost'>
          <Card.Title>FECHADAS RECENTEMENTE</Card.Title>
          <div className='space-y-2'>
            {closed.map((o) => (
              <div key={o.id} className={Card.getStyle('p-3 flex justify-between items-center opacity-70')}>
                <div>
                  <p className='text-sm font-semibold'>{o.name}</p>
                  <p className='text-xs text-base-content/60'>
                    Fechada {o.closedAt ? new Date(o.closedAt).toLocaleString('pt-BR') : ''}
                  </p>
                </div>
                <span className='font-mono text-sm'>{formatCurrency(orderTotal(o))}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}

function orderTotal(order: Order) {
  return (
    order.items.custom.reduce((a, p) => a + p.price * p.quantity, 0) +
    order.items.regular.reduce((a, p) => a + (productStore.action.get(p.id)?.price ?? 0) * p.quantity, 0)
  )
}
