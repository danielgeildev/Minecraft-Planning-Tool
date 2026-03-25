'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useQuestStore } from '@/store/useQuestStore'
import { Button }        from '@/components/ui/Button'
import type { QuestCategory, QuestPriority, QuestStatus } from '@/types'

interface Props {
  onClose: () => void
}

const CATEGORIES: { value: QuestCategory; label: string }[] = [
  { value: 'progression', label: '⭐ Progression' },
  { value: 'building',    label: '🏗️ Bauen' },
  { value: 'farming',     label: '🌾 Farming' },
  { value: 'exploration', label: '🗺️ Erkundung' },
  { value: 'crafting',    label: '🔨 Crafting' },
  { value: 'automation',  label: '⚙️ Automation' },
  { value: 'other',       label: '📌 Sonstiges' },
]

const PRIORITIES: { value: QuestPriority; label: string }[] = [
  { value: 'low',    label: 'Niedrig' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high',   label: 'Hoch' },
]

export function GraphCreateQuestModal({ onClose }: Props) {
  const addQuest = useQuestStore(s => s.addQuest)

  const [title,    setTitle]    = useState('')
  const [desc,     setDesc]     = useState('')
  const [priority, setPriority] = useState<QuestPriority>('medium')
  const [category, setCategory] = useState<QuestCategory>('other')
  const [status,   setStatus]   = useState<QuestStatus>('open')
  const [error,    setError]    = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Titel ist erforderlich.')
      return
    }
    addQuest({
      title:        trimmed,
      description:  desc.trim(),
      status,
      priority,
      category,
      parentId:     null,
      dependencies: [],
      notes:        '',
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl border border-rose-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-50">
          <h2 className="text-sm font-bold text-gray-800">📋 Neue Quest</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Titel *</label>
            <input
              autoFocus
              value={title}
              onChange={e => { setTitle(e.target.value); setError(null) }}
              placeholder="Quest-Bezeichnung…"
              className="rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Beschreibung</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              placeholder="Optional…"
              className="rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 resize-none"
            />
          </div>

          {/* Priority + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Priorität</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as QuestPriority)}
                className="rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:border-pink-400"
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Kategorie</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as QuestCategory)}
                className="rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:border-pink-400"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Status</label>
            <div className="flex gap-2">
              {(['open', 'in-progress', 'done'] as QuestStatus[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    status === s
                      ? 'bg-pink-400 text-white border-pink-400'
                      : 'bg-white text-gray-500 border-rose-100 hover:bg-rose-50'
                  }`}
                >
                  {s === 'open' ? 'Offen' : s === 'in-progress' ? 'Läuft' : 'Fertig'}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button type="submit" className="flex-1">
              Quest erstellen
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
