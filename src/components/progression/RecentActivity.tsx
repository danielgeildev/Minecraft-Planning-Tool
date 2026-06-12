'use client'

import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useQuestStore }    from '@/store/useQuestStore'
import { useItemStore }     from '@/store/useItemStore'
import { useBuildingStore } from '@/store/useBuildingStore'

interface ActivityEntry {
  id:       string
  title:    string
  subtitle?: string
  date:     Date
  emoji:    string
}

function relativeDayLabel(date: Date): string {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff  = Math.round((today.getTime() - d.getTime()) / 86_400_000)

  if (diff === 0) return 'Heute'
  if (diff === 1) return 'Gestern'
  if (diff < 7)  return `Vor ${diff} Tagen`
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
}

const MAX_ENTRIES = 8

/** Compact "recently completed" feed — replaces the former Timeline page. */
export function RecentActivity() {
  const doneQuests    = useQuestStore(useShallow(s => s.quests.filter(q => q.status === 'done')))
  const haveItems     = useItemStore(useShallow(s => s.items.filter(i => i.status === 'have')))
  const doneBuildings = useBuildingStore(useShallow(s => s.buildings.filter(b => b.status === 'done')))

  const entries = useMemo<ActivityEntry[]>(() => {
    const list: ActivityEntry[] = [
      ...doneQuests.map(q => ({
        id: q.id, title: q.title, subtitle: q.category, date: new Date(q.updatedAt), emoji: '📋',
      })),
      ...haveItems.map(i => ({
        id: i.id, title: i.name, subtitle: i.mod || undefined, date: new Date(i.updatedAt), emoji: '📦',
      })),
      ...doneBuildings.map(b => ({
        id: b.id, title: b.name, date: new Date(b.updatedAt), emoji: '🏗️',
      })),
    ]
    return list
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, MAX_ENTRIES)
  }, [doneQuests, haveItems, doneBuildings])

  if (entries.length === 0) {
    return (
      <p className="text-xs text-gray-400 dark:text-slate-500 px-1">
        Noch nichts erledigt — schließe Quests ab oder sammle Items!
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {entries.map(entry => (
        <div
          key={entry.id}
          className="flex items-center gap-2.5 bg-white dark:bg-slate-800 rounded-xl border border-rose-100/50 dark:border-slate-700/50 px-3 py-2"
        >
          <span className="text-base flex-shrink-0">{entry.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate">
              {entry.title}
            </p>
            {entry.subtitle && (
              <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                {entry.subtitle}
              </p>
            )}
          </div>
          <span className="text-[10px] text-gray-300 dark:text-slate-600 flex-shrink-0">
            {relativeDayLabel(entry.date)}
          </span>
        </div>
      ))}
    </div>
  )
}
