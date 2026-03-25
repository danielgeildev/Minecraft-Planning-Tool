'use client'

import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { useQuestStore } from '@/store/useQuestStore'
import { useItemStore } from '@/store/useItemStore'
import { QuestCard } from '@/components/quests/QuestCard'
import { QuestForm } from '@/components/quests/QuestForm'
import { GoalCreationModal } from '@/components/goals/GoalCreationModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UndoToast } from '@/components/ui/UndoToast'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useDeleteNode } from '@/hooks/useDeleteNode'
import { isUnlocked, getBlockedDependencies } from '@/lib/progression'
import type { QuestNode, QuestStatus, AnyNode } from '@/types'

type FilterStatus = 'all' | QuestStatus
type FilterPriority = 'all' | 'low' | 'medium' | 'high'

export default function QuestsPage() {
  const { quests, addQuest, updateQuest, getChildren, lastDeleted, undoDelete } =
    useQuestStore()
  const { items } = useItemStore()
  const { deleteNodeAndCleanup } = useDeleteNode()

  const allNodes: AnyNode[] = useMemo(() => [...quests, ...items], [quests, items])

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<QuestNode | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showUndo, setShowUndo] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [showOnlyRoots, setShowOnlyRoots] = useState(false)
  const [goalNode, setGoalNode] = useState<AnyNode | null>(null)

  const filtered = useMemo(() => {
    return quests.filter((q) => {
      if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus !== 'all' && q.status !== filterStatus) return false
      if (filterPriority !== 'all' && q.priority !== filterPriority) return false
      if (showOnlyRoots && q.parentId !== null) return false
      return true
    })
  }, [quests, search, filterStatus, filterPriority, showOnlyRoots])

  const sorted = useMemo(() => {
    const pOrder = { high: 0, medium: 1, low: 2 }
    const sOrder = { 'in-progress': 0, open: 1, done: 2 }
    return [...filtered].sort(
      (a, b) =>
        sOrder[a.status] - sOrder[b.status] ||
        pOrder[a.priority] - pOrder[b.priority]
    )
  }, [filtered])

  const handleEdit = (quest: QuestNode) => {
    setEditTarget(quest)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditTarget(null)
  }

  const handleSubmit = (data: Omit<QuestNode, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => {
    if (editTarget) {
      updateQuest(editTarget.id, data)
    } else {
      addQuest(data)
    }
  }

  const handleDeleteConfirm = () => {
    if (!deleteId) return
    deleteNodeAndCleanup(deleteId, 'quest')
    setDeleteId(null)
    setShowUndo(true)
  }

  const statusCounts = {
    all: quests.length,
    open: quests.filter((q) => q.status === 'open').length,
    'in-progress': quests.filter((q) => q.status === 'in-progress').length,
    done: quests.filter((q) => q.status === 'done').length,
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-3xl lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">📋 Quests</h1>
          <p className="text-xs text-gray-400 mt-0.5">{quests.length} insgesamt</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={14} />
          Neue Quest
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {(
          [
            { key: 'all', label: 'Alle' },
            { key: 'open', label: '⭕ Offen' },
            { key: 'in-progress', label: '🔄 In Arbeit' },
            { key: 'done', label: '✅ Erledigt' },
          ] as { key: FilterStatus; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`
              flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
              ${
                filterStatus === key
                  ? 'bg-pink-400 text-white'
                  : 'bg-white text-gray-500 border border-rose-100 hover:bg-rose-50'
              }
            `}
          >
            {label}
            <span className={`ml-1 ${filterStatus === key ? 'opacity-80' : 'text-gray-400'}`}>
              ({statusCounts[key as keyof typeof statusCounts]})
            </span>
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-slate-600 px-3 py-2">
          <Search size={14} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
          <input
            className="flex-1 text-sm outline-none placeholder-gray-400 dark:placeholder-slate-500 bg-transparent text-gray-800 dark:text-slate-100"
            placeholder="Quests suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs text-gray-800 dark:text-slate-100 outline-none focus:border-pink-400"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
        >
          <option value="all">Alle Prio</option>
          <option value="high">Hoch</option>
          <option value="medium">Mittel</option>
          <option value="low">Niedrig</option>
        </select>
      </div>

      {/* Only root quests toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyRoots}
            onChange={(e) => setShowOnlyRoots(e.target.checked)}
            className="rounded accent-pink-400"
          />
          Nur Haupt-Questlines
        </label>
      </div>

      {/* Quest list */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={<span>📋</span>}
          title="Keine Quests gefunden"
          description="Erstelle deine erste Quest oder passe die Filter an."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={14} />
              Neue Quest
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              blockedDeps={getBlockedDependencies(quest.id, allNodes) as QuestNode[]}
              childCount={getChildren(quest.id).length}
              isUnlocked={isUnlocked(quest.id, allNodes)}
              onEdit={handleEdit}
              onDeleteRequest={setDeleteId}
              onStatusChange={(id, status) => updateQuest(id, { status })}
              onGoalCreate={setGoalNode}
            />
          ))}
        </div>
      )}

      {/* Goal creation modal */}
      <GoalCreationModal
        open={goalNode !== null}
        onClose={() => setGoalNode(null)}
        node={goalNode}
        allNodes={allNodes}
      />

      {/* Form modal */}
      <QuestForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleSubmit}
        initialData={editTarget}
        allQuests={quests}
        allItems={items}
      />

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Quest löschen?"
        description="Diese Aktion kann rückgängig gemacht werden."
        confirmLabel="Löschen"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

      {/* Undo toast */}
      {showUndo && lastDeleted && (
        <UndoToast
          message={`"${lastDeleted.title}" gelöscht`}
          onUndo={() => {
            undoDelete()
            setShowUndo(false)
          }}
          onDismiss={() => setShowUndo(false)}
        />
      )}
    </div>
  )
}
