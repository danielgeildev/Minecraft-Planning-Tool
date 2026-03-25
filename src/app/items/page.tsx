'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, LayoutGrid, List } from 'lucide-react'
import { useItemStore } from '@/store/useItemStore'
import { useQuestStore } from '@/store/useQuestStore'
import { ItemCard } from '@/components/items/ItemCard'
import { ItemDetail } from '@/components/items/ItemDetail'
import { ItemForm } from '@/components/items/ItemForm'
import { GoalCreationModal } from '@/components/goals/GoalCreationModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UndoToast } from '@/components/ui/UndoToast'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useDeleteNode } from '@/hooks/useDeleteNode'
import type { ItemNode, ItemStatus, AnyNode } from '@/types'

type FilterStatus = 'all' | ItemStatus
type ViewMode = 'grid' | 'list'

export default function ItemsPage() {
  const { items, addItem, updateItem, lastDeleted, undoDelete } = useItemStore()
  const { quests } = useQuestStore()
  const { deleteNodeAndCleanup } = useDeleteNode()

  const allNodes: AnyNode[] = useMemo(() => [...quests, ...items], [quests, items])

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ItemNode | null>(null)
  const [selectedItem, setSelectedItem] = useState<ItemNode | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showUndo, setShowUndo] = useState(false)
  const [search, setSearch] = useState('')
  const [goalNode, setGoalNode] = useState<AnyNode | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterMod, setFilterMod] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const allMods = useMemo(() => {
    const mods = Array.from(new Set(items.map((i) => i.mod).filter(Boolean)))
    return ['all', ...mods.sort()]
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (
        search &&
        !item.name.toLowerCase().includes(search.toLowerCase()) &&
        !item.mod.toLowerCase().includes(search.toLowerCase())
      )
        return false
      if (filterStatus !== 'all' && item.status !== filterStatus) return false
      if (filterMod !== 'all' && item.mod !== filterMod) return false
      return true
    })
  }, [items, search, filterStatus, filterMod])

  const sorted = useMemo(() => {
    const sOrder: Record<ItemStatus, number> = { needed: 0, collecting: 1, have: 2 }
    return [...filtered].sort((a, b) => sOrder[a.status] - sOrder[b.status])
  }, [filtered])

  const handleEdit = (item: ItemNode) => {
    setEditTarget(item)
    setSelectedItem(null)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditTarget(null)
  }

  const handleSubmit = (data: Omit<ItemNode, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => {
    if (editTarget) {
      updateItem(editTarget.id, data)
    } else {
      addItem(data)
    }
  }

  const handleDeleteConfirm = () => {
    if (!deleteId) return
    if (selectedItem?.id === deleteId) setSelectedItem(null)
    deleteNodeAndCleanup(deleteId, 'item')
    setDeleteId(null)
    setShowUndo(true)
  }

  const statusCounts = {
    all: items.length,
    needed: items.filter((i) => i.status === 'needed').length,
    collecting: items.filter((i) => i.status === 'collecting').length,
    have: items.filter((i) => i.status === 'have').length,
  }

  return (
    <div className="flex h-full">
      {/* Main panel */}
      <div className={`flex-1 flex flex-col min-w-0 ${selectedItem ? 'hidden lg:flex' : 'flex'}`}>
        <div className="px-4 py-6 lg:px-8 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-800">📦 Items zu sammeln</h1>
              <p className="text-xs text-gray-400 mt-0.5">{items.length} Items verfolgt</p>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex rounded-xl border border-rose-100 bg-white overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-pink-400 text-white' : 'text-gray-400 hover:bg-rose-50'}`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-pink-400 text-white' : 'text-gray-400 hover:bg-rose-50'}`}
                >
                  <List size={14} />
                </button>
              </div>
              <Button onClick={() => setFormOpen(true)}>
                <Plus size={14} />
                Neues Item
              </Button>
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {(
              [
                { key: 'all', label: 'Alle' },
                { key: 'needed', label: '🔍 Gesucht' },
                { key: 'collecting', label: '📥 Sammle' },
                { key: 'have', label: '✅ Habe ich' },
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

          {/* Search + mod filter */}
          <div className="flex gap-2 mb-6">
            <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-slate-600 px-3 py-2">
              <Search size={14} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
              <input
                className="flex-1 text-sm outline-none placeholder-gray-400 dark:placeholder-slate-500 bg-transparent text-gray-800 dark:text-slate-100"
                placeholder="Items oder Mods suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {allMods.length > 2 && (
              <select
                className="rounded-xl border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs text-gray-800 dark:text-slate-100 outline-none focus:border-pink-400"
                value={filterMod}
                onChange={(e) => setFilterMod(e.target.value)}
              >
                <option value="all">Alle Mods</option>
                {allMods.filter((m) => m !== 'all').map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Item list/grid */}
          {sorted.length === 0 ? (
            <EmptyState
              icon={<span>📦</span>}
              title="Keine Items gefunden"
              description="Füge Items hinzu die du sammeln möchtest."
              action={
                <Button onClick={() => setFormOpen(true)}>
                  <Plus size={14} />
                  Neues Item
                </Button>
              }
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {sorted.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDeleteRequest={setDeleteId}
                  onStatusChange={(id, status) => updateItem(id, { status })}
                  onClick={(item) =>
                    setSelectedItem((prev) => (prev?.id === item.id ? null : item))
                  }
                  onGoalCreate={setGoalNode}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sorted.map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    setSelectedItem((prev) => (prev?.id === item.id ? null : item))
                  }
                  className={`
                    w-full bg-white rounded-xl border px-4 py-3 flex items-center gap-3
                    hover:shadow-sm transition-all duration-150 text-left
                    ${selectedItem?.id === item.id ? 'border-pink-300 ring-1 ring-pink-200' : 'border-rose-100'}
                  `}
                >
                  <span className="text-lg">
                    {item.status === 'needed' ? '🔍' : item.status === 'collecting' ? '📥' : '✅'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-gray-800 ${item.status === 'have' ? 'line-through text-gray-400' : ''}`}>
                      {item.name}
                    </p>
                    <p className="text-xs text-pink-400">{item.mod}</p>
                  </div>
                  {item.reason && (
                    <p className="text-xs text-gray-400 truncate max-w-48 hidden sm:block">{item.reason}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedItem && (
        <div className="w-full lg:w-96 flex-shrink-0 h-full">
          <ItemDetail
            item={selectedItem}
            allNodes={allNodes}
            onClose={() => setSelectedItem(null)}
            onEdit={handleEdit}
            onStatusChange={(id, status) => {
              updateItem(id, { status })
              setSelectedItem((prev) => (prev ? { ...prev, status } : null))
            }}
            onLinkedItemClick={(node) => {
              if (node.type === 'item') setSelectedItem(node)
            }}
            onGoalCreate={setGoalNode}
          />
        </div>
      )}

      {/* Goal creation modal */}
      <GoalCreationModal
        open={goalNode !== null}
        onClose={() => setGoalNode(null)}
        node={goalNode}
        allNodes={allNodes}
      />

      {/* Form */}
      <ItemForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleSubmit}
        initialData={editTarget}
        allNodes={allNodes}
      />

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Item löschen?"
        description="Diese Aktion kann rückgängig gemacht werden."
        confirmLabel="Löschen"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

      {/* Undo toast */}
      {showUndo && lastDeleted && (
        <UndoToast
          message={`"${lastDeleted.name}" gelöscht`}
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
