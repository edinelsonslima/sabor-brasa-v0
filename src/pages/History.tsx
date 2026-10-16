import { formatDate } from '@/lib/date'
import { expenseStore } from '@/stores/expense'
import {
  salesInRange,
  staffPaymentsInRange,
  salesTotals,
  staffPaymentsTotal,
  margin,
  netCash,
} from '@/selectors/finance'
import { localDateKey, isSameDay } from '@/lib/date'
import { removeSale } from '@/services/sales'
import { Title } from '@/components/_layout/title'
import { Card } from '@/components/_ui/card'
import { Calendar } from '@/components/calendar'
import { Stat } from '@/components/dashboard/stat'
import { SalesChart } from '@/components/history/chart'
import { SaleItem } from '@/components/sales/item'
import { employeeStore } from '@/stores/employee'
import { staffPaymentStore } from '@/stores/staffPayment'
import { saleStore } from '@/stores/sale'
import { toast } from '@/lib/toast'
import { cn, formatCurrency } from '@/lib/utils'
import { Banknote, PiggyBank, DollarSign, Minus, Smartphone, TrendingDown, TrendingUp } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useMemo, useState } from 'react'

type HighDateProps = Parameters<NonNullable<ComponentProps<typeof Calendar>['highlight']>>[0]

type SelectDateProps = Parameters<NonNullable<ComponentProps<typeof Calendar>['onSelect']>>[0]

export function Component() {
  const sales = saleStore.useStore((s) => s.sales)
  const payments = staffPaymentStore.useStore((s) => s.payments)

  const [date, setDate] = useState(localDateKey())

  const expenses = expenseStore.useStore((s) => s.expenses)
  const daySales = useMemo(() => salesInRange(sales, { day: date }), [sales, date])
  const dayPayments = useMemo(() => staffPaymentsInRange(payments, { day: date }), [payments, date])
  const totals = useMemo(() => salesTotals(daySales), [daySales])
  const totalSales = totals.total
  const totalPix = totals.pix
  const totalCash = totals.cash
  const totalPayments = useMemo(() => staffPaymentsTotal(payments, { day: date }), [payments, date])
  const totalPaymentsByEmployee = dayPayments.reduce<{ id: string; name: string; amount: number; count: number }[]>(
    (acc, payment) => {
      if (payment.receiver?.type !== 'employee' || !payment.receiver.id) {
        return acc
      }

      const employee = employeeStore.action.get(payment.receiver.id)

      if (!employee) {
        return acc
      }

      const existing = acc.find((e) => e.id === employee.id)

      if (!existing) {
        acc.push({
          id: employee.id,
          name: employee.name,
          amount: payment.amount ?? 0,
          count: 1,
        })
      }

      if (existing) {
        existing.amount += payment.amount ?? 0
        existing.count += 1
      }

      return acc
    },
    [],
  )
  const net = useMemo(() => netCash(sales, payments, expenses, { day: date }), [sales, payments, expenses, date])
  const dayMargin = useMemo(() => margin(daySales), [daySales])

  const currentDateSelected = {
    day: parseInt(date.split('-')[2], 10),
    month: parseInt(date.split('-')[1], 10) - 1,
    year: parseInt(date.split('-')[0], 10),
  }

  const handleSelectDate = ({ day, month, year }: SelectDateProps) => {
    setDate(localDateKey(new Date(year, month, day)))
  }

  const hasSalesOnDay = ({ day, month, year, selected }: HighDateProps) => {
    return sales.some((s) => isSameDay(s.closedAt, new Date(year, month, day))) && !selected
  }

  const handleDelete = (id: string) => {
    removeSale(id)
    toast.success('Venda excluída')
  }

  return (
    <>
      <Title title='Histórico' subtitle='Visualize vendas e pagamentos por dia' />

      <Calendar onSelect={handleSelectDate} highlight={hasSalesOnDay} />

      <Card.Title className='text-sm text-base-content/50 font-semibold capitalize mb-0.5 py-2 sticky top-15 z-10 bg-base-100'>
        {formatDate(date, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </Card.Title>

      <Card appearance='ghost'>
        <SalesChart day={currentDateSelected.day} year={currentDateSelected.year} month={currentDateSelected.month} />
      </Card>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Stat title='Vendas' value={totalSales} icon={{ element: DollarSign, variant: 'primary' }} />
        <Stat title='Pix' value={totalPix} icon={{ element: Smartphone, variant: 'success' }} variant='success' />
        <Stat title='Dinheiro' value={totalCash} icon={{ element: Banknote, variant: 'warning' }} variant='warning' />
        <Stat title='Diárias' value={totalPayments} icon={{ element: Minus, variant: 'error' }} variant='error' />
      </div>

      <Stat
        title='Líquido do Dia'
        subtitle='Total vendido − diárias pagas − gastos'
        value={net}
        icon={{
          element: net >= 0 ? TrendingUp : TrendingDown,
          appearance: 'no-border',
        }}
        classNames={{
          icon: 'text-base-content/20 size-10',
          value: cn('text-2xl sm:text-3xl font-extrabold mt-1 font-mono', net >= 0 ? 'text-success' : 'text-error'),
        }}
      />

      <Stat
        title='Margem estimada do dia'
        subtitle='Preço − custo médio dos itens vendidos. Diferente do lucro de caixa: não conta gastos nem diárias.'
        value={dayMargin}
        icon={{ element: PiggyBank, variant: 'info' }}
        variant='info'
      />

      {totalPaymentsByEmployee.length > 0 && (
        <Card>
          <Card.Title>Pagamentos ({totalPaymentsByEmployee.length})</Card.Title>

          {totalPaymentsByEmployee.map((emp) => (
            <div key={emp.id} className='flex items-center'>
              <span className='text-sm whitespace-nowrap'>{emp?.name ?? 'Externo'}</span>

              <span className='flex-1 mx-2 border-b border-dotted border-base-content/20 translate-y-1' />

              <span className='font-bold font-mono'>{formatCurrency(emp.amount)}</span>

              <small className='ml-2 text-xs text-neutral/50'>{emp.count}x</small>
            </div>
          ))}
        </Card>
      )}

      <Card appearance='ghost'>
        <Card.Title>Vendas do Dia ({daySales.length})</Card.Title>

        {daySales.length === 0 ? (
          <p className='text-center text-base-content/60 my-5'>Nenhuma venda neste dia</p>
        ) : (
          daySales.map((sale) => <SaleItem key={sale.id} saleId={sale.id} onDelete={handleDelete} />)
        )}
      </Card>
    </>
  )
}
