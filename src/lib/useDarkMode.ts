'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'atm10-dark-mode'

// Module-level listeners so all hook instances stay in sync within the tab;
// the 'storage' event covers changes from other tabs.
let listeners: (() => void)[] = []

function subscribe(listener: () => void) {
  listeners.push(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners = listeners.filter(l => l !== listener)
    window.removeEventListener('storage', listener)
  }
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

// Server snapshot is always false; AppShell applies the `dark` class to <html>
// before first paint, so there is no visual flash.
function getServerSnapshot() {
  return false
}

export function useDarkMode() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback(() => {
    const next = !getSnapshot()
    localStorage.setItem(STORAGE_KEY, String(next))
    document.documentElement.classList.toggle('dark', next)
    listeners.forEach(l => l())
  }, [])

  return { dark, toggle }
}
