import { formatDate } from '@/lib/date'
import { useToday } from '@/hooks/useToday'
import { isSameDay } from '@/lib/date'
import { staffPaymentsInRange, staffPaymentsTotal } from '@/selectors/finance'
import { addStaffPayment, deleteStaffPayment, addEmployee, deleteEmployee } from '@/services/records'
import { Title } from '@/components/_layout/title'
import { Button } from '@/components/_ui/button'
import { Card } from '@/components/_ui/card'
import { Label } from '@/components/_ui/label'
import { Modal } from '@/components/_ui/modal'
import { toast } from '@/components/_ui/toast'
import { CurrencyInput } from '@/components/currency/Input'
import { employeeStore } from '@/stores/employee'
import { staffPaymentStore } from '@/stores/staffPayment'
import { cn, formatCurrency } from '@/lib/utils'
import type { Employee } from '@/types'
import { AnimatePresence, m } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

export function Component() {
  const payments = staffPaymentStore.useStore((state) => state.payments)
  const employees = employeeStore.useStore((state) => state.employees)
  const todayStr = useToday()
  const todayPayments = useMemo(() => {
    const current = staffPaymentsInRange(payments, { day: todayStr })
    return { paymentId: current.map((p) => p.id), total: staffPaymentsTotal(payments, { day: todayStr }) }
  }, [payments, todayStr])

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [customAmount, setCustomAmount] = useState(0)

  const [newName, setNewName] = useState('')
  const [newRate1, setNewRate1] = useState(0)
  const [newRate2, setNewRate2] = useState(0)

  const handleSelectEmployee = (emp: Employee) => {
    setEmployee(emp)
    setCustomAmount(0)
  }

  const handlePayPreset = (amount: number) => {
    if (!employee) {
      return
    }

    addStaffPayment({
      date: todayStr,
      amount,
      receiver: { id: employee.id, type: 'employee' },
    })

    toast.success(`Diária de ${formatCurrency(amount)} registrada para ${employee.name}!`)
  }

  const handlePayCustom = () => {
    if (!employee) {
      return
    }

    if (customAmount <= 0) {
      toast.error('Informe um valor válido')
      return
    }

    addStaffPayment({
      date: todayStr,
      amount: customAmount,
      receiver: { id: employee.id, type: 'employee' },
    })

    toast.success(`Diária de ${formatCurrency(customAmount)} registrada para ${employee.name}!`)

    setCustomAmount(0)
  }

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || newName.trim().length < 2) {
      toast.error('Nome deve ter ao menos 2 caracteres')
      return
    }

    addEmployee({
      name: newName.trim(),
      defaultRates: [newRate1, newRate2],
    })

    toast.success('Funcionário cadastrado!')
    setNewName('')
    setNewRate1(0)
    setNewRate2(0)
  }

  const otherPayments = payments.filter((p) => !isSameDay(p.date, todayStr))

  return (
    <>
      <Title title='Pagamentos' subtitle='Selecione um funcionário e registre a diária' />

      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={Card.getStyle('flex flex-row gap-4 w-full overflow-x-auto p-4')}
      >
        <Modal>
          <Modal.Trigger
            as='button'
            type='button'
            className='flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-base-200 transition-colors cursor-pointer'
          >
            <div className='size-14 rounded-full bg-base-200 border-2 border-dashed border-base-content/20 flex items-center justify-center'>
              <Plus size={20} className='text-base-content/60' />
            </div>
            <span className='text-xs font-semibold text-base-content/60'>Novo</span>
          </Modal.Trigger>

          <Modal.Title className='text-lg font-bold'>Cadastrar Funcionário</Modal.Title>

          <Modal.Content as='form' id='add-employee-form' className='space-y-4 mt-4' onSubmit={handleAddEmployee}>
            <div className='space-y-2'>
              <Label>Nome</Label>
              <input
                className='daisy-input daisy-input-bordered w-full'
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder='Nome do funcionário'
                maxLength={100}
                minLength={2}
              />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <CurrencyInput
                  value={newRate1}
                  label='Diária Opção 1 (R$)'
                  placeholder='Ex: 20,00'
                  onValueChange={setNewRate1}
                />
              </div>
              <div className='space-y-2'>
                <CurrencyInput
                  value={newRate2}
                  label='Diária Opção 2 (R$)'
                  placeholder='Ex: 40,00'
                  onValueChange={setNewRate2}
                />
              </div>
            </div>
          </Modal.Content>

          <Modal.Actions>
            {({ close }) => [
              <Button key='submit' type='submit' form='add-employee-form' variant='primary'>
                <Plus size={16} /> Cadastrar
              </Button>,
              <Button key='button' type='button' onClick={close}>
                Cancelar
              </Button>,
            ]}
          </Modal.Actions>
        </Modal>

        {employees.map((emp) => (
          <div
            key={emp.id}
            role='button'
            aria-label={`Registrar diária para ${emp.name}`}
            onClick={() => handleSelectEmployee(emp)}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 cursor-pointer',
              employee?.id === emp.id ? 'bg-primary/10 ring-2 ring-primary scale-105' : 'hover:bg-base-200',
            )}
          >
            <div
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-colors',
                employee?.id === emp.id ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/60',
              )}
            >
              {emp.avatarUrl ? (
                <img src={emp.avatarUrl} alt={emp.name} className='w-full h-full rounded-full object-cover' />
              ) : (
                emp.name.charAt(0).toUpperCase()
              )}
            </div>
            <span className='text-xs font-semibold text-center truncate w-full'>{emp.name}</span>
          </div>
        ))}
      </m.div>

      <AnimatePresence mode='wait'>
        {employee && (
          <m.div
            key={employee.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={Card.getStyle('p-5 space-y-4')}
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='size-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold'>
                  {employee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className='font-semibold'>{employee.name}</p>
                  <p className='text-xs text-base-content/60'>Selecione o valor da diária</p>
                </div>
              </div>

              <Button.Confirm
                size='sm'
                variant='error'
                appearance='outline'
                onConfirm={() => {
                  deleteEmployee(employee.id)
                  setEmployee(null)
                  toast.info('Funcionário removido')
                }}
              >
                <Trash2 size={16} />
              </Button.Confirm>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              {employee.defaultRates
                .filter((r) => r > 0)
                .map((rate) => (
                  <Button
                    key={rate}
                    size='lg'
                    variant='secondary'
                    appearance='outline'
                    onClick={() => handlePayPreset(rate)}
                  >
                    {formatCurrency(rate)}
                  </Button>
                ))}
            </div>

            <div className='flex gap-2'>
              <CurrencyInput
                value={customAmount}
                onValueChange={setCustomAmount}
                placeholder='Valor personalizado'
                className='flex-1'
              />
              <Button onClick={handlePayCustom} variant='primary'>
                <Plus size={16} /> Registrar
              </Button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <Card variant='error'>
        <Card.Title className='text-xs'>TOTAL DIÁRIAS HOJE</Card.Title>

        <p className='text-2xl font-extrabold font-mono text-error mt-1'>{formatCurrency(todayPayments.total)}</p>
      </Card>

      {todayPayments.paymentId.length > 0 && (
        <>
          <Card.Title className='mb-3'>HOJE</Card.Title>
          <Card className='overflow-hidden divide-y divide-base-300 p-0'>
            {todayPayments.paymentId.map((paymentId) => {
              const payment = staffPaymentStore.action.get(paymentId)

              if (!payment?.receiver?.id) {
                return null
              }

              const emp = employeeStore.action.get(payment.receiver.id)

              if (!emp) {
                return null
              }

              return (
                <div key={paymentId} className='flex items-center justify-between px-5 py-3'>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-xs font-bold text-base-content/60'>
                      {emp.name.charAt(0).toUpperCase()}
                    </div>

                    <p className='text-sm font-semibold'>{emp.name}</p>
                  </div>

                  <div className='flex items-center gap-3'>
                    <p className='text-sm font-bold font-mono'>{formatCurrency(payment.amount)}</p>

                    <Button.Confirm
                      size='xs'
                      variant='error'
                      appearance='soft'
                      onConfirm={() => {
                        deleteStaffPayment(payment.id)
                        toast.info('Diária removida')
                      }}
                    >
                      <Trash2 size={14} />
                    </Button.Confirm>
                  </div>
                </div>
              )
            })}
          </Card>
        </>
      )}

      {otherPayments.length > 0 && (
        <>
          <Card.Title className='mb-3'>ANTERIORES</Card.Title>
          <Card className='overflow-hidden divide-y divide-base-300 p-0'>
            {otherPayments.slice(0, 20).map((payment) => {
              if (!payment.receiver?.id) {
                return null
              }

              const emp = employeeStore.action.get(payment.receiver.id)

              if (!emp) {
                return null
              }

              return (
                <div key={payment.id} className='flex items-center justify-between px-5 py-3'>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-xs font-bold text-base-content/60'>
                      {emp.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <p className='text-sm font-semibold'>{emp.name}</p>
                      <p className='text-xs text-base-content/60'>{formatDate(payment.date)}</p>
                    </div>
                  </div>

                  <span className='text-sm font-bold font-mono'>{formatCurrency(payment.amount)}</span>
                </div>
              )
            })}
          </Card>
        </>
      )}
    </>
  )
}
