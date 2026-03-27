'use client'

import React, { useCallback, useEffect, type ComponentType } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type NodeProps,
  type Connection,
  type EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { GraphQuestNode }    from './GraphQuestNode'
import { GraphItemNode }     from './GraphItemNode'
import { GraphBuildingNode } from './GraphBuildingNode'
import { GraphCustomEdge }   from './GraphCustomEdge'
import type { GraphNodeData } from '@/lib/graph/convert'
import type { AnyNode } from '@/types'

const nodeTypes: NodeTypes = {
  questNode:    GraphQuestNode    as unknown as ComponentType<NodeProps>,
  itemNode:     GraphItemNode     as unknown as ComponentType<NodeProps>,
  buildingNode: GraphBuildingNode as unknown as ComponentType<NodeProps>,
}

const edgeTypes: EdgeTypes = {
  custom: GraphCustomEdge as unknown as EdgeTypes[string],
}

const stateColor: Record<string, string> = {
  done:      '#34d399',
  available: '#fbbf24',
  locked:    '#d1d5db',
}

interface GraphViewProps {
  nodes:           Node<GraphNodeData>[]
  edges:           Edge[]
  onNodeClick?:    (node: AnyNode) => void
  onConnect?:      (connection: Connection) => void
  onEdgesDelete?:  (edges: Edge[]) => void
  onReconnect?:    (oldEdge: Edge, newConnection: Connection) => void
  onEdgeClick?:    (e: React.MouseEvent, edge: Edge) => void
}

export function GraphView({
  nodes:         initNodes,
  edges:         initEdges,
  onNodeClick,
  onConnect,
  onEdgesDelete,
  onReconnect,
  onEdgeClick,
}: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges)

  // Sync store-driven changes into ReactFlow state
  useEffect(() => { setNodes(initNodes) }, [initNodes, setNodes])
  useEffect(() => { setEdges(initEdges) }, [initEdges, setEdges])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as GraphNodeData
      onNodeClick?.(data.node as AnyNode)
    },
    [onNodeClick],
  )

  // Intercept edge-remove changes and forward to the parent instead of letting
  // ReactFlow remove them from local state (store is the source of truth).
  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      const removals = changes.filter(c => c.type === 'remove')
      const rest     = changes.filter(c => c.type !== 'remove')

      if (rest.length > 0) onEdgesChange(rest)

      if (removals.length > 0 && onEdgesDelete) {
        const removed = removals
          .map(c => edges.find(e => e.id === (c as { id: string }).id))
          .filter((e): e is Edge => !!e)
        if (removed.length > 0) onEdgesDelete(removed)
      }
    },
    [edges, onEdgesChange, onEdgesDelete],
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={handleNodeClick}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onEdgeClick={onEdgeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode="Delete"
        connectionRadius={50}
        // Keep nodes rendered above edges at all times so no edge
        // appears to "pierce" a node even when selected.
        elevateEdgesOnSelect={false}
        elevateNodesOnSelect={true}
      >
        <Background color="#fda4af" gap={20} size={1} style={{ opacity: 0.2 }} />
        <Controls
          style={{ borderRadius: 12, border: '1px solid #fecdd3', overflow: 'hidden' }}
        />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as GraphNodeData
            return stateColor[d?.state ?? 'locked']
          }}
          style={{
            borderRadius: 12,
            border: '1px solid #fecdd3',
          }}
          maskColor="rgba(255,241,242,0.7)"
        />
      </ReactFlow>
    </div>
  )
}
