import { vibrate } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '.'

interface Props extends ComponentProps<typeof Button> {
  onConfirm: () => void
}

export function ConfirmButton({ onConfirm, children, className, ...props }: Props) {
  const [confirming, setConfirming] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (confirming) {
      onConfirm()
      setConfirming(false)
      return
    }

    vibrate(10)
    setConfirming(true)
  }

  useEffect(() => {
    if (!confirming) {
      return
    }

    const handler = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) {
        return
      }

      setConfirming(false)
    }

    document.addEventListener('pointerdown', handler, true)
    return () => document.removeEventListener('pointerdown', handler, true)
  }, [confirming])

  return (
    <div ref={ref} className='inline-flex'>
      <Button {...props} className={className} onClick={handleClick}>
        {confirming ? <Check size={14} /> : children}
      </Button>
    </div>
  )
}
