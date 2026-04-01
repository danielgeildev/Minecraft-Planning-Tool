'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useSyncStore } from '@/store/useSyncStore'

export function SyncErrorToast() {
  const status = useSyncStore(s => s.status)
  const error  = useSyncStore(s => s.error)
  const [dismissed, setDismissed] = useState(false)

  // Reset dismissal when status changes away from error
  useEffect(() => {
    if (status !== 'error') setDismissed(false)
  }, [status])

  if (status !== 'error' || dismissed || !error) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 shadow-lg flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">Synchronisation fehlgeschlagen</p>
        <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">Daten werden lokal gespeichert.</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-red-300 dark:text-red-600 hover:text-red-500 flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}
