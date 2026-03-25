'use client'

import { useState } from 'react'
import { Pencil, Trash2, MapPin, Palette, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BuildingImage } from '@/components/buildings/BuildingImage'
import type { Building, BuildingRequirement, BuildingStatus } from '@/types'
import { RelatedNotes } from '@/components/notes/RelatedNotes'
import { useItemStore } from '@/store/useItemStore'

const statusConfig: Record<BuildingStatus, { label: string; variant: 'gray' | 'amber' | 'green' }> = {
  planned:     { label: 'Geplant',  variant: 'gray'  },
  'in-progress': { label: 'Im Bau', variant: 'amber' },
  done:        { label: 'Fertig ✓', variant: 'green' },
}

interface BuildingCardProps {
  building: Building
  onEdit:         (building: Building) => void
  onDelete:       (id: string) => void
  onStatusChange: (id: string, status: BuildingStatus) => void
}

export function BuildingCard({ building, onEdit, onDelete, onStatusChange }: BuildingCardProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const items = useItemStore(s => s.items)

  type ReqWithItem = { req: BuildingRequirement; item: NonNullable<ReturnType<typeof items.find>> }
  const reqItems = (building.itemRequirements ?? [])
    .map(req => ({ req, item: items.find(i => i.id === req.itemId) }))
    .filter((x): x is ReqWithItem => !!x.item)

  const status = statusConfig[building.status]
  const nextStatus: BuildingStatus =
    building.status === 'planned' ? 'in-progress' :
    building.status === 'in-progress' ? 'done' : 'planned'

  const pics = building.inspoPics ?? []

  const openLightbox = (i: number) => setLightboxIdx(i)
  const closeLightbox = () => setLightboxIdx(null)
  const prevImage = () => setLightboxIdx(i => i !== null ? (i - 1 + pics.length) % pics.length : null)
  const nextImage = () => setLightboxIdx(i => i !== null ? (i + 1) % pics.length : null)

  return (
    <>
      <div className={`bg-white rounded-2xl border p-4 shadow-sm ${building.status === 'done' ? 'border-emerald-100' : 'border-rose-100'}`}>
        {/* Thumbnail strip */}
        {pics.length > 0 && (
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5">
            {pics.map((ref, i) => (
              <button
                key={i}
                onClick={() => openLightbox(i)}
                className="flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border border-rose-100 hover:border-pink-300 transition-colors"
              >
                <BuildingImage imageRef={ref} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏗️</span>
            <h3 className="font-semibold text-gray-800 text-sm">{building.name}</h3>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(building)} className="!p-1.5">
              <Pencil size={13} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(building.id)} className="!p-1.5 hover:text-red-400">
              <Trash2 size={13} />
            </Button>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-2 flex flex-col gap-1">
          {building.location && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin size={11} />
              <span>{building.location}</span>
            </div>
          )}
          {building.style && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Palette size={11} />
              <span>{building.style}</span>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="mt-3 flex items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          <button
            onClick={() => onStatusChange(building.id, nextStatus)}
            className="text-xs text-pink-500 hover:text-pink-600 transition-colors"
          >
            → {statusConfig[nextStatus].label}
          </button>
        </div>

        {/* Requirements */}
        {building.requirements.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Anforderungen</p>
            <ul className="flex flex-col gap-1">
              {building.requirements.map((req, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-300 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Material-Anforderungen */}
        {reqItems.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">📦 Materialien</p>
            <div className="flex flex-col gap-2">
              {reqItems.map(({ req, item }) => {
                const done = req.preparedAmount >= req.requiredAmount
                const pct  = req.requiredAmount > 0
                  ? Math.min(100, Math.round((req.preparedAmount / req.requiredAmount) * 100))
                  : 100
                return (
                  <div key={req.itemId}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className={`truncate flex-1 ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-slate-300'}`}>
                        {item.name}
                      </span>
                      <span className={`ml-2 flex-shrink-0 font-medium tabular-nums ${done ? 'text-emerald-500' : 'text-gray-400 dark:text-slate-500'}`}>
                        {done ? '✓ fertig' : `${req.preparedAmount} / ${req.requiredAmount}`}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-rose-100/60 dark:bg-slate-600">
                      <div
                        className={`h-full rounded-full transition-all ${done ? 'bg-emerald-400' : 'bg-pink-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {building.notes && (
          <p className="mt-3 text-xs text-gray-400 italic border-t border-rose-50 pt-2">
            {building.notes}
          </p>
        )}

        <RelatedNotes nodeId={building.id} />
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && pics.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            {/* Image */}
            <BuildingImage
              imageRef={pics[lightboxIdx]}
              alt={`Screenshot ${lightboxIdx + 1}`}
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />

            {/* Nav arrows */}
            {pics.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            {/* Counter */}
            <p className="text-center text-white/60 text-xs mt-3">
              {lightboxIdx + 1} / {pics.length}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
