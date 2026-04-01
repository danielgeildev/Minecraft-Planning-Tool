/**
 * Sync Engine: subscribes to Zustand stores and writes changes to Supabase.
 * Pattern: subscribe() → diff previous vs current → debounced upsert/delete.
 * The engine does NOT modify stores — it only reads and writes to Supabase.
 */

import { createClient } from './client'
import {
  questToRow, itemToRow, buildingToRow, goalToRow,
  inventoryToRow, noteToRow, achievementsToRow,
  progressToRow, graphPositionsToRow,
} from './mappers'
import { useQuestStore }         from '@/store/useQuestStore'
import { useItemStore }          from '@/store/useItemStore'
import { useBuildingStore }      from '@/store/useBuildingStore'
import { useGoalStore }          from '@/store/useGoalStore'
import { useInventoryStore }     from '@/store/useInventoryStore'
import { useNoteStore }          from '@/store/useNoteStore'
import { useSettingsStore }      from '@/store/useSettingsStore'
import { useAchievementStore }   from '@/store/useAchievementStore'
import { useProgressStore }      from '@/store/useProgressStore'
import { useGraphPositionStore } from '@/store/useGraphPositionStore'
import { useSyncStore }          from '@/store/useSyncStore'
import type { QuestNode, ItemNode, Building, Goal, InventoryItem } from '@/types'
import type { NoteNode } from '@/types/note'

let unsubscribers: (() => void)[] = []
let hydrating = false

export function setHydrating(v: boolean) { hydrating = v }

// ─── Helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

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

/** Generic row-level diff sync for entity stores (arrays with id + updatedAt). */
function subscribeEntityStore<T extends { id: string; updatedAt: string }>(
  subscribe: (cb: (state: { [k: string]: T[] }) => void) => () => void,
  getArray: () => T[],
  table: string,
  toRow: (item: T, userId: string) => Record<string, unknown>,
  userId: string,
) {
  const supabase = createClient()
  let prev = [...getArray()]

  return subscribe(
    debounce((state: { [k: string]: T[] }) => {
      const current = Object.values(state).find(v => Array.isArray(v)) as T[] | undefined
      if (!current) return

      const upserts = current.filter(item => {
        const p = prev.find(x => x.id === item.id)
        return !p || p.updatedAt !== item.updatedAt
      })

      const removedIds = prev
        .filter(p => !current.find(c => c.id === p.id))
        .map(p => p.id)

      prev = [...current]

      if (upserts.length > 0) {
        syncWrite(() => supabase.from(table).upsert(upserts.map(i => toRow(i, userId))))
      }
      if (removedIds.length > 0) {
        syncWrite(() => supabase.from(table).delete().in('id', removedIds))
      }
    }, 300),
  )
}

// ─── startSync ───────────────────────────────────────────────────────────────

export function startSync(userId: string) {
  const supabase = createClient()

  // ── Settings (profiles) ───────────────────────────────────────────────────

  let prevPlayerName = useSettingsStore.getState().playerName
  unsubscribers.push(useSettingsStore.subscribe(
    debounce((state: { playerName: string }) => {
      if (state.playerName !== prevPlayerName) {
        prevPlayerName = state.playerName
        syncWrite(() =>
          supabase.from('profiles')
            .update({ player_name: state.playerName, updated_at: new Date().toISOString() })
            .eq('id', userId),
        )
      }
    }, 500),
  ))

  // ── Quests ────────────────────────────────────────────────────────────────

  unsubscribers.push(subscribeEntityStore<QuestNode>(
    cb => useQuestStore.subscribe(cb as (s: unknown) => void),
    () => useQuestStore.getState().quests,
    'quests', questToRow, userId,
  ))

  // ── Items ─────────────────────────────────────────────────────────────────

  unsubscribers.push(subscribeEntityStore<ItemNode>(
    cb => useItemStore.subscribe(cb as (s: unknown) => void),
    () => useItemStore.getState().items,
    'items', itemToRow, userId,
  ))

  // ── Buildings ─────────────────────────────────────────────────────────────

  unsubscribers.push(subscribeEntityStore<Building>(
    cb => useBuildingStore.subscribe(cb as (s: unknown) => void),
    () => useBuildingStore.getState().buildings,
    'buildings', buildingToRow, userId,
  ))

  // ── Goals ─────────────────────────────────────────────────────────────────

  {
    let prevGoals = [...useGoalStore.getState().goals]
    unsubscribers.push(useGoalStore.subscribe(
      debounce((state: { goals: Goal[] }) => {
        const current = state.goals
        const upserts = current.filter(g => !prevGoals.find(p => p.id === g.id))
        const removedIds = prevGoals.filter(p => !current.find(c => c.id === p.id)).map(p => p.id)
        // Goals have no updatedAt — detect note changes
        const updated = current.filter(g => {
          const p = prevGoals.find(x => x.id === g.id)
          return p && p.note !== g.note
        })
        prevGoals = [...current]
        if (upserts.length > 0 || updated.length > 0) {
          syncWrite(() => supabase.from('goals').upsert([...upserts, ...updated].map(g => goalToRow(g, userId))))
        }
        if (removedIds.length > 0) {
          syncWrite(() => supabase.from('goals').delete().in('id', removedIds))
        }
      }, 300),
    ))
  }

  // ── Inventory ─────────────────────────────────────────────────────────────

  {
    let prevInventory = [...useInventoryStore.getState().inventory]
    unsubscribers.push(useInventoryStore.subscribe(
      debounce((state: { inventory: InventoryItem[] }) => {
        const current = state.inventory
        const upserts = current.filter(item => {
          const p = prevInventory.find(x => x.nodeId === item.nodeId)
          return !p || p.amount !== item.amount
        })
        const removedNodeIds = prevInventory
          .filter(p => !current.find(q => q.nodeId === p.nodeId))
          .map(p => p.nodeId)
        prevInventory = [...current]
        if (upserts.length > 0) {
          syncWrite(() =>
            supabase.from('inventory')
              .upsert(upserts.map(item => inventoryToRow(item, userId)), { onConflict: 'user_id,node_id' }),
          )
        }
        if (removedNodeIds.length > 0) {
          syncWrite(() =>
            supabase.from('inventory').delete().eq('user_id', userId).in('node_id', removedNodeIds),
          )
        }
      }, 300),
    ))
  }

  // ── Notes ─────────────────────────────────────────────────────────────────

  unsubscribers.push(subscribeEntityStore<NoteNode>(
    cb => useNoteStore.subscribe(cb as (s: unknown) => void),
    () => useNoteStore.getState().notes,
    'notes', noteToRow, userId,
  ))

  // ── Achievements (singleton — full replace) ───────────────────────────────

  {
    let prevUnlocked = [...useAchievementStore.getState().unlockedIds]
    let prevSeen     = [...useAchievementStore.getState().seenIds]
    unsubscribers.push(useAchievementStore.subscribe(
      debounce((state: { unlockedIds: string[]; seenIds: string[] }) => {
        if (
          state.unlockedIds.length !== prevUnlocked.length ||
          state.seenIds.length !== prevSeen.length ||
          state.unlockedIds.some((id, i) => id !== prevUnlocked[i]) ||
          state.seenIds.some((id, i) => id !== prevSeen[i])
        ) {
          prevUnlocked = [...state.unlockedIds]
          prevSeen     = [...state.seenIds]
          syncWrite(() =>
            supabase.from('achievements')
              .upsert(achievementsToRow(state.unlockedIds, state.seenIds, userId), { onConflict: 'user_id' }),
          )
        }
      }, 500),
    ))
  }

  // ── Progress (singleton — full replace) ───────────────────────────────────

  {
    let prevXp = useProgressStore.getState().totalXp
    unsubscribers.push(useProgressStore.subscribe(
      debounce((state: { totalXp: number; xpLog: unknown[] }) => {
        if (state.totalXp !== prevXp) {
          prevXp = state.totalXp
          syncWrite(() =>
            supabase.from('progress')
              .upsert(progressToRow(state.totalXp, state.xpLog as Parameters<typeof progressToRow>[1], userId), { onConflict: 'user_id' }),
          )
        }
      }, 1000),
    ))
  }

  // ── Graph Positions (singleton — full replace, heavy debounce) ────────────

  {
    let prevPositions = { ...useGraphPositionStore.getState().positions }
    unsubscribers.push(useGraphPositionStore.subscribe(
      debounce((state: { positions: Record<string, { x: number; y: number }> }) => {
        const keys = Object.keys(state.positions)
        const prevKeys = Object.keys(prevPositions)
        const changed = keys.length !== prevKeys.length ||
          keys.some(k => !prevPositions[k] || prevPositions[k].x !== state.positions[k].x || prevPositions[k].y !== state.positions[k].y)
        if (changed) {
          prevPositions = { ...state.positions }
          syncWrite(() =>
            supabase.from('graph_positions')
              .upsert(graphPositionsToRow(state.positions, userId), { onConflict: 'user_id' }),
          )
        }
      }, 2000), // Heavy debounce — positions change on every drag
    ))
  }

  // ── Online/offline detection ──────────────────────────────────────────────

  const handleOnline = () => {
    if (useSyncStore.getState().status === 'offline') {
      useSyncStore.getState().setStatus('synced')
    }
  }
  const handleOffline = () => useSyncStore.getState().setStatus('offline')

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
