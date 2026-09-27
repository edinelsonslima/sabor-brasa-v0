import { Title } from '@/components/_layout/title'
import { Button } from '@/components/_ui/button'
import { ConfirmButton } from '@/components/_ui/button/confirm'
import { Card } from '@/components/_ui/card'
import { toast } from '@/components/_ui/toast'
import { orderStore } from '@/hooks/useOrders'
import { productStore } from '@/hooks/useProducts'
import { cn, formatCurrency } from '@/lib/utils'
import { ArrowLeft, Plus, ReceiptText, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { orderTotal } from './Orders'

export function Component() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const order = orderStore.useStore((s) => s.orders.find((o) => o.id === id))

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

  const isOpen = order.status === 'open'

  const items = [
    ...order.items.regular
      .map((p) => {
        const product = productStore.action.get(p.id)
        return product ? { ...product, quantity: p.quantity } : null
      })
      .filter((p): p is NonNullable<typeof p> => !!p),
    ...order.items.custom,
  ]

  const handleDelete = () => {
    orderStore.action.delete(order.id)
    toast.success('Comanda excluída')
    navigate('/comandas')
  }

  return (
    <>
      <Title
        title={order.name}
        subtitle={
          isOpen
            ? `Aberta às ${new Date(order.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
            : `Fechada em ${order.closedAt ? new Date(order.closedAt).toLocaleString('pt-BR') : ''}`
        }
        prefix={
          <Button modifier='square' appearance='ghost' onClick={() => navigate('/comandas')}>
            <ArrowLeft size={20} />
          </Button>
        }
      />

      <Card>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p className='text-xs text-base-content/60 uppercase tracking-wide font-semibold'>Total da comanda</p>
            <p className='text-3xl font-extrabold font-mono mt-1'>{formatCurrency(orderTotal(order))}</p>
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
        <Card.Title>PEDIDOS DA MESA ({items.length})</Card.Title>

        {items.length === 0 ? (
          <p className='text-sm text-base-content/60 text-center py-6'>Nenhum pedido lançado ainda</p>
        ) : (
          <div className='divide-y divide-base-300'>
            {items.map((item) => (
              <div key={item.id} className='py-3 flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='text-sm font-semibold truncate'>{item.name}</p>
                  <p className='text-xs text-base-content/60 font-mono'>
                    {formatCurrency(item.price)} × {item.quantity} ({item.unit === 'litro' ? 'litro' : 'un'})
                  </p>
                </div>
                <span className='font-mono text-sm font-bold shrink-0'>
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {isOpen ? (
        <>
          <Link
            to={`/comandas/${order.id}/pedidos`}
            className={Button.getStyle('w-full', { variant: 'primary', size: 'lg' })}
          >
            <Plus size={18} /> Adicionar pedidos / fechar comanda
          </Link>

          <ConfirmButton
            modifier='block'
            variant='error'
            appearance='soft'
            onConfirm={handleDelete}
          >
            <Trash2 size={16} /> Excluir comanda
          </ConfirmButton>
        </>
      ) : (
        <Link
          to={`/vendas/${order.saleId}/editar`}
          className={Button.getStyle('w-full', { appearance: 'outline' })}
        >
          <ReceiptText size={16} /> Ver venda gerada
        </Link>
      )}
    </>
  )
}
