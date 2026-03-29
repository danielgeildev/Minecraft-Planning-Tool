'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useQuestStore }       from '@/store/useQuestStore'
import { useBuildingStore }    from '@/store/useBuildingStore'
import { useItemStore }        from '@/store/useItemStore'
import { useGoalStore }        from '@/store/useGoalStore'
import { useSettingsStore }    from '@/store/useSettingsStore'
import { useAchievementStore } from '@/store/useAchievementStore'
import { Badge }               from '@/components/ui/Badge'
import { getNodeTitle, type AnyNode } from '@/types'
import { getGoalProgress, getNextStepsForGoal } from '@/lib/planning'
import { ACHIEVEMENTS, RARITY_CONFIG }          from '@/lib/achievements'
import { ProgressWidget }                       from '@/components/progression/ProgressWidget'
import { useInventoryStore }                    from '@/store/useInventoryStore'
import { getGlobalNextBestAction }              from '@/lib/planning/advanced'

function StatCard({ emoji, label, value, sub, href }: {
  emoji: string; label: string; value: number; sub: string; href: string
}) {
  return (
    <Link
      href={href}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4"
    >
      <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-slate-700 flex items-center justify-center text-xl flex-shrink-0">
        {emoji}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 dark:text-slate-100">{value}</p>
        <p className="text-xs font-medium text-gray-600 dark:text-slate-300">{label}</p>
        <p className="text-xs text-gray-400 dark:text-slate-500">{sub}</p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const quests    = useQuestStore((s) => s.quests)
  const buildings = useBuildingStore((s) => s.buildings)
  const items     = useItemStore((s) => s.items)
  const { goals } = useGoalStore()
  const playerName   = useSettingsStore(s => s.playerName)
  const unlockedIds        = useAchievementStore(s => s.unlockedIds)
  const manualUnlock       = useAchievementStore(s => s.manualUnlock)
  const replayAchievement  = useAchievementStore(s => s.replayAchievement)

  const inventory = useInventoryStore(s => s.inventory)
  const allNodes: AnyNode[] = useMemo(() => [...quests, ...items], [quests, items])

  const questStats = {
    total:      quests.length,
    done:       quests.filter(q => q.status === 'done').length,
    inProgress: quests.filter(q => q.status === 'in-progress').length,
    open:       quests.filter(q => q.status === 'open').length,
  }
  const buildingStats = {
    total:      buildings.length,
    done:       buildings.filter(b => b.status === 'done').length,
    inProgress: buildings.filter(b => b.status === 'in-progress').length,
  }
  const itemStats = {
    total:  items.length,
    have:   items.filter(i => i.status === 'have').length,
    needed: items.filter(i => i.status === 'needed').length,
  }

  const recentQuests = useMemo(() =>
    quests
      .filter(q => q.status !== 'done')
      .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
      .slice(0, 5),
    [quests],
  )
  const recentItems = useMemo(() => items.filter(i => i.status !== 'have').slice(0, 5), [items])

  const globalRec = useMemo(() => {
    const rootGoals = goals.filter(g => !g.parentGoalId)
    if (rootGoals.length === 0) return null
    return getGlobalNextBestAction(rootGoals, allNodes, inventory)
  }, [goals, allNodes, inventory])

  // Last 3 unlocked achievements (most recent first)
  const recentAchievements = useMemo(() =>
    [...unlockedIds]
      .reverse()
      .slice(0, 3)
      .map(id => ACHIEVEMENTS.find(a => a.id === id))
      .filter(Boolean) as typeof ACHIEVEMENTS,
    [unlockedIds],
  )

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-none lg:px-8">

      {/* Hero */}
      <div className="mb-6 flex items-center gap-4">
        <a
          href="https://www.youtube.com/watch?v=xvFZjo5PgG0"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => manualUnlock('felix-lover')}
          className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-950 dark:to-rose-950 border border-rose-200 dark:border-rose-800 shadow-sm overflow-hidden flex items-center justify-center hover:scale-105 hover:shadow-md transition-transform duration-200"
        >
          <img src="/filbert-filibert.gif" alt="Felix" className="w-full h-full object-contain" draggable={false} />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Hallo {playerName}! 🌸</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Dein ATM10 Fortschritts-Dashboard</p>
        </div>
      </div>

      {/* XP Progress Widget */}
      <div className="mb-6">
        <ProgressWidget />
      </div>

      {/* Progress banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 dark:from-pink-700 dark:to-rose-800 p-4 text-white shadow-sm">
        <p className="text-xs font-medium opacity-80 mb-1">Gesamt-Fortschritt</p>
        <p className="text-lg font-bold">{questStats.done}/{questStats.total} Quests erledigt</p>
        <div className="mt-2 h-2 rounded-full bg-white/30">
          <div
            className="h-2 rounded-full bg-white transition-all duration-500"
            style={{ width: questStats.total ? `${(questStats.done / questStats.total) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <StatCard emoji="📋" label="Aktive Quests"   value={questStats.inProgress} sub={`${questStats.open} offen · ${questStats.done} erledigt`}                    href="/quests"    />
        <StatCard emoji="🏗️" label="Gebäude im Bau"  value={buildingStats.inProgress} sub={`${buildingStats.total - buildingStats.done} aktiv · ${buildingStats.done} fertig`} href="/buildings" />
        <StatCard emoji="📦" label="Items gesucht"   value={itemStats.needed}      sub={`${itemStats.have} habe ich · ${itemStats.total} total`}                      href="/items"     />
      </div>

      {/* Global recommendation */}
      {globalRec && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border border-orange-200 dark:border-orange-800 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-lg flex-shrink-0">
              ⭐
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-orange-500 dark:text-orange-400 mb-0.5">Empfohlener nächster Schritt</p>
              <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate">
                {globalRec.node.type === 'quest' ? '📋' : '📦'} {getNodeTitle(globalRec.node)}
              </p>
              <p className="text-xs text-orange-500 dark:text-orange-400 mt-0.5">{globalRec.reason}</p>
              {(() => {
                const goalNode = allNodes.find(n => n.id === globalRec.goalNodeId)
                return goalNode ? (
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                    Für Ziel: {getNodeTitle(goalNode)}
                  </p>
                ) : null
              })()}
            </div>
            {globalRec.effortLevel && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                globalRec.effortLevel === 'low' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                globalRec.effortLevel === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
              }`}>
                {globalRec.effortLevel === 'low' ? 'Einfach' : globalRec.effortLevel === 'medium' ? 'Mittel' : 'Aufwändig'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Goals widget */}
      {goals.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">🎯 Aktive Ziele</h2>
            <Link href="/goals" className="text-xs text-pink-500 hover:text-pink-600">Alle →</Link>
          </div>
          <div className="flex flex-col gap-3">
            {goals.slice(0, 3).map(goal => {
              const targetNode = allNodes.find(n => n.id === goal.targetNodeId)
              if (!targetNode) return null
              const progress  = getGoalProgress(goal.targetNodeId, allNodes)
              const nextSteps = getNextStepsForGoal(goal.targetNodeId, allNodes).slice(0, 2)
              return (
                <div key={goal.id} className="bg-white dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-slate-700 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">🎯</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-slate-100 flex-1 truncate">{getNodeTitle(targetNode)}</span>
                    <span className="text-xs font-bold text-pink-500">{progress.percent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-rose-50 dark:bg-slate-700 mb-2">
                    <div className="h-full rounded-full bg-pink-400 transition-all duration-500" style={{ width: `${progress.percent}%` }} />
                  </div>
                  {nextSteps.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {nextSteps.map(n => (
                        <div key={n.id} className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg px-2 py-1">
                          <span>▶</span>
                          <span className="truncate">{getNodeTitle(n)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent achievements widget */}
      {recentAchievements.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">🏆 Letzte Achievements</h2>
            <Link href="/settings?tab=achievements" className="text-xs text-pink-500 hover:text-pink-600">
              Alle {unlockedIds.length}/{ACHIEVEMENTS.length} →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentAchievements.map(a => {
              const cfg = RARITY_CONFIG[a.rarity]
              return (
                <button
                  key={a.id}
                  onClick={() => replayAchievement(a.id)}
                  title="Effekt nochmal abspielen"
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left w-full transition-opacity hover:opacity-80 active:scale-[0.98] ${cfg.cardBg} ${cfg.ring}`}
                >
                  {a.emoji.startsWith('/') ? (
                    <img src={a.emoji} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                  ) : (
                    <span className="text-2xl flex-shrink-0">{a.emoji}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{a.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{a.description}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r ${cfg.gradient} text-white flex-shrink-0`}>
                    {cfg.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent quests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">📋 Nächste Quests</h2>
            <Link href="/quests" className="text-xs text-pink-500 hover:text-pink-600">Alle →</Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentQuests.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 py-4 text-center">Alle Quests erledigt! 🎉</p>
            ) : (
              recentQuests.map(q => (
                <div key={q.id} className="bg-white dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-slate-700 px-3 py-2.5 flex items-center gap-2">
                  <span className="text-sm">{q.status === 'in-progress' ? '🔄' : '⭕'}</span>
                  <span className="text-sm text-gray-700 dark:text-slate-200 flex-1 truncate">{q.title}</span>
                  <Badge variant={q.priority === 'high' ? 'red' : q.priority === 'medium' ? 'amber' : 'gray'}>
                    {q.priority}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Items needed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">📦 Items die ich brauche</h2>
            <Link href="/items" className="text-xs text-pink-500 hover:text-pink-600">Alle →</Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentItems.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 py-4 text-center">Alle Items gesammelt! ✨</p>
            ) : (
              recentItems.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-slate-700 px-3 py-2.5 flex items-center gap-2">
                  <span className="text-sm">{item.status === 'collecting' ? '📥' : '🔍'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-slate-200 truncate">{item.name}</p>
                    <p className="text-xs text-pink-400">{item.mod}</p>
                  </div>
                  <Badge variant={item.status === 'collecting' ? 'amber' : 'red'}>
                    {item.status === 'collecting' ? 'Sammle' : 'Gesucht'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
