'use client'

import { X, ExternalLink, Target } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { ItemNode, ItemStatus, AnyNode } from '@/types'
import { getNodeTitle } from '@/types'
import { getFullDependencyTree } from '@/lib/progression'
import { useGoalStore } from '@/store/useGoalStore'

const statusConfig: Record<ItemStatus, { label: string; variant: 'red' | 'amber' | 'green'; emoji: string }> = {
  needed:     { label: 'Gesucht',      variant: 'red',   emoji: '🔍' },
  collecting: { label: 'Sammle',       variant: 'amber', emoji: '📥' },
  have:       { label: 'Habe ich ✓',   variant: 'green', emoji: '✅' },
}

interface ItemDetailProps {
  item: ItemNode | null
  allNodes: AnyNode[]
  onClose: () => void
  onEdit: (item: ItemNode) => void
  onStatusChange: (id: string, status: ItemStatus) => void
  onLinkedItemClick: (node: AnyNode) => void
  onGoalCreate?: (item: ItemNode) => void
}

export function ItemDetail({ item, allNodes, onClose, onEdit, onStatusChange, onLinkedItemClick, onGoalCreate }: ItemDetailProps) {
  const { isGoal, toggleGoal } = useGoalStore()

  if (!item) return null

  const st = statusConfig[item.status]
  const nextStatus: ItemStatus = item.status === 'needed' ? 'collecting' : item.status === 'collecting' ? 'have' : 'needed'

  // Full dep tree (transitive requires)
  const depTree = getFullDependencyTree(item.id, allNodes)

  // Crafting deps with amount (requires + amount)
  const craftingDeps = item.dependencies
    .filter(d => d.type === 'requires' && d.amount != null)
    .map(d => ({ dep: d, node: allNodes.find(n => n.id === d.targetId) }))
    .filter((x): x is { dep: typeof x.dep; node: AnyNode } => !!x.node)

  // Related nodes
  const relatedNodes = item.dependencies
    .filter(d => d.type === 'related')
    .map(d => allNodes.find(n => n.id === d.targetId))
    .filter((n): n is AnyNode => !!n)

  const goal = isGoal(item.id)

  return (
    <div className="h-full flex flex-col bg-white border-l border-rose-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-rose-50">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{st.emoji}</span>
            <h2 className="font-bold text-gray-800">{item.name}</h2>
          </div>
          <p className="text-sm text-pink-400 font-medium mt-0.5 ml-8">{item.mod}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="!p-1.5">
          <X size={16} />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
        {/* Status + goal */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={st.variant}>{st.label}</Badge>
          <button
            onClick={() => onStatusChange(item.id, nextStatus)}
            className="text-xs text-pink-500 hover:text-pink-600 transition-colors"
          >
            → {statusConfig[nextStatus].label}
          </button>
          <button
            onClick={() => goal ? toggleGoal(item.id) : (onGoalCreate ? onGoalCreate(item) : toggleGoal(item.id))}
            className={`ml-auto flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1 transition-colors ${
              goal
                ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                : 'bg-gray-50 text-gray-500 hover:bg-rose-50 hover:text-pink-500'
            }`}
          >
            <Target size={12} />
            {goal ? 'Ist Ziel ✓' : 'Ziel planen…'}
          </button>
        </div>

        {/* Why / For what */}
        {item.reason && (
          <div className="rounded-xl bg-rose-50 p-3">
            <p className="text-xs font-semibold text-rose-500 mb-1">🤔 Warum brauch ich das?</p>
            <p className="text-sm text-gray-700">{item.reason}</p>
          </div>
        )}
        {item.purpose && (
          <div className="rounded-xl bg-pink-50 p-3">
            <p className="text-xs font-semibold text-pink-500 mb-1">🎯 Wofür ist es?</p>
            <p className="text-sm text-gray-700">{item.purpose}</p>
          </div>
        )}

        {/* Crafting recipe */}
        {craftingDeps.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🧪 Crafting-Rezept</p>
            <div className="flex flex-col gap-1.5">
              {craftingDeps.map(({ dep, node }) => (
                <button
                  key={dep.targetId}
                  onClick={() => onLinkedItemClick(node)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 hover:opacity-80 transition-opacity text-left ${
                    node.status === 'have' || node.status === 'done'
                      ? 'bg-emerald-50'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{node.type === 'quest' ? '📋' : '📦'}</span>
                    <span className="text-sm text-gray-700">{getNodeTitle(node)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-pink-500">×{dep.amount}</span>
                    {(node.status === 'have' || node.status === 'done') && (
                      <span className="text-xs text-emerald-500">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full dep tree */}
        {depTree.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              ⛓️ Benötigt zuerst ({depTree.length})
            </p>
            <div className="flex flex-col gap-1.5">
              {depTree.map(node => {
                const done = node.status === 'done' || node.status === 'have'
                return (
                  <button
                    key={node.id}
                    onClick={() => onLinkedItemClick(node)}
                    className={`
                      flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm
                      transition-colors hover:opacity-80
                      ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}
                    `}
                  >
                    <span>{node.type === 'quest' ? '📋' : '📦'}</span>
                    <span className="flex-1">{getNodeTitle(node)}</span>
                    {done && <span className="text-xs">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Related nodes */}
        {relatedNodes.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🔗 Verwandt</p>
            <div className="flex flex-col gap-1.5">
              {relatedNodes.map(node => (
                <button
                  key={node.id}
                  onClick={() => onLinkedItemClick(node)}
                  className="flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 hover:bg-purple-100 transition-colors text-left"
                >
                  <span>{node.type === 'quest' ? '📋' : '📦'}</span>
                  <span className="text-sm text-purple-700 flex-1">{getNodeTitle(node)}</span>
                  <ExternalLink size={12} className="text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {item.notes && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📝 Notizen</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-rose-50">
        <Button onClick={() => onEdit(item)} className="w-full justify-center">Bearbeiten</Button>
      </div>
    </div>
  )
}
