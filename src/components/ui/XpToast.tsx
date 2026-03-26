'use client'

import { useEffect, useRef, useState } from 'react'
import { useProgressStore } from '@/store/useProgressStore'
import { XP_LABELS } from '@/lib/progression/xp'

const DISPLAY_MS = 2200
const FADE_MS = 400

export function XpToast() {
  const pending = useProgressStore(s => s.pendingXpToasts)
  const dismiss = useProgressStore(s => s.dismissXpToast)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const processingRef = useRef(false)

  const current = pending[0] ?? null

  useEffect(() => {
    if (!current || processingRef.current) return
    processingRef.current = true

    // Animate in
    requestAnimationFrame(() => setVisible(true))

    // Start fade-out
    timerRef.current = setTimeout(() => {
      setVisible(false)
      // Remove from queue after fade
      setTimeout(() => {
        dismiss()
        processingRef.current = false
      }, FADE_MS)
    }, DISPLAY_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [current, dismiss])

  if (!current) return null

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-[9990]
        pointer-events-none select-none
        transition-all ease-out
        ${visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-3 scale-95'
        }
      `}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div className="
        flex items-center gap-3 px-4 py-3
        bg-white/90 dark:bg-slate-800/90
        backdrop-blur-md
        border border-amber-200/60 dark:border-amber-700/40
        rounded-2xl shadow-lg shadow-amber-100/50 dark:shadow-amber-900/20
        xp-toast-glow
      ">
        {/* XP amount */}
        <div className="
          flex items-center justify-center
          w-10 h-10 rounded-xl
          bg-gradient-to-br from-amber-400 to-orange-500
          text-white font-bold text-sm
          shadow-md shadow-amber-300/40
          xp-toast-sparkle
        ">
          +{current.xp}
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wide">
            +{current.xp} XP
          </span>
          <span className="text-xs text-gray-500 dark:text-slate-400">
            {XP_LABELS[current.eventType]}
          </span>
        </div>

        {/* Decorative sparkle */}
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-300/60 dark:bg-amber-500/40 xp-toast-ping" />
      </div>
    </div>
  )
}
