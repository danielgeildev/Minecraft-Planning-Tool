import type { Node, Edge } from '@xyflow/react'
import type { AnyNode } from '@/types'
import { getNodeState, type NodeState } from '@/lib/progression'

export type GraphHighlight = 'goal' | 'nextStep' | 'blocker' | 'path' | 'nextBestAction' | null

export interface GraphNodeData {
  node: AnyNode
  state: NodeState
  highlight: GraphHighlight
  [key: string]: unknown  // React Flow requires this
}

const EDGE_COLORS: Record<string, string> = {
  requires: '#f97316',   // orange
  unlocks:  '#22c55e',   // green
  related:  '#a78bfa',   // purple
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
      },
      position: { x: 0, y: 0 }, // overwritten by layout
    }
  })

  const edges: Edge[] = []

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
      } else if (node.type === 'building' && dep.type === 'requires') {
        const req = node.itemRequirements?.find(r => r.itemId === dep.targetId)
        if (req) {
          const reqDone = req.preparedAmount >= req.requiredAmount
          edgeLabel      = reqDone ? `✓ ${req.requiredAmount}` : `${req.preparedAmount}/${req.requiredAmount}`
          edgeLabelColor = reqDone ? '#34d399' : '#f87171'  // emerald-400 : red-400
        }
      }

      const edgeColor = isOnPath ? '#ec4899' : depColor
      const isRelated = dep.type === 'related'
      const isRequires = dep.type === 'requires'

      edges.push({
        id:       `${dep.targetId}→${node.id}:${dep.type}`,
        source:   dep.targetId,
        target:   node.id,
        type:     isRelated ? 'straight' : 'smoothstep',
        animated: isRequires && !isDone && !isOnPath,
        label:    edgeLabel,
        labelStyle: { fontSize: 10, fill: edgeLabelColor, fontWeight: 600 },
        labelBgStyle: { fill: 'white', fillOpacity: 0.85 },
        labelBgPadding: [3, 4] as [number, number],
        labelBgBorderRadius: 3,
        zIndex:   isOnPath ? 10 : isRequires ? 5 : 1,
        style: {
          stroke:          edgeColor,
          strokeWidth:     isOnPath ? 3 : isRequires ? 2 : 1.5,
          strokeDasharray: isRelated ? '5 4' : undefined,
          opacity:         isRelated ? 0.55 : 1,
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

