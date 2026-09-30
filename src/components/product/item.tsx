import { cn, formatCurrency, vibrate } from '@/lib/utils'
import type { Product } from '@/types'
import { MinusIcon, PlusIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Button } from '../_ui/button'

interface Props extends Omit<ComponentProps<'div'>, 'onSelect'> {
  product: Product
  quantity?: number
  onSelect: (product: Product, quantity: number) => void
}

export function ProductItem({ product, quantity = 0, className, onSelect, ...props }: Props) {
  const updateProductByQuantity = (qty: number = 0) => {
    const newQuantity = Math.max(qty, 0)
    onSelect(product, newQuantity)
    vibrate(10)
  }

  return (
    <div className={cn('daisy-card bg-base-100 shadow-sm', className)} {...props}>
      <figure className='daisy-card-image h-32 w-full bg-base-200 rounded-t-lg overflow-hidden'>
        <img
          src={product.imageUrl ?? '/public/icons/icon-192x192.png'}
          alt={product.name}
          className='object-contain size-full aspect-square'
        />
      </figure>

      <div className='daisy-card-body p-2'>
        <h2 className='daisy-card-title'>{product.name}</h2>

        <div className='flex items-center justify-between w-full'>
          <span className='font-mono font-bold text-sm truncate'>{formatCurrency(product.price)}</span>

          <span className={cn('text-xs', quantity && 'font-bold')}>
            {!quantity ? (product.unit === 'litro' ? 'litro' : 'uni') : `${quantity}x`}
          </span>
        </div>

        <div className='daisy-card-actions justify-end flex-row flex-nowrap gap-2'>
          <Button onClick={() => updateProductByQuantity(quantity - 1)} variant='error' appearance='soft'>
            <MinusIcon size={16} className='text-error-content' />
          </Button>
          <Button
            onClick={() => updateProductByQuantity(quantity + 1)}
            variant='success'
            appearance='soft'
            className='flex-1'
          >
            <PlusIcon size={16} className='text-success-content' />
          </Button>
        </div>
      </div>
    </div>
  )
}
