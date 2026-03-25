'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

const navItems = [
  { href: '/',           label: 'Dashboard',      emoji: '🏠' },
  { href: '/goals',      label: 'Ziele',          emoji: '🎯' },
  { href: '/quests',     label: 'Quests',         emoji: '📋' },
  { href: '/buildings',  label: 'Gebäude',        emoji: '🏗️' },
  { href: '/items',      label: 'Items',          emoji: '📦' },
  { href: '/graph',      label: 'Graph',          emoji: '🗺️' },
  { href: '/settings',   label: 'Einstellungen',  emoji: '⚙️' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

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
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-rose-100
          flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-rose-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⛏️</span>
              <span className="font-bold text-gray-800 text-sm">ATM10 Tracker</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 ml-7">All the Mods 10</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 transition-colors"
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
                    ? 'bg-pink-50 text-pink-600'
                    : 'text-gray-600 hover:bg-rose-50 hover:text-gray-800'
                  }
                `}
              >
                <span className="text-base">{emoji}</span>
                <span>{label}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-400" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-rose-50">
          <div className="rounded-xl bg-rose-50 p-3">
            <p className="text-xs font-medium text-rose-500">🌸 Alina's Quest Tracker</p>
            <p className="text-xs text-rose-400 mt-0.5">Viel Spaß beim spielen!</p>
          </div>
        </div>
      </aside>
    </>
  )
}
