import { describe, expect, it } from 'vitest'
import { inMonth, isSameDay, localDateKey } from '@/lib/date'

describe('date (America/Sao_Paulo)', () => {
  it('runs under Sao Paulo TZ', () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Sao_Paulo')
  })
  it('22:00 local stays on the same local day', () => {
    const ts = new Date(2026, 9, 18, 22, 0).getTime()
    expect(localDateKey(ts)).toBe('2026-10-18')
    expect(isSameDay(ts, '2026-10-18')).toBe(true)
  })
  it('Oct 31 22:00 counts in October', () => {
    const ts = new Date(2026, 9, 31, 22, 0).getTime()
    expect(inMonth(ts, '2026-10')).toBe(true)
    expect(inMonth(ts, '2026-11')).toBe(false)
  })
  it('plain day keys do not drift', () => {
    expect(localDateKey('2026-10-01')).toBe('2026-10-01')
  })
})
