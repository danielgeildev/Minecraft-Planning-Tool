'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  type XpEventType,
  XP_VALUES,
  getLevelFromXp,
} from '@/lib/progression/xp'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface XpLogEntry {
  id: string           // unique key for dedup (e.g. "quest_created::<nodeId>")
  eventType: XpEventType
  xp: number
  timestamp: string
}

export interface PendingXpToast {
  eventType: XpEventType
  xp: number
}

interface ProgressStore {
  totalXp: number
  xpLog: XpLogEntry[]

  // Toast queue (not persisted)
  pendingXpToasts: PendingXpToast[]
  pendingLevelUp: number | null         // level number that was just reached

  // Actions
  awardXp: (eventType: XpEventType, dedupeKey: string) => void
  dismissXpToast: () => void
  dismissLevelUp: () => void

  // Bulk recalculate XP from log (used during init to catch up)
  recalculateTotal: () => void
}

// ─── Storage ────────────────────────────────────────────────────────────────

const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? localStorage
    : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
)

// ─── Store ──────────────────────────────────────────────────────────────────

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      totalXp: 0,
      xpLog: [],
      pendingXpToasts: [],
      pendingLevelUp: null,

      awardXp: (eventType, dedupeKey) => {
        const { xpLog, totalXp } = get()

        // Dedup: skip if this exact event was already awarded
        if (xpLog.some(e => e.id === dedupeKey)) return

        const xp = XP_VALUES[eventType]
        const levelBefore = getLevelFromXp(totalXp)
        const newTotal = totalXp + xp
        const levelAfter = getLevelFromXp(newTotal)

        const entry: XpLogEntry = {
          id: dedupeKey,
          eventType,
          xp,
          timestamp: new Date().toISOString(),
        }

        set(s => ({
          totalXp: newTotal,
          xpLog: [...s.xpLog, entry],
          pendingXpToasts: [...s.pendingXpToasts, { eventType, xp }],
          pendingLevelUp: levelAfter > levelBefore ? levelAfter : s.pendingLevelUp,
        }))
      },

      dismissXpToast: () =>
        set(s => ({ pendingXpToasts: s.pendingXpToasts.slice(1) })),

      dismissLevelUp: () =>
        set({ pendingLevelUp: null }),

      recalculateTotal: () => {
        const { xpLog } = get()
        const total = xpLog.reduce((sum, e) => sum + e.xp, 0)
        set({ totalXp: total })
      },
    }),
    {
      name: 'atm10-progress-v1',
      storage: safeStorage,
      skipHydration: true,
      partialize: (s) => ({
        totalXp: s.totalXp,
        xpLog: s.xpLog,
      }),
    },
  ),
)
