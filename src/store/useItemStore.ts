'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ItemNode, ItemStatus } from '@/types'
import { mockItems } from '@/data/mockData'

interface ItemStore {
  items: ItemNode[]
  _dataVersion: number
  lastDeleted: ItemNode | null

  initializeIfNeeded: () => void

  addItem:    (item: Omit<ItemNode, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => void
  updateItem: (id: string, updates: Partial<ItemNode>) => void
  deleteItem: (id: string) => void
  undoDelete: () => void

  // Cross-store cleanup — removes all dependencies pointing to a given node id
  purgeDependenciesTo: (nodeId: string) => void

  getItemById: (id: string) => ItemNode | undefined
}

const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? localStorage
    : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
)

export const useItemStore = create<ItemStore>()(
  persist(
    (set, get) => ({
      items:        [],
      _dataVersion: 0,
      lastDeleted:  null,

      initializeIfNeeded: () => {
        if (get()._dataVersion === 0) {
          set({ items: mockItems, _dataVersion: 1 })
        }
      },

      addItem: (data) => {
        const now = new Date().toISOString()
        const item: ItemNode = {
          ...data,
          id:        crypto.randomUUID(),
          type:      'item',
          createdAt: now,
          updatedAt: now,
        }
        set(s => ({ items: [item, ...s.items] }))
      },

      updateItem: (id, updates) =>
        set(s => ({
          items: s.items.map(i =>
            i.id === id
              ? { ...i, ...updates, updatedAt: new Date().toISOString() }
              : i
          ),
        })),

      deleteItem: (id) => {
        const target = get().items.find(i => i.id === id) ?? null
        set(s => ({
          lastDeleted: target,
          items: s.items
            .filter(i => i.id !== id)
            .map(i => ({
              ...i,
              dependencies: i.dependencies.filter(d => d.targetId !== id),
            })),
        }))
      },

      undoDelete: () => {
        const { lastDeleted } = get()
        if (lastDeleted) {
          set(s => ({ items: [lastDeleted, ...s.items], lastDeleted: null }))
        }
      },

      purgeDependenciesTo: (nodeId) =>
        set(s => ({
          items: s.items.map(i => ({
            ...i,
            dependencies: i.dependencies.filter(d => d.targetId !== nodeId),
          })),
        })),

      getItemById: (id) => get().items.find(i => i.id === id),
    }),
    {
      name:          'atm10-items-v2',
      storage:       safeStorage,
      skipHydration: true,
      partialize: (s) => ({
        items:        s.items,
        _dataVersion: s._dataVersion,
      }),
    }
  )
)
