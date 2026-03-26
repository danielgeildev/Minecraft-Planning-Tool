'use client'

import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useQuestStore }    from '@/store/useQuestStore'
import { useItemStore }     from '@/store/useItemStore'
import { useBuildingStore } from '@/store/useBuildingStore'
import { useNoteStore }     from '@/store/useNoteStore'

type EntryType = 'quest' | 'item' | 'building' | 'note'

interface TimelineEntry {
  id:        string
  type:      EntryType
  title:     string
  subtitle?: string
  date:      Date
  emoji:     string
  color:     string
}

const TYPE_CONFIG: Record<EntryType, { emoji: string; color: string; dot: string }> = {
  quest:    { emoji: '📋', color: 'text-pink-600 dark:text-pink-400',    dot: 'bg-pink-400'    },
  item:     { emoji: '📦', color: 'text-blue-600 dark:text-blue-400',    dot: 'bg-blue-400'    },
  building: { emoji: '🏗️', color: 'text-amber-600 dark:text-amber-400',  dot: 'bg-amber-400'   },
  note:     { emoji: '📝', color: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-400'  },
}

function formatGroupLabel(date: Date): string {
  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff  = Math.round((today.getTime() - d.getTime()) / 86_400_000)

  if (diff === 0) return 'Heute'
  if (diff === 1) return 'Gestern'
  if (diff < 7)  return `Vor ${diff} Tagen`
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
}

function groupByDay(entries: TimelineEntry[]): { label: string; entries: TimelineEntry[] }[] {
  const map = new Map<string, TimelineEntry[]>()
  for (const e of entries) {
    const key = e.date.toDateString()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return Array.from(map.entries()).map(([, entries]) => ({
    label:   formatGroupLabel(entries[0].date),
    entries,
  }))
}

const FILTERS: { type: EntryType | 'all'; label: string; emoji: string }[] = [
  { type: 'all',      label: 'Alle',     emoji: '📅' },
  { type: 'quest',    label: 'Quests',   emoji: '📋' },
  { type: 'item',     label: 'Items',    emoji: '📦' },
  { type: 'building', label: 'Gebäude',  emoji: '🏗️' },
  { type: 'note',     label: 'Notizen',  emoji: '📝' },
]

export default function TimelinePage() {
  const [activeFilter, setActiveFilter] = useState<EntryType | 'all'>('all')
  const doneQuests    = useQuestStore(useShallow(s => s.quests.filter(q => q.status === 'done')))
  const haveItems     = useItemStore(useShallow(s => s.items.filter(i => i.status === 'have')))
  const doneBuildings = useBuildingStore(useShallow(s => s.buildings.filter(b => b.status === 'done')))
  const notes         = useNoteStore(useShallow(s => s.notes))

  const questTotal    = useQuestStore(s => s.quests.filter(q => q.status === 'done').length)
  const itemTotal     = useItemStore(s => s.items.filter(i => i.status === 'have').length)
  const buildingTotal = useBuildingStore(s => s.buildings.filter(b => b.status === 'done').length)
  const noteTotal     = useNoteStore(s => s.notes.length)

  const entries = useMemo<TimelineEntry[]>(() => {
    const list: TimelineEntry[] = [
      ...doneQuests.map(q => ({
        id:       q.id,
        type:     'quest' as const,
        title:    q.title,
        subtitle: q.category,
        date:     new Date(q.updatedAt),
        emoji:    TYPE_CONFIG.quest.emoji,
        color:    TYPE_CONFIG.quest.color,
      })),
      ...haveItems.map(i => ({
        id:       i.id,
        type:     'item' as const,
        title:    i.name,
        subtitle: i.mod || undefined,
        date:     new Date(i.updatedAt),
        emoji:    TYPE_CONFIG.item.emoji,
        color:    TYPE_CONFIG.item.color,
      })),
      ...doneBuildings.map(b => ({
        id:    b.id,
        type:  'building' as const,
        title: b.name,
        date:  new Date(b.updatedAt),
        emoji: TYPE_CONFIG.building.emoji,
        color: TYPE_CONFIG.building.color,
      })),
      ...notes.map(n => ({
        id:       n.id,
        type:     'note' as const,
        title:    n.title,
        subtitle: n.tags.length > 0 ? n.tags.map(t => `#${t}`).join(' ') : undefined,
        date:     new Date(n.updatedAt),
        emoji:    TYPE_CONFIG.note.emoji,
        color:    TYPE_CONFIG.note.color,
      })),
    ]
    return list.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [doneQuests, haveItems, doneBuildings, notes])

  const filtered = useMemo(
    () => activeFilter === 'all' ? entries : entries.filter(e => e.type === activeFilter),
    [entries, activeFilter],
  )
  const groups = useMemo(() => groupByDay(filtered), [filtered])

  const totalDone = { quests: questTotal, items: itemTotal, buildings: buildingTotal, notes: noteTotal }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-3xl lg:px-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">📅 Timeline</h1>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Dein Fortschritt auf einen Blick</p>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-0.5">
        {FILTERS.map(f => (
          <button
            key={f.type}
            onClick={() => setActiveFilter(f.type)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium flex-shrink-0 transition-colors
              ${activeFilter === f.type
                ? 'bg-pink-400 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-pink-200 dark:hover:border-pink-700'}
            `}
          >
            <span>{f.emoji}</span>
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {([
          { type: 'quest',    label: 'Quests',   count: totalDone.quests    },
          { type: 'item',     label: 'Items',    count: totalDone.items     },
          { type: 'building', label: 'Gebäude',  count: totalDone.buildings },
          { type: 'note',     label: 'Notizen',  count: totalDone.notes     },
        ] as const).map(({ type, label, count }) => {
          const cfg = TYPE_CONFIG[type]
          return (
            <div key={type} className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 p-3 text-center shadow-sm">
              <p className="text-lg">{cfg.emoji}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-slate-100">{count}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">{label}</p>
            </div>
          )
        })}
      </div>

      {/* Timeline */}
      {entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-sm font-medium">Noch nichts erledigt</p>
          <p className="text-xs mt-1">Schließe Quests ab, sammle Items oder erstelle Notizen!</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-rose-100 dark:bg-slate-700" aria-hidden />

          <div className="flex flex-col gap-0">
            {groups.map(({ label, entries: groupEntries }) => (
              <div key={label}>
                {/* Day label */}
                <div className="relative flex items-center gap-3 mb-3 mt-4 first:mt-0">
                  <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-slate-800 border-2 border-rose-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-xs">📅</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                    {label}
                  </span>
                </div>

                {/* Entries */}
                <div className="flex flex-col gap-1.5 ml-0">
                  {groupEntries.map(entry => {
                    const cfg = TYPE_CONFIG[entry.type]
                    return (
                      <div key={entry.id} className="relative flex items-center gap-3">
                        {/* Dot */}
                        <div className={`w-10 flex-shrink-0 flex justify-center z-10`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ring-2 ring-white dark:ring-slate-900`} />
                        </div>

                        {/* Card */}
                        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-slate-700 px-3 py-2.5 shadow-sm flex items-center gap-2.5 mb-0.5">
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
                            {entry.date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
