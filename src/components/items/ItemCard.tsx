'use client'

import { Pencil, Trash2, Target } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { ItemNode, ItemStatus } from '@/types'
import { useGoalStore } from '@/store/useGoalStore'

const statusConfig: Record<ItemStatus, { label: string; variant: 'red' | 'amber' | 'green'; emoji: string }> = {
  needed:     { label: 'Gesucht',    variant: 'red',   emoji: '🔍' },
  collecting: { label: 'Sammle',     variant: 'amber', emoji: '📥' },
  have:       { label: 'Habe ich ✓', variant: 'green', emoji: '✅' },
}

interface ItemCardProps {
  item: ItemNode
  onEdit:          (item: ItemNode) => void
  onDeleteRequest: (id: string) => void
  onStatusChange:  (id: string, status: ItemStatus) => void
  onClick:         (item: ItemNode) => void
  onGoalCreate?:   (item: ItemNode) => void
}

export function ItemCard({ item, onEdit, onDeleteRequest, onStatusChange, onClick, onGoalCreate }: ItemCardProps) {
  const { isGoal, toggleGoal } = useGoalStore()
  const status = statusConfig[item.status]
  const nextStatus: ItemStatus =
    item.status === 'needed' ? 'collecting' : item.status === 'collecting' ? 'have' : 'needed'

  const craftCount = item.dependencies.filter(d => d.type === 'requires' && d.amount != null).length
  const depCount   = item.dependencies.filter(d => d.type === 'requires').length
  const goal       = isGoal(item.id)

  return (
    <div
      className={`
        bg-white rounded-2xl border shadow-sm p-4 cursor-pointer
        hover:shadow-md transition-all duration-200
        ${goal ? 'border-pink-300 ring-1 ring-pink-100' : item.status === 'have' ? 'border-emerald-100 opacity-80' : 'border-rose-100'}
      `}
      onClick={() => onClick(item)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{status.emoji}</span>
            <h3
              className={`text-sm font-semibold text-gray-800 truncate ${
                item.status === 'have' ? 'line-through text-gray-400' : ''
              }`}
            >
              {item.name}
            </h3>
          </div>
          <p className="text-xs text-pink-400 font-medium mt-0.5 ml-7">{item.mod}</p>
        </div>

        <div className="flex gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => goal ? toggleGoal(item.id) : (onGoalCreate ? onGoalCreate(item) : toggleGoal(item.id))}
            title={goal ? 'Ziel entfernen' : 'Ziel setzen…'}
            className={`
              p-1.5 rounded-lg transition-all duration-150 min-w-[28px] min-h-[28px] flex items-center justify-center
              ${goal
                ? 'bg-pink-100 text-pink-500 ring-1 ring-pink-300 hover:bg-pink-200'
                : 'text-gray-300 hover:bg-pink-50 hover:text-pink-400 active:bg-pink-100'}
            `}
          >
            <Target size={14} strokeWidth={goal ? 2.5 : 1.5} />
          </button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="!p-1.5">
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDeleteRequest(item.id)} className="!p-1.5 hover:text-red-400">
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* Reason */}
      {item.reason && (
        <p className="mt-2 text-xs text-gray-500 line-clamp-2 ml-7">{item.reason}</p>
      )}

      {/* Bottom row */}
      <div className="mt-3 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
        <Badge variant={status.variant}>{status.label}</Badge>
        <button
          onClick={() => onStatusChange(item.id, nextStatus)}
          className="text-xs text-pink-500 hover:text-pink-600 transition-colors"
        >
          → {statusConfig[nextStatus].label}
        </button>
      </div>

      {/* Meta */}
      {(craftCount > 0 || depCount > 0) && (
        <div className="mt-2 text-xs text-gray-400">
          {craftCount > 0 && `🧪 ${craftCount} Zutat${craftCount > 1 ? 'en' : ''}`}
          {craftCount > 0 && depCount > craftCount && ' · '}
          {depCount > craftCount && `⛓️ ${depCount - craftCount} weitere Dep${depCount - craftCount > 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  )
}
