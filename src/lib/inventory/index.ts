/**
 * Inventory-aware resource calculations — pure functions, no UI, no store imports.
 */

import type { AnyNode, InventoryItem } from '@/types'
import { isNodeDone } from '@/types'
import { calculateTotalResources, type ResourceRequirement } from '@/lib/planning'

// ─── Extended Resource Requirement ────────────────────────────────────────────

export interface ExtendedResourceRequirement extends ResourceRequirement {
  haveAmount:      number   // from inventory
  remainingAmount: number   // max(0, totalAmount - haveAmount)
  partialPercent:  number   // 0–100
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getInventoryAmount(nodeId: string, inventory: InventoryItem[]): number {
  return inventory.find(i => i.nodeId === nodeId)?.amount ?? 0
}

export function getPartialProgress(
  nodeId: string,
  totalNeeded: number,
  inventory: InventoryItem[],
): { have: number; need: number; total: number; percent: number } {
  const have    = getInventoryAmount(nodeId, inventory)
  const need    = Math.max(0, totalNeeded - have)
  const percent = totalNeeded > 0 ? Math.min(100, Math.round((have / totalNeeded) * 100)) : 0
  return { have, need, total: totalNeeded, percent }
}

// ─── Remaining Resources ──────────────────────────────────────────────────────

/**
 * Like calculateTotalResources but subtracts inventory amounts.
 * Shows: totalAmount, haveAmount, remainingAmount, partialPercent.
 */
export function calculateRemainingResources(
  goalNodeId: string,
  allNodes:   AnyNode[],
  inventory:  InventoryItem[],
): ExtendedResourceRequirement[] {
  const total = calculateTotalResources(goalNodeId, allNodes)

  return total
    .map(req => {
      const haveAmount      = getInventoryAmount(req.nodeId, inventory)
      const remainingAmount = Math.max(0, req.totalAmount - haveAmount)
      const partialPercent  = req.totalAmount > 0
        ? Math.min(100, Math.round((haveAmount / req.totalAmount) * 100))
        : 0

      return {
        ...req,
        haveAmount,
        remainingAmount,
        isDone: remainingAmount === 0 || isNodeDone(req.node),
        partialPercent,
      }
    })
    .sort((a, b) => {
      if (a.isDone !== b.isDone) return a.isDone ? 1 : -1
      // among incomplete: sort by partial progress descending (closest to done first)
      return b.partialPercent - a.partialPercent
    })
}
