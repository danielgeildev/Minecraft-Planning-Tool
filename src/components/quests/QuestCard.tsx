'use client'

import { Pencil, Trash2, Lock, ChevronRight, Target, Unlock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { QuestNode, QuestStatus } from '@/types'
import { useGoalStore } from '@/store/useGoalStore'
import { RelatedNotes } from '@/components/notes/RelatedNotes'
import { triggerConfetti } from '@/lib/confetti'

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
  quest:           QuestNode
  blockedDeps:     QuestNode[]
  unlocksCount:    number
  childCount:      number
  isUnlocked:      boolean
  onEdit:          (quest: QuestNode) => void
  onDeleteRequest: (id: string) => void
  onStatusChange:  (id: string, status: QuestStatus) => void
  onGoalCreate?:   (quest: QuestNode) => void
}

export function QuestCard({
  quest, blockedDeps, unlocksCount, childCount, isUnlocked,
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
        bg-white dark:bg-slate-800 rounded-2xl border p-4 shadow-sm transition-all duration-200
        ${goal
          ? 'border-pink-300 dark:border-pink-700 ring-1 ring-pink-100 dark:ring-pink-900'
          : quest.status === 'done'
            ? 'border-emerald-100 dark:border-emerald-900 opacity-75'
            : 'border-rose-100 dark:border-slate-700'}
        ${isLocked ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Status toggle */}
        <button
          onClick={(e) => {
            onStatusChange(quest.id, nextStatus)
            if (nextStatus === 'done') triggerConfetti(e.clientX, e.clientY)
          }}
          className={`
            mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
            transition-colors duration-150 cursor-pointer
            ${quest.status === 'done'
              ? 'bg-emerald-400 border-emerald-400 text-white'
              : quest.status === 'in-progress'
                ? 'bg-amber-300 border-amber-300'
                : 'border-gray-300 dark:border-slate-500 hover:border-pink-400'}
          `}
        >
          {quest.status === 'done'        && <span className="text-white text-xs">✓</span>}
          {quest.status === 'in-progress' && <span className="w-2 h-2 rounded-full bg-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm">{categoryEmoji[quest.category]}</span>
            <h3 className={`text-sm font-semibold text-gray-800 dark:text-slate-100 ${quest.status === 'done' ? 'line-through text-gray-400 dark:text-slate-500' : ''}`}>
              {quest.title}
            </h3>
            {isLocked && <Lock size={11} className="text-gray-400" />}
            {goal && <Target size={11} className="text-pink-400" />}
          </div>

          {quest.description && (
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{quest.description}</p>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant={priorityVariant[quest.priority]}>{quest.priority}</Badge>
            <Badge variant="purple">{quest.category}</Badge>
          </div>

          {/* Dependencies visual */}
          {(blockedDeps.length > 0 || unlocksCount > 0 || childCount > 0) && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {blockedDeps.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Lock size={10} className="text-rose-400 flex-shrink-0" />
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">Braucht:</span>
                  {blockedDeps.map(d => (
                    <span
                      key={d.id}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400"
                    >
                      {d.title}
                    </span>
                  ))}
                </div>
              )}
              {unlocksCount > 0 && (
                <div className="flex items-center gap-1">
                  <Unlock size={10} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Schaltet {unlocksCount} Quest{unlocksCount > 1 ? 's' : ''} frei
                  </span>
                </div>
              )}
              {childCount > 0 && (
                <div className="flex items-center gap-1">
                  <ChevronRight size={10} className="text-pink-400 flex-shrink-0" />
                  <span className="text-[11px] text-pink-500">
                    {childCount} Unterquest{childCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => goal ? toggleGoal(quest.id) : (onGoalCreate ? onGoalCreate(quest) : toggleGoal(quest.id))}
            className={`p-1.5 rounded-lg transition-colors ${goal ? 'bg-pink-50 dark:bg-pink-950 text-pink-400' : 'text-gray-300 dark:text-slate-600 hover:text-pink-400'}`}
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
