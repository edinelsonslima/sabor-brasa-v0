import { Title } from '@/components/_layout/title'
import { Button } from '@/components/_ui/button'
import { Card } from '@/components/_ui/card'
import { Label } from '@/components/_ui/label'
import { Modal } from '@/components/_ui/modal'
import { toast } from '@/components/_ui/toast'
import { CurrencyInput } from '@/components/currency/Input'
import { productStore } from '@/hooks/useProducts'
import { stockEntryStore } from '@/hooks/useStockEntries'
import { cn, formatCurrency, vibrate } from '@/lib/utils'
import type { Product, ProductCategory } from '@/types'
import { m } from 'framer-motion'
import { PackagePlus, Package, Pencil, Plus, Trash2 } from 'lucide-react'
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

  const reset = () => {
    setName(product.name)
    setCategory(product.category ?? 'bebida')
    setUnit(product.unit)
    setPrice(product.price)
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

function StockEntryModal({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const unitLabel = product.unit === 'litro' ? 'L' : 'un'
  const unitCost = quantity > 0 ? totalCost / quantity : 0
  const stock = Math.max(0, product.stock ?? 0)
  const avg = product.averageCost ?? 0
  const newAvg =
    quantity > 0 ? (stock === 0 ? unitCost : (stock * avg + quantity * unitCost) / (stock + quantity)) : avg

  const reset = () => {
    setQuantity(0)
    setTotalCost(0)
  }

  const handleSave = () => {
    if (quantity <= 0) {
      toast.error('Informe a quantidade')
      return false
    }
    if (totalCost <= 0) {
      toast.error('Informe quanto pagou na compra')
      return false
    }
    stockEntryStore.action.add(product.id, quantity, unitCost)
    toast.success('Estoque lançado e gasto registrado!')
    return true
  }

  return (
    <Modal className='w-full'>
      <Modal.Trigger
        as='button'
        aria-label='Lançar estoque'
        className={Button.getStyle(undefined, { size: 'sm', appearance: 'soft', variant: 'primary' })}
        onClick={reset}
      >
        <PackagePlus size={14} />
      </Modal.Trigger>

      <form className='space-y-4'>
        <Modal.Title>
          <h3 className='font-bold'>Lançar estoque · {product.name}</h3>
        </Modal.Title>

        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label>Quantidade ({unitLabel})</Label>
            <input
              type='number'
              min={0}
              step={1}
              inputMode='numeric'
              value={quantity || ''}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder='0'
              className='daisy-input w-full font-mono'
            />
          </div>
          <div className='space-y-2'>
            <CurrencyInput value={totalCost} label='Total pago (R$)' onValueChange={setTotalCost} placeholder='0,00' />
          </div>
        </div>

        <div className='rounded-lg bg-base-200/60 p-3 text-sm space-y-1'>
          <div className='flex justify-between'>
            <span className='text-base-content/60'>Custo por {unitLabel}</span>
            <span className='font-mono font-bold'>{formatCurrency(unitCost)}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-base-content/60'>Custo médio: {formatCurrency(avg)} →</span>
            <span className='font-mono font-bold'>{formatCurrency(newAvg)}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-base-content/60'>Estoque: {product.stock ?? 0} →</span>
            <span className='font-mono font-bold'>
              {(product.stock ?? 0) + quantity} {unitLabel}
            </span>
          </div>
          <p className='text-xs text-base-content/50 pt-1'>O valor pago entra automaticamente nos Gastos.</p>
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
                Lançar
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
  const [stockCost, setStockCost] = useState(0)

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

    if (stock > 0 && stockCost <= 0) {
      toast.error('Informe quanto pagou pelo estoque inicial')
      return
    }

    const created = productStore.action.add({ name: name.trim(), unit, category, price, stock: 0 })
    if (stock > 0) {
      stockEntryStore.action.add(created.id, stock, stockCost / stock)
    }
    toast.success('Produto adicionado!')
    setName('')
    setPrice(0)
    setStock(0)
    setStockCost(0)
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

        {stock > 0 && (
          <div className='space-y-2'>
            <CurrencyInput
              value={stockCost}
              label='Total pago pelo estoque (R$)'
              onValueChange={setStockCost}
              placeholder='0,00'
            />
            <p className='text-xs text-base-content/60'>
              Custo por unidade: {formatCurrency(stockCost / stock)} · entra automaticamente nos Gastos
            </p>
          </div>
        )}

        <Button type='submit' variant='primary' modifier='block'>
          <Plus size={18} /> Adicionar Produto
        </Button>
      </m.form>

      <div className='space-y-2'>
        <h3 className='text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3'>
          Catálogo ({products.length})
        </h3>

        {products.map((p) => (
          <Card key={p.id} className='flex flex-col gap-1'>
            <div className='flex items-center justify-between'>
              <p className='text-lg font-semibold truncate'>{p.name}</p>

              <span className='flex gap-2 items-baseline'>
                <p className='text-xs text-base-content/60 font-mono' title='Custo médio ponderado'>
                  custo {formatCurrency(p.averageCost ?? 0)}
                </p>
                <p className='text-sm font-bold font-mono'>{formatCurrency(p.price)}</p>
              </span>
            </div>

            <div className='flex items-start justify-between gap-3'>
              <div className='flex items-center gap-2 flex-wrap'>
                <CategoryBadge category={p.category} />
                <span
                  className={cn('text-xs', (p.stock ?? 0) <= 0 ? 'text-error font-semibold' : 'text-base-content/60')}
                >
                  Estoque: {p.stock ?? 0} {p.unit === 'litro' ? 'L' : 'un'}
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <StockEntryModal product={p} />
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
          </Card>
        ))}
      </div>
    </>
  )
}
