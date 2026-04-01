/**
 * Sync Engine: subscribes to Zustand stores and writes changes to Supabase.
 * Phase 2: settings (profiles), quests, inventory.
 *
 * Pattern: subscribe() → diff previous vs current → debounced upsert/delete.
 * The engine does NOT modify stores — it only reads and writes to Supabase.
 */

import { createClient } from './client'
import { questToRow, inventoryToRow } from './mappers'
import { useQuestStore }     from '@/store/useQuestStore'
import { useSettingsStore }  from '@/store/useSettingsStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useSyncStore }      from '@/store/useSyncStore'
import type { QuestNode, InventoryItem } from '@/types'

let unsubscribers: (() => void)[] = []
let hydrating = false

/** Set to true while fetchAndHydrate is running to prevent sync-back loops. */
export function setHydrating(v: boolean) { hydrating = v }

// ─── Debounce helper ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

// ─── Sync helpers ────────────────────────────────────────────────────────────

async function syncWrite(fn: () => PromiseLike<{ error: unknown }>) {
  if (hydrating) return

  useSyncStore.getState().setStatus('syncing')
  try {
    const { error } = await fn()
    if (error) {
      console.error('[sync]', error)
      useSyncStore.getState().setStatus('error', String(error))
    } else {
      useSyncStore.getState().setStatus('synced')
    }
  } catch (err) {
    console.error('[sync] network error', err)
    useSyncStore.getState().setStatus('offline')
  }
}

// ─── startSync ───────────────────────────────────────────────────────────────

export function startSync(userId: string) {
  const supabase = createClient()

  // ── Settings (profiles) sync ──────────────────────────────────────────────

  let prevPlayerName = useSettingsStore.getState().playerName

  const unsubSettings = useSettingsStore.subscribe(
    debounce((state: { playerName: string }) => {
      if (state.playerName !== prevPlayerName) {
        prevPlayerName = state.playerName
        syncWrite(() =>
          supabase
            .from('profiles')
            .update({ player_name: state.playerName, updated_at: new Date().toISOString() })
            .eq('id', userId),
        )
      }
    }, 500),
  )
  unsubscribers.push(unsubSettings)

  // ── Quests sync ───────────────────────────────────────────────────────────

  let prevQuests = [...useQuestStore.getState().quests]

  const unsubQuests = useQuestStore.subscribe(
    debounce((state: { quests: QuestNode[] }) => {
      const current = state.quests

      // Find added or updated quests
      const upserts = current.filter(q => {
        const prev = prevQuests.find(p => p.id === q.id)
        return !prev || prev.updatedAt !== q.updatedAt
      })

      // Find removed quests
      const removedIds = prevQuests
        .filter(p => !current.find(q => q.id === p.id))
        .map(p => p.id)

      prevQuests = [...current]

      if (upserts.length > 0) {
        syncWrite(() =>
          supabase
            .from('quests')
            .upsert(upserts.map(q => questToRow(q, userId))),
        )
      }

      if (removedIds.length > 0) {
        syncWrite(() =>
          supabase
            .from('quests')
            .delete()
            .in('id', removedIds),
        )
      }
    }, 300),
  )
  unsubscribers.push(unsubQuests)

  // ── Inventory sync ────────────────────────────────────────────────────────

  let prevInventory = [...useInventoryStore.getState().inventory]

  const unsubInventory = useInventoryStore.subscribe(
    debounce((state: { inventory: InventoryItem[] }) => {
      const current = state.inventory

      // Upserts (added or changed amount)
      const upserts = current.filter(item => {
        const prev = prevInventory.find(p => p.nodeId === item.nodeId)
        return !prev || prev.amount !== item.amount
      })

      // Removals (items no longer in the array)
      const removedNodeIds = prevInventory
        .filter(p => !current.find(q => q.nodeId === p.nodeId))
        .map(p => p.nodeId)

      prevInventory = [...current]

      if (upserts.length > 0) {
        syncWrite(() =>
          supabase
            .from('inventory')
            .upsert(
              upserts.map(item => inventoryToRow(item, userId)),
              { onConflict: 'user_id,node_id' },
            ),
        )
      }

      if (removedNodeIds.length > 0) {
        syncWrite(() =>
          supabase
            .from('inventory')
            .delete()
            .eq('user_id', userId)
            .in('node_id', removedNodeIds),
        )
      }
    }, 300),
  )
  unsubscribers.push(unsubInventory)

  // ── Online/offline detection ──────────────────────────────────────────────

  const handleOnline = () => {
    if (useSyncStore.getState().status === 'offline') {
      useSyncStore.getState().setStatus('synced')
    }
  }
  const handleOffline = () => {
    useSyncStore.getState().setStatus('offline')
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  unsubscribers.push(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })
}

// ─── stopSync ────────────────────────────────────────────────────────────────

export function stopSync() {
  unsubscribers.forEach(fn => fn())
  unsubscribers = []
  useSyncStore.getState().setStatus('idle')
}
