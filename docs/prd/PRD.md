# Alina Minecraft App — Product Requirements Document

## Overview

A Minecraft companion app for tracking quests, items, buildings, and their dependencies via an interactive knowledge graph. The app helps players plan their progression through complex dependency chains and make optimal decisions about what to work on next.

---

## Features

### Next-Best-Action Recommendations

**Problem:** The knowledge graph shows goals, dependencies, and progress, but users must manually figure out which node to work on next. The scoring engine (`getNextBestAction`) already exists but is not connected to any UI surface.

**Solution:** Surface the recommendation engine's output across 4 UI surfaces using inline integration — graph node highlight, detail panel banner, goals page cards, and dashboard widget. Subtle, on-demand presentation.

**Users:** End users (players)

**Acceptance Criteria:**

Must Have:
- [ ] Graph view: recommended node gets `nextBestAction` highlight (pulsing orange ring) when a goal is active
- [ ] Detail panel: "Recommended next step" banner when viewing a goal node, showing the recommended action with reason
- [ ] Goals page: each goal card shows its recommended next action with reason text and a link to the node
- [ ] Dashboard: global "Next best step" widget showing the single best action across all goals
- [ ] Graceful fallback when no inventory data exists (pass empty array)
- [ ] Subtle presentation: recommendation is visible but not overwhelming

Should Have:
- [ ] `nextBestAction` highlight styling on all 3 node types (Quest, Item, Building)
- [ ] Click-to-navigate from recommendation to the node in graph view
- [ ] Reason text is user-friendly (German strings already exist in the engine)

Won't Have (this iteration):
- [ ] Inventory UI (recommendation works without it, just less accurate)
- [ ] "Dismiss" or "snooze" recommendations
- [ ] Multiple recommendation display (top 3 actions) — just the single best
- [ ] Custom scoring weights

**Technical Notes:**
- `getNextBestAction(goalNodeId, allNodes, inventory)` — per-goal, in `src/lib/planning/advanced/index.ts`
- `getGlobalNextBestAction(goals, allNodes, inventory)` — cross-goal, same file
- Graph highlight type `nextBestAction` already defined in `src/lib/graph/convert.ts`
- Quest node styling exists in `GraphQuestNode.tsx` — need to add to Item and Building nodes
- Inventory can be passed as `[]` until inventory UI is built
- No new dependencies required

**Status:** In Progress (PR #27)

---

### User Accounts & Cloud Persistence (Supabase)

**Problem:** All data is stored in localStorage — no multi-device sync, no backup, data lost on browser switch.

**Solution:** Supabase Auth + PostgreSQL backend with dual-layer Zustand sync. 5 phases: Auth UI → Sync Engine → Full Migration → Polish → Feature Flag.

**Users:** End users (players)

**Status:** In Progress (Phase 1)

---

<!-- Add new features above this line -->
