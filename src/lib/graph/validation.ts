import type { AnyNode } from '@/types'

export interface EdgeValidationResult {
  ok: boolean
  error?: string
}

/**
 * Validate whether adding a "requires" edge is legal.
 *
 * dependentId  = the node that would gain the dependency (React Flow target)
 * requiredId   = the node being depended on (React Flow source)
 *
 * Checks: self-reference, duplicate edge, cycle.
 */
export function validateNewRequiresEdge(
  dependentId: string,
  requiredId:  string,
  allNodes:    AnyNode[],
): EdgeValidationResult {
  if (dependentId === requiredId) {
    return { ok: false, error: 'Ein Node kann nicht sich selbst als Abhängigkeit haben.' }
  }

  const dependent = allNodes.find(n => n.id === dependentId)
  if (!dependent) return { ok: false, error: 'Node nicht gefunden.' }

  const alreadyExists = dependent.dependencies.some(
    d => d.targetId === requiredId && d.type === 'requires',
  )
  if (alreadyExists) {
    return { ok: false, error: 'Diese Verbindung existiert bereits.' }
  }

  if (wouldCreateCycle(dependentId, requiredId, allNodes)) {
    return { ok: false, error: 'Diese Verbindung würde einen Kreislauf erzeugen.' }
  }

  return { ok: true }
}

/**
 * Returns true if adding dependentId → requiredId would create a cycle.
 * This occurs when requiredId already transitively depends on dependentId.
 */
function wouldCreateCycle(
  dependentId: string,
  requiredId:  string,
  allNodes:    AnyNode[],
): boolean {
  const visited = new Set<string>()

  function dfs(nodeId: string): boolean {
    if (nodeId === dependentId) return true
    if (visited.has(nodeId)) return false
    visited.add(nodeId)
    const node = allNodes.find(n => n.id === nodeId)
    if (!node) return false
    for (const dep of node.dependencies) {
      if (dfs(dep.targetId)) return true
    }
    return false
  }

  return dfs(requiredId)
}
