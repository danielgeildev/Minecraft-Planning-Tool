'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { GraphNodeData } from '@/lib/graph/convert'

const statusStyles: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  done:          { bg: 'bg-emerald-50',  border: 'border-emerald-300', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  'in-progress': { bg: 'bg-teal-50',    border: 'border-teal-300',    text: 'text-teal-700',    dot: 'bg-teal-400'    },
  planned:       { bg: 'bg-cyan-50',    border: 'border-cyan-200',    text: 'text-cyan-600',    dot: 'bg-cyan-300'    },
}

export const GraphBuildingNode = memo(({ data }: NodeProps<Node<GraphNodeData>>) => {
  if (data.node.type !== 'building') return null

  const building = data.node
  const s = statusStyles[building.status] ?? statusStyles.planned

  return (
    <div className={`relative w-52 rounded-2xl border-2 px-3 py-2.5 shadow-sm select-none ${s.bg} ${s.border}`}>
      {/* Invisible full-body target handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="body"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          transform: 'none', borderRadius: '14px',
          background: 'transparent', border: 'none',
          opacity: 0, zIndex: 0, pointerEvents: 'none',
        }}
      />
      <Handle type="target" position={Position.Left}  style={{ background: '#5eead4', border: '2px solid #2dd4bf', width: 12, height: 12, cursor: 'crosshair' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#5eead4', border: '2px solid #2dd4bf', width: 12, height: 12, cursor: 'crosshair' }} />

      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">🏗️</span>
        <span className={`text-xs font-bold truncate ${s.text}`}>{building.name}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
        <span className={`text-xs ${s.text}`}>
          {building.status === 'done' ? 'Fertig' : building.status === 'in-progress' ? 'Im Bau' : 'Geplant'}
        </span>
      </div>

      {building.location && (
        <div className="mt-1 text-xs text-gray-400 truncate">{building.location}</div>
      )}
    </div>
  )
})

GraphBuildingNode.displayName = 'GraphBuildingNode'
