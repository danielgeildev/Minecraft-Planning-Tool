'use client'

import { useState, useEffect } from 'react'
import { Target, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import type { AnyNode } from '@/types'
import { getNodeTitle } from '@/types'
import { useGoalStore } from '@/store/useGoalStore'

interface GoalCreationModalProps {
  open:      boolean
  onClose:   () => void
  node:      AnyNode | null
  allNodes:  AnyNode[]
}

export function GoalCreationModal({ open, onClose, node, allNodes }: GoalCreationModalProps) {
  const { addGoalWithSubgoals, isGoal, updateGoalNote, getGoalForNode } = useGoalStore()

  const [note,            setNote]            = useState('')
  const [selectedSubGoals, setSelectedSubGoals] = useState<Set<string>>(new Set())

  const alreadyGoal = node ? isGoal(node.id) : false
  const existingGoal = node ? getGoalForNode(node.id) : undefined

  // Reset state when modal opens
  useEffect(() => {
    if (open && node) {
      setNote(existingGoal?.note ?? '')
      setSelectedSubGoals(new Set())
    }
  }, [open, node, existingGoal])

  if (!node) return null

  // Direct requires-deps as subgoal candidates (not already goals themselves)
  const subGoalCandidates = node.dependencies
    .filter(d => d.type === 'requires')
    .map(d => allNodes.find(n => n.id === d.targetId))
    .filter((n): n is AnyNode => !!n)

  const toggleSubGoal = (id: string) => {
    setSelectedSubGoals(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = () => {
    if (alreadyGoal && existingGoal) {
      // Update note + add any new subgoals
      if (note !== existingGoal.note) updateGoalNote(existingGoal.id, note)
      if (selectedSubGoals.size > 0) {
        addGoalWithSubgoals(node.id, note, [...selectedSubGoals])
      }
    } else {
      addGoalWithSubgoals(node.id, note, [...selectedSubGoals])
    }
    onClose()
  }

  const nodeEmoji = node.type === 'quest' ? '📋' : '📦'
  const nodeType  = node.type === 'quest' ? 'Quest' : 'Item'
  const nodeMeta  = node.type === 'quest'
    ? `${node.category} · ${node.priority} Priorität`
    : node.mod

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={alreadyGoal ? 'Ziel bearbeiten' : 'Ziel planen'}
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-5">

        {/* Node preview */}
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 border border-rose-100 px-4 py-3">
          <span className="text-2xl">{nodeEmoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 truncate">{getNodeTitle(node)}</p>
            <p className="text-xs text-pink-400 mt-0.5">{nodeMeta}</p>
          </div>
          <Badge variant="gray">{nodeType}</Badge>
        </div>

        {/* Note */}
        <Textarea
          label="Warum ist das dein Ziel? (optional)"
          placeholder="z.B. Das ist der nächste große Meilenstein für den ATM Star…"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
        />

        {/* Subgoals */}
        {subGoalCandidates.length > 0 && (
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Unterziele hinzufügen</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Wähle Abhängigkeiten aus, die du separat verfolgen möchtest.
              </p>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-rose-100 p-2 max-h-48 overflow-y-auto">
              {subGoalCandidates.map(candidate => {
                const selected   = selectedSubGoals.has(candidate.id)
                const alreadySet = isGoal(candidate.id)
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => !alreadySet && toggleSubGoal(candidate.id)}
                    disabled={alreadySet}
                    className={`
                      flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-left transition-colors
                      ${alreadySet ? 'opacity-50 cursor-default bg-emerald-50' :
                        selected ? 'bg-pink-50' : 'hover:bg-rose-50'}
                    `}
                  >
                    <span className={`
                      w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border text-white text-xs
                      ${alreadySet ? 'bg-emerald-400 border-emerald-400' :
                        selected ? 'bg-pink-400 border-pink-400' : 'border-gray-300'}
                    `}>
                      {(selected || alreadySet) ? '✓' : ''}
                    </span>
                    <span>{candidate.type === 'quest' ? '📋' : '📦'}</span>
                    <span className="flex-1 truncate text-gray-700">{getNodeTitle(candidate)}</span>
                    {alreadySet && <span className="text-emerald-500 text-xs">bereits Ziel</span>}
                    {candidate.type === 'item' && !alreadySet && (
                      <span className="text-gray-400 truncate max-w-[80px]">{candidate.mod}</span>
                    )}
                  </button>
                )
              })}
            </div>
            {selectedSubGoals.size > 0 && (
              <p className="text-xs text-pink-500">
                {selectedSubGoals.size} Unterziel{selectedSubGoals.size > 1 ? 'e' : ''} gewählt
              </p>
            )}
          </div>
        )}

        {/* Already a goal notice */}
        {alreadyGoal && (
          <div className="flex items-center gap-2 rounded-xl bg-pink-50 border border-pink-100 px-3 py-2">
            <Target size={13} className="text-pink-400 flex-shrink-0" />
            <p className="text-xs text-pink-600">Dieses Ziel ist bereits aktiv. Du kannst die Notiz ändern oder neue Unterziele hinzufügen.</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
          <Button onClick={handleSubmit} className="gap-1.5">
            <Target size={13} />
            {alreadyGoal ? 'Aktualisieren' : 'Ziel erstellen'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
