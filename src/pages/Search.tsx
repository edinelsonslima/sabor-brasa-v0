import { Title } from '@/components/_layout/title'
import { Button } from '@/components/_ui/button'
import { Card } from '@/components/_ui/card'
import { toast } from '@/components/_ui/toast'
import { SaleItem } from '@/components/sales/item'
import { employeeStore } from '@/hooks/useEmployees'
import { productStore } from '@/hooks/useProducts'
import { saleStore } from '@/hooks/useSales'
import { formatCurrency } from '@/lib/utils'
import { m } from 'framer-motion'
import { ArrowLeft, Package, Search as SearchIcon, User } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function Component() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const sales = saleStore.useStore((s) => s.sales)
  const employees = employeeStore.useStore((s) => s.employees)
  const products = productStore.useStore((s) => s)

  const q = query.toLowerCase().trim()

  const filteredEmployees = q ? employees.filter((e) => e.name.toLowerCase().includes(q)) : []

  const filteredProducts = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : []

  const filteredSales = q
    ? sales.filter((s) => {
        const dateMatch = new Date(s.closedAt).toLocaleDateString('pt-BR').includes(q)
        const nameMatch = s.name.toLowerCase().includes(q)
        const productMatch = s.items.some((i) => i.name.toLowerCase().includes(q))
        const priceMatch = formatCurrency(s.total).toLowerCase().includes(q)
        return dateMatch || nameMatch || productMatch || priceMatch
      })
    : []

  const handleDeleteSale = (id: string) => {
    saleStore.action.delete(id)
    toast.success('Venda excluída')
  }

  const hasResults = filteredEmployees.length > 0 || filteredProducts.length > 0 || filteredSales.length > 0

  return (
    <>
      <Title
        title='Buscar'
        subtitle='Pesquise por vendas, funcionários e produtos'
        prefix={
          <Button modifier='square' appearance='ghost' onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
        }
      />

      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <label className='daisy-input daisy-input-bordered w-full flex items-center gap-2'>
          <SearchIcon size={18} className='text-base-content/40' />
          <input
            type='text'
            placeholder='Buscar vendas, funcionários, produtos...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className='grow'
            autoFocus
          />
        </label>
      </m.div>

      {q && !hasResults && (
        <Card className='text-center text-base-content/60 text-sm py-8'>Nenhum resultado para "{query}"</Card>
      )}

      {filteredEmployees.length > 0 && (
        <div>
          <h3 className='text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3'>
            Funcionários ({filteredEmployees.length})
          </h3>
          <Card className='divide-y divide-base-300 p-0 overflow-hidden'>
            {filteredEmployees.map((emp) => (
              <div key={emp.id} className='flex items-center gap-3 px-4 py-3'>
                <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                  <User size={18} className='text-primary' />
                </div>
                <div>
                  <p className='font-semibold text-sm'>{emp.name}</p>
                  <p className='text-xs text-base-content/60'>
                    Diárias: {formatCurrency(emp.defaultRates[0])} / {formatCurrency(emp.defaultRates[1])}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {filteredProducts.length > 0 && (
        <div>
          <h3 className='text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3'>
            Produtos ({filteredProducts.length})
          </h3>
          <Card className='divide-y divide-base-300 p-0 overflow-hidden'>
            {filteredProducts.map((product) => (
              <div key={product.id} className='flex items-center gap-3 px-4 py-3'>
                <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                  <Package size={18} className='text-primary' />
                </div>
                <div>
                  <p className='font-semibold text-sm'>{product.name}</p>
                  <p className='text-xs text-base-content/60 font-mono'>
                    {formatCurrency(product.price)} / {product.unit === 'litro' ? 'litro' : 'unidade'}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {filteredSales.length > 0 && (
        <div>
          <h3 className='text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-3'>
            Vendas ({filteredSales.length})
          </h3>
          <div className='space-y-2'>
            {filteredSales.slice(0, 30).map((sale) => (
              <SaleItem key={sale.id} saleId={sale.id} onDelete={handleDeleteSale} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
