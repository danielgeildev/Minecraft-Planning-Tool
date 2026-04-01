/**
 * Fetches user data from Supabase and hydrates Zustand stores.
 * Phase 2: settings (profiles), quests, inventory.
 *
 * Returns true if Supabase had data, false if empty (for migration detection).
 */

import { createClient } from './client'
import { rowToQuest, rowToInventoryItem } from './mappers'
import { useQuestStore }     from '@/store/useQuestStore'
import { useSettingsStore }  from '@/store/useSettingsStore'
import { useInventoryStore } from '@/store/useInventoryStore'

export async function fetchAndHydrate(userId: string): Promise<boolean> {
  const supabase = createClient()

  const [profileRes, questsRes, inventoryRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('quests').select('*').eq('user_id', userId),
    supabase.from('inventory').select('*').eq('user_id', userId),
  ])

  let hasData = false

  // Settings / Profile
  if (profileRes.data) {
    useSettingsStore.setState({ playerName: profileRes.data.player_name ?? 'Alina' })
  }

  // Quests
  if (questsRes.data && questsRes.data.length > 0) {
    hasData = true
    const quests = questsRes.data.map(rowToQuest)
    useQuestStore.setState({ quests, _dataVersion: 1 })
  }

  // Inventory
  if (inventoryRes.data && inventoryRes.data.length > 0) {
    hasData = true
    const inventory = inventoryRes.data.map(rowToInventoryItem)
    useInventoryStore.setState({ inventory })
  }

  return hasData
}
