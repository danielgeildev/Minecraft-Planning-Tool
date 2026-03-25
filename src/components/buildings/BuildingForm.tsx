'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, X, ImagePlus, Search, PackagePlus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { BuildingImage } from '@/components/buildings/BuildingImage'
import { saveImage, deleteImage, isDataUrl } from '@/lib/imageStorage'
import { useItemStore } from '@/store/useItemStore'
import type { Building, BuildingRequirement, BuildingStatus } from '@/types'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

interface BuildingFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialData?: Building | null
}

const emptyForm = {
  name: '',
  location: '',
  style: '',
  status: 'planned' as BuildingStatus,
  requirements: [] as string[],
  inspoPics: [] as string[],
  notes: '',
}

export function BuildingForm({ open, onClose, onSubmit, initialData }: BuildingFormProps) {
  const allItems = useItemStore(s => s.items)

  const [form, setForm]                   = useState(emptyForm)
  const [itemRequirements, setItemReqs]   = useState<BuildingRequirement[]>([])
  const [itemSearch, setItemSearch]       = useState('')
  const [newReq, setNewReq]               = useState('')
  const [dragOver, setDragOver]           = useState(false)
  const [imageError, setImageError]       = useState<string | null>(null)

  // Inline item-create state
  const [showInline, setShowInline]       = useState(false)
  const [inlineName, setInlineName]       = useState('')
  const [inlineMod, setInlineMod]         = useState('')

  const newKeysRef   = useRef<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      newKeysRef.current = []
      setImageError(null)
      setItemSearch('')
      setShowInline(false)
      setInlineName('')
      setInlineMod('')
      if (initialData) {
        setForm({
          name:         initialData.name,
          location:     initialData.location,
          style:        initialData.style,
          status:       initialData.status,
          requirements: [...initialData.requirements],
          inspoPics:    [...initialData.inspoPics],
          notes:        initialData.notes,
        })
        setItemReqs(initialData.itemRequirements ?? [])
      } else {
        setForm(emptyForm)
        setItemReqs([])
      }
      setNewReq('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, open])

  // ── Freitext-Anforderungen ─────────────────────────────────────────────────
  const addRequirement = () => {
    const trimmed = newReq.trim()
    if (!trimmed) return
    setForm(p => ({ ...p, requirements: [...p.requirements, trimmed] }))
    setNewReq('')
  }
  const removeRequirement = (i: number) =>
    setForm(p => ({ ...p, requirements: p.requirements.filter((_, idx) => idx !== i) }))

  // ── Item-Requirements ──────────────────────────────────────────────────────
  const addItemReq = (itemId: string) => {
    if (itemRequirements.some(r => r.itemId === itemId)) return
    setItemReqs(prev => [...prev, { itemId, requiredAmount: 1, preparedAmount: 0 }])
  }
  const removeItemReq = (itemId: string) =>
    setItemReqs(prev => prev.filter(r => r.itemId !== itemId))

  const updateItemReq = (itemId: string, field: 'requiredAmount' | 'preparedAmount', value: number) =>
    setItemReqs(prev => prev.map(r =>
      r.itemId === itemId ? { ...r, [field]: Math.max(0, isNaN(value) ? 0 : value) } : r
    ))

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
    // addItem prepends, so the new item is index 0
    const newItem = useItemStore.getState().items[0]
    addItemReq(newItem.id)
    setInlineName('')
    setInlineMod('')
    setShowInline(false)
  }

  // Items not yet in requirements, filtered by search
  const filteredItems = allItems
    .filter(item => !itemRequirements.some(r => r.itemId === item.id))
    .filter(item =>
      !itemSearch ||
      item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.mod.toLowerCase().includes(itemSearch.toLowerCase())
    )

  // ── Images ────────────────────────────────────────────────────────────────
  const removeImage = (i: number) => {
    const key = form.inspoPics[i]
    if (!isDataUrl(key)) {
      deleteImage(key).catch(() => {})
      newKeysRef.current = newKeysRef.current.filter(k => k !== key)
    }
    setForm(p => ({ ...p, inspoPics: p.inspoPics.filter((_, idx) => idx !== i) }))
  }

  const processFiles = (files: FileList | null) => {
    if (!files) return
    setImageError(null)
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError(`"${file.name}" ist zu groß (max. 5 MB pro Bild).`)
        return
      }
      const key = crypto.randomUUID()
      saveImage(key, file)
        .then(() => {
          newKeysRef.current.push(key)
          setForm(p => ({ ...p, inspoPics: [...p.inspoPics, key] }))
        })
        .catch(() => setImageError(`"${file.name}" konnte nicht gespeichert werden.`))
    })
  }

  // ── Submit / Close ─────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!form.name.trim()) return
    const allItemIds = new Set(allItems.map(i => i.id))
    // Preserve non-item graph deps (building→building edges from the graph editor)
    const preservedDeps = (initialData?.dependencies ?? []).filter(
      d => !(d.type === 'requires' && allItemIds.has(d.targetId))
    )
    // Sync item deps for graph edges
    const itemDeps = itemRequirements.map(r => ({ targetId: r.itemId, type: 'requires' as const }))
    onSubmit({
      ...form,
      type:             'building',
      itemRequirements,
      dependencies:     [...preservedDeps, ...itemDeps],
    })
    newKeysRef.current = []
    onClose()
  }

  const handleClose = () => {
    const keysToClean = newKeysRef.current.filter(k => form.inspoPics.includes(k))
    if (keysToClean.length > 0) {
      import('@/lib/imageStorage').then(({ deleteImages }) => {
        deleteImages(keysToClean).catch(() => {})
      })
    }
    newKeysRef.current = []
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={initialData ? 'Gebäude bearbeiten' : 'Neues Gebäude'}
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Name *"
          placeholder="z.B. Main Base"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ort"
            placeholder="z.B. Spawn, Overworld"
            value={form.location}
            onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value as BuildingStatus }))}
          >
            <option value="planned">Geplant</option>
            <option value="in-progress">Im Bau</option>
            <option value="done">Fertig</option>
          </Select>
        </div>

        <Input
          label="Stil"
          placeholder="z.B. Cozy Cottage, Modern Industrial"
          value={form.style}
          onChange={e => setForm(p => ({ ...p, style: e.target.value }))}
        />

        {/* ── Freitext-Anforderungen ─────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Anforderungen</p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-rose-200 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 px-3 py-2 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 dark:focus:ring-pink-900 transition-colors"
              placeholder="z.B. schöner Eingang, Deko..."
              value={newReq}
              onChange={e => setNewReq(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRequirement()}
            />
            <Button variant="secondary" size="sm" onClick={addRequirement}>
              <Plus size={14} />
            </Button>
          </div>
          {form.requirements.length > 0 && (
            <ul className="flex flex-col gap-1">
              {form.requirements.map((req, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-rose-50 dark:bg-slate-700 px-3 py-1.5 text-xs text-gray-700 dark:text-slate-300">
                  <span>{req}</span>
                  <button onClick={() => removeRequirement(i)} className="text-gray-400 hover:text-red-400 transition-colors">
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Material-Anforderungen ─────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
            📦 Material-Anforderungen
            {itemRequirements.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-pink-100 dark:bg-pink-900 text-pink-500">{itemRequirements.length}</span>
            )}
          </p>

          {/* Selected requirements with amount inputs */}
          {itemRequirements.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-xl border border-rose-100 dark:border-slate-700 p-2">
              {itemRequirements.map(req => {
                const item = allItems.find(i => i.id === req.itemId)
                if (!item) return null
                const done = req.preparedAmount >= req.requiredAmount
                return (
                  <div key={req.itemId} className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-slate-700 px-2.5 py-1.5">
                    <span className={`flex-1 truncate text-xs font-medium ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-slate-300'}`}>
                      {item.name}
                      {item.mod && <span className="ml-1 text-gray-400 dark:text-slate-500 font-normal">({item.mod})</span>}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-400 dark:text-slate-500">Fertig</span>
                      <input
                        type="number"
                        min="0"
                        value={req.preparedAmount || ''}
                        placeholder="0"
                        onChange={e => updateItemReq(req.itemId, 'preparedAmount', parseInt(e.target.value))}
                        className="w-14 rounded-lg border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-center text-xs outline-none focus:border-pink-400 dark:text-slate-100"
                      />
                      <span className="text-xs text-gray-300 dark:text-slate-600">/</span>
                      <input
                        type="number"
                        min="1"
                        value={req.requiredAmount || ''}
                        placeholder="1"
                        onChange={e => updateItemReq(req.itemId, 'requiredAmount', parseInt(e.target.value))}
                        className="w-14 rounded-lg border border-rose-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-center text-xs outline-none focus:border-pink-400 dark:text-slate-100"
                      />
                      <span className="text-xs text-gray-400 dark:text-slate-500">Nötig</span>
                    </div>
                    <button onClick={() => removeItemReq(req.itemId)} className="text-gray-300 dark:text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                      <X size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Search existing items */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-slate-600 px-3 py-2">
            <Search size={13} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
            <input
              className="flex-1 text-sm outline-none placeholder-gray-400 dark:placeholder-slate-500 bg-transparent text-gray-800 dark:text-slate-100"
              placeholder="Items suchen & hinzufügen..."
              value={itemSearch}
              onChange={e => setItemSearch(e.target.value)}
            />
          </div>

          {/* Items list */}
          <div className="max-h-36 overflow-y-auto flex flex-col gap-0.5 rounded-xl border border-rose-100 dark:border-slate-700 p-1">
            {filteredItems.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500 px-2 py-2 text-center">
                {allItems.length === 0 ? 'Noch keine Items vorhanden' : 'Keine weiteren Items gefunden'}
              </p>
            ) : (
              filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addItemReq(item.id)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors text-sm hover:bg-rose-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300"
                >
                  <Plus size={12} className="text-pink-400 flex-shrink-0" />
                  <span className="flex-1 truncate">📦 {item.name}</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 truncate max-w-20">{item.mod}</span>
                </button>
              ))
            )}
          </div>

          {/* Inline item create */}
          {!showInline ? (
            <button
              onClick={() => setShowInline(true)}
              className="flex items-center gap-1.5 text-xs text-pink-500 hover:text-pink-600 transition-colors self-start"
            >
              <PackagePlus size={13} />
              Neues Item anlegen
            </button>
          ) : (
            <div className="rounded-xl border border-pink-200 dark:border-pink-900 bg-pink-50 dark:bg-pink-950/30 p-3 flex flex-col gap-2">
              <p className="text-xs font-semibold text-pink-600 dark:text-pink-400">Neues Item anlegen</p>
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
                  Erstellen & hinzufügen
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowInline(false); setInlineName(''); setInlineMod('') }}>
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Screenshots ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Screenshots & Inspo-Bilder</p>
          <div
            className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer ${dragOver ? 'border-pink-400 bg-pink-50' : 'border-rose-200 hover:border-pink-300 hover:bg-rose-50 dark:hover:bg-slate-800'}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files) }}
          >
            <ImagePlus size={20} className="mx-auto mb-1 text-rose-300" />
            <p className="text-xs text-gray-400">Klicken oder Bilder hierher ziehen</p>
            <p className="text-xs text-gray-300 mt-0.5">PNG, JPG, WebP · max. 5 MB pro Bild</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => { processFiles(e.target.files); e.target.value = '' }}
            />
          </div>
          {imageError && (
            <p className="text-xs text-red-500 rounded-lg bg-red-50 px-3 py-2">{imageError}</p>
          )}
          {form.inspoPics.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {form.inspoPics.map((ref, i) => (
                <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-rose-100">
                  <BuildingImage imageRef={ref} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Textarea
          label="Notizen"
          placeholder="Inspo, Ideen, Links..."
          value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          rows={3}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={handleClose}>Abbrechen</Button>
          <Button onClick={handleSubmit} disabled={!form.name.trim()}>
            {initialData ? 'Speichern' : 'Erstellen'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
