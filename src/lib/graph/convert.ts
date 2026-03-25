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
      type: node.type === 'quest' ? 'questNode' : 'itemNode',
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

      edges.push({
        id:       `${dep.targetId}→${node.id}:${dep.type}`,
        source:   dep.targetId,
        target:   node.id,
        type:     'smoothstep',
        animated: dep.type === 'requires' && !isDone,
        label:    dep.amount && dep.type === 'requires' ? `×${dep.amount}` : undefined,
        labelStyle: { fontSize: 10, fill: '#9ca3af' },
        style: {
          stroke:          isOnPath ? '#ec4899' : depColor,
          strokeWidth:     isOnPath ? 3 : dep.type === 'requires' ? 2 : 1,
          strokeDasharray: dep.type === 'related' ? '4 3' : undefined,
        },
        markerEnd: {
          type:   'arrowclosed',
          color:  isOnPath ? '#ec4899' : depColor,
          width:  16,
          height: 16,
        },
      })
    })
  })

  return { nodes, edges }
}

