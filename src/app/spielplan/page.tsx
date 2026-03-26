'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useGoalStore }    from '@/store/useGoalStore'
import { useQuestStore }   from '@/store/useQuestStore'
import { useItemStore }    from '@/store/useItemStore'
import { useBuildingStore } from '@/store/useBuildingStore'
import { EmptyState }      from '@/components/ui/EmptyState'
import { Button }          from '@/components/ui/Button'
import { getNodeTitle, type AnyNode } from '@/types'
import {
  getGoalProgress,
  getBlockingNodesForGoal,
} from '@/lib/planning'
import {
  getGlobalNextBestAction,
  getNextBestAction,
  type ActionRecommendation,
} from '@/lib/planning/advanced'

// Inventory UI not yet built — scoring still works, partial-bonus just unused
const EMPTY_INVENTORY: { nodeId: string; amount: number }[] = []

function effortLabel(effort: ActionRecommendation['effortLevel']): string {
  if (effort === 'low')    return '🟢 Einfach'
  if (effort === 'medium') return '🟡 Mittel'
  if (effort === 'high')   return '🔴 Aufwändig'
  return ''
}

function nodeHref(node: AnyNode): string {
  if (node.type === 'quest')    return '/quests'
  if (node.type === 'building') return '/buildings'
  return '/items'
}

function nodeEmoji(node: AnyNode): string {
  if (node.type === 'quest')    return '📋'
  if (node.type === 'building') return '🏗️'
  return '📦'
}

export default function SpielplanPage() {
  const { getRootGoals }  = useGoalStore()
  const { quests }        = useQuestStore()
  const { items }         = useItemStore()
  const { buildings }     = useBuildingStore()

  const rootGoals = getRootGoals()
  const allNodes: AnyNode[] = useMemo(
    () => [...quests, ...items, ...buildings],
    [quests, items, buildings],
  )

  // Global "Was jetzt?" — highest-impact single action across all goals
  const globalBest = useMemo(
    () => getGlobalNextBestAction(rootGoals, allNodes, EMPTY_INVENTORY),
    [rootGoals, allNodes],
  )

  // Per-goal: next action + progress
  const goalData = useMemo(() => rootGoals.map(goal => {
    const goalNode = allNodes.find(n => n.id === goal.targetNodeId)
    const next     = getNextBestAction(goal.targetNodeId, allNodes, EMPTY_INVENTORY)
    const progress = getGoalProgress(goal.targetNodeId, allNodes)
    return { goal, goalNode, next, progress }
  }), [rootGoals, allNodes])

  // Top-Blocker: aggregate locked nodes across all goals, rank by frequency
  const topBlockers = useMemo(() => {
    const freq = new Map<string, { node: AnyNode; goalCount: number }>()
    rootGoals.forEach(goal => {
      getBlockingNodesForGoal(goal.targetNodeId, allNodes).forEach(node => {
        const entry = freq.get(node.id)
        if (entry) entry.goalCount++
        else freq.set(node.id, { node, goalCount: 1 })
      })
    })
    return Array.from(freq.values())
      .sort((a, b) => b.goalCount - a.goalCount)
      .slice(0, 3)
  }, [rootGoals, allNodes])

  // ── Empty state ──────────────────────────────────────────────────────────────

  if (rootGoals.length === 0) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-3xl lg:px-8">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-6">⚡ Spielplan</h1>
        <EmptyState
          icon={<span>🎯</span>}
          title="Noch keine Ziele gesetzt"
          description="Setze zuerst Ziele — dann zeigt der Spielplan dir aktiv was als nächstes dran ist."
          action={
            <div className="flex gap-2 flex-wrap justify-center">
              <Link href="/goals">
                <Button variant="secondary">🎯 Zu den Zielen</Button>
              </Link>
              <Link href="/quests">
                <Button variant="secondary">📋 Quests</Button>
              </Link>
              <Link href="/items">
                <Button variant="secondary">📦 Items</Button>
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  // ── Main view ────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-3xl lg:px-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">⚡ Spielplan</h1>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
          Was sollst du als nächstes tun?
        </p>
      </div>

      {/* ── "Was jetzt?" ─────────────────────────────────────────────────────── */}
      {globalBest ? (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 p-4 text-white shadow-sm">
          <p className="text-xs font-medium opacity-75 mb-2">⚡ Was jetzt?</p>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold leading-snug">{getNodeTitle(globalBest.node)}</p>
              <p className="text-sm opacity-90 mt-0.5">{globalBest.reason}</p>
              {globalBest.unlocksCount > 0 && (
                <p className="text-xs opacity-70 mt-1">
                  Schaltet {globalBest.unlocksCount}{' '}
                  {globalBest.unlocksCount === 1 ? 'weiteren Schritt' : 'weitere Schritte'} frei
                </p>
              )}
            </div>
            <Link
              href={nodeHref(globalBest.node)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors"
            >
              Öffnen →
            </Link>
          </div>
          {globalBest.effortLevel && (
            <p className="mt-2 text-xs opacity-70 bg-white/10 rounded-lg px-2 py-0.5 inline-block">
              {effortLabel(globalBest.effortLevel)}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 p-5 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Alles erledigt!</p>
          <p className="text-xs text-emerald-500 dark:text-emerald-500 mt-0.5">
            Du hast alle Ziele vollständig abgearbeitet.
          </p>
        </div>
      )}

      {/* ── Top-Blocker ──────────────────────────────────────────────────────── */}
      {topBlockers.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
            🚫 Top-Blocker
          </h2>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
            Diese Schritte sind noch gesperrt und blockieren deinen Fortschritt.
          </p>
          <div className="flex flex-col gap-2">
            {topBlockers.map(({ node, goalCount }) => (
              <Link
                key={node.id}
                href={nodeHref(node)}
                className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-slate-700 px-3 py-2.5 hover:border-pink-200 dark:hover:border-pink-800 transition-colors"
              >
                <span className="text-base flex-shrink-0">{nodeEmoji(node)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate">
                    {getNodeTitle(node)}
                  </p>
                  <p className="text-xs text-rose-400">
                    Blockiert {goalCount} Ziel{goalCount !== 1 ? 'e' : ''}
                  </p>
                </div>
                <span className="text-gray-300 dark:text-slate-600 flex-shrink-0">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Ziel-Aktionen ────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
          🎯 Ziel-Aktionen
        </h2>
        <div className="flex flex-col gap-3">
          {goalData.map(({ goal, goalNode, next, progress }) => {
            if (!goalNode) return null
            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 p-4 shadow-sm"
              >
                {/* Goal title + progress % */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🎯</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-slate-100 flex-1 truncate">
                    {getNodeTitle(goalNode)}
                  </span>
                  <span className="text-xs font-bold text-pink-500">{progress.percent}%</span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-rose-50 dark:bg-slate-700 mb-3">
                  <div
                    className="h-full rounded-full bg-pink-400 transition-all duration-500"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>

                {/* Next action */}
                {next ? (
                  <Link
                    href={nodeHref(next.node)}
                    className="flex items-center gap-2 bg-rose-50 dark:bg-slate-700/50 rounded-xl px-3 py-2.5 hover:bg-rose-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="text-sm flex-shrink-0">▶</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate">
                        {getNodeTitle(next.node)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-400">{next.reason}</p>
                    </div>
                    {next.effortLevel && (
                      <span className="text-xs flex-shrink-0" title={effortLabel(next.effortLevel)}>
                        {next.effortLevel === 'low' ? '🟢' : next.effortLevel === 'high' ? '🔴' : '🟡'}
                      </span>
                    )}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl px-3 py-2">
                    <span className="text-sm">✅</span>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Alle Schritte erledigt!
                    </p>
                  </div>
                )}

                {/* Stats footer */}
                <div className="mt-2 flex gap-3 text-xs text-gray-400 dark:text-slate-500">
                  <span>{progress.done}/{progress.total} erledigt</span>
                  {progress.available > 0 && (
                    <span>· {progress.available} verfügbar</span>
                  )}
                  {progress.locked > 0 && (
                    <span>· {progress.locked} gesperrt</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
