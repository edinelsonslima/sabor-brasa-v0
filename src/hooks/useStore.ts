import { storage } from '@/lib/utils'
import { useSyncExternalStore } from 'react'

type SetterStateFn<T> = (state: T) => T

interface Store<TState, TActions> {
  createActions: (setState: (partialState: TState | SetterStateFn<TState>) => void, getState: () => TState) => TActions

  createState: (setState: (partialState: TState | SetterStateFn<TState>) => void, getState: () => TState) => TState

  persist?: {
    key: Lowercase<string>
  }
}

export function createStore<
  TState extends object | string | number | boolean,
  TActions extends Record<string, (...args: never) => unknown>,
>({ createActions, createState, persist }: Store<TState, TActions>) {
  const persistStorageKey: Lowercase<`${string}-${string}`> = `store-${persist?.key}`
  const persistStorage = persist ? storage([persistStorageKey]) : null

  const listeners = new Set<() => void>()

  let state: TState

  const updateState = (value: TState) => {
    state = value
    persistStorage?.save(persistStorageKey, state)

    listeners.forEach((listener) => listener())
  }

  const setState = (partialState: TState | SetterStateFn<TState>) => {
    if (typeof partialState === 'function') {
      updateState(partialState(state))
      return
    }

    updateState(partialState)
  }

  const getState = () => {
    return state
  }

  const loaded = persistStorage?.load<TState | undefined>(persistStorageKey, undefined)

  state = loaded ?? createState(setState, getState)

  /**
   * Subscribes a listener to state changes. Returns an unsubscribe function.
   * @param listener The listener function to be called on state changes.
   * @returns A function to unsubscribe the listener.
   */
  const subscribe = (listener: () => void) => {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  }

  /**
   * Custom hook to access the store's state. Accepts a selector function to derive specific values from the state.
   * @param selector A function that takes the current state and returns a derived value. This allows components to subscribe to specific parts of the state.
   * @returns The selected value derived from the store's state. The component will re-render whenever the selected value changes due to state updates.
   */
  const useStore = <TValue>(selector: (currentState: TState) => TValue) => {
    return useSyncExternalStore(subscribe, () => selector(state))
  }

  return {
    subscribe,
    useStore,
    getState,
    action: createActions(setState, getState),
  } as const
}
