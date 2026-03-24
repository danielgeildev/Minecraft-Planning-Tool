'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Goal } from '@/types'
import { mockGoals } from '@/data/mockData'

interface GoalStore {
  goals: Goal[]
  _dataVersion: number

  initializeIfNeeded: () => void

  addGoal:             (targetNodeId: string, opts?: { note?: string; parentGoalId?: string }) => string
  addGoalWithSubgoals: (targetNodeId: string, note: string, subGoalNodeIds: string[]) => void
  removeGoal:          (id: string) => void
  removeGoalByNodeId:  (targetNodeId: string) => void
  toggleGoal:          (targetNodeId: string) => void
  updateGoalNote:      (id: string, note: string) => void

  isGoal:          (nodeId: string) => boolean
  getGoalForNode:  (nodeId: string) => Goal | undefined
  getSubgoals:     (parentGoalId: string) => Goal[]
  getRootGoals:    () => Goal[]
}

const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? localStorage
    : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
)

export const useGoalStore = create<GoalStore>()(
  persist(
    (set, get) => ({
      goals:        [],
      _dataVersion: 0,

      initializeIfNeeded: () => {
        if (get()._dataVersion === 0) {
          set({ goals: mockGoals, _dataVersion: 1 })
        }
      },

      addGoal: (targetNodeId, opts = {}) => {
        const existing = get().goals.find(g => g.targetNodeId === targetNodeId)
        if (existing) return existing.id

        const id = crypto.randomUUID()
        const goal: Goal = {
          id,
          targetNodeId,
          createdAt: new Date().toISOString(),
          ...(opts.note         ? { note:         opts.note         } : {}),
          ...(opts.parentGoalId ? { parentGoalId: opts.parentGoalId } : {}),
        }
        set(s => ({ goals: [goal, ...s.goals] }))
        return id
      },

      addGoalWithSubgoals: (targetNodeId, note, subGoalNodeIds) => {
        const existing = get().goals.find(g => g.targetNodeId === targetNodeId)
        let parentId: string

        if (existing) {
          // Update existing goal's note
          set(s => ({
            goals: s.goals.map(g =>
              g.id === existing.id ? { ...g, note: note || g.note } : g
            ),
          }))
          parentId = existing.id
        } else {
          parentId = crypto.randomUUID()
          const parentGoal: Goal = {
            id:        parentId,
            targetNodeId,
            createdAt: new Date().toISOString(),
            ...(note ? { note } : {}),
          }
          set(s => ({ goals: [parentGoal, ...s.goals] }))
        }

        // Add subgoals (skip if already tracked)
        const newSubGoals: Goal[] = subGoalNodeIds
          .filter(id => !get().goals.some(g => g.targetNodeId === id))
          .map(id => ({
            id:           crypto.randomUUID(),
            targetNodeId: id,
            parentGoalId: parentId,
            createdAt:    new Date().toISOString(),
          }))

        if (newSubGoals.length > 0) {
          set(s => ({ goals: [...s.goals, ...newSubGoals] }))
        }
      },

      removeGoal: (id) => {
        // Also remove all subgoals of this goal
        set(s => ({ goals: s.goals.filter(g => g.id !== id && g.parentGoalId !== id) }))
      },

      removeGoalByNodeId: (targetNodeId) => {
        const goal = get().goals.find(g => g.targetNodeId === targetNodeId)
        if (goal) get().removeGoal(goal.id)
      },

      toggleGoal: (targetNodeId) => {
        const existing = get().goals.find(g => g.targetNodeId === targetNodeId)
        if (existing) {
          get().removeGoal(existing.id)
        } else {
          get().addGoal(targetNodeId)
        }
      },

      updateGoalNote: (id, note) =>
        set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, note } : g) })),

      isGoal:         (nodeId) => get().goals.some(g => g.targetNodeId === nodeId),
      getGoalForNode: (nodeId) => get().goals.find(g => g.targetNodeId === nodeId),
      getSubgoals:    (parentGoalId) => get().goals.filter(g => g.parentGoalId === parentGoalId),
      getRootGoals:   () => get().goals.filter(g => !g.parentGoalId),
    }),
    {
      name:          'atm10-goals-v1',
      storage:       safeStorage,
      skipHydration: true,
      partialize: (s) => ({
        goals:        s.goals,
        _dataVersion: s._dataVersion,
      }),
    }
  )
)
