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

  return (
    <Collapse icon='arrow'>
      <Collapse.Summary>
        <p className='text-sm font-semibold truncate min-w-0'>{sale.name} • {sale.items.reduce((a, i) => a + i.quantity, 0)} itens · {formatCurrency(sale.total)}</p>

        <div className='flex items-center justify-start gap-3 text-xs text-base-content/60 mt-1'>
          <span>{formatDateTime(new Date(sale.closedAt).toISOString())}</span>

          {sale.cash > 0 && (
            <span className='flex items-center gap-1'>
              <Banknote size={12} className='text-warning' />
              {formatCurrency(sale.cash)}
            </span>
          )}

          {sale.pix > 0 && (
            <span className='flex items-center gap-1'>
              <Smartphone size={12} className='text-success' />
              {formatCurrency(sale.pix)}
            </span>
          )}
        </div>
      </Collapse.Summary>

      <Collapse.Content className='space-y-4'>
        <div className='space-y-1 py-3 border-t border-b border-dashed border-base-300'>
          {sale.items.map((item, index) => (
            <div key={`${item.productId ?? item.name}-${index}`} className='flex items-center justify-between text-sm'>
              <span className='truncate'>{item.name}</span>
              <span className='flex-1 mx-2 border-b border-dotted border-base-content/20 translate-y-1' />
              <span className='text-base-content/60 font-mono'>
                {item.quantity}x {formatCurrency(item.unitPrice)}
              </span>
            </div>
          ))}
        </div>

        <div className='flex justify-end gap-2'>
          <Link
            to={`/vendas/${sale.id}/editar`}
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
