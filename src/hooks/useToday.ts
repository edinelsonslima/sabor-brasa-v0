import { useEffect, useState } from 'react'
import { todayKey } from '@/lib/date'
/** Raw arrays do not change at midnight. Refresh the range independently of store writes. */
export function useToday() {
  const [day, setDay] = useState(todayKey)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const refresh = () => {
      setDay(todayKey())
      clearTimeout(timer)
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      timer = setTimeout(refresh, Math.max(1, midnight.getTime() - Date.now()))
    }
    refresh()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return day
}
