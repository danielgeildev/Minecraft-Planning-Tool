import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InventoryItem } from '@/types'

interface InventoryStore {
  inventory: InventoryItem[]
  setAmount:  (nodeId: string, amount: number) => void
  getAmount:  (nodeId: string) => number
  clearItem:  (nodeId: string) => void
  clearAll:   () => void
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      inventory: [],

      setAmount: (nodeId, amount) => {
        if (amount <= 0) {
          set(s => ({ inventory: s.inventory.filter(i => i.nodeId !== nodeId) }))
        } else {
          set(s => {
            const exists = s.inventory.some(i => i.nodeId === nodeId)
            if (exists) {
              return { inventory: s.inventory.map(i => i.nodeId === nodeId ? { ...i, amount } : i) }
            }
            return { inventory: [...s.inventory, { nodeId, amount }] }
          })
        }
      },

      getAmount: (nodeId) => get().inventory.find(i => i.nodeId === nodeId)?.amount ?? 0,

      clearItem: (nodeId) => set(s => ({ inventory: s.inventory.filter(i => i.nodeId !== nodeId) })),

      clearAll: () => set({ inventory: [] }),
    }),
    {
      name: 'atm10-inventory-v1',
      skipHydration: true,
    }
  )
)
