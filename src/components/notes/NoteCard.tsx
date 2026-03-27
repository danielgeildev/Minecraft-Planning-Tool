'use client'

import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RichTextDisplay } from '@/components/ui/RichTextDisplay'
import { NoteImage } from './NoteImage'
import { ImageLightbox } from '@/components/ui/ImageLightbox'
import type { NoteNode } from '@/types/note'
import type { AnyNode } from '@/types'
import { getNodeTitle } from '@/types'

const nodeEmoji: Record<string, string> = {
  quest:    '📋',
  item:     '📦',
  building: '🏗️',
  note:     '📝',
}

interface NoteCardProps {
  note:      NoteNode
  allNodes:  AnyNode[]
  allNotes?: NoteNode[]
  onEdit:    (note: NoteNode) => void
  onDelete:  (id: string) => void
}

export function NoteCard({ note, allNodes, allNotes = [], onEdit, onDelete }: NoteCardProps) {
  const [expanded, setExpanded]       = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  type LinkedEntry = { id: string; label: string; typeKey: string }
  const linkedEntries: LinkedEntry[] = note.linkedNodeIds.flatMap(id => {
    const node = allNodes.find(n => n.id === id)
    if (node) return [{ id: node.id, label: getNodeTitle(node), typeKey: node.type }]
    const linked = allNotes.find(n => n.id === id)
    if (linked) return [{ id: linked.id, label: linked.title, typeKey: 'note' }]
    return []
  })

  const date = new Date(note.updatedAt).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  })

  return (
    <>
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <button
          className="flex-1 text-left"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">📝</span>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100 leading-tight">{note.title}</h3>
            {expanded ? <ChevronUp size={13} className="text-gray-400 ml-auto flex-shrink-0" /> : <ChevronDown size={13} className="text-gray-400 ml-auto flex-shrink-0" />}
          </div>
        </button>
        <div className="flex gap-1 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onEdit(note)} className="!p-1.5">
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(note.id)} className="!p-1.5 hover:text-red-400">
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* Content preview / full */}
      {note.content && (
        <div className={`mt-2 text-gray-600 dark:text-slate-400 ${expanded ? '' : ''}`}>
          <RichTextDisplay content={note.content} clamp={!expanded} />
        </div>
      )}

      {/* Images (only when expanded) — clickable for lightbox */}
      {note.images.length > 0 && expanded && (
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
          {note.images.map((ref, i) => (
            <button
              key={i}
              onClick={() => setLightboxIdx(i)}
              className="flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border border-rose-100 dark:border-slate-600 hover:border-pink-300 dark:hover:border-pink-600 transition-colors"
            >
              <NoteImage imageRef={ref} alt={`Bild ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {note.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 dark:bg-pink-950 text-pink-500 dark:text-pink-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Linked nodes */}
      {linkedEntries.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {linkedEntries.map(entry => (
            <span
              key={entry.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-rose-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
            >
              <span>{nodeEmoji[entry.typeKey] ?? '🔗'}</span>
              <span className="truncate max-w-24">{entry.label}</span>
            </span>
          ))}
        </div>
      )}

      {/* Footer: image count + date */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-slate-500">
        <div className="flex items-center gap-2">
          {note.images.length > 0 && (
            <span>🖼️ {note.images.length}</span>
          )}
        </div>
        <span>{date}</span>
      </div>
    </div>

    {lightboxIdx !== null && (
      <ImageLightbox
        imageRefs={note.images}
        initialIndex={lightboxIdx}
        onClose={() => setLightboxIdx(null)}
        renderImage={(ref, cls) => (
          <NoteImage imageRef={ref} alt="" className={cls} />
        )}
      />
    )}
    </>
  )
}
