'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, X, ImagePlus, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { BuildingImage } from '@/components/buildings/BuildingImage'
import { saveImage, deleteImage, isDataUrl } from '@/lib/imageStorage'
import type { Building, BuildingStatus, ItemNode } from '@/types'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

interface BuildingFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialData?: Building | null
  allItems?: ItemNode[]
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

export function BuildingForm({ open, onClose, onSubmit, initialData, allItems = [] }: BuildingFormProps) {
  const [form, setForm]               = useState(emptyForm)
  const [linkedItemIds, setLinkedItemIds] = useState<string[]>([])
  const [itemSearch, setItemSearch]   = useState('')
  const [newReq, setNewReq]           = useState('')
  const [dragOver, setDragOver]       = useState(false)
  const [imageError, setImageError]   = useState<string | null>(null)
  // Track keys added during this session so we can clean up on cancel
  const newKeysRef = useRef<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // IDs of all known items (for filtering non-item deps on submit)
  const allItemIdSet = new Set(allItems.map(i => i.id))

  useEffect(() => {
    if (open) {
      newKeysRef.current = []
      setImageError(null)
      setItemSearch('')
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
        // Populate linked items from existing requires-deps that point to known items
        setLinkedItemIds(
          initialData.dependencies
            .filter(d => d.type === 'requires' && allItemIdSet.has(d.targetId))
            .map(d => d.targetId)
        )
      } else {
        setForm(emptyForm)
        setLinkedItemIds([])
      }
      setNewReq('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, open])

  const toggleItem = (id: string) =>
    setLinkedItemIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )

  const filteredItems = allItems.filter(item =>
    !itemSearch ||
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.mod.toLowerCase().includes(itemSearch.toLowerCase())
  )

  const addRequirement = () => {
    const trimmed = newReq.trim()
    if (!trimmed) return
    setForm(p => ({ ...p, requirements: [...p.requirements, trimmed] }))
    setNewReq('')
  }

  const removeRequirement = (i: number) =>
    setForm(p => ({ ...p, requirements: p.requirements.filter((_, idx) => idx !== i) }))

  const removeImage = (i: number) => {
    const key = form.inspoPics[i]
    // Delete from IndexedDB immediately if it's a key (not a legacy data URL)
    if (!isDataUrl(key)) {
      deleteImage(key).catch(() => {/* best-effort */})
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
        .catch(() => {
          setImageError(`"${file.name}" konnte nicht gespeichert werden.`)
        })
    })
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return
    // Preserve non-item deps (e.g. building→building from graph) + new item requires
    const preservedDeps = (initialData?.dependencies ?? []).filter(
      d => !(d.type === 'requires' && allItemIdSet.has(d.targetId))
    )
    const itemDeps = linkedItemIds.map(id => ({ targetId: id, type: 'requires' as const }))
    onSubmit({
      ...form,
      type: 'building',
      dependencies: [...preservedDeps, ...itemDeps],
    })
    newKeysRef.current = [] // committed — don't clean up on close
    onClose()
  }

  const handleClose = () => {
    // Clean up any newly-added images that weren't submitted
    const keysToClean = newKeysRef.current.filter(k => form.inspoPics.includes(k))
    if (keysToClean.length > 0) {
      import('@/lib/imageStorage').then(({ deleteImages }) => {
        deleteImages(keysToClean).catch(() => {/* best-effort */})
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

        {/* Requirements */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Anforderungen</p>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-colors"
              placeholder="Neue Anforderung..."
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
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs text-gray-700">
                  <span>{req}</span>
                  <button onClick={() => removeRequirement(i)} className="text-gray-400 hover:text-red-400 transition-colors">
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Linked Items */}
        {allItems.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Verknüpfte Items
                {linkedItemIds.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-pink-100 dark:bg-pink-900 text-pink-500">{linkedItemIds.length}</span>
                )}
              </p>
            </div>

            {/* Selected items */}
            {linkedItemIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {linkedItemIds.map(id => {
                  const item = allItems.find(i => i.id === id)
                  if (!item) return null
                  return (
                    <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900">
                      📦 {item.name}
                      <button onClick={() => toggleItem(id)} className="hover:text-red-400 transition-colors">
                        <X size={10} />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}

            {/* Search + list */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-slate-600 px-3 py-2">
              <Search size={13} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
              <input
                className="flex-1 text-sm outline-none placeholder-gray-400 dark:placeholder-slate-500 bg-transparent text-gray-800 dark:text-slate-100"
                placeholder="Items suchen..."
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
              />
            </div>
            <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5 rounded-xl border border-rose-100 dark:border-slate-700 p-1">
              {filteredItems.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500 px-2 py-2 text-center">Keine Items gefunden</p>
              ) : (
                filteredItems.map(item => {
                  const selected = linkedItemIds.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors text-sm ${
                        selected
                          ? 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                          : 'hover:bg-rose-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected ? 'bg-pink-400 border-pink-400 text-white' : 'border-gray-300 dark:border-slate-500'}`}>
                        {selected && <span className="text-xs leading-none">✓</span>}
                      </span>
                      <span className="flex-1 truncate">📦 {item.name}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500 truncate max-w-20">{item.mod}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Screenshots / Inspo-Pics */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Screenshots & Inspo-Bilder</p>

          {/* Drop zone */}
          <div
            className={`
              relative rounded-xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer
              ${dragOver ? 'border-pink-400 bg-pink-50' : 'border-rose-200 hover:border-pink-300 hover:bg-rose-50'}
            `}
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

          {/* Error */}
          {imageError && (
            <p className="text-xs text-red-500 rounded-lg bg-red-50 px-3 py-2">{imageError}</p>
          )}

          {/* Preview grid */}
          {form.inspoPics.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {form.inspoPics.map((ref, i) => (
                <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-rose-100">
                  <BuildingImage
                    imageRef={ref}
                    alt={`Screenshot ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
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
