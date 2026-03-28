'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { GraphNodeData } from '@/lib/graph/convert'

const stateStyles: Record<string, { bg: string; border: string; label: string; dot: string; mod: string }> = {
  done:      { bg: 'bg-emerald-50',  border: 'border-emerald-300', label: 'text-emerald-700', dot: 'bg-emerald-400', mod: 'text-emerald-400' },
  available: { bg: 'bg-purple-50',   border: 'border-purple-300',  label: 'text-purple-700',  dot: 'bg-purple-400',  mod: 'text-purple-400'  },
  locked:    { bg: 'bg-gray-50',     border: 'border-gray-200',    label: 'text-gray-400',    dot: 'bg-gray-300',    mod: 'text-gray-300'    },
}

const highlightStyles: Record<string, { bg: string; border: string; ring: string }> = {
  goal:     { bg: 'bg-pink-50',   border: 'border-pink-400',  ring: 'ring-2 ring-pink-300 ring-offset-1'  },
  nextStep: { bg: 'bg-blue-50',   border: 'border-blue-400',  ring: 'ring-2 ring-blue-300 ring-offset-1'  },
  blocker:  { bg: 'bg-red-50',    border: 'border-red-400',   ring: 'ring-2 ring-red-300 ring-offset-1'   },
  path:     { bg: 'bg-violet-50', border: 'border-violet-300', ring: '' },
}

const statusEmoji: Record<string, string> = {
  needed: '🔍', collecting: '📥', have: '✅',
}

export const GraphItemNode = memo(({ data }: NodeProps<Node<GraphNodeData>>) => {
  if (data.node.type !== 'item') return null

  const item = data.node
  const s    = stateStyles[data.state]
  const h    = data.highlight ? highlightStyles[data.highlight] : null

  const isolated = data.isIsolated

  return (
    <div
      className={`
        relative w-52 rounded-2xl border-2 px-3 py-2.5 shadow-sm select-none
        ${h ? `${h.bg} ${h.border} ${h.ring}` : `${s.bg} ${s.border}`}
        ${isolated ? 'border-dashed opacity-75' : ''}
      `}
    >
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
      <Handle type="target" position={Position.Left}  style={{ background: '#c4b5fd', border: '2px solid #a78bfa', width: 12, height: 12, cursor: 'crosshair' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#c4b5fd', border: '2px solid #a78bfa', width: 12, height: 12, cursor: 'crosshair' }} />

      {data.highlight === 'goal' && (
        <div className="absolute -top-2 -right-2 text-xs bg-pink-400 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">🎯</div>
      )}
      {data.highlight === 'nextStep' && (
        <div className="absolute -top-2 -right-2 text-xs bg-blue-400 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">▶</div>
      )}
      {data.highlight === 'blocker' && (
        <div className="absolute -top-2 -right-2 text-xs bg-red-400 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">🔒</div>
      )}

      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{statusEmoji[item.status]}</span>
        <span className={`text-xs font-bold truncate ${h ? 'text-gray-800' : s.label}`}>{item.name}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
        <span className={`text-xs truncate ${h ? 'text-gray-400' : s.mod}`}>{item.mod}</span>
        {isolated && (
          <span className="ml-auto text-[10px] text-gray-300 italic">standalone</span>
        )}
      </div>
    </div>
  )
})

GraphItemNode.displayName = 'GraphItemNode'
