'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
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
import { useInventoryStore }    from '@/store/useInventoryStore'
import { useAuthStore }         from '@/store/useAuthStore'
import { createClient }         from '@/lib/supabase/client'
import { fetchAndHydrate }     from '@/lib/supabase/fetchAndHydrate'
import { startSync, stopSync, setHydrating } from '@/lib/supabase/syncEngine'
import {
  getLocalDataCounts, migrateLocalDataToSupabase,
  hasUserModifiedLocalData, captureLocalSnapshot, mergeSnapshotIntoSupabase,
  type MigrationCounts, type LocalDataSnapshot,
} from '@/lib/supabase/migration'
import { MigrationModal }      from '@/components/ui/MigrationModal'
import { MergeModal }          from '@/components/ui/MergeModal'
import { SyncErrorToast }      from '@/components/ui/SyncErrorToast'
import { initXpTracking }       from '@/lib/progression/xpTracker'
import { getLevelFromXp }       from '@/lib/progression/xp'

interface AppShellProps {
  children: ReactNode
}

/**
 * Auth pages (login/register/callback) render without sidebar, toasts, and
 * store/sync initialization — they bring their own standalone layout.
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isAuthPage =
    pathname === '/login' || pathname === '/register' || pathname.startsWith('/auth/')

  // Restore dark mode before paint — for auth pages and app pages alike
  useEffect(() => {
    if (localStorage.getItem('atm10-dark-mode') === 'true') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  if (isAuthPage) return <>{children}</>
  return <AppShellInner>{children}</AppShellInner>
}

function AppShellInner({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [migrationCounts, setMigrationCounts] = useState<MigrationCounts | null>(null)
  const [mergeSnapshot, setMergeSnapshot]     = useState<LocalDataSnapshot | null>(null)
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  // Auth state listener
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      useAuthStore.getState().setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        useAuthStore.getState().setUser(session?.user ?? null)
        // Clear anonymous mode when user authenticates
        if (session?.user) {
          document.cookie = 'atm10-anonymous-mode=; path=/; max-age=0'
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  // Supabase sync: fetch data and start sync engine when authenticated
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const userId = useAuthStore(s => s.user?.id)

  useEffect(() => {
    if (!isAuthenticated || !userId) return

    let cancelled = false

    async function initSync() {
      setHydrating(true)
      try {
        // Capture local (anonymous) work BEFORE hydration overwrites the stores
        const localSnapshot = hasUserModifiedLocalData() ? captureLocalSnapshot() : null

        const hasSupabaseData = await fetchAndHydrate(userId!)

        if (!hasSupabaseData) {
          // Supabase is empty but localStorage has data → offer migration
          const counts = getLocalDataCounts()
          if (counts) {
            setMigrationCounts(counts)
            setHydrating(false)
            return // Wait for user decision before starting sync
          }
        } else if (localSnapshot) {
          // Cloud has data AND this device had user-modified local data →
          // let the user decide instead of silently discarding the local work
          setMergeSnapshot(localSnapshot)
          setHydrating(false)
          return // Wait for user decision before starting sync
        }
      } catch (err) {
        console.error('[sync] fetch failed', err)
      }
      setHydrating(false)

      if (!cancelled) {
        startSync(userId!)
      }
    }

    initSync()

    return () => {
      cancelled = true
      stopSync()
    }
  }, [isAuthenticated, userId])

  useEffect(() => {
    // 1. Rehydrate all stores from localStorage
    useQuestStore.persist.rehydrate()
    useBuildingStore.persist.rehydrate()
    useItemStore.persist.rehydrate()
    useGoalStore.persist.rehydrate()
    useNoteStore.persist.rehydrate()
    useSettingsStore.persist.rehydrate()
    useAchievementStore.persist.rehydrate()
    useProgressStore.persist.rehydrate()
    useInventoryStore.persist.rehydrate()

    // 1b. Queue any already-unlocked achievements the user hasn't seen a toast for yet
    useAchievementStore.getState().queueUnseen()

    // 2. Load mock data only on very first run (_dataVersion === 0)
    const isFirstRun = useQuestStore.getState()._dataVersion === 0
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

    // 3b. On the very first run the mock data instantly unlocks achievements
    // the user didn't earn — mark those as seen instead of celebrating them
    if (isFirstRun) {
      useAchievementStore.setState(s => ({
        seenIds:      [...new Set([...s.seenIds, ...s.pendingQueue])],
        pendingQueue: [],
      }))
    }

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

  async function handleMigrate() {
    if (!userId) return
    await migrateLocalDataToSupabase(userId)
    setMigrationCounts(null)
    startSync(userId)
  }

  function handleSkipMigration() {
    setMigrationCounts(null)
    if (userId) startSync(userId)
  }

  async function handleMerge() {
    if (!userId || !mergeSnapshot) return
    await mergeSnapshotIntoSupabase(userId, mergeSnapshot)
    // Re-fetch so the stores show the merged result
    setHydrating(true)
    try {
      await fetchAndHydrate(userId)
    } finally {
      setHydrating(false)
    }
    setMergeSnapshot(null)
    startSync(userId)
  }

  function handleDiscardLocal() {
    setMergeSnapshot(null)
    if (userId) startSync(userId)
  }

  return (
    <div className="min-h-screen bg-rose-50 dark:bg-slate-950 flex">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

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

      {migrationCounts && (
        <MigrationModal
          counts={migrationCounts}
          onMigrate={handleMigrate}
          onSkip={handleSkipMigration}
        />
      )}

      {mergeSnapshot && (
        <MergeModal
          snapshot={mergeSnapshot}
          onMerge={handleMerge}
          onDiscard={handleDiscardLocal}
        />
      )}

      <AchievementToast />
      <XpToast />
      <LevelUpModal />
      <SyncErrorToast />
    </div>
  )
}
