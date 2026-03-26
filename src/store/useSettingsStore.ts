import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsStore {
  playerName: string
  setPlayerName: (name: string) => void
}

const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? localStorage
    : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
)

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      playerName: 'Alina',
      setPlayerName: (name) => set({ playerName: name.trim() || 'Alina' }),
    }),
    {
      name:           'atm10-settings',
      storage:        safeStorage,
      skipHydration:  true,
    },
  ),
)
