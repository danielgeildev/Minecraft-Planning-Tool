'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Trash2, ExternalLink, ChevronRight } from 'lucide-react'
import { useGoalStore }    from '@/store/useGoalStore'
import { useQuestStore }   from '@/store/useQuestStore'
import { useItemStore }    from '@/store/useItemStore'
import { Badge }           from '@/components/ui/Badge'
import { EmptyState }      from '@/components/ui/EmptyState'
import { Button }          from '@/components/ui/Button'
import {
  getRequiredNodesForGoal,
  getNextStepsForGoal,
  getBlockingNodesForGoal,
  calculateTotalResources,
  getGoalProgress,
} from '@/lib/planning'
import { getNodeTitle, isNodeDone, type AnyNode } from '@/types'

export default function GoalsPage() {
  const { getRootGoals, getSubgoals, removeGoal } = useGoalStore()
  const goals = getRootGoals()
  const { quests }             = useQuestStore()
  const { items }              = useItemStore()

  const allNodes: AnyNode[] = useMemo(() => [...quests, ...items], [quests, items])

  if (goals.length === 0) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-3xl lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-xl font-bold text-gray-800">🎯 Ziele</h1>
        </div>
        <EmptyState
          icon={<span>🎯</span>}
          title="Noch keine Ziele gesetzt"
          description='Öffne ein Item oder eine Quest und klicke auf "Als Ziel setzen".'
          action={
            <div className="flex gap-2">
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

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto lg:max-w-4xl lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">🎯 Ziele</h1>
          <p className="text-xs text-gray-400 mt-0.5">{goals.length} aktives Ziel{goals.length !== 1 ? 'e' : ''}</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {goals.map(goal => {
          const targetNode = allNodes.find(n => n.id === goal.targetNodeId)
          if (!targetNode) return null

          const progress  = getGoalProgress(goal.targetNodeId, allNodes)
          const nextSteps = getNextStepsForGoal(goal.targetNodeId, allNodes)
          const blockers  = getBlockingNodesForGoal(goal.targetNodeId, allNodes)
          const resources = calculateTotalResources(goal.targetNodeId, allNodes)
          const isDone    = isNodeDone(targetNode)
          const subgoals  = getSubgoals(goal.id)
            .map(sg => ({ sg, node: allNodes.find(n => n.id === sg.targetNodeId) }))
            .filter((x): x is { sg: typeof x.sg; node: typeof allNodes[0] } => !!x.node)

          return (
            <div key={goal.id} className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
              {/* Goal header */}
              <div className={`px-5 py-4 flex items-start justify-between gap-3 ${isDone ? 'bg-emerald-50' : 'bg-gradient-to-r from-pink-50 to-rose-50'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <div>
                      <p className="font-bold text-gray-800">{getNodeTitle(targetNode)}</p>
                      {targetNode.type === 'item' && (
                        <p className="text-xs text-pink-400">{targetNode.mod}</p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>{progress.done}/{progress.total} Schritte erledigt</span>
                      <span className="font-semibold text-pink-500">{progress.percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/60 border border-rose-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-400' : 'bg-pink-400'}`}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                      {progress.done > 0 && <span className="text-emerald-500">✓ {progress.done} erledigt</span>}
                      {progress.available > 0 && <span className="text-blue-500">▶ {progress.available} verfügbar</span>}
                      {progress.locked > 0 && <span>🔒 {progress.locked} gesperrt</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeGoal(goal.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="px-5 py-4 flex flex-col gap-5">

                {/* Personal note */}
                {goal.note && (
                  <div className="rounded-xl bg-pink-50 border border-pink-100 px-3 py-2">
                    <p className="text-xs text-pink-500 font-medium mb-0.5">💭 Notiz</p>
                    <p className="text-sm text-gray-700">{goal.note}</p>
                  </div>
                )}

                {/* Subgoals */}
                {subgoals.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      🎯 Unterziele ({subgoals.length})
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {subgoals.map(({ sg, node }) => {
                        const subProgress = getGoalProgress(sg.targetNodeId, allNodes)
                        const subDone     = isNodeDone(node)
                        return (
                          <div
                            key={sg.id}
                            className={`rounded-xl border px-3 py-2 ${subDone ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-rose-100'}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <ChevronRight size={12} className="text-pink-400 flex-shrink-0" />
                              <span className="text-xs font-medium text-gray-700 flex-1 truncate">
                                {getNodeTitle(node)}
                              </span>
                              <span className="text-xs font-bold text-pink-500">{subProgress.percent}%</span>
                              <button
                                onClick={() => removeGoal(sg.id)}
                                className="text-gray-300 hover:text-red-400 transition-colors ml-1"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                            <div className="h-1 rounded-full bg-rose-100">
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
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                    <p className="text-emerald-600 font-semibold text-sm">🎉 Ziel erreicht!</p>
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
                        <div key={node.id} className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2">
                          <span>{node.type === 'quest' ? '📋' : '📦'}</span>
                          <span className="text-sm text-blue-700 font-medium flex-1">{getNodeTitle(node)}</span>
                          {node.type === 'item' && (
                            <Badge variant="purple">{node.status === 'needed' ? 'Gesucht' : 'Sammle'}</Badge>
                          )}
                          {node.type === 'quest' && (
                            <Badge variant="amber">{node.status === 'open' ? 'Offen' : 'In Arbeit'}</Badge>
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
                        <div key={node.id} className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
                          <span>{node.type === 'quest' ? '📋' : '📦'}</span>
                          <span className="text-sm text-red-600 flex-1">{getNodeTitle(node)}</span>
                        </div>
                      ))}
                      {blockers.length > 5 && (
                        <p className="text-xs text-gray-400 ml-2">+{blockers.length - 5} weitere</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Resource calculation */}
                {resources.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      🧮 Benötigte Ressourcen ({resources.filter(r => !r.isDone).length} offen)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {resources.map(req => (
                        <div
                          key={req.nodeId}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
                            req.isDone
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span>{req.node.type === 'quest' ? '📋' : '📦'}</span>
                            <span className="truncate">{getNodeTitle(req.node)}</span>
                          </div>
                          <span className={`font-semibold ml-2 flex-shrink-0 ${req.isDone ? 'text-emerald-500' : 'text-pink-500'}`}>
                            {req.isDone ? '✓' : `×${req.totalAmount}`}
                          </span>
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
