import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ACHIEVEMENTS, RARITY_ORDER, type Achievement, type AchievementCheckInput } from '@/lib/achievements'

interface AchievementStore {
  unlockedIds:  string[]
  seenIds:      string[]   // persisted — toasts that have already been shown
  pendingQueue: string[]   // not persisted — IDs waiting to show, common first → mythic last

  checkAndUnlock:    (input: AchievementCheckInput) => void
  manualUnlock:      (id: string) => void
  replayAchievement: (id: string) => void
  dismissToast:      () => void
  queueUnseen:       () => void   // call once after hydration to replay unseen toasts
}

const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? localStorage
    : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
)

// Sort achievements common→mythic so the rarest pops last (most memorable)
function sortByRarityAscending(ids: string[]): string[] {
  return ids
    .map(id => ACHIEVEMENTS.find(a => a.id === id))
    .filter((a): a is Achievement => !!a)
    .sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity))
    .map(a => a.id)
}

export const useAchievementStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      unlockedIds:  [],
      seenIds:      [],
      pendingQueue: [],

      checkAndUnlock: (input) => {
        const { unlockedIds } = get()
        const inputWithUnlocked: AchievementCheckInput = { ...input, unlockedIds }

        const newlyUnlocked = ACHIEVEMENTS.filter(
          a => !unlockedIds.includes(a.id) && a.check(inputWithUnlocked),
        )
        if (newlyUnlocked.length === 0) return

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

      replayAchievement: (id) => {
        set(s => {
          if (s.pendingQueue.includes(id)) return s
          return { pendingQueue: [...s.pendingQueue, id] }
        })
      },

      dismissToast: () => set(s => {
        const dismissed = s.pendingQueue[0]
        return {
          seenIds:      dismissed ? [...new Set([...s.seenIds, dismissed])] : s.seenIds,
          pendingQueue: s.pendingQueue.slice(1),
        }
      }),

      queueUnseen: () => {
        const { unlockedIds, seenIds, pendingQueue } = get()
        const unseen = unlockedIds.filter(
          id => !seenIds.includes(id) && !pendingQueue.includes(id),
        )
        if (unseen.length === 0) return
        set(s => ({ pendingQueue: [...s.pendingQueue, ...sortByRarityAscending(unseen)] }))
      },
    }),
    {
      name:          'atm10-achievements',
      storage:       safeStorage,
      skipHydration: true,
      partialize:    (s) => ({ unlockedIds: s.unlockedIds, seenIds: s.seenIds }),
    },
  ),
)
