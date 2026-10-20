import { useSyncExternalStore } from 'react'

type Setter<T> = (value: T | ((state: T) => T)) => void
interface Store<T, A> {
  createActions: (set: Setter<T>, get: () => T) => A
  createState: (set: Setter<T>, get: () => T) => T
  persist?: {
    key: Lowercase<string>
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
      localStorage.setItem(key, JSON.stringify(state))
    }
  }
  const set: Setter<T> = (value) => {
    state = immutable(structuredClone(typeof value === 'function' ? value(state) : value))
    save()
    listeners.forEach((listener) => listener())
  }
  const get = () => state
  const load = (): T | undefined => {
    const raw = persist ? localStorage.getItem(key) : null
    if (!raw) {
      return undefined
    }
    try {
      return JSON.parse(raw) as T
    } catch {
      return undefined
    }
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
