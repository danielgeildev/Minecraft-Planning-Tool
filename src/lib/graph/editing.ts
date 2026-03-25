import { useQuestStore } from '@/store/useQuestStore'
import { useItemStore }  from '@/store/useItemStore'
import type { AnyNode } from '@/types'

/**
 * Parse a React Flow edge ID back to its constituent parts.
 *
 * Edge ID format (from convert.ts): "${source}→${target}:${type}"
 * where source = required node, target = dependent node.
 */
export function parseEdgeId(
  id: string,
): { source: string; target: string; type: string } | null {
  const arrowIdx  = id.indexOf('→')
  const colonIdx  = id.lastIndexOf(':')
  if (arrowIdx === -1 || colonIdx === -1 || arrowIdx >= colonIdx) return null
  return {
    source: id.slice(0, arrowIdx),
    target: id.slice(arrowIdx + 1, colonIdx),
    type:   id.slice(colonIdx + 1),
  }
}

/**
 * Add a "requires" dependency to a node via the appropriate store.
 * dependentId gains: { targetId: requiredId, type: 'requires' }
 */
export function addRequiresDep(
  dependentId: string,
  requiredId:  string,
  allNodes:    AnyNode[],
): void {
  const dependent = allNodes.find(n => n.id === dependentId)
  if (!dependent) return

  const newDeps = [...dependent.dependencies, { targetId: requiredId, type: 'requires' as const }]

  if (dependent.type === 'quest') {
    useQuestStore.getState().updateQuest(dependentId, { dependencies: newDeps })
  } else {
    useItemStore.getState().updateItem(dependentId, { dependencies: newDeps })
  }
}

/**
 * Remove the "requires" dependency from dependentId → requiredId via the appropriate store.
 */
export function removeRequiresDep(
  dependentId: string,
  requiredId:  string,
  allNodes:    AnyNode[],
): void {
  const dependent = allNodes.find(n => n.id === dependentId)
  if (!dependent) return

  const newDeps = dependent.dependencies.filter(
    d => !(d.targetId === requiredId && d.type === 'requires'),
  )

  if (dependent.type === 'quest') {
    useQuestStore.getState().updateQuest(dependentId, { dependencies: newDeps })
  } else {
    useItemStore.getState().updateItem(dependentId, { dependencies: newDeps })
  }
}
