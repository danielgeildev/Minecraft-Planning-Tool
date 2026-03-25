'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useBuildingStore } from '@/store/useBuildingStore'
import { Button } from '@/components/ui/Button'
import type { BuildingStatus } from '@/types'

interface Props { onClose: () => void }

export function GraphCreateBuildingModal({ onClose }: Props) {
  const addBuilding = useBuildingStore(s => s.addBuilding)

  const [name,     setName]     = useState('')
  const [location, setLocation] = useState('')
  const [style,    setStyle]    = useState('')
  const [status,   setStatus]   = useState<BuildingStatus>('planned')
  const [error,    setError]    = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError('Name ist erforderlich.'); return }
    addBuilding({
      name: trimmed,
      location: location.trim(),
      style: style.trim(),
      status,
      requirements:    [],
      itemRequirements: [],
      inspoPics:       [],
      dependencies:    [],
      notes:           '',
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl border border-teal-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-teal-50">
          <h2 className="text-sm font-bold text-gray-800">🏗️ Neues Gebäude</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Name *</label>
            <input
              autoFocus
              value={name}
              onChange={e => { setName(e.target.value); setError(null) }}
              placeholder="z.B. Cherry Haus"
              className="rounded-xl border border-teal-200 px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Ort</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="z.B. Spawn"
                className="rounded-xl border border-teal-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Stil</label>
              <input
                value={style}
                onChange={e => setStyle(e.target.value)}
                placeholder="z.B. Cozy Cottage"
                className="rounded-xl border border-teal-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Status</label>
            <div className="flex gap-2">
              {(['planned', 'in-progress', 'done'] as BuildingStatus[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    status === s
                      ? 'bg-teal-400 text-white border-teal-400'
                      : 'bg-white text-gray-500 border-teal-100 hover:bg-teal-50'
                  }`}
                >
                  {s === 'planned' ? 'Geplant' : s === 'in-progress' ? 'Im Bau' : 'Fertig'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Abbrechen</Button>
            <Button type="submit" className="flex-1">Gebäude erstellen</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
