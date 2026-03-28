import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n'

interface SettingsStore {
  playerName: string
  locale:     Locale
  setPlayerName: (name: string) => void
  setLocale:     (locale: Locale) => void
}

const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? localStorage
    : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
)

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      playerName:    'Alina',
      locale:        DEFAULT_LOCALE,
      setPlayerName: (name)   => set({ playerName: name.trim() || 'Alina' }),
      setLocale:     (locale) => set({ locale }),
    }),
    {
      name:          'atm10-settings',
      storage:       safeStorage,
      skipHydration: true,
    },
  ),
)
