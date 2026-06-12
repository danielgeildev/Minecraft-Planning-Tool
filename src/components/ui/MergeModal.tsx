'use client'

import { useState } from 'react'
import { Modal }  from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { LocalDataSnapshot } from '@/lib/supabase/migration'

interface MergeModalProps {
  snapshot:  LocalDataSnapshot
  onMerge:   () => Promise<void>
  onDiscard: () => void
}

/**
 * Shown when a user logs into an account that already has cloud data while
 * this device holds locally modified (anonymous) data. Lets the user merge
 * instead of silently losing the local work.
 */
export function MergeModal({ snapshot, onMerge, onDiscard }: MergeModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleMerge() {
    setLoading(true)
    setError(null)
    try {
      await onMerge()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zusammenführen fehlgeschlagen')
      setLoading(false)
    }
  }

  const items = [
    { label: 'Quests',   count: snapshot.quests.length },
    { label: 'Items',    count: snapshot.items.length },
    { label: 'Gebäude',  count: snapshot.buildings.length },
    { label: 'Ziele',    count: snapshot.goals.length },
    { label: 'Inventar', count: snapshot.inventory.length },
    { label: 'Notizen',  count: snapshot.notes.length },
  ].filter(i => i.count > 0)

  return (
    <Modal open onClose={() => {}} title="Lokale Änderungen gefunden">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Auf diesem Gerät gibt es lokale Daten, die nicht in deinem Account sind.
          Möchtest du sie mit deinen Cloud-Daten zusammenführen?
        </p>

        <div className="rounded-xl bg-rose-50 dark:bg-slate-700/50 p-3 flex flex-col gap-1">
          {items.map(({ label, count }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-slate-300">{label}</span>
              <span className="font-medium text-gray-800 dark:text-slate-100">{count}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 dark:text-slate-500">
          Bei Konflikten (gleicher Eintrag lokal und in der Cloud) gewinnt die lokale Version.
          XP und Achievements werden aus der Cloud übernommen.
        </p>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={handleMerge} disabled={loading} className="flex-1">
            {loading ? 'Wird zusammengeführt...' : 'Zusammenführen'}
          </Button>
          <Button variant="ghost" onClick={onDiscard} disabled={loading} className="flex-1">
            Lokale Daten verwerfen
          </Button>
        </div>
      </div>
    </Modal>
  )
}
