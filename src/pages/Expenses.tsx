import { formatDate } from '@/lib/date'
import { useToday } from '@/hooks/useToday'
import { expensesTotal, staffPaymentsTotal } from '@/selectors/finance'
import { expenseCategories, addExpense, deleteExpense } from '@/services/records'
import { Title } from '@/components/_layout/title'
import { Button } from '@/components/_ui/button'
import { ConfirmButton } from '@/components/_ui/button/confirm'
import { Card } from '@/components/_ui/card'
import { Label } from '@/components/_ui/label'
import { toast } from '@/components/_ui/toast'
import { CurrencyInput } from '@/components/currency/Input'
import { Stat } from '@/components/dashboard/stat'
import { expenseStore } from '@/stores/expense'
import { staffPaymentStore } from '@/stores/staffPayment'
import { formatCurrency, vibrate } from '@/lib/utils'
import type { ExpenseCategory } from '@/types'
import { Minus, Plus, Trash2, Wallet } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'

export function Component() {
  const expenses = expenseStore.useStore((s) => s.expenses)
  const payments = staffPaymentStore.useStore((s) => s.payments)
  const today = useToday()
  const month = today.slice(0, 7)
  const monthPayments = useMemo(() => ({ total: staffPaymentsTotal(payments, { month }) }), [payments, month])
  const [category, setCategory] = useState<ExpenseCategory>('bebidas_comida')
  const [formKey, setFormKey] = useState(0)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const amount = parseInt(fd.get('amount')?.toString().replace(/\D/g, '') || '0', 10) / 100
    const description = fd.get('description')?.toString().trim() || expenseCategories[category]
    const date = fd.get('date')?.toString() || today

    if (amount <= 0) {
      toast.warn('Informe um valor válido')
      return
    }

    vibrate(10)
    addExpense({ amount, description, category, date })
    toast.success('Gasto lançado')
    setFormKey((k) => k + 1)
  }

  const monthExpenses = useMemo(() => expensesTotal(expenses, { month }), [expenses, month])

  return (
    <>
      <Title title='Gastos' subtitle='Compras e despesas do estabelecimento' />

      <div className='grid grid-cols-2 gap-4'>
        <Stat
          title='Gastos no mês'
          variant='error'
          value={monthExpenses}
          icon={{ element: Wallet, variant: 'error' }}
        />
        <Stat
          title='Diárias no mês'
          variant='error'
          value={monthPayments.total}
          icon={{ element: Minus, variant: 'error' }}
        />
      </div>

      <form key={formKey} onSubmit={handleSubmit} className={Card.getStyle('p-4 space-y-3')}>
        <div className='flex gap-2 flex-wrap'>
          {(Object.keys(expenseCategories) as ExpenseCategory[]).map((c) => (
            <Button
              key={c}
              type='button'
              size='sm'
              appearance='outline'
              active={category === c}
              variant={category === c ? 'primary' : undefined}
              onClick={() => setCategory(c)}
            >
              {expenseCategories[c]}
            </Button>
          ))}
        </div>

        <CurrencyInput name='amount' label='Valor' />

        <div>
          <Label>Descrição</Label>
          <input
            name='description'
            maxLength={100}
            placeholder='Ex: caixa de cerveja, carne...'
            className='daisy-input w-full'
          />
        </div>

        <div>
          <Label>Data</Label>
          <input name='date' type='date' defaultValue={today} className='daisy-input w-full' />
        </div>

        <Button type='submit' variant='primary' modifier='block'>
          <Plus size={16} /> Lançar gasto
        </Button>
      </form>

      <Card appearance='ghost'>
        <Card.Title>ÚLTIMOS GASTOS</Card.Title>
        {expenses.length === 0 ? (
          <Card className='p-8 text-center text-base-content/60 text-sm'>Nenhum gasto lançado</Card>
        ) : (
          <div className='space-y-2'>
            {expenses.slice(0, 50).map((e) => (
              <div key={e.id} className={Card.getStyle('p-3 flex items-center gap-3')}>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold truncate'>{e.description}</p>
                  <p className='text-xs text-base-content/60'>
                    {expenseCategories[e.category]} · {formatDate(e.date)}
                  </p>
                </div>
                <span className='font-mono text-sm text-error'>-{formatCurrency(e.amount)}</span>
                <ConfirmButton
                  size='xs'
                  variant='error'
                  appearance='soft'
                  onConfirm={() => (deleteExpense(e.id), toast.success('Gasto excluído'))}
                >
                  <Trash2 size={15} />
                </ConfirmButton>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
