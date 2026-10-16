import { localDateKey, todayKey } from '@/lib/date'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './_ui/button'
import { Card } from './_ui/card'

interface DateProps {
  day: number
  month: number
  year: number
}

interface HighlightProps extends DateProps {
  isToday: boolean
  selected: boolean
}

interface Props {
  onSelect?: (date: DateProps) => void
  highlight?: (props: HighlightProps) => boolean
  onViewChange?: (date: Omit<DateProps, 'day'>) => void
}

export function Calendar({ onSelect, highlight, onViewChange }: Props) {
  const [selectedDate, setSelectedDate] = useState(todayKey)

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const prevMonth = () => {
    setViewMonth((v) => {
      const prev = v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }

      return prev
    })
  }

  const nextMonth = () => {
    return setViewMonth((v) => {
      const next = v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }

      return next
    })
  }

  const goToToday = () => {
    const today = new Date()

    selectDay(today.getDate())
    setViewMonth({
      year: today.getFullYear(),
      month: today.getMonth(),
    })
  }

  const selectDay = (day: number) => {
    setSelectedDate(localDateKey(new Date(viewMonth.year, viewMonth.month, day)))
  }

  const firstDayOfWeek = new Date(viewMonth.year, viewMonth.month, 1).getDay()

  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate()

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const selectedDay = parseInt(selectedDate.split('-')[2])
  const selectedMonth = parseInt(selectedDate.split('-')[1]) - 1
  const selectedYear = parseInt(selectedDate.split('-')[0])

  useEffect(() => {
    onSelect?.({ day: selectedDay, month: selectedMonth, year: selectedYear })
  }, [selectedDay, selectedMonth, selectedYear, onSelect])

  useEffect(() => {
    onViewChange?.({ month: viewMonth.month, year: viewMonth.year })
  }, [viewMonth, onViewChange])

  return (
    <Card>
      <div className='flex items-center justify-between mb-4'>
        <Button size='sm' appearance='ghost' modifier='square' onClick={prevMonth}>
          <ChevronLeft size={18} />
        </Button>

        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <CalendarIcon size={16} className='text-primary' />

            <span className='font-semibold text-sm'>
              {monthNames[viewMonth.month]} {viewMonth.year}
            </span>
          </div>

          <Button size='xs' appearance='ghost' onClick={goToToday}>
            Hoje
          </Button>
        </div>

        <Button size='sm' appearance='ghost' modifier='square' onClick={nextMonth}>
          <ChevronRight size={18} />
        </Button>
      </div>

      <div className='grid grid-cols-7 gap-1 text-center text-xs'>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <span key={i} className='font-semibold text-base-content/40 py-1'>
            {d}
          </span>
        ))}

        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <span key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1

          const isSelected = day === selectedDay && viewMonth.month === selectedMonth && viewMonth.year === selectedYear

          const isToday =
            day === new Date().getDate() &&
            viewMonth.month === new Date().getMonth() &&
            viewMonth.year === new Date().getFullYear()

          const enableHighlight = !highlight?.({
            day,
            month: viewMonth.month,
            year: viewMonth.year,
            isToday: isToday,
            selected: isSelected,
          })

          return (
            <Button
              key={day}
              size='sm'
              active={isSelected}
              variant={isSelected || isToday ? 'primary' : undefined}
              appearance={isToday ? 'soft' : 'ghost'}
              onClick={() => selectDay(day)}
              className='relative'
            >
              {day}

              <span
                hidden={enableHighlight}
                className='absolute bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-success'
              />
            </Button>
          )
        })}
      </div>
    </Card>
  )
}
