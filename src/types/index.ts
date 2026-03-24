// ─── Shared Graph Types ───────────────────────────────────────────────────────

export interface Dependency {
  targetId: string
  type: 'requires' | 'unlocks' | 'related'
  amount?: number   // crafting: how many of targetId are needed to make 1 of this
}

export type EffortLevel = 'low' | 'medium' | 'high'

// ─── Quest ────────────────────────────────────────────────────────────────────

export type QuestStatus   = 'open' | 'in-progress' | 'done'
export type QuestPriority = 'low' | 'medium' | 'high'
export type QuestCategory =
  | 'progression' | 'building' | 'farming'
  | 'exploration' | 'crafting' | 'automation' | 'other'

export interface QuestNode {
  id: string
  type: 'quest'
  title: string
  description: string
  status: QuestStatus
  priority: QuestPriority
  category: QuestCategory
  parentId: string | null
  dependencies: Dependency[]
  effort?: EffortLevel
  timeEstimate?: number   // minutes
  notes: string
  createdAt: string
  updatedAt: string
}

// ─── Item ─────────────────────────────────────────────────────────────────────

export type ItemStatus = 'needed' | 'collecting' | 'have'

export interface ItemNode {
  id: string
  type: 'item'
  name: string
  mod: string
  status: ItemStatus
  reason: string
  purpose: string
  dependencies: Dependency[]
  effort?: EffortLevel
  timeEstimate?: number   // minutes
  notes: string
  createdAt: string
  updatedAt: string
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface InventoryItem {
  nodeId: string
  amount: number
}

export type AnyNode = QuestNode | ItemNode

// ─── Goal ─────────────────────────────────────────────────────────────────────

export interface Goal {
  id: string
  targetNodeId: string
  createdAt: string
  note?: string           // personal reason/context for this goal
  parentGoalId?: string   // set when this is a subgoal of another goal
}

// ─── Building (not in graph) ──────────────────────────────────────────────────

export type BuildingStatus = 'planned' | 'in-progress' | 'done'

export interface Building {
  id: string
  name: string
  location: string
  style: string
  status: BuildingStatus
  requirements: string[]
  inspoPics: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getNodeTitle(node: AnyNode): string {
  return node.type === 'quest' ? node.title : node.name
}

export function isNodeDone(node: AnyNode): boolean {
  return node.status === 'done' || node.status === 'have'
}
