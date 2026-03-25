export interface NoteNode {
  id: string
  title: string
  content: string
  images: string[]        // UUID keys → IndexedDB (legacy 'data:' also supported)
  tags: string[]
  linkedNodeIds: string[] // IDs of QuestNode | ItemNode | Building
  createdAt: string
  updatedAt: string
}
