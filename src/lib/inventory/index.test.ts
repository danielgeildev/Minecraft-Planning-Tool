import { describe, it, expect } from 'vitest'
import { calculateRemainingResources, getInventoryAmount, getPartialProgress } from './index'
import type { AnyNode, ItemNode, QuestNode, Dependency, InventoryItem } from '@/types'

function item(id: string, status: ItemNode['status'], deps: Dependency[] = []): ItemNode {
  return {
    id, type: 'item', name: id, mod: 'test', status,
    reason: '', purpose: '', dependencies: deps, notes: '',
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  }
}

function quest(id: string, deps: Dependency[] = []): QuestNode {
  return {
    id, type: 'quest', title: id, description: '', status: 'open',
    priority: 'medium', category: 'other', parentId: null,
    dependencies: deps, notes: '',
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
  }
}

const req = (targetId: string, amount?: number): Dependency =>
  ({ targetId, type: 'requires', amount })

const nodes: AnyNode[] = [
  quest('goal', [req('iron', 10), req('coal', 4)]),
  item('iron', 'needed'),
  item('coal', 'needed'),
]

describe('getInventoryAmount', () => {
  it('returns 0 for unknown nodes', () => {
    expect(getInventoryAmount('iron', [])).toBe(0)
  })

  it('returns the stored amount', () => {
    expect(getInventoryAmount('iron', [{ nodeId: 'iron', amount: 7 }])).toBe(7)
  })
})

describe('getPartialProgress', () => {
  it('computes have/need/percent', () => {
    const p = getPartialProgress('iron', 10, [{ nodeId: 'iron', amount: 4 }])
    expect(p).toEqual({ have: 4, need: 6, total: 10, percent: 40 })
  })

  it('caps percent at 100 when overstocked', () => {
    const p = getPartialProgress('iron', 10, [{ nodeId: 'iron', amount: 25 }])
    expect(p.need).toBe(0)
    expect(p.percent).toBe(100)
  })
})

describe('calculateRemainingResources', () => {
  it('subtracts inventory from totals', () => {
    const inventory: InventoryItem[] = [{ nodeId: 'iron', amount: 4 }]
    const result = calculateRemainingResources('goal', nodes, inventory)
    const iron = result.find(r => r.nodeId === 'iron')!
    expect(iron.totalAmount).toBe(10)
    expect(iron.haveAmount).toBe(4)
    expect(iron.remainingAmount).toBe(6)
    expect(iron.partialPercent).toBe(40)
    expect(iron.isDone).toBe(false)
  })

  it('marks a requirement done when inventory covers it', () => {
    const inventory: InventoryItem[] = [{ nodeId: 'coal', amount: 4 }]
    const coal = calculateRemainingResources('goal', nodes, inventory).find(r => r.nodeId === 'coal')!
    expect(coal.remainingAmount).toBe(0)
    expect(coal.isDone).toBe(true)
  })

  it('sorts incomplete before done, then by partial progress', () => {
    const inventory: InventoryItem[] = [
      { nodeId: 'coal', amount: 4 },  // done
      { nodeId: 'iron', amount: 2 },  // 20%
    ]
    const result = calculateRemainingResources('goal', nodes, inventory)
    expect(result.map(r => r.nodeId)).toEqual(['iron', 'coal'])
  })

  it('works with empty inventory', () => {
    const result = calculateRemainingResources('goal', nodes, [])
    expect(result.every(r => r.haveAmount === 0)).toBe(true)
    expect(result.every(r => r.remainingAmount === r.totalAmount)).toBe(true)
  })
})
