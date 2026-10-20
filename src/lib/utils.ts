import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function vibrate(pattern: number | number[]) {
  return window?.navigator?.vibrate?.(pattern)
}

export function generateUUID(): string {
  return window?.crypto?.randomUUID?.()
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
