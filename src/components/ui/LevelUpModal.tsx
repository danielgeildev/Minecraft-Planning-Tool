'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useProgressStore } from '@/store/useProgressStore'
import { getCurrentMobLevel } from '@/lib/progression/xp'
import { useMobColors } from '@/lib/progression/useMobColors'
import { triggerConfetti } from '@/lib/confetti'

export function LevelUpModal() {
  const pendingLevel = useProgressStore(s => s.pendingLevelUp)
  const totalXp = useProgressStore(s => s.totalXp)
  const dismiss = useProgressStore(s => s.dismissLevelUp)
  const [animateIn, setAnimateIn] = useState(false)
  const prevLevelRef = useRef<number | null>(null)

  // Derive show from store state
  const show = pendingLevel !== null

  // Must call hooks unconditionally (before any early return)
  const mob = getCurrentMobLevel(totalXp)
  const color = useMobColors(mob)

  useEffect(() => {
    if (pendingLevel === null || pendingLevel === prevLevelRef.current) return
    prevLevelRef.current = pendingLevel

    // Trigger entrance animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateIn(true))
    })

    // Confetti burst
    const confettiTimer = setTimeout(() => {
      triggerConfetti(undefined, undefined, 120)
    }, 200)

    return () => clearTimeout(confettiTimer)
  }, [pendingLevel])

  const handleClose = useCallback(() => {
    setAnimateIn(false)
    prevLevelRef.current = null
    setTimeout(() => dismiss(), 400)
  }, [dismiss])

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!show) return
    const timer = setTimeout(handleClose, 6000)
    return () => clearTimeout(timer)
  }, [show, handleClose])

  if (!show) return null

  return (
    <div
      className={`
        fixed inset-0 z-[9995] flex items-center justify-center
        transition-opacity duration-400
        ${animateIn ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Glow rings */}
      <div
        className="absolute w-80 h-80 rounded-full levelup-pulse-ring"
        style={{
          background: `radial-gradient(circle, ${color.glow}, transparent 70%)`,
        }}
      />
      <div
        className="absolute w-56 h-56 rounded-full levelup-pulse-ring-delayed"
        style={{
          background: `radial-gradient(circle, ${color.glow}, transparent 70%)`,
        }}
      />

      {/* Card */}
      <div
        className={`
          relative z-10
          w-[320px] max-w-[90vw]
          bg-white/95 dark:bg-slate-900/95
          backdrop-blur-md
          rounded-3xl
          border border-white/20 dark:border-slate-700/50
          shadow-2xl
          overflow-hidden
          transition-all duration-500 ease-out
          ${animateIn ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}
        `}
      >
        {/* Top gradient bar */}
        <div
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(to right, ${color.from}, ${color.to})` }}
        />

        {/* Content */}
        <div className="px-6 pt-6 pb-7 text-center">
          {/* Level badge */}
          <div className="flex justify-center mb-4">
            <div
              className="
                relative w-20 h-20
                rounded-2xl
                flex items-center justify-center
                text-4xl
                levelup-emoji-bounce
                shadow-lg
              "
              style={{
                background: `linear-gradient(135deg, ${color.from}20, ${color.to}30)`,
                boxShadow: `0 8px 32px ${color.glow}`,
              }}
            >
              {mob.emoji}
              {/* Sparkle dots */}
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-300 levelup-sparkle-1" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-pink-300 levelup-sparkle-2" />
              <div className="absolute top-1 -left-2 w-1.5 h-1.5 rounded-full bg-purple-300 levelup-sparkle-3" />
            </div>
          </div>

          {/* Title */}
          <p className="text-xs font-bold tracking-widest uppercase text-gray-400 dark:text-slate-500 mb-1">
            Level Up!
          </p>
          <h2
            className="text-2xl font-bold mb-1 levelup-text-shimmer"
            style={{ color: color.accent }}
          >
            Level {mob.level}
          </h2>
          <p className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-3">
            {mob.mob}
          </p>

          {/* Description */}
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">
            {mob.description}
          </p>

          {/* Close hint */}
          <p className="mt-5 text-[10px] text-gray-300 dark:text-slate-600 tracking-wide">
            Tippe um zu schließen
          </p>
        </div>
      </div>
    </div>
  )
}
