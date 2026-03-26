'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'atm10-dark-mode'

export function useDarkMode() {
  // Always start false (matches server). Sync from localStorage after mount to
  // avoid a SSR/client hydration mismatch. AppShell already applies the `dark`
  // class to <html> before first paint, so there is no visual flash.
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(localStorage.getItem(STORAGE_KEY) === 'true')
  }, [])

  const toggle = useCallback(() => {
    setDark(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }, [])

  return { dark, toggle }
}
