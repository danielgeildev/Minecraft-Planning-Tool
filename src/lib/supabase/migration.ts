/**
 * Detects existing localStorage data and bulk-inserts it into Supabase
 * for first-time login migration.
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
import { useAchievementStore }   from '@/store/useAchievementStore'
import { useProgressStore }      from '@/store/useProgressStore'
import { useGraphPositionStore } from '@/store/useGraphPositionStore'

export interface MigrationCounts {
  quests:       number
  items:        number
  buildings:    number
  goals:        number
  inventory:    number
  notes:        number
  achievements: number
  xp:           number
}

/** Returns counts of local data available for migration, or null if nothing to migrate. */
export function getLocalDataCounts(): MigrationCounts | null {
  const counts: MigrationCounts = {
    quests:       useQuestStore.getState().quests.length,
    items:        useItemStore.getState().items.length,
    buildings:    useBuildingStore.getState().buildings.length,
    goals:        useGoalStore.getState().goals.length,
    inventory:    useInventoryStore.getState().inventory.length,
    notes:        useNoteStore.getState().notes.length,
    achievements: useAchievementStore.getState().unlockedIds.length,
    xp:           useProgressStore.getState().totalXp,
  }

  const hasData = counts.quests > 0 || counts.items > 0 || counts.buildings > 0 ||
    counts.goals > 0 || counts.notes > 0 || counts.achievements > 0 || counts.xp > 0

  return hasData ? counts : null
}

/** Bulk-insert all localStorage data into Supabase for the given user. */
export async function migrateLocalDataToSupabase(userId: string): Promise<void> {
  const supabase = createClient()

  const quests    = useQuestStore.getState().quests
  const items     = useItemStore.getState().items
  const buildings = useBuildingStore.getState().buildings
  const goals     = useGoalStore.getState().goals
  const inventory = useInventoryStore.getState().inventory
  const notes     = useNoteStore.getState().notes
  const { unlockedIds, seenIds } = useAchievementStore.getState()
  const { totalXp, xpLog } = useProgressStore.getState()
  const positions = useGraphPositionStore.getState().positions

  // Batch inserts — run in parallel where safe
  const promises: PromiseLike<unknown>[] = []

  if (quests.length > 0) {
    promises.push(
      supabase.from('quests').upsert(quests.map(q => questToRow(q, userId))).then(({ error }) => {
        if (error) throw new Error(`quests: ${error.message}`)
      }),
    )
  }

  if (items.length > 0) {
    promises.push(
      supabase.from('items').upsert(items.map(i => itemToRow(i, userId))).then(({ error }) => {
        if (error) throw new Error(`items: ${error.message}`)
      }),
    )
  }

  if (buildings.length > 0) {
    promises.push(
      supabase.from('buildings').upsert(buildings.map(b => buildingToRow(b, userId))).then(({ error }) => {
        if (error) throw new Error(`buildings: ${error.message}`)
      }),
    )
  }

  if (goals.length > 0) {
    promises.push(
      supabase.from('goals').upsert(goals.map(g => goalToRow(g, userId))).then(({ error }) => {
        if (error) throw new Error(`goals: ${error.message}`)
      }),
    )
  }

  if (inventory.length > 0) {
    promises.push(
      supabase.from('inventory')
        .upsert(inventory.map(i => inventoryToRow(i, userId)), { onConflict: 'user_id,node_id' })
        .then(({ error }) => { if (error) throw new Error(`inventory: ${error.message}`) }),
    )
  }

  if (notes.length > 0) {
    promises.push(
      supabase.from('notes').upsert(notes.map(n => noteToRow(n, userId))).then(({ error }) => {
        if (error) throw new Error(`notes: ${error.message}`)
      }),
    )
  }

  if (unlockedIds.length > 0) {
    promises.push(
      supabase.from('achievements')
        .upsert(achievementsToRow(unlockedIds, seenIds, userId), { onConflict: 'user_id' })
        .then(({ error }) => { if (error) throw new Error(`achievements: ${error.message}`) }),
    )
  }

  if (totalXp > 0) {
    promises.push(
      supabase.from('progress')
        .upsert(progressToRow(totalXp, xpLog, userId), { onConflict: 'user_id' })
        .then(({ error }) => { if (error) throw new Error(`progress: ${error.message}`) }),
    )
  }

  if (Object.keys(positions).length > 0) {
    promises.push(
      supabase.from('graph_positions')
        .upsert(graphPositionsToRow(positions, userId), { onConflict: 'user_id' })
        .then(({ error }) => { if (error) throw new Error(`graph_positions: ${error.message}`) }),
    )
  }

  await Promise.all(promises)
}
