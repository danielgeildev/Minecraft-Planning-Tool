/**
 * Mappers: convert between Zustand store shapes (camelCase) and Supabase rows (snake_case).
 * Phase 2 covers quests, settings (profiles), and inventory.
 */

import type { QuestNode, InventoryItem } from '@/types'

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
