/**
 * Resets all data stores to their pristine state and wipes their persisted
 * localStorage entries. Called on logout so the next user on this device
 * (anonymous or a different account) does not see the previous account's data.
 */

import { useQuestStore }         from './useQuestStore'
import { useItemStore }          from './useItemStore'
import { useBuildingStore }      from './useBuildingStore'
import { useGoalStore }          from './useGoalStore'
import { useNoteStore }          from './useNoteStore'
import { useInventoryStore }     from './useInventoryStore'
import { useSettingsStore }      from './useSettingsStore'
import { useAchievementStore }   from './useAchievementStore'
import { useProgressStore }      from './useProgressStore'
import { useGraphPositionStore } from './useGraphPositionStore'

export function resetAllStores() {
  useQuestStore.setState({ quests: [], _dataVersion: 0, lastDeleted: null })
  useItemStore.setState({ items: [], _dataVersion: 0, lastDeleted: null })
  useBuildingStore.setState({ buildings: [], _dataVersion: 0, lastDeleted: null })
  useGoalStore.setState({ goals: [], _dataVersion: 0 })
  useNoteStore.setState({ notes: [], _dataVersion: 0, lastDeleted: null })
  useInventoryStore.setState({ inventory: [] })
  useSettingsStore.setState({ playerName: 'Alina' })
  useAchievementStore.setState({ unlockedIds: [], seenIds: [], pendingQueue: [] })
  useProgressStore.setState({ totalXp: 0, xpLog: [], pendingXpToasts: [], pendingLevelUp: null })
  useGraphPositionStore.setState({ positions: {} })

  // Remove the persisted copies entirely so nothing survives the session
  const persistedStores = [
    useQuestStore, useItemStore, useBuildingStore, useGoalStore, useNoteStore,
    useInventoryStore, useSettingsStore, useAchievementStore, useProgressStore,
    useGraphPositionStore,
  ]
  persistedStores.forEach(store => store.persist.clearStorage())
}
