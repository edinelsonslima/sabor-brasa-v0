import { formatDate } from '@/lib/date'
import { useMemo, useState } from 'react'
import { useToday } from '@/hooks/useToday'
import { salesInRange, salesTotals, staffPaymentsTotal, expensesTotal, margin, netCash } from '@/selectors/finance'
import { removeSale } from '@/services/sales'
import { Title } from '@/components/_layout/title'
import { Card } from '@/components/_ui/card'
import { toast } from '@/components/_ui/toast'
import { Stat } from '@/components/dashboard/stat'
import { SaleItem } from '@/components/sales/item'
import { authStore } from '@/stores/auth'
import { expenseStore } from '@/stores/expense'
import { staffPaymentStore } from '@/stores/staffPayment'
import { saleStore } from '@/stores/sale'
import { cn, formatCurrency } from '@/lib/utils'
import { Banknote, PiggyBank, DollarSign, Wallet, Minus, Smartphone, TrendingDown, TrendingUp } from 'lucide-react'

export function Component() {
  const user = authStore.useStore((state) => state.user)

  const allSales = saleStore.useStore((state) => state.sales)
  const payments = staffPaymentStore.useStore((state) => state.payments)
  const expenses = expenseStore.useStore((state) => state.expenses)
  const day = useToday()
  const month = day.slice(0, 7)
  const stats = useMemo(() => {
    const dayRange = { day }
    const monthRange = { month }
    const daily = salesInRange(allSales, dayRange)
    const monthly = salesInRange(allSales, monthRange)
    return {
      todaySales: salesTotals(daily),
      monthSales: salesTotals(monthly),
      todayPayments: { total: staffPaymentsTotal(payments, dayRange) },
      monthPayments: { total: staffPaymentsTotal(payments, monthRange) },
      todayExpenses: expensesTotal(expenses, dayRange),
      monthExpenses: expensesTotal(expenses, monthRange),
      todayMargin: margin(daily),
      monthMargin: margin(monthly),
      todayNet: netCash(allSales, payments, expenses, dayRange),
      monthNet: netCash(allSales, payments, expenses, monthRange),
    }
  }, [allSales, payments, expenses, day, month])
  const {
    todaySales,
    monthSales,
    todayPayments,
    monthPayments,
    todayExpenses,
    monthExpenses,
    todayMargin,
    monthMargin,
    todayNet,
    monthNet,
  } = stats

  const [hour] = useState(() => new Date().getHours())
  const getGreeting = () => {
    if (hour < 12) {
      return 'Bom dia'
    }

    if (hour < 18) {
      return 'Boa tarde'
    }

    return 'Boa noite'
  }

  const handleDelete = (id: string) => {
    removeSale(id)
    toast.success('Venda excluída')
  }

  return (
    <>
      <Title
        title={`${getGreeting()}, ${user?.name?.split(' ')[0] ?? ''}!`}
        subtitle={`Resumo do dia ${formatDate(day)}`}
      />

      <Card appearance='ghost'>
        <Card.Title>HOJE</Card.Title>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Stat title='Total Vendido' value={todaySales.total} icon={{ element: DollarSign, variant: 'primary' }} />

          <Stat
            title='Pix'
            variant='success'
            value={todaySales.pix}
            icon={{ element: Smartphone, variant: 'success' }}
          />

          <Stat
            title='Dinheiro'
            variant='warning'
            value={todaySales.cash}
            icon={{ element: Banknote, variant: 'warning' }}
          />

          <Stat
            title='Diárias Pagas'
            variant='error'
            value={todayPayments.total}
            icon={{ element: Minus, variant: 'error' }}
          />
        </div>
      </Card>

      <Stat
        title='Líquido Hoje'
        subtitle={`Vendas − diárias − gastos (${formatCurrency(todayExpenses)} em gastos)`}
        value={todayNet}
        icon={{
          element: todayNet >= 0 ? TrendingUp : TrendingDown,
          appearance: 'no-border',
        }}
        classNames={{
          icon: 'text-base-content/20 size-10',
          value: cn(
            'text-2xl sm:text-3xl font-extrabold mt-1 font-mono',
            todayNet >= 0 ? 'text-success' : 'text-error',
          ),
        }}
      />

      <Stat
        title='Margem estimada hoje'
        subtitle='Preço − custo médio dos itens vendidos. Diferente do lucro de caixa: não conta gastos nem diárias.'
        value={todayMargin}
        icon={{ element: PiggyBank, variant: 'info' }}
        variant='info'
      />

      <Card appearance='ghost'>
        <Card.Title>ESTE MÊS</Card.Title>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          <Stat title='Total Mês' value={monthSales.total} icon={{ element: DollarSign, variant: 'primary' }} />
          <Stat
            title='Pix no Mês'
            variant='success'
            value={monthSales.pix}
            icon={{ element: Smartphone, variant: 'success' }}
          />
          <Stat
            title='Dinheiro no Mês'
            variant='warning'
            value={monthSales.cash}
            icon={{ element: Banknote, variant: 'warning' }}
          />
          <Stat
            title='Diárias Pagas no Mês'
            variant='error'
            value={monthPayments.total}
            icon={{ element: Minus, variant: 'error' }}
          />
          <Stat
            title='Gastos no Mês'
            variant='error'
            value={monthExpenses}
            icon={{ element: Wallet, variant: 'error' }}
          />
        </div>
      </Card>

      <Stat
        title={monthNet >= 0 ? 'Lucro do Mês' : 'Prejuízo do Mês'}
        subtitle='Vendas − diárias − gastos do mês'
        value={monthNet}
        icon={{ element: monthNet >= 0 ? TrendingUp : TrendingDown, appearance: 'no-border' }}
        classNames={{
          icon: 'text-base-content/20 size-10',
          value: cn(
            'text-2xl sm:text-3xl font-extrabold mt-1 font-mono',
            monthNet >= 0 ? 'text-success' : 'text-error',
          ),
        }}
      />

      <Stat
        title='Margem estimada do mês'
        subtitle='Preço − custo médio dos itens vendidos. Diferente do lucro de caixa: não conta gastos nem diárias.'
        value={monthMargin}
        icon={{ element: PiggyBank, variant: 'info' }}
        variant='info'
      />

      <Card appearance='ghost'>
        <Card.Title>VENDAS DE HOJE ({todaySales.saleId.length})</Card.Title>
        {todaySales.saleId.length === 0 ? (
          <Card className='p-8 text-center text-base-content/60 text-sm'>Nenhuma venda registrada hoje</Card>
        ) : (
          <div className='space-y-2'>
            {todaySales.saleId.slice(0, 10).map((saleId) => (
              <SaleItem key={saleId} saleId={saleId} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
