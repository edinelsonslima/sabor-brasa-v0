import { saleStore } from '@/hooks/useSales'
import { cn, formatCurrency, localDateKey } from '@/lib/utils'
import { m } from 'framer-motion'
import { Card } from '../_ui/card'

interface Props {
  day: number
  year: number
  month: number
}

export function SalesChart({ day, year, month }: Props) {
  const sales = saleStore.useStore((s) => s.sales)

  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const dailyTotals = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const mm = (month + 1).toString().padStart(2, '0')
    const dd = day.toString().padStart(2, '0')
    const dateStr = `${year}-${mm}-${dd}`

    return sales.filter((s) => localDateKey(s.closedAt) === dateStr).reduce((acc, s) => acc + (s.total), 0)
  })

  const max = Math.max(...dailyTotals, 1)
  const monthTotal = dailyTotals.reduce((a, b) => a + b, 0)

  if (monthTotal === 0) {
    return null
  }

  return (
    <Card>
      <Card.Title>VENDAS POR DIA</Card.Title>

      <div className='flex items-end gap-0.5 h-28 mt-3'>
        {dailyTotals.map((total, i) => {
          const currentDay = i + 1
          const height = (total / max) * 100

          return (
            <m.div
              key={i}
              className={cn(
                'flex-1 bg-primary/50 rounded-t-sm relative group cursor-pointer hover:bg-primary/70 transition-colors',
                currentDay === day && 'bg-primary!',
              )}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 2)}%` }}
              style={{ minHeight: total > 0 ? 4 : 2 }}
              transition={{ delay: i * 0.02, duration: 0.4, ease: 'easeOut' }}
            >
              <div
                className='
                  absolute -top-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 z-10 opacity-0 pointer-events-none
                  bg-base-300 text-xs rounded group-hover:opacity-100 transition-opacity whitespace-nowrap
                '
              >
                {currentDay}: {formatCurrency(total)}
              </div>
            </m.div>
          )
        })}
      </div>

      <div className='flex justify-between text-[10px] text-base-content/40 mt-1'>
        <span>1</span>
        <span>{Math.ceil(daysInMonth / 2)}</span>
        <span>{daysInMonth}</span>
      </div>

      <p className='text-xs text-base-content/60 mt-2'>
        Total do mês: <strong className='font-mono'>{formatCurrency(monthTotal)}</strong>
      </p>
    </Card>
  )
}
