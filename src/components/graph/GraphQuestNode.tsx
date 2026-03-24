'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { GraphNodeData } from '@/lib/graph/convert'

const categoryEmoji: Record<string, string> = {
  progression: '⭐', building: '🏗️', farming: '🌾',
  exploration: '🗺️', crafting: '🔨', automation: '⚙️', other: '📌',
}

const stateStyles: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  done:      { bg: 'bg-emerald-50',  border: 'border-emerald-300', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  available: { bg: 'bg-amber-50',    border: 'border-amber-300',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  locked:    { bg: 'bg-gray-50',     border: 'border-gray-200',    text: 'text-gray-400',    dot: 'bg-gray-300'    },
}

const highlightStyles: Record<string, { bg: string; border: string; ring: string }> = {
  goal:           { bg: 'bg-pink-50',    border: 'border-pink-400',   ring: 'ring-2 ring-pink-300 ring-offset-1' },
  nextStep:       { bg: 'bg-blue-50',    border: 'border-blue-400',   ring: 'ring-2 ring-blue-300 ring-offset-1' },
  blocker:        { bg: 'bg-red-50',     border: 'border-red-400',    ring: 'ring-2 ring-red-300 ring-offset-1'  },
  path:           { bg: 'bg-violet-50',  border: 'border-violet-300', ring: '' },
  nextBestAction: { bg: 'bg-orange-50',  border: 'border-orange-400', ring: 'ring-4 ring-orange-300 ring-offset-2 animate-pulse' },
}

export const GraphQuestNode = memo(({ data }: NodeProps<Node<GraphNodeData>>) => {
  if (data.node.type !== 'quest') return null

  const quest = data.node
  const s     = stateStyles[data.state]
  const h     = data.highlight ? highlightStyles[data.highlight] : null

  return (
    <div
      className={`
        w-52 rounded-2xl border-2 px-3 py-2.5 shadow-sm select-none
        ${h ? `${h.bg} ${h.border} ${h.ring}` : `${s.bg} ${s.border}`}
      `}
    >
      <Handle type="target" position={Position.Left}  style={{ background: '#fda4af', border: 'none', width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: '#fda4af', border: 'none', width: 8, height: 8 }} />

      {/* Goal badge */}
      {data.highlight === 'goal' && (
        <div className="absolute -top-2 -right-2 text-xs bg-pink-400 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
          🎯
        </div>
      )}
      {data.highlight === 'nextStep' && (
        <div className="absolute -top-2 -right-2 text-xs bg-blue-400 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
          ▶
        </div>
      )}
      {data.highlight === 'blocker' && (
        <div className="absolute -top-2 -right-2 text-xs bg-red-400 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
          🔒
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{categoryEmoji[quest.category]}</span>
        <span className={`text-xs font-bold truncate ${h ? 'text-gray-800' : s.text}`}>{quest.title}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
        <span className={`text-xs ${h ? 'text-gray-500' : s.text}`}>
          {data.state === 'done' ? 'Erledigt' : data.state === 'available' ? 'Verfügbar' : 'Gesperrt'}
        </span>
        {quest.priority === 'high' && (
          <span className="ml-auto text-xs text-rose-400 font-bold">!</span>
        )}
      </div>
    </div>
  )
})

GraphQuestNode.displayName = 'GraphQuestNode'
