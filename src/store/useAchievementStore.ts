import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ACHIEVEMENTS, RARITY_ORDER, type AchievementCheckInput } from '@/lib/achievements'

interface AchievementStore {
  unlockedIds:  string[]
  pendingQueue: string[]   // not persisted — IDs to show, rarest first

  checkAndUnlock: (input: AchievementCheckInput) => void
  manualUnlock:   (id: string) => void
  dismissToast:   () => void
}

const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? localStorage
    : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
)

export const useAchievementStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      unlockedIds:  [],
      pendingQueue: [],

      checkAndUnlock: (input) => {
        const { unlockedIds } = get()
        const inputWithUnlocked: AchievementCheckInput = { ...input, unlockedIds }

        const newlyUnlocked = ACHIEVEMENTS.filter(
          a => !unlockedIds.includes(a.id) && a.check(inputWithUnlocked),
        )
        if (newlyUnlocked.length === 0) return

        // Sort rarest first so legendary pops last (most memorable)
        const sorted = newlyUnlocked.sort(
          (a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity),
        )

        set(s => ({
          unlockedIds:  [...s.unlockedIds, ...sorted.map(a => a.id)],
          pendingQueue: [...s.pendingQueue, ...sorted.map(a => a.id)],
        }))
      },

      manualUnlock: (id) => {
        const { unlockedIds } = get()
        if (unlockedIds.includes(id)) return
        set(s => ({
          unlockedIds:  [...s.unlockedIds, id],
          pendingQueue: [...s.pendingQueue, id],
        }))
      },

      dismissToast: () => set(s => ({ pendingQueue: s.pendingQueue.slice(1) })),
    }),
    {
      name:          'atm10-achievements',
      storage:       safeStorage,
      skipHydration: true,
      partialize:    (s) => ({ unlockedIds: s.unlockedIds }),
    },
  ),
)
