'use client'

import { useState, useRef } from 'react'
import { ImagePlus, X, Plus, Search, PackagePlus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { NoteImage } from './NoteImage'
import { saveImage, deleteImages, isDataUrl } from '@/lib/imageStorage'
import { useItemStore } from '@/store/useItemStore'
import type { NoteNode } from '@/types/note'
import type { AnyNode } from '@/types'
import { getNodeTitle } from '@/types'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

interface NoteFormState {
  title:         string
  content:       string
  images:        string[]
  tags:          string[]
  linkedNodeIds: string[]
}

const emptyForm: NoteFormState = {
  title:         '',
  content:       '',
  images:        [],
  tags:          [],
  linkedNodeIds: [],
}

const nodeEmoji: Record<string, string> = {
  quest:    '📋',
  item:     '📦',
  building: '🏗️',
  note:     '📝',
}

interface NoteFormProps {
  open:         boolean
  onClose:      () => void
  onSubmit:     (data: Omit<NoteNode, 'id' | 'type' | 'createdAt' | 'updatedAt'>) => void
  initialData?: NoteNode | null
  allNodes:     AnyNode[]
  allNotes?:    NoteNode[]
}

export function NoteForm({ open, onClose, onSubmit, initialData, allNodes, allNotes = [] }: NoteFormProps) {
  const [form, setForm]             = useState<NoteFormState>(() =>
    initialData
      ? { title: initialData.title, content: initialData.content, images: [...initialData.images], tags: [...initialData.tags], linkedNodeIds: [...initialData.linkedNodeIds] }
      : emptyForm
  )
  const [newTag, setNewTag]               = useState('')
  const [nodeSearch, setNodeSearch]       = useState('')
  const [dragOver, setDragOver]           = useState(false)
  const [imageError, setImageError]       = useState<string | null>(null)
  const [showInlineCreate, setShowInline] = useState(false)
  const [inlineName, setInlineName]       = useState('')
  const [inlineMod, setInlineMod]         = useState('')
  const fileInputRef                      = useRef<HTMLInputElement>(null)
  const newKeysRef                        = useRef<string[]>([])

  // No reset-on-open effect needed: the parent remounts this form via key prop
  // on every open/close, so all state starts fresh.

  const processFiles = (files: FileList | null) => {
    if (!files) return
    setImageError(null)
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError(`"${file.name}" ist zu groß (max. 5 MB)`)
        return
      }
      const key = crypto.randomUUID()
      saveImage(key, file)
        .then(() => {
          newKeysRef.current.push(key)
          setForm(p => ({ ...p, images: [...p.images, key] }))
        })
        .catch(() => setImageError(`"${file.name}" konnte nicht gespeichert werden`))
    })
  }

  const removeImage = (idx: number) => {
    const key = form.images[idx]
    if (!isDataUrl(key)) {
      deleteImages([key]).catch(() => {})
      newKeysRef.current = newKeysRef.current.filter(k => k !== key)
    }
    setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))
  }

  const addTag = () => {
    const t = newTag.trim().toLowerCase()
    if (!t || form.tags.includes(t)) { setNewTag(''); return }
    setForm(p => ({ ...p, tags: [...p.tags, t] }))
    setNewTag('')
  }

  const removeTag = (tag: string) => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))

  const toggleNode = (nodeId: string) => {
    setForm(p => ({
      ...p,
      linkedNodeIds: p.linkedNodeIds.includes(nodeId)
        ? p.linkedNodeIds.filter(id => id !== nodeId)
        : [...p.linkedNodeIds, nodeId],
    }))
  }

  const handleClose = () => {
    const orphans = newKeysRef.current.filter(k => form.images.includes(k))
    if (!initialData && orphans.length > 0) {
      deleteImages(orphans).catch(() => {})
    }
    newKeysRef.current = []
    onClose()
  }

  const handleSubmit = () => {
    if (!form.title.trim()) return
    newKeysRef.current = []
    onSubmit(form)
    onClose()
  }

  // Inline-create a new item and immediately link it
  const handleInlineCreate = () => {
    if (!inlineName.trim()) return
    useItemStore.getState().addItem({
      name:         inlineName.trim(),
      mod:          inlineMod.trim() || 'Vanilla',
      status:       'needed',
      reason:       '',
      purpose:      '',
      dependencies: [],
      notes:        '',
    })
    const newItem = useItemStore.getState().items[0]
    setForm(p => ({ ...p, linkedNodeIds: [...p.linkedNodeIds, newItem.id] }))
    setInlineName('')
    setInlineMod('')
    setShowInline(false)
  }

  // Combine AnyNodes + other notes (excluding self) for link list
  const selfId = initialData?.id
  const linkableNotes = allNotes.filter(n => n.id !== selfId)

  type LinkEntry = { id: string; label: string; typeKey: string }

  // Selected entries always appear at the top regardless of search
  const selectedEntries: LinkEntry[] = form.linkedNodeIds.flatMap(id => {
    const node = allNodes.find(n => n.id === id)
    if (node) return [{ id: node.id, label: getNodeTitle(node), typeKey: node.type }]
    const note = linkableNotes.find(n => n.id === id)
    if (note) return [{ id: note.id, label: note.title, typeKey: 'note' }]
    return []
  })

  // Unselected entries filtered by search
  const filteredLinks: LinkEntry[] = [
    ...selectedEntries,
    ...allNodes
      .filter(n =>
        !form.linkedNodeIds.includes(n.id) &&
        (!nodeSearch || getNodeTitle(n).toLowerCase().includes(nodeSearch.toLowerCase()))
      )
      .map(n => ({ id: n.id, label: getNodeTitle(n), typeKey: n.type })),
    ...linkableNotes
      .filter(n =>
        !form.linkedNodeIds.includes(n.id) &&
        (!nodeSearch || n.title.toLowerCase().includes(nodeSearch.toLowerCase()))
      )
      .map(n => ({ id: n.id, label: n.title, typeKey: 'note' })),
  ]

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={initialData ? 'Notiz bearbeiten' : 'Neue Notiz'}
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4">

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Titel *</label>
          <input
            className="w-full rounded-xl border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900 transition-colors"
            placeholder="z.B. Ritual Chamber Setup"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Inhalt / Notizen</label>
          <RichTextEditor
            value={form.content}
            onChange={html => setForm(p => ({ ...p, content: html }))}
            placeholder="Was hast du gelernt? Notizen, Crafting-Tipps, YouTube-Links..."
            minHeight={120}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Tags</label>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 dark:bg-pink-950 text-pink-500 dark:text-pink-400">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-pink-700">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 outline-none focus:border-pink-400 transition-colors"
              placeholder="Tag hinzufügen..."
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button variant="secondary" onClick={addTag} className="flex-shrink-0">
              <Plus size={13} />
            </Button>
          </div>
        </div>

        {/* Images */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Bilder</label>

          {form.images.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {form.images.map((ref, i) => (
                <div key={i} className="relative w-20 h-14 rounded-xl overflow-hidden border border-rose-100 dark:border-slate-600 group">
                  <NoteImage imageRef={ref} alt={`Bild ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
                  >
                    <X size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {imageError && <p className="text-xs text-red-500">{imageError}</p>}

          <div
            className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer ${dragOver ? 'border-pink-400 bg-pink-50 dark:bg-pink-950' : 'border-rose-200 dark:border-slate-600 hover:border-pink-300 hover:bg-rose-50 dark:hover:bg-slate-700'}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files) }}
          >
            <ImagePlus size={20} className="mx-auto mb-1 text-rose-300" />
            <p className="text-xs text-gray-400 dark:text-slate-500">Klicken oder Bilder hierher ziehen (max. 5 MB)</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => processFiles(e.target.files)}
          />
        </div>

        {/* Linked Nodes */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Verknüpfungen
            {form.linkedNodeIds.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-pink-100 dark:bg-pink-900 text-pink-500">{form.linkedNodeIds.length}</span>
            )}
          </label>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-slate-600 px-3 py-2">
            <Search size={13} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
            <input
              className="flex-1 text-sm outline-none placeholder-gray-400 dark:placeholder-slate-500 bg-transparent text-gray-800 dark:text-slate-100"
              placeholder="Items, Buildings, Quests, Notizen suchen..."
              value={nodeSearch}
              onChange={e => setNodeSearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5 rounded-xl border border-rose-100 dark:border-slate-700 p-1">
            {filteredLinks.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500 px-2 py-2 text-center">Keine Einträge gefunden</p>
            ) : (
              filteredLinks.map((entry, idx) => {
                const selected = form.linkedNodeIds.includes(entry.id)
                const typeLabel = entry.typeKey === 'note' ? 'Notiz'
                  : entry.typeKey === 'quest' ? 'Quest'
                  : entry.typeKey === 'item' ? 'Item'
                  : 'Gebäude'
                // Visual divider between selected and unselected items
                const showDivider = idx > 0 && selected === false && form.linkedNodeIds.includes(filteredLinks[idx - 1].id)
                return (
                  <div key={entry.id}>
                    {showDivider && <div className="my-0.5 border-t border-rose-100 dark:border-slate-700" />}
                    <button
                      onClick={() => toggleNode(entry.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors text-sm min-h-[40px] ${
                        selected
                          ? 'bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400'
                          : 'hover:bg-rose-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${selected ? 'bg-pink-400 border-pink-400 text-white' : 'border-gray-300 dark:border-slate-500'}`}>
                        {selected && <span className="text-xs leading-none">✓</span>}
                      </span>
                      <span>{nodeEmoji[entry.typeKey] ?? '🔗'}</span>
                      <span className="flex-1 truncate">{entry.label}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">{typeLabel}</span>
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Inline item creation */}
          {!showInlineCreate ? (
            <button
              onClick={() => setShowInline(true)}
              className="flex items-center gap-1.5 text-xs text-pink-500 hover:text-pink-600 transition-colors self-start"
            >
              <PackagePlus size={13} />
              Item hinzufügen +
            </button>
          ) : (
            <div className="rounded-xl border border-pink-200 dark:border-pink-900 bg-pink-50 dark:bg-pink-950/30 p-3 flex flex-col gap-2">
              <p className="text-xs font-semibold text-pink-600 dark:text-pink-400">Neues Item anlegen & verknüpfen</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  autoFocus
                  className="rounded-lg border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 px-2.5 py-1.5 text-sm outline-none focus:border-pink-400 placeholder-gray-400 dark:placeholder-slate-500"
                  placeholder="Name *"
                  value={inlineName}
                  onChange={e => setInlineName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInlineCreate()}
                />
                <input
                  className="rounded-lg border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 px-2.5 py-1.5 text-sm outline-none focus:border-pink-400 placeholder-gray-400 dark:placeholder-slate-500"
                  placeholder="Mod (optional)"
                  value={inlineMod}
                  onChange={e => setInlineMod(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInlineCreate()}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleInlineCreate} disabled={!inlineName.trim()}>
                  <Plus size={12} />
                  Erstellen & verknüpfen
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowInline(false); setInlineName(''); setInlineMod('') }}>
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={handleClose}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={!form.title.trim()}>Speichern</Button>
        </div>

      </div>
    </Modal>
  )
}
