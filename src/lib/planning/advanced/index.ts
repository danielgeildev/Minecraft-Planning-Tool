/**
 * Advanced decision-making logic — pure functions, no UI, no store imports.
 *
 * getNextBestAction: returns the single best node to work on right now,
 * scored by unlock-impact, effort, and partial inventory progress.
 */

import type { AnyNode, InventoryItem } from '@/types'
import { isNodeDone } from '@/types'
import { isUnlocked } from '@/lib/progression'
import { getRequiredNodesForGoal, getNextStepsForGoal } from '@/lib/planning'
import { getInventoryAmount } from '@/lib/inventory'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionRecommendation {
  node:          AnyNode
  reason:        string
  impactPercent: number           // % of goal completion this step represents
  unlocksCount:  number           // how many other nodes this directly unblocks
  effortLevel:   'low' | 'medium' | 'high' | undefined
  score:         number           // internal score (lower = better)
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

const EFFORT_SCORE: Record<string, number> = { low: 1, medium: 2, high: 3 }

function scoreNode(
  node:     AnyNode,
  required: AnyNode[],
  allNodes: AnyNode[],
  inventory: InventoryItem[],
  totalRequired: number,
): { unlocksCount: number; effortScore: number; partialBonus: number; impactPercent: number } {
  const effortScore = EFFORT_SCORE[node.effort ?? 'medium'] ?? 2

  // How many currently-locked required nodes become directly unlocked when this node is done?
  const unlocksCount = required.filter(n => {
    if (isNodeDone(n)) return false
    if (isUnlocked(n.id, allNodes)) return false  // already unlocked, wouldn't change

    // Check: if node.id were marked done, would all of n's requires be satisfied?
    const remainingBlocks = n.dependencies
      .filter(d => d.type === 'requires')
      .filter(d => {
        if (d.targetId === node.id) return false  // this one would be done
        const dep = allNodes.find(x => x.id === d.targetId)
        return dep ? !isNodeDone(dep) : false
      })
    return remainingBlocks.length === 0
  }).length

  // Partial inventory bonus: prefer nodes where we already have some materials
  const haveAmount   = getInventoryAmount(node.id, inventory)
  const partialBonus = haveAmount > 0 ? 1 : 0

  const impactPercent = totalRequired > 0 ? Math.round((1 / totalRequired) * 100) : 0

  return { unlocksCount, effortScore, partialBonus, impactPercent }
}

// ─── getNextBestAction ────────────────────────────────────────────────────────

/**
 * Returns the single best node to work on for the given goal.
 *
 * Scoring (lower = better):
 *   primary:   maximize nodes unlocked  (-unlocksCount * 10)
 *   secondary: minimize effort           (+effortScore)
 *   tertiary:  prefer partial progress   (-partialBonus * 0.5)
 */
export function getNextBestAction(
  goalNodeId: string,
  allNodes:   AnyNode[],
  inventory:  InventoryItem[],
): ActionRecommendation | null {
  const nextSteps = getNextStepsForGoal(goalNodeId, allNodes)
  if (nextSteps.length === 0) return null

  const required     = getRequiredNodesForGoal(goalNodeId, allNodes)
  const totalRequired = required.length + 1  // +1 for the goal itself

  const scored = nextSteps.map(node => {
    const { unlocksCount, effortScore, partialBonus, impactPercent } =
      scoreNode(node, required, allNodes, inventory, totalRequired)

    const score = -unlocksCount * 10 + effortScore - partialBonus * 0.5

    return { node, unlocksCount, effortScore, partialBonus, impactPercent, score }
  })

  scored.sort((a, b) => a.score - b.score)

  const best = scored[0]
  if (!best) return null

  // Build human-readable reason
  let reason: string
  if (best.unlocksCount > 1) {
    reason = `Schaltet ${best.unlocksCount} weitere Schritte frei`
  } else if (best.unlocksCount === 1) {
    reason = `Schaltet den nächsten Schritt frei`
  } else if (best.node.effort === 'low') {
    reason = `Günstigster nächster Schritt`
  } else if (best.partialBonus > 0) {
    reason = `Du hast bereits Materialien dafür`
  } else {
    reason = `Nächster verfügbarer Schritt`
  }

  return {
    node:          best.node,
    reason,
    impactPercent: best.impactPercent,
    unlocksCount:  best.unlocksCount,
    effortLevel:   best.node.effort,
    score:         best.score,
  }
}

// ─── getGlobalNextBestAction ──────────────────────────────────────────────────

/**
 * Best action across ALL active goals combined.
 * Returns the globally highest-impact, lowest-effort step.
 */
export function getGlobalNextBestAction(
  goals:    { targetNodeId: string }[],
  allNodes: AnyNode[],
  inventory: InventoryItem[],
): (ActionRecommendation & { goalNodeId: string }) | null {
  const recommendations = goals
    .map(g => {
      const rec = getNextBestAction(g.targetNodeId, allNodes, inventory)
      return rec ? { ...rec, goalNodeId: g.targetNodeId } : null
    })
    .filter((r): r is ActionRecommendation & { goalNodeId: string } => r !== null)

  if (recommendations.length === 0) return null

  recommendations.sort((a, b) => a.score - b.score)
  return recommendations[0]
}
