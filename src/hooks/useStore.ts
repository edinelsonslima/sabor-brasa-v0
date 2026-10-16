import { useSyncExternalStore } from 'react'

type Setter<T> = (value: T | ((state: T) => T)) => void
interface Store<T, A> {
  createActions: (set: Setter<T>, get: () => T) => A
  createState: (set: Setter<T>, get: () => T) => T
  persist?: {
    key: Lowercase<string>
    version?: number
    migrate?: (data: unknown, version: number) => T
    legacyKeys?: string[]
  }
}

function immutable<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(immutable)
    Object.freeze(value)
  }
  return value
}

export function createStore<T extends object | string | number | boolean, A>({
  createActions,
  createState,
  persist,
}: Store<T, A>) {
  const key = `sabor-brasa-store-${persist?.key}`
  const listeners = new Set<() => void>()
  let state: T
  const save = () => {
    if (persist) {
      localStorage.setItem(
        key,
        JSON.stringify({
          data: state,
          version: persist.version ?? 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          expiresAt: null,
        }),
      )
    }
  }
  const set: Setter<T> = (value) => {
    state = immutable(structuredClone(typeof value === 'function' ? value(state) : value))
    save()
    listeners.forEach((listener) => listener())
  }
  const get = () => state
  const load = (): T | undefined => {
    if (!persist) {
      return undefined
    }
    const keys = [key, ...(persist.legacyKeys ?? []), `jhp-store-store-${persist.key}`, `jhp-store-${persist.key}`]
    for (const candidate of keys) {
      const raw = localStorage.getItem(candidate)
      if (!raw) {
        continue
      }
      try {
        const parsed = JSON.parse(raw)
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          continue
        }
        const data = parsed.data ?? parsed
        return persist.migrate ? persist.migrate(data, parsed.version ?? 0) : (data as T)
      } catch {
        /* Leave malformed legacy data intact and try other keys. */
      }
    }
    return undefined
  }
  state = immutable(structuredClone(load() ?? createState(set, get)))
  save()
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
  const useStore = <V>(selector: (current: T) => V) => useSyncExternalStore(subscribe, () => selector(state))
  return { subscribe, useStore, getState: get, action: createActions(set, get) } as const
}
