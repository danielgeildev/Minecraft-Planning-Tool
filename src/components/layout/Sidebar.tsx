'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useQuestStore }    from '@/store/useQuestStore'
import { useNoteStore }     from '@/store/useNoteStore'
import { useBuildingStore } from '@/store/useBuildingStore'
import { useAuthStore }    from '@/store/useAuthStore'
import { UserMenu }        from './UserMenu'
import { SyncIndicator }   from '@/components/ui/SyncIndicator'

const navItems = [
  { href: '/',           label: 'Dashboard',      emoji: '🏠' },
  { href: '/progress',   label: 'Fortschritt',    emoji: '✨' },
  { href: '/spielplan',  label: 'Spielplan',      emoji: '⚡' },
  { href: '/goals',      label: 'Ziele',          emoji: '🎯' },
  { href: '/quests',     label: 'Quests',         emoji: '📋' },
  { href: '/buildings',  label: 'Gebäude',        emoji: '🏗️' },
  { href: '/items',      label: 'Items',          emoji: '📦' },
  { href: '/graph',      label: 'Graph',          emoji: '🗺️' },
  { href: '/notes',      label: 'Notizen',        emoji: '📝' },
  { href: '/timeline',   label: 'Timeline',       emoji: '📅' },
  { href: '/settings',   label: 'Einstellungen',  emoji: '⚙️' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const activeQuests    = useQuestStore(s => s.quests.filter(q => q.status === 'in-progress').length)
  const activeBuildings = useBuildingStore(s => s.buildings.filter(b => b.status === 'in-progress').length)
  const noteCount       = useNoteStore(s => s.notes.length)

  const badges: Record<string, number> = {
    '/quests':    activeQuests,
    '/buildings': activeBuildings,
    '/notes':     noteCount,
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-900 border-r border-rose-100 dark:border-slate-700
          flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-rose-50 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⛏️</span>
              <span className="font-bold text-gray-800 dark:text-slate-100 text-sm">ATM10 Tracker</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 ml-7">All the Mods 10</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, emoji }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-colors duration-150
                  ${isActive
                    ? 'bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-slate-200'
                  }
                `}
              >
                <span className="text-base">{emoji}</span>
                <span>{label}</span>
                <span className="ml-auto flex items-center gap-1.5">
                  {badges[href] > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none
                      ${isActive ? 'bg-pink-200 dark:bg-pink-800 text-pink-700 dark:text-pink-200' : 'bg-rose-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                      {badges[href]}
                    </span>
                  )}
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-rose-50 dark:border-slate-700 flex flex-col gap-3">
          {isAuthenticated ? (
            <>
              <UserMenu />
              <SyncIndicator />
            </>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-xl bg-pink-400 text-white px-3 py-2 text-xs font-semibold hover:bg-pink-500 transition-colors"
            >
              Anmelden
            </Link>
          )}
          <div className="rounded-xl bg-rose-50 dark:bg-slate-800 p-3">
            <p className="text-xs font-medium text-rose-500 dark:text-rose-400">🌸 Alina&apos;s Quest Tracker</p>
            <p className="text-xs text-rose-400 dark:text-slate-500 mt-0.5">Viel Spaß beim spielen!</p>
          </div>
        </div>
      </aside>
    </>
  )
}
