'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Trash2, ExternalLink, ChevronRight } from 'lucide-react'
import { useGoalStore }      from '@/store/useGoalStore'
import { useQuestStore }     from '@/store/useQuestStore'
import { useItemStore }      from '@/store/useItemStore'
import { useBuildingStore }  from '@/store/useBuildingStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { Badge }             from '@/components/ui/Badge'
import { EmptyState }        from '@/components/ui/EmptyState'
import { Button }            from '@/components/ui/Button'
import { getNodeTitle, isNodeDone, type AnyNode } from '@/types'
import { useHasHydrated } from '@/hooks/useHasHydrated'
import {
  getNextStepsForGoal,
  getBlockingNodesForGoal,
  getGoalProgress,
} from '@/lib/planning'
import { calculateRemainingResources } from '@/lib/inventory'
import { InventoryControl } from '@/components/items/InventoryControl'
import {
  getGlobalNextBestAction,
  getNextBestAction,
  type ActionRecommendation,
} from '@/lib/planning/advanced'

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
  const hydrated = useHasHydrated()
  const { getRootGoals, getSubgoals, removeGoal } = useGoalStore()
  const { quests }    = useQuestStore()
  const { items }     = useItemStore()
  const { buildings } = useBuildingStore()
  const inventory     = useInventoryStore(s => s.inventory)

  const rootGoals = getRootGoals()
  const allNodes: AnyNode[] = useMemo(
    () => [...quests, ...items, ...buildings],
    [quests, items, buildings],
  )

  // Global "Was jetzt?" — highest-impact single action across all goals
  const globalBest = useMemo(
    () => getGlobalNextBestAction(rootGoals, allNodes, inventory),
    [rootGoals, allNodes, inventory],
  )

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

  // ── Loading (pre-hydration) ──────────────────────────────────────────────────
  // Store data only exists after client-side rehydration; rendering it earlier
  // causes a server/client hydration mismatch.

  if (!hydrated) {
    return (
      <div className="px-4 py-6 max-w-3xl mx-auto lg:max-w-4xl lg:px-8">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-6">🎯 Ziele & Spielplan</h1>
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-24 rounded-2xl bg-rose-100/60 dark:bg-slate-800" />
          <div className="h-40 rounded-2xl bg-rose-50 dark:bg-slate-800/60" />
        </div>
      </div>
    )
  }

  // ── Empty state ──────────────────────────────────────────────────────────────

  if (rootGoals.length === 0) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-3xl lg:px-8">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-6">🎯 Ziele & Spielplan</h1>
        <EmptyState
          icon={<span>🎯</span>}
          title="Noch keine Ziele gesetzt"
          description='Öffne ein Item, eine Quest oder ein Gebäude und klicke auf "Als Ziel setzen" — dann zeigt dir der Spielplan, was als nächstes dran ist.'
          action={
            <div className="flex gap-2 flex-wrap justify-center">
              <Link href="/quests">
                <Button variant="secondary">📋 Quests</Button>
              </Link>
              <Link href="/items">
                <Button variant="secondary">📦 Items</Button>
              </Link>
              <Link href="/graph">
                <Button variant="secondary">🗺️ Graph</Button>
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  // ── Main view ────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto lg:max-w-4xl lg:px-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">🎯 Ziele & Spielplan</h1>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
          {rootGoals.length} aktives Ziel{rootGoals.length !== 1 ? 'e' : ''} · Was sollst du als nächstes tun?
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

      {/* ── Ziele ────────────────────────────────────────────────────────────── */}
      <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
        🎯 Deine Ziele
      </h2>
      <div className="flex flex-col gap-8">
        {rootGoals.map(goal => {
          const targetNode = allNodes.find(n => n.id === goal.targetNodeId)
          if (!targetNode) return null

          const progress  = getGoalProgress(goal.targetNodeId, allNodes)
          const nextSteps = getNextStepsForGoal(goal.targetNodeId, allNodes)
          const blockers  = getBlockingNodesForGoal(goal.targetNodeId, allNodes)
          const resources = calculateRemainingResources(goal.targetNodeId, allNodes, inventory)
          const isDone         = isNodeDone(targetNode)
          const recommendation = isDone ? null : getNextBestAction(goal.targetNodeId, allNodes, inventory)
          const subgoals  = getSubgoals(goal.id)
            .map(sg => ({ sg, node: allNodes.find(n => n.id === sg.targetNodeId) }))
            .filter((x): x is { sg: typeof x.sg; node: typeof allNodes[0] } => !!x.node)

          return (
            <div key={goal.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Goal header */}
              <div className={`px-5 py-4 flex items-start justify-between gap-3 ${isDone ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-slate-800'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-slate-100">{getNodeTitle(targetNode)}</p>
                      {targetNode.type === 'item' && (
                        <p className="text-xs text-pink-400">{targetNode.mod}</p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mb-1">
                      <span>{progress.done}/{progress.total} Schritte erledigt</span>
                      <span className="font-semibold text-pink-500">{progress.percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-rose-100/60 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-400' : 'bg-pink-400'}`}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <div className="flex gap-3 mt-1.5 text-xs text-gray-400 dark:text-slate-500">
                      {progress.done > 0 && <span className="text-emerald-500">✓ {progress.done} erledigt</span>}
                      {progress.available > 0 && <span className="text-pink-400">▶ {progress.available} verfügbar</span>}
                      {progress.locked > 0 && <span className="text-gray-400 dark:text-slate-500">🔒 {progress.locked} gesperrt</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeGoal(goal.id)}
                  className="text-gray-300 dark:text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="px-5 py-4 flex flex-col gap-5">

                {/* Recommendation */}
                {recommendation && (
                  <div className="rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 px-3 py-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">⭐</span>
                      <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">Empfohlener nächster Schritt</p>
                      {recommendation.effortLevel && (
                        <Badge variant={recommendation.effortLevel === 'low' ? 'green' : recommendation.effortLevel === 'high' ? 'red' : 'amber'}>
                          {recommendation.effortLevel === 'low' ? 'Einfach' : recommendation.effortLevel === 'medium' ? 'Mittel' : 'Aufwändig'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      {nodeEmoji(recommendation.node)} {getNodeTitle(recommendation.node)}
                    </p>
                    <p className="text-xs text-orange-500 dark:text-orange-400 mt-0.5">{recommendation.reason}</p>
                  </div>
                )}

                {/* Personal note */}
                {goal.note && (
                  <div className="rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900 px-3 py-2">
                    <p className="text-xs text-pink-500 dark:text-pink-400 font-medium mb-0.5">💭 Notiz</p>
                    <p className="text-sm text-gray-700 dark:text-slate-300">{goal.note}</p>
                  </div>
                )}

                {/* Subgoals */}
                {subgoals.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                      🎯 Unterziele ({subgoals.length})
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {subgoals.map(({ sg, node }) => {
                        const subProgress = getGoalProgress(sg.targetNodeId, allNodes)
                        const subDone     = isNodeDone(node)
                        return (
                          <div
                            key={sg.id}
                            className={`rounded-xl border px-3 py-2 ${subDone ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900' : 'bg-white dark:bg-slate-700 border-rose-100 dark:border-slate-600'}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <ChevronRight size={12} className="text-pink-400 flex-shrink-0" />
                              <span className="text-xs font-medium text-gray-700 dark:text-slate-300 flex-1 truncate">
                                {getNodeTitle(node)}
                              </span>
                              <span className="text-xs font-bold text-pink-500">{subProgress.percent}%</span>
                              <button
                                onClick={() => removeGoal(sg.id)}
                                className="text-gray-300 dark:text-slate-600 hover:text-red-400 transition-colors ml-1"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                            <div className="h-1 rounded-full bg-rose-100/60 dark:bg-slate-600">
                              <div
                                className={`h-full rounded-full transition-all ${subDone ? 'bg-emerald-400' : 'bg-pink-300'}`}
                                style={{ width: `${subProgress.percent}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Done! */}
                {isDone && (
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 p-3 text-center">
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">🎉 Ziel erreicht!</p>
                  </div>
                )}

                {/* Next Steps */}
                {!isDone && nextSteps.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">
                      ▶ Das solltest du jetzt tun ({nextSteps.length})
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {nextSteps.map(node => (
                        <div key={node.id} className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 px-3 py-2">
                          <span>{nodeEmoji(node)}</span>
                          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium flex-1">{getNodeTitle(node)}</span>
                          {node.type === 'item' && (
                            <Badge variant="purple">{node.status === 'needed' ? 'Gesucht' : 'Sammle'}</Badge>
                          )}
                          {node.type === 'quest' && (
                            <Badge variant="gray">{node.status === 'open' ? 'Offen' : 'In Arbeit'}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blockers */}
                {!isDone && blockers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">
                      🔒 Blockiert durch ({blockers.length})
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {blockers.slice(0, 5).map(node => (
                        <div key={node.id} className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 px-3 py-2">
                          <span>{nodeEmoji(node)}</span>
                          <span className="text-sm text-red-600 dark:text-red-400 flex-1">{getNodeTitle(node)}</span>
                        </div>
                      ))}
                      {blockers.length > 5 && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 ml-2">+{blockers.length - 5} weitere</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Resource calculation (inventory-aware) */}
                {resources.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">
                      Ressourcen · {resources.filter(r => !r.isDone).length} offen
                    </p>
                    <div className="flex flex-col gap-1">
                      {resources.map(req => (
                        <div
                          key={req.nodeId}
                          className={`rounded-lg px-2.5 py-1.5 text-xs ${
                            req.isDone
                              ? 'text-emerald-500 dark:text-emerald-400'
                              : 'text-gray-500 dark:text-slate-400 bg-rose-50/50 dark:bg-slate-700/30'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="opacity-60">{nodeEmoji(req.node)}</span>
                              <span className={`truncate ${req.isDone ? 'line-through opacity-60' : ''}`}>{getNodeTitle(req.node)}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {req.node.type === 'item' && !req.isDone && (
                                <InventoryControl nodeId={req.nodeId} />
                              )}
                              <span className={`font-medium tabular-nums ${req.isDone ? 'text-emerald-400' : 'text-gray-400 dark:text-slate-500'}`}>
                                {req.isDone ? '✓' : `noch ×${req.remainingAmount} von ${req.totalAmount}`}
                              </span>
                            </div>
                          </div>
                          {!req.isDone && req.haveAmount > 0 && (
                            <div className="mt-1.5 h-1 rounded-full bg-rose-100/60 dark:bg-slate-600">
                              <div
                                className="h-full rounded-full bg-amber-400 transition-all"
                                style={{ width: `${req.partialPercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Link to graph */}
                <div className="flex gap-2 pt-1">
                  <Link href="/graph" className="flex-1">
                    <Button variant="secondary" className="w-full justify-center gap-1.5">
                      <ExternalLink size={13} />
                      Im Graph anzeigen
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
