'use client'

import { useSyncExternalStore } from 'react'
import type { MobLevel } from './levels'

export interface ResolvedMobColors {
  from: string
  to: string
  accent: string
  glow: string
  bg: string
}

// ─── Dark mode detection via useSyncExternalStore (no setState-in-effect) ────

function subscribeToDarkMode(callback: () => void): () => void {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

function getIsDarkSnapshot(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

function getIsDarkServerSnapshot(): boolean {
  return false
}

/** Hook that reactively returns whether dark mode is active */
export function useIsDark(): boolean {
  return useSyncExternalStore(subscribeToDarkMode, getIsDarkSnapshot, getIsDarkServerSnapshot)
}

/**
 * Returns the right color set for the current theme (light/dark).
 */
export function useMobColors(mob: MobLevel): ResolvedMobColors {
  const isDark = useIsDark()
  return resolveMobColors(mob, isDark)
}

/** Non-hook version for static contexts (pass isDark explicitly) */
export function resolveMobColors(mob: MobLevel, isDark: boolean): ResolvedMobColors {
  const { color } = mob

  if (isDark) {
    return {
      from: color.darkFrom,
      to: color.darkTo,
      accent: color.darkAccent,
      glow: color.darkGlow,
      bg: color.darkBg,
    }
  }

  return {
    from: color.from,
    to: color.to,
    accent: color.accent,
    glow: color.glow,
    bg: color.bg,
  }
}
