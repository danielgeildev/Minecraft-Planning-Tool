import { create } from 'zustand'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

interface SyncStore {
  status:       SyncStatus
  lastSyncedAt: string | null
  error:        string | null
  setStatus:    (status: SyncStatus, error?: string | null) => void
}

export const useSyncStore = create<SyncStore>()((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  error: null,

  setStatus: (status, error = null) => set({
    status,
    error,
    ...(status === 'synced' ? { lastSyncedAt: new Date().toISOString() } : {}),
  }),
}))
