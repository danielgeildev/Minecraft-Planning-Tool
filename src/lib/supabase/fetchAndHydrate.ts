/**
 * Fetches user data from Supabase and hydrates Zustand stores.
 * Returns true if Supabase had data, false if empty (for migration detection).
 */

import { createClient } from './client'
import {
  rowToQuest, rowToItem, rowToBuilding, rowToGoal,
  rowToInventoryItem, rowToNote, rowToAchievements,
  rowToProgress, rowToGraphPositions,
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

export async function fetchAndHydrate(userId: string): Promise<boolean> {
  const supabase = createClient()

  const [
    profileRes, questsRes, itemsRes, buildingsRes,
    goalsRes, inventoryRes, notesRes,
    achievementsRes, progressRes, positionsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('quests').select('*').eq('user_id', userId),
    supabase.from('items').select('*').eq('user_id', userId),
    supabase.from('buildings').select('*').eq('user_id', userId),
    supabase.from('goals').select('*').eq('user_id', userId),
    supabase.from('inventory').select('*').eq('user_id', userId),
    supabase.from('notes').select('*').eq('user_id', userId),
    supabase.from('achievements').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('progress').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('graph_positions').select('*').eq('user_id', userId).maybeSingle(),
  ])

  let hasData = false

  // Settings / Profile
  if (profileRes.data) {
    useSettingsStore.setState({ playerName: profileRes.data.player_name ?? 'Alina' })
  }

  // Quests
  if (questsRes.data && questsRes.data.length > 0) {
    hasData = true
    useQuestStore.setState({ quests: questsRes.data.map(rowToQuest), _dataVersion: 1 })
  }

  // Items
  if (itemsRes.data && itemsRes.data.length > 0) {
    hasData = true
    useItemStore.setState({ items: itemsRes.data.map(rowToItem), _dataVersion: 1 })
  }

  // Buildings
  if (buildingsRes.data && buildingsRes.data.length > 0) {
    hasData = true
    useBuildingStore.setState({ buildings: buildingsRes.data.map(rowToBuilding), _dataVersion: 1 })
  }

  // Goals
  if (goalsRes.data && goalsRes.data.length > 0) {
    hasData = true
    useGoalStore.setState({ goals: goalsRes.data.map(rowToGoal), _dataVersion: 1 })
  }

  // Inventory
  if (inventoryRes.data && inventoryRes.data.length > 0) {
    hasData = true
    useInventoryStore.setState({ inventory: inventoryRes.data.map(rowToInventoryItem) })
  }

  // Notes
  if (notesRes.data && notesRes.data.length > 0) {
    hasData = true
    useNoteStore.setState({ notes: notesRes.data.map(rowToNote), _dataVersion: 1 })
  }

  // Achievements (singleton)
  if (achievementsRes.data) {
    const { unlockedIds, seenIds } = rowToAchievements(achievementsRes.data)
    if (unlockedIds.length > 0) hasData = true
    useAchievementStore.setState({ unlockedIds, seenIds })
  }

  // Progress (singleton)
  if (progressRes.data) {
    const { totalXp, xpLog } = rowToProgress(progressRes.data)
    if (totalXp > 0) hasData = true
    useProgressStore.setState({ totalXp, xpLog })
  }

  // Graph Positions (singleton)
  if (positionsRes.data) {
    const positions = rowToGraphPositions(positionsRes.data)
    if (Object.keys(positions).length > 0) hasData = true
    useGraphPositionStore.setState({ positions })
  }

  return hasData
}
