'use client'

import { useSyncStore, type SyncStatus } from '@/store/useSyncStore'

const config: Record<SyncStatus, { dot: string; label: string; title: string }> = {
  idle:    { dot: 'bg-gray-300',   label: '',            title: 'Nicht verbunden' },
  syncing: { dot: 'bg-amber-400 animate-pulse', label: 'Synchronisiert...', title: 'Daten werden synchronisiert' },
  synced:  { dot: 'bg-emerald-400', label: '',            title: 'Alles gespeichert' },
  error:   { dot: 'bg-red-400',    label: 'Sync-Fehler', title: 'Synchronisation fehlgeschlagen' },
  offline: { dot: 'bg-gray-400',   label: 'Offline',     title: 'Keine Internetverbindung' },
}

export function SyncIndicator() {
  const status = useSyncStore(s => s.status)

  if (status === 'idle') return null

  const { dot, label, title } = config[status]

  return (
    <div className="flex items-center gap-1.5" title={title}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
      {label && (
        <span className="text-[10px] text-gray-400 dark:text-slate-500">{label}</span>
      )}
    </div>
  )
}
