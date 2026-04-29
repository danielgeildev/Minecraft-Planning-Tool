'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'atm10-dark-mode'

function prefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function readDark() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'true') return true
  if (stored === 'false') return false
  return prefersDark()
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    mq.removeEventListener('change', onChange)
  }
}

// SSR: render light mode. RootLayout's inline init script applies the `dark`
// class to <html> before first paint, so there is no flash.
function getServerSnapshot() {
  return false
}

export function useDarkMode() {
  const dark = useSyncExternalStore(subscribe, readDark, getServerSnapshot)

  const toggle = useCallback(() => {
    const next = !readDark()
    localStorage.setItem(STORAGE_KEY, String(next))
    document.documentElement.classList.toggle('dark', next)
    // useSyncExternalStore won't re-run on same-window localStorage writes —
    // dispatch a synthetic storage event so subscribers re-read the snapshot.
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
  }, [])

  return { dark, toggle }
}
