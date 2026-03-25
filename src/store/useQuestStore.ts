'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { QuestNode, QuestStatus, Dependency } from '@/types'
import { mockQuests } from '@/data/mockData'

interface QuestStore {
  quests: QuestNode[]
  _dataVersion: number          // 0 = fresh, 1+ = real user data
  lastDeleted: QuestNode | null

  // Init (persistence fix – mock data only on first ever load)
  initializeIfNeeded: () => void

  // CRUD
  addQuest:    (q: Omit<QuestNode, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => void
  updateQuest: (id: string, updates: Partial<QuestNode>) => void
  deleteQuest: (id: string) => void
  undoDelete:  () => void

  // Cross-store cleanup — removes all dependencies pointing to a given node id
  purgeDependenciesTo: (nodeId: string) => void

  // Queries
  getQuestById: (id: string) => QuestNode | undefined
  getChildren:  (parentId: string) => QuestNode[]
}

const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? localStorage
    : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
)

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      quests:       [],
      _dataVersion: 0,
      lastDeleted:  null,

      initializeIfNeeded: () => {
        if (get()._dataVersion === 0) {
          set({ quests: mockQuests, _dataVersion: 1 })
        }
      },

      addQuest: (data) => {
        const now = new Date().toISOString()
        const quest: QuestNode = {
          ...data,
          id:        crypto.randomUUID(),
          type:      'quest',
          createdAt: now,
          updatedAt: now,
        }
        set(s => ({ quests: [quest, ...s.quests] }))
      },

      updateQuest: (id, updates) =>
        set(s => ({
          quests: s.quests.map(q =>
            q.id === id
              ? { ...q, ...updates, updatedAt: new Date().toISOString() }
              : q
          ),
        })),

      deleteQuest: (id) => {
        const target = get().quests.find(q => q.id === id) ?? null
        set(s => ({
          lastDeleted: target,
          quests: s.quests
            .filter(q => q.id !== id)
            .map(q => ({
              ...q,
              parentId:     q.parentId === id ? null : q.parentId,
              dependencies: q.dependencies.filter(d => d.targetId !== id),
            })),
        }))
      },

      undoDelete: () => {
        const { lastDeleted } = get()
        if (lastDeleted) {
          set(s => ({ quests: [lastDeleted, ...s.quests], lastDeleted: null }))
        }
      },

      purgeDependenciesTo: (nodeId) =>
        set(s => ({
          quests: s.quests.map(q => ({
            ...q,
            dependencies: q.dependencies.filter(d => d.targetId !== nodeId),
          })),
        })),

      getQuestById: (id) => get().quests.find(q => q.id === id),
      getChildren:  (parentId) => get().quests.filter(q => q.parentId === parentId),
    }),
    {
      name:           'atm10-quests-v2',     // new key → no conflict with old data
      storage:        safeStorage,
      skipHydration:  true,
      partialize: (s) => ({
        quests:       s.quests,
        _dataVersion: s._dataVersion,
      }),
    }
  )
)
