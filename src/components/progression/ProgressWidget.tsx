'use client'

import Link from 'next/link'
import { useProgressStore } from '@/store/useProgressStore'
import {
  getCurrentMobLevel,
  getProgressToNextLevel,
  getXpToNextLevel,
  getXpInCurrentLevel,
  getCurrentLevelRange,
  MAX_LEVEL,
} from '@/lib/progression/xp'
import { useMobColors } from '@/lib/progression/useMobColors'

export function ProgressWidget() {
  const totalXp = useProgressStore(s => s.totalXp)
  const mob = getCurrentMobLevel(totalXp)
  const progress = getProgressToNextLevel(totalXp)
  const xpToNext = getXpToNextLevel(totalXp)
  const xpInLevel = getXpInCurrentLevel(totalXp)
  const levelRange = getCurrentLevelRange(totalXp)
  const isMaxLevel = mob.level >= MAX_LEVEL
  const color = useMobColors(mob)

  return (
    <Link
      href="/progress"
      className="
        group block
        rounded-2xl
        border border-rose-100 dark:border-slate-700
        bg-white dark:bg-slate-800
        shadow-sm hover:shadow-md
        transition-all duration-300
        overflow-hidden
      "
    >
      {/* Thin accent bar */}
      <div
        className="h-1 w-full transition-colors duration-500"
        style={{ background: `linear-gradient(to right, ${color.from}, ${color.to})` }}
      />

      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Mob emoji with glow */}
          <div
            className="
              relative w-14 h-14 flex-shrink-0
              rounded-xl
              flex items-center justify-center
              text-3xl
              transition-transform duration-300
              group-hover:scale-105
            "
            style={{
              background: `linear-gradient(135deg, ${color.from}18, ${color.to}25)`,
              boxShadow: `0 4px 20px ${color.glow}`,
            }}
          >
            {mob.emoji}
            {/* Subtle animated glow ring */}
            <div
              className="absolute inset-0 rounded-xl progress-widget-glow"
              style={{ boxShadow: `inset 0 0 12px ${color.glow}` }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: color.accent }}
              >
                Lvl {mob.level}
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">
                {mob.mob}
              </span>
            </div>

            {/* XP info */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {totalXp.toLocaleString('de-DE')} XP
              </span>
              {!isMaxLevel && (
                <span className="text-[10px] text-gray-400 dark:text-slate-500">
                  · noch {xpToNext} XP
                </span>
              )}
              {isMaxLevel && (
                <span className="text-[10px] font-medium" style={{ color: color.accent }}>
                  · MAX
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out progress-bar-shimmer"
                style={{
                  width: `${Math.max(2, progress * 100)}%`,
                  background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
                  boxShadow: `0 0 8px ${color.glow}`,
                }}
              />
            </div>

            {/* Level fraction */}
            {!isMaxLevel && (
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400 dark:text-slate-500">
                  {xpInLevel} / {levelRange} XP
                </span>
                <span className="text-[10px] font-medium" style={{ color: color.accent }}>
                  {Math.round(progress * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description (truncated) */}
        <p className="mt-3 text-xs text-gray-400 dark:text-slate-500 leading-relaxed line-clamp-2 italic">
          &ldquo;{mob.description}&rdquo;
        </p>
      </div>
    </Link>
  )
}
