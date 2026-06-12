import { describe, it, expect } from 'vitest'
import {
  getRequiredNodesForGoal,
  getNextStepsForGoal,
  getBlockingNodesForGoal,
  getGoalProgress,
  calculateTotalResources,
} from './index'
import type { AnyNode, ItemNode, QuestNode, Dependency, ItemStatus, QuestStatus } from '@/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function item(id: string, status: ItemStatus, deps: Dependency[] = []): ItemNode {
  return {
    id, type: 'item', name: id, mod: 'test', status,
    reason: '', purpose: '', dependencies: deps, notes: '',
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  }
}

function quest(id: string, status: QuestStatus, deps: Dependency[] = []): QuestNode {
  return {
    id, type: 'quest', title: id, description: '', status,
    priority: 'medium', category: 'other', parentId: null,
    dependencies: deps, notes: '',
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  }
}

const req = (targetId: string, amount?: number): Dependency =>
  ({ targetId, type: 'requires', amount })

/**
 * Crafting diamond:
 *   me-controller ── requires 8× fluix, 1× acceptor
 *   fluix         ── requires 1× certus
 *   acceptor      ── requires 2× certus
 *   certus        ── no deps (raw material)
 */
function diamondGraph(certusStatus: ItemStatus = 'needed'): AnyNode[] {
  return [
    quest('me-controller', 'open', [req('fluix', 8), req('acceptor', 1)]),
    item('fluix',    'needed', [req('certus', 1)]),
    item('acceptor', 'needed', [req('certus', 2)]),
    item('certus',   certusStatus),
  ]
}

// ─── getRequiredNodesForGoal ─────────────────────────────────────────────────

describe('getRequiredNodesForGoal', () => {
  it('returns the transitive closure without the goal itself', () => {
    const ids = getRequiredNodesForGoal('me-controller', diamondGraph()).map(n => n.id)
    expect(ids.sort()).toEqual(['acceptor', 'certus', 'fluix'])
  })

  it('deduplicates shared dependencies (diamond)', () => {
    const ids = getRequiredNodesForGoal('me-controller', diamondGraph()).map(n => n.id)
    expect(ids.filter(id => id === 'certus')).toHaveLength(1)
  })

  it('returns empty for unknown goal or goal without deps', () => {
    expect(getRequiredNodesForGoal('nope', diamondGraph())).toEqual([])
    expect(getRequiredNodesForGoal('certus', diamondGraph())).toEqual([])
  })

  it('ignores non-requires edges', () => {
    const nodes: AnyNode[] = [
      quest('a', 'open', [{ targetId: 'b', type: 'related' }, { targetId: 'c', type: 'unlocks' }]),
      item('b', 'needed'),
      item('c', 'needed'),
    ]
    expect(getRequiredNodesForGoal('a', nodes)).toEqual([])
  })

  it('terminates on cyclic dependencies', () => {
    const nodes: AnyNode[] = [
      quest('a', 'open', [req('b')]),
      item('b', 'needed', [req('c')]),
      item('c', 'needed', [req('b')]), // b ↔ c cycle
    ]
    const ids = getRequiredNodesForGoal('a', nodes).map(n => n.id)
    expect(ids.sort()).toEqual(['b', 'c'])
  })
})

// ─── getNextStepsForGoal / getBlockingNodesForGoal ───────────────────────────

describe('getNextStepsForGoal', () => {
  it('returns only unlocked, not-done nodes', () => {
    // certus has no deps → available; fluix/acceptor wait on certus → locked
    const ids = getNextStepsForGoal('me-controller', diamondGraph()).map(n => n.id)
    expect(ids).toEqual(['certus'])
  })

  it('unlocks downstream nodes once deps are done', () => {
    const ids = getNextStepsForGoal('me-controller', diamondGraph('have')).map(n => n.id)
    expect(ids.sort()).toEqual(['acceptor', 'fluix'])
  })
})

describe('getBlockingNodesForGoal', () => {
  it('returns locked nodes in the required set', () => {
    const ids = getBlockingNodesForGoal('me-controller', diamondGraph()).map(n => n.id)
    expect(ids.sort()).toEqual(['acceptor', 'fluix'])
  })

  it('is empty when everything is unlocked', () => {
    expect(getBlockingNodesForGoal('me-controller', diamondGraph('have'))).toEqual([])
  })
})

// ─── getGoalProgress ─────────────────────────────────────────────────────────

describe('getGoalProgress', () => {
  it('counts the goal node itself', () => {
    const p = getGoalProgress('me-controller', diamondGraph())
    expect(p.total).toBe(4) // goal + 3 deps
  })

  it('computes done/available/locked and percent', () => {
    const p = getGoalProgress('me-controller', diamondGraph('have'))
    expect(p.done).toBe(1)        // certus
    expect(p.available).toBe(2)   // fluix, acceptor
    expect(p.locked).toBe(1)      // goal itself (deps not done)
    expect(p.percent).toBe(25)
  })

  it('returns 0 percent for an unknown goal', () => {
    expect(getGoalProgress('nope', diamondGraph()).percent).toBe(0)
  })
})

// ─── calculateTotalResources ─────────────────────────────────────────────────

describe('calculateTotalResources', () => {
  it('multiplies amounts down the crafting tree and sums shared materials', () => {
    const totals = new Map(
      calculateTotalResources('me-controller', diamondGraph()).map(r => [r.nodeId, r.totalAmount]),
    )
    expect(totals.get('fluix')).toBe(8)
    expect(totals.get('acceptor')).toBe(1)
    // 8× fluix · 1 certus + 1× acceptor · 2 certus = 10
    expect(totals.get('certus')).toBe(10)
  })

  it('defaults missing amounts to 1', () => {
    const nodes: AnyNode[] = [
      quest('goal', 'open', [req('a')]),
      item('a', 'needed'),
    ]
    expect(calculateTotalResources('goal', nodes)[0].totalAmount).toBe(1)
  })

  it('sorts undone resources before done ones', () => {
    const result = calculateTotalResources('me-controller', diamondGraph('have'))
    const doneFlags = result.map(r => r.isDone)
    // once a done entry appears, no undone entry may follow
    expect(doneFlags.indexOf(true) === -1 || doneFlags.lastIndexOf(false) < doneFlags.indexOf(true)).toBe(true)
  })

  it('terminates on cyclic graphs', () => {
    const nodes: AnyNode[] = [
      quest('goal', 'open', [req('a', 2)]),
      item('a', 'needed', [req('b', 2)]),
      item('b', 'needed', [req('a', 2)]), // a ↔ b cycle
    ]
    const totals = calculateTotalResources('goal', nodes)
    expect(totals.length).toBeGreaterThan(0) // must not hang
  })
})
