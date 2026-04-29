'use client'

import { useSyncExternalStore } from 'react'

let hydrated = false
const listeners = new Set<() => void>()

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

function getSnapshot() {
  return hydrated
}

// Server snapshot is always false — stores can't be hydrated before the client mounts.
function getServerSnapshot() {
  return false
}

export function markHydrated() {
  if (hydrated) return
  hydrated = true
  listeners.forEach(l => l())
}

/**
 * Returns true once AppShell has finished rehydrating all persisted stores from
 * localStorage. Use to gate UI that would otherwise flash misleading empty-states
 * (e.g. "Alle Quests erledigt!") on first paint, before zustand has read storage.
 */
export function useHasHydrated() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
