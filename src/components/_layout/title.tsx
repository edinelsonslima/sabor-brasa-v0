import { cn } from '@/lib/utils'
import type { ComponentProps, ReactNode } from 'react'

type MotionDivProps = ComponentProps<'div'>

interface Props extends Omit<MotionDivProps, 'prefix'> {
  suffix?: ReactNode
  prefix?: ReactNode
  title: string
  subtitle: string
}

export function Title({ title, subtitle, prefix, suffix, className, ...props }: Props) {
  if (!title && !subtitle) {
    return null
  }

  return (
    <div className={cn('flex gap-3 items-center', className)} {...props}>
      {prefix}

      <div>
        <h1 className='text-2xl font-extrabold tracking-tight'>{title}</h1>
        <p className='text-base-content/60 text-sm mt-1'>{subtitle}</p>
      </div>

      {suffix}
    </div>
  )
}
