'use client'

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

/**
 * False during SSR and the hydration render, true afterwards.
 *
 * Pages that render store-derived content must gate on this: the AppShell
 * rehydrates the Zustand stores from localStorage in an effect that can run
 * before the page hydrates — without the gate the server HTML (empty stores)
 * mismatches the first client render (hydrated stores).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}
