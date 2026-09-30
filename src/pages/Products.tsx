import { Title } from '@/components/_layout/title'
import { Button } from '@/components/_ui/button'
import { Card } from '@/components/_ui/card'
import { Label } from '@/components/_ui/label'
import { Modal } from '@/components/_ui/modal'
import { toast } from '@/components/_ui/toast'
import { CurrencyInput } from '@/components/currency/Input'
import { productStore } from '@/hooks/useProducts'
import { cn, formatCurrency, vibrate } from '@/lib/utils'
import type { Product, ProductCategory } from '@/types'
import { m } from 'framer-motion'
import { Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  bebida: 'Bebida',
  comida: 'Comida',
}

function CategoryBadge({ category }: { category?: ProductCategory }) {
  return (
    <span
      className={cn(
        'text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
        category === 'comida' ? 'bg-warning/15 text-warning' : 'bg-info/15 text-info',
      )}
    >
      {CATEGORY_LABEL[category ?? 'bebida']}
    </span>
  )
}

function ProductEditModal({ product }: { product: Product }) {
  const [name, setName] = useState(product.name)
  const [category, setCategory] = useState<ProductCategory>(product.category ?? 'bebida')
  const [unit, setUnit] = useState<'unidade' | 'litro'>(product.unit)
  const [price, setPrice] = useState(product.price)
  const [refill, setRefill] = useState(0)

  const reset = () => {
    setName(product.name)
    setCategory(product.category ?? 'bebida')
    setUnit(product.unit)
    setPrice(product.price)
    setRefill(0)
  }

  const handleSave = () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Nome do produto deve ter ao menos 2 caracteres')
      return false
    }

    if (price <= 0) {
      toast.error('Informe um preço válido')
      return false
    }

    productStore.action.update(product.id, {
      name: name.trim(),
      category,
      unit,
      price,
      stock: (product.stock ?? 0) + Math.max(0, refill),
    })
    toast.success('Produto atualizado!')
    return true
  }

  return (
    <Modal className='w-full'>
      <Modal.Trigger
        as='button'
        aria-label='Editar produto'
        className={Button.getStyle(undefined, { size: 'sm', appearance: 'soft' })}
        onClick={reset}
      >
        <Pencil size={14} />
      </Modal.Trigger>

      <form className='space-y-4'>
        <Modal.Title>
          <h3 className='font-bold'>Editar produto</h3>
        </Modal.Title>

        <div className='space-y-2'>
          <Label>Nome do Produto</Label>
          <input
            className='daisy-input w-full'
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            minLength={2}
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label>Categoria</Label>
            <select
              className='daisy-select w-full'
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
            >
              <option value='bebida'>Bebida</option>
              <option value='comida'>Comida</option>
            </select>
          </div>
          <div className='space-y-2'>
            <Label>Unidade</Label>
            <select
              className='daisy-select w-full'
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'unidade' | 'litro')}
            >
              <option value='unidade'>Por Unidade</option>
              <option value='litro'>Por Litro</option>
            </select>
          </div>
        </div>

        <div className='space-y-2'>
          <CurrencyInput value={price} label='Preço (R$)' onValueChange={setPrice} placeholder='0,00' />
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label>Adicionar ao estoque</Label>
            <span className='text-xs text-base-content/60'>
              Atual: {product.stock ?? 0} {product.unit === 'litro' ? 'L' : 'un'}
            </span>
          </div>
          <input
            type='number'
            min={0}
            step={1}
            value={refill || ''}
            onChange={(e) => setRefill(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder='0'
            className='daisy-input w-full font-mono'
          />
          {refill > 0 && (
            <p className='text-xs text-base-content/60'>
              Novo estoque: {(product.stock ?? 0) + refill} {product.unit === 'litro' ? 'L' : 'un'}
            </p>
          )}
        </div>

        <Modal.Actions>
          {({ close }) => (
            <>
              <Button type='button' appearance='ghost' onClick={close}>
                Cancelar
              </Button>
              <Button
                type='button'
                variant='primary'
                onClick={(e) => {
                  vibrate(10)
                  if (handleSave()) {
                    close()
                  } else {
                    e.preventDefault()
                  }
                }}
              >
                Salvar
              </Button>
            </>
          )}
        </Modal.Actions>
      </form>
    </Modal>
  )
}

export function Component() {
  const products = productStore.useStore((state) => state)

  const [name, setName] = useState('')
  const [unit, setUnit] = useState<'unidade' | 'litro'>('unidade')
  const [category, setCategory] = useState<ProductCategory>('bebida')
  const [price, setPrice] = useState(0)
  const [stock, setStock] = useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || name.trim().length < 2) {
      toast.error('Nome do produto deve ter ao menos 2 caracteres')
      return
    }

    if (price <= 0) {
      toast.error('Informe um preço válido')
      return
    }

    productStore.action.add({ name: name.trim(), unit, category, price, stock })
    toast.success('Produto adicionado!')
    setName('')
    setPrice(0)
    setStock(0)
  }

  return (
    <>
      <Title title='Produtos' subtitle='Gerencie seu catálogo de produtos' />

      <m.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className={Card.getStyle('p-3 space-y-4')}
      >
        <div className='space-y-2'>
          <Label>Nome do Produto</Label>
          <input
            className='daisy-input w-full'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Ex: Água Mineral, Gasolina, etc.'
            maxLength={100}
            minLength={2}
          />
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label>Categoria</Label>
            <select
              className='daisy-select w-full'
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
            >
              <option value='bebida'>Bebida</option>
              <option value='comida'>Comida</option>
            </select>
          </div>
          <div className='space-y-2'>
            <Label>Unidade</Label>
            <select
              className='daisy-select w-full'
              value={unit}
              onChange={(e) => setUnit(e.target.value as 'unidade' | 'litro')}
            >
              <option value='unidade'>Por Unidade</option>
              <option value='litro'>Por Litro</option>
            </select>
          </div>
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <CurrencyInput value={price} label='Preço (R$)' onValueChange={setPrice} placeholder='0,00' />
          </div>
          <div className='space-y-2'>
            <Label>Quantidade em estoque</Label>
            <input
              type='number'
              min={0}
              step={1}
              value={stock || ''}
              onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder='0'
              className='daisy-input w-full font-mono'
            />
          </div>
        </div>

        {stock > 0 && price > 0 && (
          <div className='flex items-center justify-between rounded-lg bg-base-200/60 p-3 text-sm'>
            <span className='text-base-content/60'>
              Valor total em estoque ({stock} × {formatCurrency(price)})
            </span>
            <span className='font-mono font-bold'>{formatCurrency(price * stock)}</span>
          </div>
        )}

        <Button type='submit' variant='primary' modifier='block'>
          <Plus size={18} /> Adicionar Produto
        </Button>
      </m.form>

      <div>
        <h3 className='text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3'>
          Catálogo ({products.length})
        </h3>

        <Card className={{ root: 'overflow-hidden', body: 'divide-y divide-base-content/20' }}>
          {products.map((p) => (
            <div key={p.id} className='flex items-center justify-between gap-2 py-3'>
              <div className='flex items-center gap-3 min-w-0 flex-1'>
                <Package size={16} className='text-primary shrink-0' />

                <div className='min-w-0'>
                  <p className='text-sm font-semibold truncate'>{p.name}</p>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <CategoryBadge category={p.category} />
                    <span
                      className={cn(
                        'text-xs',
                        (p.stock ?? 0) <= 0 ? 'text-error font-semibold' : 'text-base-content/60',
                      )}
                    >
                      Estoque: {p.stock ?? 0} {p.unit === 'litro' ? 'L' : 'un'}
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-4'>
                <p className='text-sm font-bold font-mono'>{formatCurrency(p.price)}</p>

                <div className='flex items-center gap-2'>
                  <ProductEditModal product={p} />
                  <Button.Confirm
                    size='sm'
                    variant='error'
                    appearance='soft'
                    onConfirm={() => {
                      productStore.action.delete(p.id)
                      toast.info('Produto removido')
                    }}
                  >
                    <Trash2 size={14} />
                  </Button.Confirm>
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </>
  )
}
