'use client'

import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { useBuildingStore } from '@/store/useBuildingStore'
import { BuildingCard } from '@/components/buildings/BuildingCard'
import { BuildingForm } from '@/components/buildings/BuildingForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UndoToast } from '@/components/ui/UndoToast'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { deleteImages, isDataUrl } from '@/lib/imageStorage'
import type { Building, BuildingStatus } from '@/types'

type FilterStatus = 'all' | BuildingStatus

export default function BuildingsPage() {
  const { buildings, addBuilding, updateBuilding, deleteBuilding, undoDelete, lastDeleted } =
    useBuildingStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Building | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showUndo, setShowUndo] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  const filtered = useMemo(() => {
    return buildings.filter((b) => {
      if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterStatus !== 'all' && b.status !== filterStatus) return false
      return true
    })
  }, [buildings, search, filterStatus])

  const handleEdit = (building: Building) => {
    setEditTarget(building)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditTarget(null)
  }

  const handleSubmit = (data: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editTarget) {
      updateBuilding(editTarget.id, data)
    } else {
      addBuilding(data)
    }
  }

  const handleDeleteConfirm = () => {
    if (!deleteId) return
    const building = buildings.find(b => b.id === deleteId)
    if (building) {
      // Delete associated images from IndexedDB (ignore legacy data: URLs)
      const imageKeys = building.inspoPics.filter(p => !isDataUrl(p))
      if (imageKeys.length > 0) deleteImages(imageKeys).catch(() => {/* best-effort */})
    }
    deleteBuilding(deleteId)
    setDeleteId(null)
    setShowUndo(true)
  }

  const statusCounts = {
    all: buildings.length,
    planned: buildings.filter((b) => b.status === 'planned').length,
    'in-progress': buildings.filter((b) => b.status === 'in-progress').length,
    done: buildings.filter((b) => b.status === 'done').length,
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-3xl lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">🏗️ Gebäude-Planer</h1>
          <p className="text-xs text-gray-400 mt-0.5">{buildings.length} Gebäude geplant</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={14} />
          Neues Gebäude
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {(
          [
            { key: 'all', label: 'Alle' },
            { key: 'planned', label: '📐 Geplant' },
            { key: 'in-progress', label: '🔨 Im Bau' },
            { key: 'done', label: '✅ Fertig' },
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

      {/* Search */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-slate-600 px-3 py-2 mb-4">
        <Search size={14} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
        <input
          className="flex-1 text-sm outline-none placeholder-gray-400 dark:placeholder-slate-500 bg-transparent text-gray-800 dark:text-slate-100"
          placeholder="Gebäude suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Building grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<span>🏗️</span>}
          title="Keine Gebäude gefunden"
          description="Plane dein erstes Gebäude!"
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={14} />
              Neues Gebäude
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((building) => (
            <BuildingCard
              key={building.id}
              building={building}
              onEdit={handleEdit}
              onDelete={setDeleteId}
              onStatusChange={(id, status) => updateBuilding(id, { status })}
            />
          ))}
        </div>
      )}

      <BuildingForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleSubmit}
        initialData={editTarget}
      />

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Gebäude löschen?"
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
