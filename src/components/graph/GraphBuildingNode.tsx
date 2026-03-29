'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { useItemStore } from '@/store/useItemStore'
import type { GraphNodeData } from '@/lib/graph/convert'

const statusStyles: Record<string, { bg: string; border: string; text: string; dot: string; divider: string }> = {
  done:          { bg: 'bg-emerald-50',  border: 'border-emerald-300', text: 'text-emerald-700', dot: 'bg-emerald-400', divider: 'border-emerald-100' },
  'in-progress': { bg: 'bg-teal-50',    border: 'border-teal-300',    text: 'text-teal-700',    dot: 'bg-teal-400',    divider: 'border-teal-100'    },
  planned:       { bg: 'bg-cyan-50',    border: 'border-cyan-200',    text: 'text-cyan-600',    dot: 'bg-cyan-300',    divider: 'border-cyan-100'    },
}

const highlightStyles: Record<string, { bg: string; border: string; ring: string }> = {
  goal:           { bg: 'bg-pink-50',    border: 'border-pink-400',   ring: 'ring-2 ring-pink-300 ring-offset-1' },
  nextStep:       { bg: 'bg-blue-50',    border: 'border-blue-400',   ring: 'ring-2 ring-blue-300 ring-offset-1' },
  blocker:        { bg: 'bg-red-50',     border: 'border-red-400',    ring: 'ring-2 ring-red-300 ring-offset-1'  },
  path:           { bg: 'bg-violet-50',  border: 'border-violet-300', ring: '' },
  nextBestAction: { bg: 'bg-orange-50',  border: 'border-orange-400', ring: 'ring-4 ring-orange-300 ring-offset-2 animate-pulse' },
}

export const GraphBuildingNode = memo(({ data }: NodeProps<Node<GraphNodeData>>) => {
  if (data.node.type !== 'building') return null

  const building = data.node
  const s = statusStyles[building.status] ?? statusStyles.planned
  const items = useItemStore(s => s.items)

  const reqs = (building.itemRequirements ?? [])
    .map(req => ({ ...req, item: items.find(i => i.id === req.itemId) }))
    .filter((x): x is typeof x & { item: NonNullable<typeof x.item> } => !!x.item)

  const h = data.highlight ? highlightStyles[data.highlight] : null
  const isolated = data.isIsolated

  return (
    <div className={`relative w-52 rounded-2xl border-2 px-3 py-2.5 shadow-sm select-none ${h ? `${h.bg} ${h.border} ${h.ring}` : `${s.bg} ${s.border}`} ${isolated ? 'border-dashed opacity-75' : ''}`}>
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

      {data.highlight === 'goal' && (
        <div className="absolute -top-2 -right-2 text-xs bg-pink-400 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">🎯</div>
      )}
      {data.highlight === 'nextStep' && (
        <div className="absolute -top-2 -right-2 text-xs bg-blue-400 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">▶</div>
      )}
      {data.highlight === 'blocker' && (
        <div className="absolute -top-2 -right-2 text-xs bg-red-400 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">🔒</div>
      )}
      {data.highlight === 'nextBestAction' && (
        <div className="absolute -top-2 -right-2 text-xs bg-orange-400 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">⭐</div>
      )}

      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">🏗️</span>
        <span className={`text-xs font-bold truncate ${h ? 'text-gray-800' : s.text}`}>{building.name}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
        <span className={`text-xs ${h ? 'text-gray-600' : s.text}`}>
          {building.status === 'done' ? 'Fertig' : building.status === 'in-progress' ? 'Im Bau' : 'Geplant'}
        </span>
        {isolated && (
          <span className="ml-auto text-[10px] text-gray-300 italic">standalone</span>
        )}
      </div>

      {building.location && (
        <div className="mt-1 text-xs text-gray-400 truncate">{building.location}</div>
      )}

      {reqs.length > 0 && (
        <div className={`mt-2 pt-2 border-t ${s.divider} flex flex-col gap-1.5`}>
          {reqs.slice(0, 3).map(req => {
            const done = req.preparedAmount >= req.requiredAmount
            const pct  = req.requiredAmount > 0
              ? Math.min(100, Math.round((req.preparedAmount / req.requiredAmount) * 100))
              : 100
            return (
              <div key={req.itemId}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`truncate flex-1 text-[11px] ${done ? 'text-emerald-500' : 'text-gray-500'}`}>
                    {req.item.name}
                  </span>
                  <span className={`ml-1.5 flex-shrink-0 text-[11px] font-medium tabular-nums ${done ? 'text-emerald-500' : 'text-gray-400'}`}>
                    {done ? '✓' : `${req.preparedAmount}/${req.requiredAmount}`}
                  </span>
                </div>
                <div className="h-0.5 rounded-full bg-black/10">
                  <div
                    className={`h-full rounded-full ${done ? 'bg-emerald-400' : 'bg-pink-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
          {reqs.length > 3 && (
            <p className={`text-[11px] ${s.text} opacity-60`}>+{reqs.length - 3} weitere</p>
          )}
        </div>
      )}
    </div>
  )
})

GraphBuildingNode.displayName = 'GraphBuildingNode'
