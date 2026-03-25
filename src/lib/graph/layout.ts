import type { Node, Edge } from '@xyflow/react'

const NODE_W = 220
const NODE_H = 100
const H_GAP  = 180
const V_GAP  = 70

/**
 * Simple DAG layout using longest-path depth assignment.
 * No external dependency – works with any graph, handles cycles gracefully.
 */
export function applyAutoLayout<T extends Record<string, unknown>>(
  nodes: Node<T>[],
  edges: Edge[],
): Node<T>[] {
  if (nodes.length === 0) return nodes

  const nodeSet = new Set(nodes.map(n => n.id))

  // Build predecessor map (inAdj[id] = ids of nodes that point TO id)
  const inAdj = new Map<string, string[]>()
  nodes.forEach(n => inAdj.set(n.id, []))
  edges.forEach(e => {
    if (nodeSet.has(e.source) && nodeSet.has(e.target)) {
      inAdj.get(e.target)?.push(e.source)
    }
  })

  // Compute depth via memoised DFS (longest path from any root)
  const depths  = new Map<string, number>()
  const onStack = new Set<string>()

  function depth(id: string): number {
    if (depths.has(id))  return depths.get(id)!
    if (onStack.has(id)) return 0          // cycle → break

    onStack.add(id)
    const preds = inAdj.get(id) ?? []
    const d = preds.length === 0
      ? 0
      : Math.max(...preds.map(p => depth(p))) + 1
    onStack.delete(id)
    depths.set(id, d)
    return d
  }

  nodes.forEach(n => depth(n.id))

  // Group by depth
  const levels = new Map<number, string[]>()
  depths.forEach((d, id) => {
    if (!levels.has(d)) levels.set(d, [])
    levels.get(d)!.push(id)
  })

  // Assign positions (center-aligned vertically per column)
  const posMap = new Map<string, { x: number; y: number }>()

  levels.forEach((ids, level) => {
    const totalH   = ids.length * NODE_H + (ids.length - 1) * V_GAP
    const startY   = -totalH / 2

    ids.forEach((id, idx) => {
      posMap.set(id, {
        x: level * (NODE_W + H_GAP),
        y: startY + idx * (NODE_H + V_GAP),
      })
    })
  })

  return nodes.map(n => ({
    ...n,
    position: posMap.get(n.id) ?? { x: 0, y: 0 },
  }))
}
