import type { Node, Edge } from '@xyflow/react'
import type { AnyNode } from '@/types'
import { getNodeState, type NodeState } from '@/lib/progression'

export type GraphHighlight = 'goal' | 'nextStep' | 'blocker' | 'path' | 'nextBestAction' | null

export interface GraphNodeData {
  node: AnyNode
  state: NodeState
  highlight: GraphHighlight
  /** true when the node has zero visible edges */
  isIsolated: boolean
  [key: string]: unknown  // React Flow requires this
}

const EDGE_COLORS: Record<string, string> = {
  requires: '#f97316',   // orange
  unlocks:  '#22c55e',   // green
  related:  '#a78bfa',   // purple
}

/**
 * Slightly shift the hue/lightness of an edge colour so sibling edges from the
 * same source are distinguishable without being garish.
 * `index` is the 0-based sibling position, `total` is the sibling count.
 */
function shiftEdgeColor(base: string, index: number, total: number): string {
  if (total <= 1) return base
  // Lighten/darken by up to ±12% from centre
  const range = 0.24
  const t = total === 1 ? 0 : (index / (total - 1)) - 0.5  // -0.5 … +0.5
  const factor = 1 + t * range
  // Parse hex
  const r = parseInt(base.slice(1, 3), 16)
  const g = parseInt(base.slice(3, 5), 16)
  const b = parseInt(base.slice(5, 7), 16)
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * factor)))
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`
}

/**
 * Convert AnyNode[] into React Flow nodes + edges.
 * Accepts optional highlight sets for goal-based visual emphasis.
 */
export function convertNodesToGraph(
  allNodes: AnyNode[],
  visibleNodes: AnyNode[],
  highlights?: {
    goalIds:            Set<string>
    nextStepIds:        Set<string>
    blockerIds:         Set<string>
    pathIds:            Set<string>
    nextBestActionIds?: Set<string>
  },
): {
  nodes: Node<GraphNodeData>[]
  edges: Edge[]
} {
  const visibleSet = new Set(visibleNodes.map(n => n.id))

  // Pre-compute which nodes have at least one visible edge
  const connectedNodeIds = new Set<string>()
  visibleNodes.forEach(node => {
    node.dependencies.forEach(dep => {
      if (visibleSet.has(dep.targetId)) {
        connectedNodeIds.add(node.id)
        connectedNodeIds.add(dep.targetId)
      }
    })
  })

  const nodes: Node<GraphNodeData>[] = visibleNodes.map(node => {
    let highlight: GraphHighlight = null
    if (highlights) {
      if (highlights.nextBestActionIds?.has(node.id)) highlight = 'nextBestAction'
      else if (highlights.goalIds.has(node.id))       highlight = 'goal'
      else if (highlights.nextStepIds.has(node.id))   highlight = 'nextStep'
      else if (highlights.blockerIds.has(node.id))    highlight = 'blocker'
      else if (highlights.pathIds.has(node.id))       highlight = 'path'
    }

    return {
      id:   node.id,
      type: node.type === 'quest' ? 'questNode'
          : node.type === 'item'  ? 'itemNode'
          : 'buildingNode',
      data: {
        node,
        state: getNodeState(node.id, allNodes),
        highlight,
        isIsolated: !connectedNodeIds.has(node.id),
      },
      position: { x: 0, y: 0 }, // overwritten by layout
    }
  })

  const edges: Edge[] = []

  // Count outgoing edges per source to compute sibling offsets
  const sourceChildCount = new Map<string, number>()
  const sourceChildIndex = new Map<string, number>()
  visibleNodes.forEach(node => {
    node.dependencies.forEach(dep => {
      if (!visibleSet.has(dep.targetId)) return
      const key = dep.targetId  // source in graph terms
      sourceChildCount.set(key, (sourceChildCount.get(key) ?? 0) + 1)
    })
  })

  visibleNodes.forEach(node => {
    node.dependencies.forEach(dep => {
      if (!visibleSet.has(dep.targetId)) return

      const depColor = EDGE_COLORS[dep.type] ?? '#94a3b8'
      const isDone   = node.status === 'done' || node.status === 'have'

      // Highlight edges on the goal path
      const isOnPath = highlights && (
        (highlights.goalIds.has(node.id) || highlights.pathIds.has(node.id)) &&
        (highlights.pathIds.has(dep.targetId) || highlights.nextStepIds.has(dep.targetId) ||
          highlights.goalIds.has(dep.targetId))
      )

      // For building→item edges, show preparedAmount/requiredAmount from itemRequirements
      let edgeLabel: string | undefined
      let edgeLabelColor = '#9ca3af'
      if (dep.amount && dep.type === 'requires') {
        edgeLabel = `×${dep.amount}`
        const targetNode = allNodes.find(n => n.id === dep.targetId)
        const targetDone = targetNode?.status === 'done' || targetNode?.status === 'have'
        edgeLabelColor = targetDone ? '#34d399' : '#f87171'  // emerald-400 : red-400
      } else if (node.type === 'building' && dep.type === 'requires') {
        const req = node.itemRequirements?.find(r => r.itemId === dep.targetId)
        if (req) {
          const reqDone = req.preparedAmount >= req.requiredAmount
          edgeLabel      = reqDone ? `✓ ${req.requiredAmount}` : `${req.preparedAmount}/${req.requiredAmount}`
          edgeLabelColor = reqDone ? '#34d399' : '#f87171'  // emerald-400 : red-400
        }
      }

      // Sibling offset: spread edges from the same source apart
      const sourceId = dep.targetId
      const sibTotal = sourceChildCount.get(sourceId) ?? 1
      const sibIdx   = sourceChildIndex.get(sourceId) ?? 0
      sourceChildIndex.set(sourceId, sibIdx + 1)

      const edgeColor  = isOnPath ? '#ec4899' : shiftEdgeColor(depColor, sibIdx, sibTotal)
      const isRelated  = dep.type === 'related'
      const isRequires = dep.type === 'requires'

      // Mini-card colours matching the node style (bg = *-50, border = *-300)
      const labelBg     = edgeLabelColor === '#34d399' ? '#ecfdf5'   // emerald-50
                        : edgeLabelColor === '#f87171' ? '#fff1f2'   // rose-50
                        : '#f9fafb'                                  // gray-50
      const labelBorder = edgeLabelColor === '#34d399' ? '#6ee7b7'   // emerald-300
                        : edgeLabelColor === '#f87171' ? '#fda4af'   // rose-300
                        : '#d1d5db'                                  // gray-300

      // Compute vertical offset for sibling edges so they don't overlap
      const sibOffset = sibTotal <= 1 ? 0 : ((sibIdx / (sibTotal - 1)) - 0.5) * (sibTotal * 12)

      edges.push({
        id:       `${dep.targetId}→${node.id}:${dep.type}`,
        source:   dep.targetId,
        target:   node.id,
        type:     'custom',
        animated: isRequires && !isDone && !isOnPath,
        data: {
          labelText:  edgeLabel,
          labelBg,
          labelBorder,
          labelColor: edgeLabelColor,
          sibOffset,
        },
        zIndex:   isOnPath ? 10 : isRequires ? 5 : 1,
        style: {
          stroke:          edgeColor,
          strokeWidth:     isOnPath ? 3 : isRequires ? 2 : 1.5,
          strokeDasharray: isRelated ? '5 4' : undefined,
          opacity:         isRelated ? 0.45 : 1,
        },
        markerEnd: {
          type:   'arrowclosed',
          color:  edgeColor,
          width:  isOnPath ? 18 : 14,
          height: isOnPath ? 18 : 14,
        },
      })
    })
  })

  return { nodes, edges }
}
