import { productStore } from '@/hooks/useProducts'
import { saleStore } from '@/hooks/useSales'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Banknote, Pencil, Smartphone, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../_ui/button'
import { Collapse } from '../_ui/collapse'

interface SaleItemProps {
  saleId: string
  onDelete?: (id: string) => void
}

export function SaleItem({ saleId, onDelete }: SaleItemProps) {
  const sale = saleStore.useStore((state) => {
    return state.sales.find((s) => s.id === saleId)
  })

  if (!sale) {
    return null
  }

  const getProducts = () => {
    return (sale.products?.regular ?? [])
      .map((p) => {
        const product = productStore.action.get(p.id)
        return product ? { ...product, quantity: p.quantity } : null
      })
      .concat(sale.products?.custom ?? [])
      .filter((p) => !!p)
  }

  return (
    <Collapse icon='arrow'>
      <Collapse.Summary>
        <p className='text-sm font-semibold'>Venda • {getProducts()?.length ?? 0} itens</p>

        <div className='flex items-center justify-start gap-3 text-xs text-base-content/60 mt-1'>
          <span>{formatDateTime(sale.date)}</span>

          {sale.price?.cash > 0 && (
            <span className='flex items-center gap-1'>
              <Banknote size={12} className='text-warning' />
              {formatCurrency(sale.price.cash)}
            </span>
          )}

          {sale.price?.pix > 0 && (
            <span className='flex items-center gap-1'>
              <Smartphone size={12} className='text-success' />
              {formatCurrency(sale.price.pix)}
            </span>
          )}
        </div>
      </Collapse.Summary>

      <Collapse.Content className='space-y-4'>
        <div className='space-y-1 py-3 border-t border-b border-dashed border-base-300'>
          {getProducts()?.map((product) => (
            <div key={product.id} className='flex items-center justify-between text-sm'>
              <span className='truncate'>
                {product.name} ({product.unit === 'litro' ? 'L' : 'un.'})
              </span>
              <span className='flex-1 mx-2 border-b border-dotted border-base-content/20 translate-y-1' />
              <span className='text-base-content/60'>{product.quantity}x</span>
            </div>
          ))}
        </div>

        <div className='flex justify-end gap-2'>
          <Link
            to={`/comandas/${sale.id}/editar`}
            className={Button.getStyle(undefined, {
              appearance: 'soft',
              size: 'sm',
            })}
          >
            <Pencil size={15} /> Editar
          </Link>

          {onDelete && (
            <Button.Confirm size='sm' variant='error' appearance='soft' onConfirm={() => onDelete(sale.id)}>
              <Trash2 size={15} />
            </Button.Confirm>
          )}
        </div>
      </Collapse.Content>
    </Collapse>
  )
}
