/**
 * Mappers: convert between Zustand store shapes (camelCase) and Supabase rows (snake_case).
 */

import type { QuestNode, ItemNode, Building, Goal, InventoryItem } from '@/types'
import type { NoteNode } from '@/types/note'
import type { XpLogEntry } from '@/store/useProgressStore'

// ─── Quest ───────────────────────────────────────────────────────────────────

export function questToRow(q: QuestNode, userId: string) {
  return {
    id:            q.id,
    user_id:       userId,
    title:         q.title,
    description:   q.description,
    status:        q.status,
    priority:      q.priority,
    category:      q.category,
    parent_id:     q.parentId,
    dependencies:  q.dependencies,
    effort:        q.effort ?? null,
    time_estimate: q.timeEstimate ?? null,
    notes:         q.notes,
    created_at:    q.createdAt,
    updated_at:    q.updatedAt,
  }
}

export function rowToQuest(row: Record<string, unknown>): QuestNode {
  return {
    id:           row.id as string,
    type:         'quest',
    title:        row.title as string,
    description:  row.description as string,
    status:       row.status as QuestNode['status'],
    priority:     row.priority as QuestNode['priority'],
    category:     row.category as QuestNode['category'],
    parentId:     (row.parent_id as string) ?? null,
    dependencies: (row.dependencies ?? []) as QuestNode['dependencies'],
    effort:       (row.effort as QuestNode['effort']) ?? undefined,
    timeEstimate: (row.time_estimate as number) ?? undefined,
    notes:        row.notes as string,
    createdAt:    row.created_at as string,
    updatedAt:    row.updated_at as string,
  }
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export function inventoryToRow(item: InventoryItem, userId: string) {
  return {
    user_id: userId,
    node_id: item.nodeId,
    amount:  item.amount,
  }
}

export function rowToInventoryItem(row: Record<string, unknown>): InventoryItem {
  return {
    nodeId: row.node_id as string,
    amount: row.amount as number,
  }
}

// ─── Item ────────────────────────────────────────────────────────────────────

export function itemToRow(i: ItemNode, userId: string) {
  return {
    id:            i.id,
    user_id:       userId,
    name:          i.name,
    mod:           i.mod,
    status:        i.status,
    reason:        i.reason,
    purpose:       i.purpose,
    dependencies:  i.dependencies,
    effort:        i.effort ?? null,
    time_estimate: i.timeEstimate ?? null,
    notes:         i.notes,
    created_at:    i.createdAt,
    updated_at:    i.updatedAt,
  }
}

export function rowToItem(row: Record<string, unknown>): ItemNode {
  return {
    id:           row.id as string,
    type:         'item',
    name:         row.name as string,
    mod:          row.mod as string,
    status:       row.status as ItemNode['status'],
    reason:       row.reason as string,
    purpose:      row.purpose as string,
    dependencies: (row.dependencies ?? []) as ItemNode['dependencies'],
    effort:       (row.effort as ItemNode['effort']) ?? undefined,
    timeEstimate: (row.time_estimate as number) ?? undefined,
    notes:        row.notes as string,
    createdAt:    row.created_at as string,
    updatedAt:    row.updated_at as string,
  }
}

// ─── Building ────────────────────────────────────────────────────────────────

export function buildingToRow(b: Building, userId: string) {
  return {
    id:                b.id,
    user_id:           userId,
    name:              b.name,
    location:          b.location,
    style:             b.style,
    status:            b.status,
    requirements:      b.requirements,
    item_requirements: b.itemRequirements,
    inspo_pics:        b.inspoPics,
    dependencies:      b.dependencies,
    notes:             b.notes,
    created_at:        b.createdAt,
    updated_at:        b.updatedAt,
  }
}

export function rowToBuilding(row: Record<string, unknown>): Building {
  return {
    id:               row.id as string,
    type:             'building',
    name:             row.name as string,
    location:         row.location as string,
    style:            row.style as string,
    status:           row.status as Building['status'],
    requirements:     (row.requirements ?? []) as string[],
    itemRequirements: (row.item_requirements ?? []) as Building['itemRequirements'],
    inspoPics:        (row.inspo_pics ?? []) as string[],
    dependencies:     (row.dependencies ?? []) as Building['dependencies'],
    notes:            row.notes as string,
    createdAt:        row.created_at as string,
    updatedAt:        row.updated_at as string,
  }
}

// ─── Goal ────────────────────────────────────────────────────────────────────

export function goalToRow(g: Goal, userId: string) {
  return {
    id:              g.id,
    user_id:         userId,
    target_node_id:  g.targetNodeId,
    note:            g.note ?? null,
    parent_goal_id:  g.parentGoalId ?? null,
    created_at:      g.createdAt,
  }
}

export function rowToGoal(row: Record<string, unknown>): Goal {
  return {
    id:           row.id as string,
    targetNodeId: row.target_node_id as string,
    createdAt:    row.created_at as string,
    note:         (row.note as string) ?? undefined,
    parentGoalId: (row.parent_goal_id as string) ?? undefined,
  }
}

// ─── Note ────────────────────────────────────────────────────────────────────

export function noteToRow(n: NoteNode, userId: string) {
  return {
    id:              n.id,
    user_id:         userId,
    title:           n.title,
    content:         n.content,
    images:          n.images,
    tags:            n.tags,
    linked_node_ids: n.linkedNodeIds,
    created_at:      n.createdAt,
    updated_at:      n.updatedAt,
  }
}

export function rowToNote(row: Record<string, unknown>): NoteNode {
  return {
    id:            row.id as string,
    type:          'note',
    title:         row.title as string,
    content:       row.content as string,
    images:        (row.images ?? []) as string[],
    tags:          (row.tags ?? []) as string[],
    linkedNodeIds: (row.linked_node_ids ?? []) as string[],
    createdAt:     row.created_at as string,
    updatedAt:     row.updated_at as string,
  }
}

// ─── Achievements (singleton per user) ───────────────────────────────────────

export function achievementsToRow(unlockedIds: string[], seenIds: string[], userId: string) {
  return {
    user_id:      userId,
    unlocked_ids: unlockedIds,
    seen_ids:     seenIds,
  }
}

export function rowToAchievements(row: Record<string, unknown>): { unlockedIds: string[]; seenIds: string[] } {
  return {
    unlockedIds: (row.unlocked_ids ?? []) as string[],
    seenIds:     (row.seen_ids ?? []) as string[],
  }
}

// ─── Progress (singleton per user) ───────────────────────────────────────────

export function progressToRow(totalXp: number, xpLog: XpLogEntry[], userId: string) {
  return {
    user_id:  userId,
    total_xp: totalXp,
    xp_log:   xpLog,
  }
}

export function rowToProgress(row: Record<string, unknown>): { totalXp: number; xpLog: XpLogEntry[] } {
  return {
    totalXp: (row.total_xp as number) ?? 0,
    xpLog:   (row.xp_log ?? []) as XpLogEntry[],
  }
}

// ─── Graph Positions (singleton per user) ────────────────────────────────────

export function graphPositionsToRow(positions: Record<string, { x: number; y: number }>, userId: string) {
  return {
    user_id:   userId,
    positions: positions,
  }
}

export function rowToGraphPositions(row: Record<string, unknown>): Record<string, { x: number; y: number }> {
  return (row.positions ?? {}) as Record<string, { x: number; y: number }>
}
