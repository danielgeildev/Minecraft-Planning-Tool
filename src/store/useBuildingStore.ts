'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Building } from '@/types'
import { mockBuildings } from '@/data/mockData'

interface BuildingStore {
  buildings: Building[]
  _dataVersion: number
  lastDeleted: Building | null

  initializeIfNeeded: () => void

  addBuilding:    (b: Omit<Building, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => void
  updateBuilding: (id: string, updates: Partial<Building>) => void
  deleteBuilding: (id: string) => void
  undoDelete:     () => void

  getBuildingById:      (id: string) => Building | undefined
  purgeDependenciesTo:  (nodeId: string) => void
}

const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? localStorage
    : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
)

export const useBuildingStore = create<BuildingStore>()(
  persist(
    (set, get) => ({
      buildings:    [],
      _dataVersion: 0,
      lastDeleted:  null,

      initializeIfNeeded: () => {
        if (get()._dataVersion === 0) {
          set({ buildings: mockBuildings, _dataVersion: 1 })
        }
      },

      addBuilding: (data) => {
        const now = new Date().toISOString()
        const building: Building = {
          ...data,
          type: 'building',
          id:        crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        }
        set(s => ({ buildings: [building, ...s.buildings] }))
      },

      updateBuilding: (id, updates) =>
        set(s => ({
          buildings: s.buildings.map(b =>
            b.id === id
              ? { ...b, ...updates, updatedAt: new Date().toISOString() }
              : b
          ),
        })),

      deleteBuilding: (id) => {
        const target = get().buildings.find(b => b.id === id) ?? null
        set(s => ({
          lastDeleted: target,
          buildings:   s.buildings.filter(b => b.id !== id),
        }))
      },

      undoDelete: () => {
        const { lastDeleted } = get()
        if (lastDeleted) {
          set(s => ({ buildings: [lastDeleted, ...s.buildings], lastDeleted: null }))
        }
      },

      getBuildingById: (id) => get().buildings.find(b => b.id === id),

      purgeDependenciesTo: (nodeId) =>
        set(s => ({
          buildings: s.buildings.map(b => ({
            ...b,
            dependencies:    (b.dependencies ?? []).filter(d => d.targetId !== nodeId),
            itemRequirements: (b.itemRequirements ?? []).filter(r => r.itemId !== nodeId),
          })),
        })),
    }),
    {
      name:          'atm10-buildings-v2',
      storage:       safeStorage,
      skipHydration: true,
      partialize: (s) => ({
        buildings:    s.buildings,
        _dataVersion: s._dataVersion,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.buildings = state.buildings.map(b => ({
            ...b,
            type:             (b as Building).type ?? 'building',
            dependencies:     (b as Building).dependencies ?? [],
            itemRequirements: (b as Building).itemRequirements ?? [],
          }))
        }
      },
    }
  )
)
