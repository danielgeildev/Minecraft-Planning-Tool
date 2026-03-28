import type { Node, Edge } from '@xyflow/react'

const NODE_W = 220
const NODE_H = 100
const H_GAP  = 280   // wide column gaps so long-range edges clear intermediate nodes
const V_GAP  = 120   // tall row gaps for clean edge routing

/**
 * DAG layout using longest-path depth assignment + Barycenter crossing-minimisation.
 *
 * Nodes whose id appears in `pinnedPositions` keep that exact position and are
 * excluded from automatic placement (but still participate in barycenter
 * ordering so sibling nodes stay tidy).
 */
export function applyAutoLayout<T extends Record<string, unknown>>(
  nodes: Node<T>[],
  edges: Edge[],
  pinnedPositions?: Record<string, { x: number; y: number }>,
): Node<T>[] {
  if (nodes.length === 0) return nodes

  const pinned = pinnedPositions ?? {}
  const nodeSet = new Set(nodes.map(n => n.id))

  // --- 1. Build adjacency maps ---
  const inAdj       = new Map<string, string[]>()  // predecessors  (sources → this node)
  const outNeighbors = new Map<string, string[]>()  // successors   (this node → targets)
  const inNeighbors  = new Map<string, string[]>()  // predecessors (targets of this node)
  nodes.forEach(n => {
    inAdj.set(n.id, [])
    outNeighbors.set(n.id, [])
    inNeighbors.set(n.id, [])
  })
  edges.forEach(e => {
    if (!nodeSet.has(e.source) || !nodeSet.has(e.target)) return
    inAdj.get(e.target)?.push(e.source)
    outNeighbors.get(e.source)?.push(e.target)
    inNeighbors.get(e.target)?.push(e.source)
  })

  // --- 2. Longest-path depth (rank) assignment ---
  const depths  = new Map<string, number>()
  const onStack = new Set<string>()

  function depth(id: string): number {
    if (depths.has(id))  return depths.get(id)!
    if (onStack.has(id)) return 0        // cycle guard
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

  // --- 3. Group nodes into levels ---
  const levelMap = new Map<number, string[]>()
  depths.forEach((d, id) => {
    if (!levelMap.has(d)) levelMap.set(d, [])
    levelMap.get(d)!.push(id)
  })
  const maxLevel = Math.max(...levelMap.keys())

  // Working order for each level (will be reordered by Barycenter)
  const order = new Map<number, string[]>()
  for (let l = 0; l <= maxLevel; l++) {
    order.set(l, [...(levelMap.get(l) ?? [])])
  }

  // --- 4. Barycenter crossing-minimisation ---
  function barycenterSort(level: number, useNextLevel: boolean): void {
    const ids = order.get(level)
    if (!ids || ids.length < 2) return

    const refLevel = useNextLevel ? level + 1 : level - 1
    const refOrder = order.get(refLevel)
    if (!refOrder) return

    const refPos = new Map<string, number>()
    refOrder.forEach((id, i) => refPos.set(id, i))

    let fallback = 0
    const withBc = ids.map(id => {
      const nbrs = (useNextLevel ? outNeighbors : inNeighbors).get(id) ?? []
      const connected = nbrs.filter(n => refPos.has(n))
      if (connected.length === 0) {
        return { id, bc: -1, fallback: fallback++ }
      }
      const avg = connected.reduce((s, n) => s + refPos.get(n)!, 0) / connected.length
      fallback++
      return { id, bc: avg, fallback: 0 }
    })

    withBc.sort((a, b) => {
      if (a.bc < 0 && b.bc < 0) return a.fallback - b.fallback
      if (a.bc < 0) return 1
      if (b.bc < 0) return -1
      return a.bc - b.bc
    })
    order.set(level, withBc.map(x => x.id))
  }

  // 3 forward + backward sweeps converge to a near-optimal ordering
  for (let pass = 0; pass < 3; pass++) {
    for (let l = 1; l <= maxLevel; l++)     barycenterSort(l, false)
    for (let l = maxLevel - 1; l >= 0; l--) barycenterSort(l, true)
  }

  // --- 5. Assign final positions ---
  const posMap = new Map<string, { x: number; y: number }>()
  order.forEach((ids, level) => {
    // Filter out pinned nodes for vertical spacing calculation
    const autoIds = ids.filter(id => !pinned[id])
    const totalH = autoIds.length * NODE_H + (autoIds.length - 1) * V_GAP
    const startY = -totalH / 2
    let autoIdx = 0
    ids.forEach(id => {
      if (pinned[id]) {
        posMap.set(id, pinned[id])
      } else {
        posMap.set(id, {
          x: level * (NODE_W + H_GAP),
          y: startY + autoIdx * (NODE_H + V_GAP),
        })
        autoIdx++
      }
    })
  })

  return nodes.map(n => ({
    ...n,
    position: posMap.get(n.id) ?? { x: 0, y: 0 },
  }))
}
