'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useNoteStore } from '@/store/useNoteStore'

interface RelatedNotesProps {
  nodeId: string
}

export function RelatedNotes({ nodeId }: RelatedNotesProps) {
  const allNotes = useNoteStore(s => s.notes)
  const notes = useMemo(
    () => allNotes.filter(n => n.linkedNodeIds.includes(nodeId)),
    [allNotes, nodeId],
  )

  if (notes.length === 0) return null

  return (
    <div className="mt-3 pt-3 border-t border-rose-50 dark:border-slate-700">
      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">
        📝 Verwandte Notizen ({notes.length})
      </p>
      <div className="flex flex-col gap-1">
        {notes.map(note => (
          <Link
            key={note.id}
            href="/notes"
            className="block rounded-lg bg-rose-50 dark:bg-slate-700 px-2.5 py-1.5 hover:bg-pink-50 dark:hover:bg-slate-600 transition-colors"
          >
            <p className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate">{note.title}</p>
            {note.tags.length > 0 && (
              <p className="text-xs text-pink-400 mt-0.5 truncate">{note.tags.join(' · ')}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
