import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function vibrate(pattern: number | number[]) {
  return window?.navigator?.vibrate?.(pattern)
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function storage<T extends Lowercase<`${string}-${string}`>>(keys: T[]) {
  if (!keys.length) {
    throw new Error('At least one key must be provided')
  }

  const prefix = 'jhp-store-'

  type Key = (typeof keys)[number]

  const save = (key: Key, value: unknown, expiresIn: number = Infinity) => {
    const toSave = JSON.stringify({
      data: value,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: expiresIn > 0 ? Date.now() + expiresIn : null,
    })

    localStorage.setItem(prefix + key, toSave)
  }

  const load = <T>(key: Key, defaultValue: T): T => {
    const item = localStorage.getItem(prefix + key)

    if (!item) {
      return defaultValue
    }

    try {
      const parsed = JSON.parse(item)

      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        localStorage.removeItem(prefix + key)
        return defaultValue
      }

      return parsed.data
    } catch {
      return defaultValue
    }
  }

  const update = <T>(key: Key, value: T) => {
    const existing = load<Record<string, unknown>>(key, {})

    const toSave = JSON.stringify({
      data: { ...existing, ...value },
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
      expiresAt: existing?.expiresAt || null,
    })

    localStorage.setItem(prefix + key, toSave)
  }

  const remove = (key: Key) => {
    localStorage.removeItem(prefix + key)
  }

  const clear = () => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => localStorage.removeItem(k))
  }

  return { save, load, update, remove, clear } as const
}

export type GetStyleConfig<
  T extends ReturnType<typeof createStyle>,
  K extends keyof Parameters<Parameters<T>[0]>[2],
> = keyof Parameters<Parameters<T>[0]>[2][K]

type VariantConfig = Record<string, Record<string, string>>
type VariantProps<C extends VariantConfig> = { [K in keyof C]?: keyof C[K] }

export function createStyle<C extends VariantConfig>(config: C) {
  function getStyle<S extends object, E extends object>(fn: (className: string, styles: S, extra?: E) => string) {
    function styleFn(className?: string, styles?: S, extra?: E) {
      return fn(className || '', styles || ({} as S), extra)
    }

    return styleFn
  }

  function build<E extends object>(fn: (className: string, props: VariantProps<C>, style: C, extra?: E) => string) {
    return getStyle<VariantProps<C>, E>((className, props, extra) => fn(className, props, config, extra))
  }

  return build
}
