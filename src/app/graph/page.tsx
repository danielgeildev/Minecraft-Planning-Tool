'use client'

import { useState, useMemo, useCallback } from 'react'
import { type Connection, type Edge } from '@xyflow/react'
import { Filter, Target, Plus, X } from 'lucide-react'

import { useQuestStore }    from '@/store/useQuestStore'
import { useItemStore }     from '@/store/useItemStore'
import { useGoalStore }     from '@/store/useGoalStore'
import { GraphView }              from '@/components/graph/GraphView'
import { GraphCreateQuestModal }  from '@/components/graph/GraphCreateQuestModal'
import { convertNodesToGraph }    from '@/lib/graph/convert'
import { applyAutoLayout }        from '@/lib/graph/layout'
import { validateNewRequiresEdge } from '@/lib/graph/validation'
import { parseEdgeId, addRequiresDep, removeRequiresDep } from '@/lib/graph/editing'
import { getNodeTitle, isNodeDone, type AnyNode } from '@/types'
import { getNodeState, getBlockedDependencies, getDependencyChain } from '@/lib/progression'
import { getRequiredNodesForGoal, getNextStepsForGoal, getBlockingNodesForGoal } from '@/lib/planning'
import { Badge }   from '@/components/ui/Badge'
import { Button }  from '@/components/ui/Button'

type StatusFilter = 'all' | 'done' | 'available' | 'locked'

export default function GraphPage() {
  const quests = useQuestStore(s => s.quests)
  const items  = useItemStore(s => s.items)

  const [showQuests, setShowQuests]         = useState(true)
  const [showItems, setShowItems]           = useState(true)
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>('all')
  const [modFilter, setModFilter]           = useState('all')
  const [selectedNode, setSelectedNode]     = useState<AnyNode | null>(null)
  const [showFilters, setShowFilters]       = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [edgeError, setEdgeError]           = useState<string | null>(null)

  const { goals, toggleGoal, isGoal } = useGoalStore()

  const allNodes: AnyNode[] = useMemo(
    () => [...quests, ...items],
    [quests, items],
  )

  // Compute goal highlight sets for all active goals
  const highlights = useMemo(() => {
    const goalIds     = new Set<string>()
    const nextStepIds = new Set<string>()
    const blockerIds  = new Set<string>()
    const pathIds     = new Set<string>()

    goals.forEach(g => {
      goalIds.add(g.targetNodeId)
      getRequiredNodesForGoal(g.targetNodeId, allNodes).forEach(n => pathIds.add(n.id))
      getNextStepsForGoal(g.targetNodeId, allNodes).forEach(n => nextStepIds.add(n.id))
      getBlockingNodesForGoal(g.targetNodeId, allNodes).forEach(n => blockerIds.add(n.id))
    })

    return { goalIds, nextStepIds, blockerIds, pathIds }
  }, [goals, allNodes])

  const allMods = useMemo(() => {
    const mods = Array.from(new Set(items.map(i => i.mod).filter(Boolean))).sort()
    return ['all', ...mods]
  }, [items])

  const visibleNodes = useMemo(() => {
    return allNodes.filter(node => {
      if (!showQuests && node.type === 'quest') return false
      if (!showItems  && node.type === 'item')  return false
      if (modFilter !== 'all' && node.type === 'item' && node.mod !== modFilter) return false

      if (statusFilter !== 'all') {
        const state = getNodeState(node.id, allNodes)
        if (state !== statusFilter) return false
      }

      return true
    })
  }, [allNodes, showQuests, showItems, statusFilter, modFilter])

  const { nodes: rawNodes, edges } = useMemo(
    () => convertNodesToGraph(allNodes, visibleNodes, highlights),
    [allNodes, visibleNodes, highlights],
  )

  const nodes = useMemo(
    () => applyAutoLayout(rawNodes, edges),
    [rawNodes, edges],
  )

  const handleNodeClick = useCallback((node: AnyNode) => {
    setSelectedNode(prev => (prev?.id === node.id ? null : node))
  }, [])

  // ─── Edge editing ──────────────────────────────────────────────────────────

  const showEdgeError = useCallback((msg: string) => {
    setEdgeError(msg)
    const t = setTimeout(() => setEdgeError(null), 3500)
    return () => clearTimeout(t)
  }, [])

  const handleConnect = useCallback((connection: Connection) => {
    const { source, target } = connection
    if (!source || !target) return

    // In our model: source = required node, target = dependent node
    const validation = validateNewRequiresEdge(target, source, allNodes)
    if (!validation.ok) {
      showEdgeError(validation.error ?? 'Ungültige Verbindung.')
      return
    }
    addRequiresDep(target, source, allNodes)
  }, [allNodes, showEdgeError])

  const handleEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    deletedEdges.forEach(edge => {
      const parsed = parseEdgeId(edge.id)
      if (!parsed || parsed.type !== 'requires') return
      // source = required node, target = dependent node
      removeRequiresDep(parsed.target, parsed.source, allNodes)
    })
  }, [allNodes])

  const handleReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    const parsed = parseEdgeId(oldEdge.id)
    if (!parsed || parsed.type !== 'requires') return

    const { source: newRequired, target: newDependent } = newConnection
    if (!newRequired || !newDependent) return

    // Temporarily remove the old dep so cycle check doesn't see it
    removeRequiresDep(parsed.target, parsed.source, allNodes)

    // Re-read allNodes after removal to get fresh state for validation
    const freshNodes: AnyNode[] = [
      ...useQuestStore.getState().quests,
      ...useItemStore.getState().items,
    ]

    const validation = validateNewRequiresEdge(newDependent, newRequired, freshNodes)
    if (!validation.ok) {
      // Restore the old dep
      addRequiresDep(parsed.target, parsed.source, allNodes)
      showEdgeError(validation.error ?? 'Ungültige Verbindung.')
      return
    }

    addRequiresDep(newDependent, newRequired, freshNodes)
  }, [allNodes, showEdgeError])

  // ─── Detail panel data ─────────────────────────────────────────────────────

  const nodeState    = selectedNode ? getNodeState(selectedNode.id, allNodes) : null
  const blockedBy    = selectedNode ? getBlockedDependencies(selectedNode.id, allNodes) : []
  const chain        = selectedNode ? getDependencyChain(selectedNode.id, allNodes) : []
  const unlocksNodes = selectedNode
    ? allNodes.filter(n => n.dependencies.some(d => d.targetId === selectedNode.id && d.type === 'requires'))
    : []

  const stateLabel:   Record<string, string>               = { done: 'Erledigt ✓', available: 'Verfügbar', locked: '🔒 Gesperrt' }
  const stateVariant: Record<string, 'green' | 'amber' | 'gray'> = { done: 'green', available: 'amber', locked: 'gray' }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-rose-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">🗺️</span>
          <h1 className="text-sm font-bold text-gray-800">Dependency Graph</h1>
          <span className="text-xs text-gray-400">
            {visibleNodes.length}/{allNodes.length} Nodes
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Create quest */}
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="gap-1"
          >
            <Plus size={12} />
            Neue Quest
          </Button>

          {/* Quick toggles */}
          <button
            onClick={() => setShowQuests(v => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showQuests ? 'bg-pink-400 text-white border-pink-400' : 'bg-white text-gray-400 border-gray-200'
            }`}
          >
            📋 Quests
          </button>
          <button
            onClick={() => setShowItems(v => !v)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showItems ? 'bg-purple-400 text-white border-purple-400' : 'bg-white text-gray-400 border-gray-200'
            }`}
          >
            📦 Items
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(v => !v)}
            className="gap-1"
          >
            <Filter size={12} />
            Filter
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-rose-50 border-b border-rose-100 flex-shrink-0">
          <span className="text-xs font-medium text-gray-500">Status:</span>
          {(['all', 'available', 'locked', 'done'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-pink-400 text-white'
                  : 'bg-white text-gray-500 border border-rose-100 hover:bg-rose-50'
              }`}
            >
              {s === 'all' ? 'Alle' : s === 'available' ? '🟡 Verfügbar' : s === 'locked' ? '🔒 Gesperrt' : '✅ Erledigt'}
            </button>
          ))}

          {allMods.length > 2 && (
            <>
              <span className="text-xs font-medium text-gray-500 ml-2">Mod:</span>
              <select
                value={modFilter}
                onChange={e => setModFilter(e.target.value)}
                className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs outline-none focus:border-pink-400"
              >
                {allMods.map(m => (
                  <option key={m} value={m}>{m === 'all' ? 'Alle Mods' : m}</option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-1.5 bg-white border-b border-rose-50 text-xs text-gray-400 flex-shrink-0">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-400 inline-block" /> requires</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-purple-400 inline-block" style={{ borderTop: '1px dashed #a78bfa' }} /> related</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> verfügbar</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> gesperrt</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> erledigt</span>
        {goals.length > 0 && (
          <>
            <span className="flex items-center gap-1 text-pink-500">🎯 Ziel</span>
            <span className="flex items-center gap-1 text-blue-500">▶ nächster Schritt</span>
            <span className="flex items-center gap-1 text-red-400">🔒 Blocker</span>
          </>
        )}
        <span className="ml-auto flex items-center gap-2 text-gray-300 italic">
          Verbindung ziehen · Entf zum Löschen
        </span>
      </div>

      {/* Edge validation error */}
      {edgeError && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-red-50 border-b border-red-100 text-xs text-red-600 flex-shrink-0">
          <span>⚠️ {edgeError}</span>
          <button onClick={() => setEdgeError(null)} className="hover:text-red-800">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Main canvas + detail */}
      <div className="flex flex-1 min-h-0">
        {/* Graph canvas */}
        <div className="flex-1 min-w-0">
          {visibleNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 text-sm">
              <span>Keine Nodes sichtbar – Filter anpassen</span>
              <Button onClick={() => setShowCreateModal(true)} className="gap-1">
                <Plus size={12} />
                Erste Quest erstellen
              </Button>
            </div>
          ) : (
            <GraphView
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
              onConnect={handleConnect}
              onEdgesDelete={handleEdgesDelete}
              onReconnect={handleReconnect}
            />
          )}
        </div>

        {/* Detail panel */}
        {selectedNode && (
          <div className="w-72 flex-shrink-0 bg-white border-l border-rose-100 overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-rose-50">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {selectedNode.type === 'quest' ? '📋' : '📦'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {getNodeTitle(selectedNode)}
                  </p>
                  {selectedNode.type === 'item' && (
                    <p className="text-xs text-pink-400">{selectedNode.mod}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleGoal(selectedNode.id)}
                  className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                    isGoal(selectedNode.id)
                      ? 'bg-pink-100 text-pink-500'
                      : 'text-gray-300 hover:text-pink-400'
                  }`}
                  title={isGoal(selectedNode.id) ? 'Ziel entfernen' : 'Als Ziel setzen'}
                >
                  <Target size={13} />
                </button>
              </div>
              {nodeState && (
                <div className="mt-2">
                  <Badge variant={stateVariant[nodeState]}>
                    {stateLabel[nodeState]}
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex-1 px-4 py-3 flex flex-col gap-4 text-xs">
              {/* Description / reason */}
              {selectedNode.type === 'quest' && selectedNode.description && (
                <p className="text-gray-600">{selectedNode.description}</p>
              )}
              {selectedNode.type === 'item' && (
                <>
                  {selectedNode.reason && (
                    <div className="rounded-xl bg-rose-50 p-2.5">
                      <p className="font-semibold text-rose-500 mb-1">🤔 Warum?</p>
                      <p className="text-gray-600">{selectedNode.reason}</p>
                    </div>
                  )}
                  {selectedNode.purpose && (
                    <div className="rounded-xl bg-pink-50 p-2.5">
                      <p className="font-semibold text-pink-500 mb-1">🎯 Wofür?</p>
                      <p className="text-gray-600">{selectedNode.purpose}</p>
                    </div>
                  )}
                </>
              )}

              {/* Blocked by */}
              {blockedBy.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-500 mb-1.5">🔒 Blockiert durch</p>
                  <div className="flex flex-col gap-1">
                    {blockedBy.map(n => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedNode(n)}
                        className="flex items-center gap-1.5 text-left rounded-lg bg-gray-50 px-2 py-1.5 hover:bg-gray-100 transition-colors"
                      >
                        <span>{n.type === 'quest' ? '📋' : '📦'}</span>
                        <span className="text-gray-700">{getNodeTitle(n)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Full dep chain */}
              {chain.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-500 mb-1.5">⛓️ Schritte davor ({chain.length})</p>
                  <div className="flex flex-col gap-1">
                    {chain.map((n, i) => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedNode(n)}
                        className={`
                          flex items-center gap-1.5 text-left rounded-lg px-2 py-1.5 transition-colors
                          ${isNodeDone(n) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}
                          hover:opacity-80
                        `}
                      >
                        <span className="text-gray-400">{i + 1}.</span>
                        <span>{n.type === 'quest' ? '📋' : '📦'}</span>
                        <span className="truncate">{getNodeTitle(n)}</span>
                        {isNodeDone(n) && <span className="ml-auto">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Unlocks */}
              {unlocksNodes.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-500 mb-1.5">🔓 Schaltet frei ({unlocksNodes.length})</p>
                  <div className="flex flex-col gap-1">
                    {unlocksNodes.map(n => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedNode(n)}
                        className="flex items-center gap-1.5 text-left rounded-lg bg-purple-50 px-2 py-1.5 hover:bg-purple-100 transition-colors text-purple-700"
                      >
                        <span>{n.type === 'quest' ? '📋' : '📦'}</span>
                        <span className="truncate">{getNodeTitle(n)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Crafting deps (items) */}
              {selectedNode.type === 'item' && (() => {
                const craftDeps = selectedNode.dependencies
                  .filter(d => d.type === 'requires' && d.amount != null)
                  .map(d => ({ dep: d, node: allNodes.find(n => n.id === d.targetId) }))
                  .filter((x): x is { dep: typeof x.dep; node: AnyNode } => !!x.node)
                return craftDeps.length > 0 ? (
                  <div>
                    <p className="font-semibold text-gray-500 mb-1.5">🧪 Crafting-Zutaten</p>
                    <div className="flex flex-col gap-1">
                      {craftDeps.map(({ dep, node }) => (
                        <button
                          key={dep.targetId}
                          onClick={() => setSelectedNode(node)}
                          className="flex justify-between rounded-lg bg-gray-50 px-2 py-1.5 hover:bg-gray-100 transition-colors text-left"
                        >
                          <span className="text-gray-700">{getNodeTitle(node)}</span>
                          <span className="font-medium text-pink-500">×{dep.amount}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              })()}
            </div>

            <div className="px-4 py-3 border-t border-rose-50">
              <button
                onClick={() => setSelectedNode(null)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create quest modal */}
      {showCreateModal && (
        <GraphCreateQuestModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}
