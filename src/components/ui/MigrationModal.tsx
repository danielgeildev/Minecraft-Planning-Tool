'use client'

import { useState } from 'react'
import { Modal }  from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { MigrationCounts } from '@/lib/supabase/migration'

interface MigrationModalProps {
  counts:    MigrationCounts
  onMigrate: () => Promise<void>
  onSkip:    () => void
}

export function MigrationModal({ counts, onMigrate, onSkip }: MigrationModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleMigrate() {
    setLoading(true)
    setError(null)
    try {
      await onMigrate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration fehlgeschlagen')
      setLoading(false)
    }
  }

  const items = [
    { label: 'Quests',       count: counts.quests },
    { label: 'Items',        count: counts.items },
    { label: 'Gebäude',      count: counts.buildings },
    { label: 'Ziele',        count: counts.goals },
    { label: 'Inventar',     count: counts.inventory },
    { label: 'Notizen',      count: counts.notes },
    { label: 'Achievements', count: counts.achievements },
  ].filter(i => i.count > 0)

  return (
    <Modal open onClose={() => {}} title="Lokale Daten gefunden">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Du hast bestehende Daten auf diesem Gerät. Möchtest du diese in deinen Account übernehmen?
        </p>

        <div className="rounded-xl bg-rose-50 dark:bg-slate-700/50 p-3 flex flex-col gap-1">
          {items.map(({ label, count }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-slate-300">{label}</span>
              <span className="font-medium text-gray-800 dark:text-slate-100">{count}</span>
            </div>
          ))}
          {counts.xp > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-slate-300">XP</span>
              <span className="font-medium text-gray-800 dark:text-slate-100">{counts.xp}</span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 dark:text-slate-500">
          Hinweis: Bilder in Notizen und Gebäuden bleiben lokal auf diesem Gerät gespeichert.
        </p>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={handleMigrate} disabled={loading} className="flex-1">
            {loading ? 'Wird übernommen...' : 'Übernehmen'}
          </Button>
          <Button variant="ghost" onClick={onSkip} disabled={loading} className="flex-1">
            Neu starten
          </Button>
        </div>
      </div>
    </Modal>
  )
}
