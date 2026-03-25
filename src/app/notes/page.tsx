'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { useNoteStore }    from '@/store/useNoteStore'
import { useQuestStore }   from '@/store/useQuestStore'
import { useItemStore }    from '@/store/useItemStore'
import { useBuildingStore } from '@/store/useBuildingStore'
import { NoteCard }   from '@/components/notes/NoteCard'
import { NoteForm }   from '@/components/notes/NoteForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UndoToast }  from '@/components/ui/UndoToast'
import { Button }     from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { deleteImages, isDataUrl } from '@/lib/imageStorage'
import type { NoteNode } from '@/types/note'
import type { AnyNode } from '@/types'

export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote, undoDelete, lastDeleted } = useNoteStore()
  const { quests }    = useQuestStore()
  const { items }     = useItemStore()
  const { buildings } = useBuildingStore()

  const allNodes: AnyNode[] = useMemo(
    () => [...quests, ...items, ...buildings],
    [quests, items, buildings],
  )

  const [formOpen, setFormOpen]       = useState(false)
  const [editTarget, setEditTarget]   = useState<NoteNode | null>(null)
  const [deleteId, setDeleteId]       = useState<string | null>(null)
  const [showUndo, setShowUndo]       = useState(false)
  const [search, setSearch]           = useState('')
  const [tagFilter, setTagFilter]     = useState<string | null>(null)

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    notes.forEach(n => n.tags.forEach(t => tags.add(t)))
    return Array.from(tags).sort()
  }, [notes])

  const filtered = useMemo(() => {
    return notes.filter(n => {
      if (search) {
        const q = search.toLowerCase()
        const match =
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some(t => t.toLowerCase().includes(q))
        if (!match) return false
      }
      if (tagFilter && !n.tags.includes(tagFilter)) return false
      return true
    })
  }, [notes, search, tagFilter])

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [filtered],
  )

  const handleEdit = (note: NoteNode) => {
    setEditTarget(note)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditTarget(null)
  }

  const handleSubmit = (data: Omit<NoteNode, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editTarget) {
      updateNote(editTarget.id, data)
    } else {
      addNote(data)
    }
  }

  const handleDeleteConfirm = () => {
    if (!deleteId) return
    const note = notes.find(n => n.id === deleteId)
    if (note) {
      const imageKeys = note.images.filter(p => !isDataUrl(p))
      if (imageKeys.length > 0) deleteImages(imageKeys).catch(() => {})
    }
    deleteNote(deleteId)
    setDeleteId(null)
    setShowUndo(true)
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto lg:max-w-4xl lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">📝 Notizen</h1>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{notes.length} gespeicherte Notizen</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={14} />
          Neue Notiz
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-slate-600 px-3 py-2 mb-3">
        <Search size={14} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
        <input
          className="flex-1 text-sm outline-none placeholder-gray-400 dark:placeholder-slate-500 bg-transparent text-gray-800 dark:text-slate-100"
          placeholder="Notizen nach Titel, Inhalt oder Tags suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tagFilter && (
            <button
              onClick={() => setTagFilter(null)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-pink-400 text-white"
            >
              #{tagFilter}
              <X size={10} />
            </button>
          )}
          {allTags.filter(t => t !== tagFilter).map(tag => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Results info */}
      {(search || tagFilter) && (
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
          {sorted.length} Treffer
        </p>
      )}

      {/* Notes grid */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={<span>📝</span>}
          title={search || tagFilter ? 'Keine Notizen gefunden' : 'Noch keine Notizen'}
          description={
            search || tagFilter
              ? 'Passe deine Suche an.'
              : 'Speichere Wissen aus YouTube, Gameplay oder Planung hier.'
          }
          action={
            !search && !tagFilter ? (
              <Button onClick={() => setFormOpen(true)}>
                <Plus size={14} />
                Erste Notiz erstellen
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              allNodes={allNodes}
              onEdit={handleEdit}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <NoteForm
        key={formOpen ? (editTarget?.id ?? 'new') : 'closed'}
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleSubmit}
        initialData={editTarget}
        allNodes={allNodes}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Notiz löschen?"
        description="Diese Aktion kann rückgängig gemacht werden."
        confirmLabel="Löschen"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

      {showUndo && lastDeleted && (
        <UndoToast
          message={`"${lastDeleted.title}" gelöscht`}
          onUndo={() => { undoDelete(); setShowUndo(false) }}
          onDismiss={() => setShowUndo(false)}
        />
      )}
    </div>
  )
}
