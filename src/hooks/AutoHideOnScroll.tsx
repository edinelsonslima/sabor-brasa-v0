import type { PropsWithChildren } from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface AutoHideOnScrollProps {
  className?: string
  threshold?: number
}

export function AutoHideOnScroll({ children, className, threshold = 8 }: PropsWithChildren<AutoHideOnScrollProps>) {
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) {
        return
      }

      ticking.current = true

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        const difference = currentScrollY - lastScrollY.current

        if (currentScrollY <= 0) {
          setHidden(false)
        } else if (difference > threshold) {
          setHidden(true)
        } else if (difference < -threshold) {
          setHidden(false)
        }

        lastScrollY.current = currentScrollY
        ticking.current = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  return (
    <div
      className={cn(
        'sticky top-0 z-50 transition-transform duration-400 ease-out',
        hidden && '-translate-y-full',
        className,
      )}
    >
      {children}
    </div>
  )
}
