// ─── XP Tracker ─────────────────────────────────────────────────────────────
// Centralized XP awarding logic that subscribes to store changes.
// Called once from AppShell after hydration.

import { useQuestStore } from '@/store/useQuestStore'
import { useItemStore } from '@/store/useItemStore'
import { useBuildingStore } from '@/store/useBuildingStore'
import { useGoalStore } from '@/store/useGoalStore'
import { useNoteStore } from '@/store/useNoteStore'
import { useProgressStore } from '@/store/useProgressStore'
import type { QuestNode, ItemNode, Building, Goal } from '@/types'

// ─── Snapshot diffing ───────────────────────────────────────────────────────

interface Snapshot {
  questIds: Set<string>
  questDone: Set<string>
  itemIds: Set<string>
  itemHave: Set<string>
  buildingIds: Set<string>
  buildingDone: Set<string>
  noteIds: Set<string>
  goalIds: Set<string>
}

function takeSnapshot(): Snapshot {
  const quests = useQuestStore.getState().quests
  const items = useItemStore.getState().items
  const buildings = useBuildingStore.getState().buildings
  const goals = useGoalStore.getState().goals
  const notes = useNoteStore.getState().notes

  return {
    questIds: new Set(quests.map(q => q.id)),
    questDone: new Set(quests.filter(q => q.status === 'done').map(q => q.id)),
    itemIds: new Set(items.map(i => i.id)),
    itemHave: new Set(items.filter(i => i.status === 'have').map(i => i.id)),
    buildingIds: new Set(buildings.map(b => b.id)),
    buildingDone: new Set(buildings.filter(b => b.status === 'done').map(b => b.id)),
    noteIds: new Set(notes.map(n => n.id)),
    goalIds: new Set(goals.map(g => g.id)),
  }
}

function diffAndAward(prev: Snapshot, next: Snapshot) {
  const award = useProgressStore.getState().awardXp

  // New quests
  for (const id of next.questIds) {
    if (!prev.questIds.has(id)) {
      award('quest_created', `quest_created::${id}`)
    }
  }

  // Quests completed
  for (const id of next.questDone) {
    if (!prev.questDone.has(id)) {
      award('quest_completed', `quest_completed::${id}`)
    }
  }

  // New items
  for (const id of next.itemIds) {
    if (!prev.itemIds.has(id)) {
      award('item_created', `item_created::${id}`)
    }
  }

  // Items set to "have"
  for (const id of next.itemHave) {
    if (!prev.itemHave.has(id)) {
      award('item_have', `item_have::${id}`)
    }
  }

  // New buildings
  for (const id of next.buildingIds) {
    if (!prev.buildingIds.has(id)) {
      award('building_created', `building_created::${id}`)
    }
  }

  // Buildings completed
  for (const id of next.buildingDone) {
    if (!prev.buildingDone.has(id)) {
      award('building_completed', `building_completed::${id}`)
    }
  }

  // New notes
  for (const id of next.noteIds) {
    if (!prev.noteIds.has(id)) {
      award('note_created', `note_created::${id}`)
    }
  }

  // New goals
  for (const id of next.goalIds) {
    if (!prev.goalIds.has(id)) {
      award('goal_created', `goal_created::${id}`)
    }
  }
}

// ─── Goal completion detection ──────────────────────────────────────────────
// Goals don't have a "done" status — they're done when the target node is done.

function checkGoalCompletions(goals: Goal[]) {
  const quests = useQuestStore.getState().quests
  const items = useItemStore.getState().items
  const buildings = useBuildingStore.getState().buildings
  const award = useProgressStore.getState().awardXp

  const allNodes = [...quests, ...items, ...buildings]

  for (const goal of goals) {
    const target = allNodes.find(n => n.id === goal.targetNodeId)
    if (!target) continue

    const isDone =
      target.type === 'quest' ? (target as QuestNode).status === 'done' :
      target.type === 'item' ? (target as ItemNode).status === 'have' :
      target.type === 'building' ? (target as Building).status === 'done' :
      false

    if (isDone) {
      award('goal_completed', `goal_completed::${goal.id}`)
    }
  }
}

// ─── Public: start tracking ─────────────────────────────────────────────────

export function initXpTracking(): () => void {
  let snapshot = takeSnapshot()

  // Award XP for initial state (e.g. mock data on first load)
  // We skip this because dedup keys in the log will prevent double-awarding

  const handleChange = () => {
    const next = takeSnapshot()
    diffAndAward(snapshot, next)
    snapshot = next

    // Check goal completions
    checkGoalCompletions(useGoalStore.getState().goals)
  }

  const unsubs = [
    useQuestStore.subscribe(handleChange),
    useItemStore.subscribe(handleChange),
    useBuildingStore.subscribe(handleChange),
    useNoteStore.subscribe(handleChange),
    useGoalStore.subscribe(handleChange),
  ]

  return () => unsubs.forEach(u => u())
}
