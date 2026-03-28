import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GraphPositionState {
  /** Manually placed node positions: nodeId → { x, y } */
  positions: Record<string, { x: number; y: number }>
  setPosition: (nodeId: string, x: number, y: number) => void
  clearPosition: (nodeId: string) => void
  clearAll: () => void
}

export const useGraphPositionStore = create<GraphPositionState>()(
  persist(
    (set) => ({
      positions: {},
      setPosition: (nodeId, x, y) =>
        set((s) => ({ positions: { ...s.positions, [nodeId]: { x, y } } })),
      clearPosition: (nodeId) =>
        set((s) => {
          const { [nodeId]: _, ...rest } = s.positions
          return { positions: rest }
        }),
      clearAll: () => set({ positions: {} }),
    }),
    { name: 'graph-positions' },
  ),
)
