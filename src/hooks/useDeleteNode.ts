'use client'

import { useCallback } from 'react'
import { useQuestStore }    from '@/store/useQuestStore'
import { useItemStore }     from '@/store/useItemStore'
import { useGoalStore }     from '@/store/useGoalStore'
import { useBuildingStore } from '@/store/useBuildingStore'

/**
 * Orchestrates deletion of a quest, item, or building across all stores.
 *
 * Order of operations:
 * 1. Remove cross-store dependencies pointing to the node (single set() per store)
 * 2. Remove any goal / subgoals associated with the node
 * 3. Delete the node itself (also handles same-store cleanup + sets lastDeleted for undo)
 *
 * Note: undo (undoDelete) restores the node but does NOT restore the cross-store
 * cleanup or goals — those cleanups are permanent. This is an acceptable trade-off
 * for a single-user local app.
 */
export function useDeleteNode() {
  const undoDeleteQuest = useQuestStore(s => s.undoDelete)
  const undoDeleteItem  = useItemStore(s => s.undoDelete)

  const deleteNodeAndCleanup = useCallback((nodeId: string, nodeType: 'quest' | 'item' | 'building') => {
    // Use getState() to avoid stale closures
    useQuestStore.getState().purgeDependenciesTo(nodeId)
    useItemStore.getState().purgeDependenciesTo(nodeId)
    useBuildingStore.getState().purgeDependenciesTo(nodeId)
    useGoalStore.getState().removeGoalByNodeId(nodeId)

    if (nodeType === 'quest') {
      useQuestStore.getState().deleteQuest(nodeId)
    } else if (nodeType === 'item') {
      useItemStore.getState().deleteItem(nodeId)
    } else {
      useBuildingStore.getState().deleteBuilding(nodeId)
    }
  }, [])

  return {
    deleteNodeAndCleanup,
    undoDeleteQuest,
    undoDeleteItem,
  }
}
