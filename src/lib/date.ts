export type DateInput = Date | number | string

export function toDate(input: DateInput = Date.now()): Date {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T12:00:00`)
  }
  return new Date(input)
}

export function localDateKey(input: DateInput = Date.now()): string {
  const date = toDate(input)
  if (Number.isNaN(date.getTime())) { throw new RangeError('Invalid date') }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function todayKey() { return localDateKey() }
export function monthKey(input: DateInput = Date.now()) { return localDateKey(input).slice(0, 7) }
export function isSameDay(key: DateInput, day: DateInput = Date.now()) { return localDateKey(key) === localDateKey(day) }
export function inMonth(key: DateInput, month: string = monthKey()) { return monthKey(key) === month }
export function formatDate(input: DateInput, options?: Intl.DateTimeFormatOptions) {
  return toDate(input).toLocaleDateString('pt-BR', options)
}
export function formatTime(input: DateInput) {
  return toDate(input).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
export function formatDateTime(input: DateInput) {
  return toDate(input).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
export function isoTimestamp(input: DateInput = Date.now()) { return toDate(input).toISOString() }
