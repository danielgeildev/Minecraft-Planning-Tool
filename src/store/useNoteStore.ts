'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { NoteNode } from '@/types/note'

interface NoteStore {
  notes: NoteNode[]
  _dataVersion: number
  lastDeleted: NoteNode | null

  initializeIfNeeded: () => void
  addNote:    (note: Omit<NoteNode, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateNote: (id: string, updates: Partial<NoteNode>) => void
  deleteNote: (id: string) => void
  undoDelete: () => void
  getNoteById: (id: string) => NoteNode | undefined
}

const safeStorage = createJSONStorage(() =>
  typeof window !== 'undefined'
    ? localStorage
    : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)
)

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      notes:        [],
      _dataVersion: 0,
      lastDeleted:  null,

      initializeIfNeeded: () => {
        if (get()._dataVersion === 0) {
          set({ _dataVersion: 1 })
        }
      },

      addNote: (data) => {
        const now = new Date().toISOString()
        const note: NoteNode = {
          ...data,
          id:        crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        }
        set(s => ({ notes: [note, ...s.notes] }))
      },

      updateNote: (id, updates) =>
        set(s => ({
          notes: s.notes.map(n =>
            n.id === id
              ? { ...n, ...updates, updatedAt: new Date().toISOString() }
              : n
          ),
        })),

      deleteNote: (id) => {
        const target = get().notes.find(n => n.id === id) ?? null
        set(s => ({
          lastDeleted: target,
          notes: s.notes.filter(n => n.id !== id),
        }))
      },

      undoDelete: () => {
        const { lastDeleted } = get()
        if (lastDeleted) {
          set(s => ({ notes: [lastDeleted, ...s.notes], lastDeleted: null }))
        }
      },

      getNoteById: (id) => get().notes.find(n => n.id === id),
    }),
    {
      name:          'atm10-notes-v1',
      storage:       safeStorage,
      skipHydration: true,
      partialize: (s) => ({
        notes:        s.notes,
        _dataVersion: s._dataVersion,
      }),
    }
  )
)
