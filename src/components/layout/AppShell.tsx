'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useQuestStore }   from '@/store/useQuestStore'
import { useBuildingStore } from '@/store/useBuildingStore'
import { useItemStore }    from '@/store/useItemStore'
import { useGoalStore }    from '@/store/useGoalStore'
import { useNoteStore }    from '@/store/useNoteStore'

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

    // 1. Rehydrate from localStorage
    useQuestStore.persist.rehydrate()
    useBuildingStore.persist.rehydrate()
    useItemStore.persist.rehydrate()
    useGoalStore.persist.rehydrate()
    useNoteStore.persist.rehydrate()

    // 2. Load mock data only on very first run (_dataVersion === 0)
    useQuestStore.getState().initializeIfNeeded()
    useBuildingStore.getState().initializeIfNeeded()
    useItemStore.getState().initializeIfNeeded()
    useGoalStore.getState().initializeIfNeeded()
    useNoteStore.getState().initializeIfNeeded()
  }, [])

  return (
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
    </div>
  )
}
