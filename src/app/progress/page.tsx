'use client'

import { useMemo } from 'react'
import { useProgressStore } from '@/store/useProgressStore'
import {
  getCurrentMobLevel,
  getProgressToNextLevel,
  getXpToNextLevel,
  getXpInCurrentLevel,
  getCurrentLevelRange,
  MOB_LEVELS,
  MAX_LEVEL,
  type XpEventType,
} from '@/lib/progression/xp'
import { XP_LABELS } from '@/lib/progression/xp'
import { resolveMobColors, useIsDark } from '@/lib/progression/useMobColors'

// ─── Mob Level Card ─────────────────────────────────────────────────────────

function MobLevelCard({
  mob,
  isReached,
  isCurrent,
  totalXp,
  isDark,
}: {
  mob: (typeof MOB_LEVELS)[number]
  isReached: boolean
  isCurrent: boolean
  totalXp: number
  isDark: boolean
}) {
  const color = resolveMobColors(mob, isDark)

  return (
    <div
      className={`
        relative rounded-2xl border overflow-hidden
        transition-all duration-300
        ${isCurrent
          ? 'border-2 shadow-lg scale-[1.02]'
          : isReached
            ? 'border-rose-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm'
            : 'border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 opacity-50'
        }
      `}
      style={isCurrent ? {
        borderColor: color.accent,
        boxShadow: `0 4px 24px ${color.glow}`,
        background: isDark
          ? `linear-gradient(135deg, ${color.bg}, #1e293b)`
          : `linear-gradient(135deg, ${color.bg}, white)`,
      } : undefined}
    >
      {/* Current level indicator */}
      {isCurrent && (
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(to right, ${color.from}, ${color.to})` }}
        />
      )}

      <div className="p-4 flex items-start gap-3">
        {/* Emoji badge */}
        <div
          className={`
            w-12 h-12 rounded-xl flex-shrink-0
            flex items-center justify-center text-2xl
            ${isCurrent ? 'progress-page-current-emoji' : ''}
          `}
          style={isReached ? {
            background: `linear-gradient(135deg, ${color.from}20, ${color.to}30)`,
            boxShadow: isCurrent ? `0 4px 16px ${color.glow}` : 'none',
          } : {
            background: 'rgba(156,163,175,0.1)',
          }}
        >
          {isReached ? mob.emoji : (
            <span className="text-lg text-gray-300 dark:text-slate-600">?</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-bold tracking-wider uppercase"
              style={{ color: isReached ? color.accent : '#9ca3af' }}
            >
              Lvl {mob.level}
            </span>
            <span className={`text-sm font-semibold truncate ${
              isReached
                ? 'text-gray-800 dark:text-slate-100'
                : 'text-gray-400 dark:text-slate-600'
            }`}>
              {isReached ? mob.mob : '???'}
            </span>
            {isCurrent && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                style={{ background: `linear-gradient(to right, ${color.from}, ${color.to})` }}
              >
                Aktuell
              </span>
            )}
            {isReached && !isCurrent && (
              <span className="text-[10px] text-green-500 dark:text-green-400">✓</span>
            )}
          </div>

          {isReached ? (
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              {mob.description}
            </p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-slate-600 italic">
              {mob.xpRequired.toLocaleString('de-DE')} XP benötigt
            </p>
          )}

          {/* Progress bar for current level */}
          {isCurrent && mob.level < MAX_LEVEL && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 progress-bar-shimmer"
                  style={{
                    width: `${Math.max(2, getProgressToNextLevel(totalXp) * 100)}%`,
                    background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── XP Source Summary ──────────────────────────────────────────────────────

function XpSourcesSummary({ xpLog }: { xpLog: { eventType: XpEventType; xp: number }[] }) {
  const sources = useMemo(() => {
    const map = new Map<XpEventType, { count: number; totalXp: number }>()
    for (const entry of xpLog) {
      const existing = map.get(entry.eventType)
      if (existing) {
        existing.count++
        existing.totalXp += entry.xp
      } else {
        map.set(entry.eventType, { count: 1, totalXp: entry.xp })
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1].totalXp - a[1].totalXp)
  }, [xpLog])

  if (sources.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">
        Noch keine XP gesammelt. Leg los! ✨
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {sources.map(([eventType, data]) => (
        <div
          key={eventType}
          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-rose-100/50 dark:border-slate-700/50"
        >
          <span className="text-xs text-gray-500 dark:text-slate-400 flex-1">
            {XP_LABELS[eventType]}
          </span>
          <span className="text-xs font-medium text-gray-400 dark:text-slate-500">
            ×{data.count}
          </span>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 min-w-[50px] text-right">
            {data.totalXp} XP
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const totalXp = useProgressStore(s => s.totalXp)
  const xpLog = useProgressStore(s => s.xpLog)
  const isDark = useIsDark()

  const mob = getCurrentMobLevel(totalXp)
  const progress = getProgressToNextLevel(totalXp)
  const xpToNext = getXpToNextLevel(totalXp)
  const xpInLevel = getXpInCurrentLevel(totalXp)
  const levelRange = getCurrentLevelRange(totalXp)
  const isMaxLevel = mob.level >= MAX_LEVEL
  const color = resolveMobColors(mob, isDark)

  // Next mob preview
  const nextMob = mob.level < MAX_LEVEL ? MOB_LEVELS[mob.level] : null
  const nextMobColor = nextMob ? resolveMobColors(nextMob, isDark) : null

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-none lg:px-8">

      {/* ─── Hero Section ────────────────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden mb-8 shadow-lg"
        style={{ boxShadow: `0 8px 40px ${color.glow}` }}
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0 opacity-10 dark:opacity-20"
          style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
        />

        {/* Subtle glow orb */}
        <div
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20 blur-3xl"
          style={{ background: color.accent }}
        />

        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Big mob emoji */}
            <div
              className="
                w-24 h-24 sm:w-28 sm:h-28
                rounded-2xl
                flex items-center justify-center
                text-5xl sm:text-6xl
                flex-shrink-0
                progress-hero-float
              "
              style={{
                background: `linear-gradient(135deg, ${color.from}25, ${color.to}35)`,
                boxShadow: `0 8px 32px ${color.glow}`,
              }}
            >
              {mob.emoji}
            </div>

            <div className="flex-1">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400 dark:text-slate-500 mb-1">
                Dein Mob-Level
              </p>
              <h1
                className="text-3xl sm:text-4xl font-bold mb-1"
                style={{ color: color.accent }}
              >
                Level {mob.level}
              </h1>
              <p className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-3">
                {mob.mob}
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-md whitespace-pre-line italic">
                &ldquo;{mob.description}&rdquo;
              </p>
            </div>
          </div>

          {/* XP bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                {totalXp.toLocaleString('de-DE')} XP gesamt
              </span>
              {!isMaxLevel ? (
                <span className="text-sm text-gray-500 dark:text-slate-400">
                  {xpInLevel} / {levelRange} XP · noch {xpToNext}
                </span>
              ) : (
                <span className="text-sm font-bold" style={{ color: color.accent }}>
                  Maximum erreicht ✨
                </span>
              )}
            </div>
            <div className="h-3 rounded-full bg-white/50 dark:bg-slate-700/50 overflow-hidden backdrop-blur-sm">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out progress-bar-shimmer"
                style={{
                  width: `${Math.max(2, progress * 100)}%`,
                  background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
                  boxShadow: `0 0 12px ${color.glow}`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                {mob.mob}
              </span>
              {nextMob && (
                <span className="text-[10px] text-gray-400 dark:text-slate-500">
                  {nextMob.emoji} {nextMob.mob}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Next Level Teaser ───────────────────────────────────────── */}
      {nextMob && (
        <div className="mb-8 px-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl opacity-60"
              style={{ background: nextMobColor ? `linear-gradient(135deg, ${nextMobColor.from}15, ${nextMobColor.to}25)` : undefined }}
            >
              {nextMob.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Nächstes Level
              </p>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 truncate">
                Lvl {nextMob.level} — {nextMob.mob}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{xpToNext} XP</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">verbleibend</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Two Column Layout ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left: All Mob Levels */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <span>🏰</span> Alle Mob-Level
          </h2>
          <div className="space-y-2">
            {MOB_LEVELS.map(m => (
              <MobLevelCard
                key={m.level}
                mob={m}
                isReached={totalXp >= m.xpRequired}
                isCurrent={m.level === mob.level}
                totalXp={totalXp}
                isDark={isDark}
              />
            ))}
          </div>
        </div>

        {/* Right: XP Sources */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <span>⚡</span> XP-Quellen
          </h2>
          <XpSourcesSummary xpLog={xpLog} />

          {/* Stats */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <span>📊</span> Statistiken
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-rose-100/50 dark:border-slate-700/50 text-center">
                <p className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                  {totalXp.toLocaleString('de-DE')}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">XP Gesamt</p>
              </div>
              <div className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-rose-100/50 dark:border-slate-700/50 text-center">
                <p className="text-2xl font-bold" style={{ color: color.accent }}>
                  {mob.level}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Level</p>
              </div>
              <div className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-rose-100/50 dark:border-slate-700/50 text-center">
                <p className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                  {xpLog.length}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Aktionen</p>
              </div>
              <div className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-rose-100/50 dark:border-slate-700/50 text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {xpLog.length > 0 ? Math.round(totalXp / xpLog.length) : 0}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">XP / Aktion</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
