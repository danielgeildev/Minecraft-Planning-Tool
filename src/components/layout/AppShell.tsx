'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar }              from './Sidebar'
import { AchievementToast }     from '@/components/ui/AchievementToast'
import { XpToast }              from '@/components/ui/XpToast'
import { LevelUpModal }         from '@/components/ui/LevelUpModal'
import { useQuestStore }        from '@/store/useQuestStore'
import { useBuildingStore }     from '@/store/useBuildingStore'
import { useItemStore }         from '@/store/useItemStore'
import { useGoalStore }         from '@/store/useGoalStore'
import { useNoteStore }         from '@/store/useNoteStore'
import { useSettingsStore }     from '@/store/useSettingsStore'
import { useAchievementStore }  from '@/store/useAchievementStore'
import { useProgressStore }     from '@/store/useProgressStore'
import { initXpTracking }       from '@/lib/progression/xpTracker'
import { getLevelFromXp }       from '@/lib/progression/xp'
import { I18nProvider }         from '@/lib/i18n/I18nProvider'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // 0. Restore dark mode before paint to prevent flash
    if (localStorage.getItem('atm10-dark-mode') === 'true') {
      document.documentElement.classList.add('dark')
    }

    // 1. Rehydrate all stores from localStorage
    useQuestStore.persist.rehydrate()
    useBuildingStore.persist.rehydrate()
    useItemStore.persist.rehydrate()
    useGoalStore.persist.rehydrate()
    useNoteStore.persist.rehydrate()
    useSettingsStore.persist.rehydrate()
    useAchievementStore.persist.rehydrate()
    useProgressStore.persist.rehydrate()

    // 1b. Queue any already-unlocked achievements the user hasn't seen a toast for yet
    useAchievementStore.getState().queueUnseen()

    // 2. Load mock data only on very first run (_dataVersion === 0)
    useQuestStore.getState().initializeIfNeeded()
    useBuildingStore.getState().initializeIfNeeded()
    useItemStore.getState().initializeIfNeeded()
    useGoalStore.getState().initializeIfNeeded()
    useNoteStore.getState().initializeIfNeeded()

    // 3. Check achievements once after hydration
    const checkNow = () => {
      const totalXp = useProgressStore.getState().totalXp
      useAchievementStore.getState().checkAndUnlock({
        quests:      useQuestStore.getState().quests,
        items:       useItemStore.getState().items,
        buildings:   useBuildingStore.getState().buildings,
        notes:       useNoteStore.getState().notes,
        goals:       useGoalStore.getState().goals,
        unlockedIds: useAchievementStore.getState().unlockedIds,
        totalXp,
        level:       getLevelFromXp(totalXp),
      })
    }
    checkNow()

    // 4. Subscribe to all relevant stores to check achievements on every change
    const unsubQuests    = useQuestStore.subscribe(checkNow)
    const unsubItems     = useItemStore.subscribe(checkNow)
    const unsubBuildings = useBuildingStore.subscribe(checkNow)
    const unsubNotes     = useNoteStore.subscribe(checkNow)
    const unsubGoals     = useGoalStore.subscribe(checkNow)
    const unsubProgress  = useProgressStore.subscribe(checkNow)

    // 5. Start XP tracking (subscribes to store changes)
    const unsubXp = initXpTracking()

    return () => {
      unsubQuests()
      unsubItems()
      unsubBuildings()
      unsubNotes()
      unsubGoals()
      unsubProgress()
      unsubXp()
    }
  }, [])

  return (
    <I18nProvider>
    <div className="min-h-screen bg-rose-50 dark:bg-slate-950 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-rose-100 dark:border-slate-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">⛏️</span>
            <span className="font-bold text-sm text-gray-800 dark:text-slate-100">ATM10 Tracker</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      <AchievementToast />
      <XpToast />
      <LevelUpModal />
    </div>
    </I18nProvider>
  )
}
