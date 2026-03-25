'use client'

import { Pencil, Trash2, Lock, ChevronRight, Link, Target } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { QuestNode, QuestStatus } from '@/types'
import { useGoalStore } from '@/store/useGoalStore'
import { RelatedNotes } from '@/components/notes/RelatedNotes'

const statusConfig: Record<QuestStatus, { label: string; variant: 'gray' | 'amber' | 'green' }> = {
  open:          { label: 'Offen',       variant: 'gray'  },
  'in-progress': { label: 'In Arbeit',   variant: 'amber' },
  done:          { label: 'Erledigt ✓',  variant: 'green' },
}

const priorityVariant = { low: 'gray', medium: 'amber', high: 'red' } as const

const categoryEmoji: Record<string, string> = {
  progression: '⭐', building: '🏗️', farming: '🌾',
  exploration: '🗺️', crafting: '🔨', automation: '⚙️', other: '📌',
}

interface QuestCardProps {
  quest: QuestNode
  blockedDeps: QuestNode[]
  childCount: number
  isUnlocked: boolean
  onEdit:          (quest: QuestNode) => void
  onDeleteRequest: (id: string) => void
  onStatusChange:  (id: string, status: QuestStatus) => void
  onGoalCreate?:   (quest: QuestNode) => void
}

export function QuestCard({
  quest, blockedDeps, childCount, isUnlocked,
  onEdit, onDeleteRequest, onStatusChange, onGoalCreate,
}: QuestCardProps) {
  const { isGoal, toggleGoal } = useGoalStore()
  const status   = statusConfig[quest.status]
  const isLocked = !isUnlocked && quest.status === 'open'
  const goal     = isGoal(quest.id)

  const nextStatus: QuestStatus =
    quest.status === 'open' ? 'in-progress' :
    quest.status === 'in-progress' ? 'done' : 'open'

  return (
    <div
      className={`
        bg-white rounded-2xl border p-4 shadow-sm transition-all duration-200
        ${goal ? 'border-pink-300 ring-1 ring-pink-100' :
          quest.status === 'done' ? 'border-emerald-100 opacity-75' : 'border-rose-100'}
        ${isLocked ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Status toggle */}
        <button
          onClick={() => onStatusChange(quest.id, nextStatus)}
          className={`
            mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
            transition-colors duration-150 cursor-pointer
            ${quest.status === 'done'          ? 'bg-emerald-400 border-emerald-400 text-white'
            : quest.status === 'in-progress'   ? 'bg-amber-300 border-amber-300'
            : 'border-gray-300 hover:border-pink-400'}
          `}
        >
          {quest.status === 'done'        && <span className="text-white text-xs">✓</span>}
          {quest.status === 'in-progress' && <span className="w-2 h-2 rounded-full bg-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm">{categoryEmoji[quest.category]}</span>
            <h3 className={`text-sm font-semibold text-gray-800 ${quest.status === 'done' ? 'line-through text-gray-400' : ''}`}>
              {quest.title}
            </h3>
            {isLocked && <Lock size={11} className="text-gray-400" />}
            {goal && <Target size={11} className="text-pink-400" />}
          </div>

          {quest.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{quest.description}</p>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant={priorityVariant[quest.priority]}>{quest.priority}</Badge>
            <Badge variant="purple">{quest.category}</Badge>
          </div>

          {blockedDeps.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
              <Link size={10} />
              <span>Braucht: {blockedDeps.map(d => d.title).join(', ')}</span>
            </div>
          )}

          {childCount > 0 && (
            <div className="mt-1 flex items-center gap-1 text-xs text-pink-500">
              <ChevronRight size={10} />
              <span>{childCount} Unterquest{childCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => goal ? toggleGoal(quest.id) : (onGoalCreate ? onGoalCreate(quest) : toggleGoal(quest.id))}
            className={`p-1.5 rounded-lg transition-colors ${goal ? 'bg-pink-50 text-pink-400' : 'text-gray-300 hover:text-pink-400'}`}
            title={goal ? 'Ziel entfernen' : 'Ziel planen…'}
          >
            <Target size={13} />
          </button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(quest)} className="!p-1.5">
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDeleteRequest(quest.id)} className="!p-1.5 hover:text-red-400">
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
      <RelatedNotes nodeId={quest.id} />
    </div>
  )
}
