'use client'

import { useEffect, useState } from 'react'
import { ACHIEVEMENTS, RARITY_CONFIG } from '@/lib/achievements'
import { useAchievementStore } from '@/store/useAchievementStore'
import { triggerConfetti } from '@/lib/confetti'

// ─── Per-rarity FX config ────────────────────────────────────────────────────

const RARITY_FX: Record<string, {
  flash:     string
  beam:      string
  beam2?:    string
  particle:  string[]
  confetti:  number
  sparks:    number
  sparkDist: number
  sparkSizes: [number, number, number]   // large / medium / small
  shimmerSpeed: string | null            // null = no shimmer
  shimmerRepeat: string                  // '1' | 'infinite'
  shimmerBrightness: number             // 0–1 opacity of white overlay
  rings:     number                      // 0 = none
  glitter:   number                      // 0 = none; count per layer
  glitterLayers: number                  // 1 or 2
  rainbow:   boolean
}> = {
  common: {
    flash:            'rgba(148,163,184,0.08)',
    beam:             'rgba(148,163,184,0.15)',
    particle:         ['#94a3b8', '#cbd5e1', '#e2e8f0'],
    confetti:         30,
    sparks:           5,
    sparkDist:        42,
    sparkSizes:       [4, 3, 2],
    shimmerSpeed:     null,
    shimmerRepeat:    '1',
    shimmerBrightness: 0,
    rings:            0,
    glitter:          0,
    glitterLayers:    0,
    rainbow:          false,
  },
  rare: {
    flash:            'rgba(96,165,250,0.14)',
    beam:             'rgba(147,197,253,0.24)',
    particle:         ['#60a5fa', '#93c5fd', '#bfdbfe', '#ffffff'],
    confetti:         60,
    sparks:           9,
    sparkDist:        55,
    sparkSizes:       [5, 4, 3],
    shimmerSpeed:     '2.0s',
    shimmerRepeat:    '1',
    shimmerBrightness: 0.22,
    rings:            0,
    glitter:          0,
    glitterLayers:    0,
    rainbow:          false,
  },
  epic: {
    flash:            'rgba(168,85,247,0.18)',
    beam:             'rgba(216,180,254,0.32)',
    particle:         ['#a855f7', '#c084fc', '#e879f9', '#f0abfc', '#fff'],
    confetti:         100,
    sparks:           13,
    sparkDist:        68,
    sparkSizes:       [7, 5, 3],
    shimmerSpeed:     '1.8s',
    shimmerRepeat:    '1',
    shimmerBrightness: 0.28,
    rings:            2,
    glitter:          0,
    glitterLayers:    0,
    rainbow:          false,
  },
  legendary: {
    flash:            'rgba(251,191,36,0.28)',
    beam:             'rgba(253,224,71,0.45)',
    particle:         ['#fbbf24', '#f59e0b', '#fde68a', '#fef3c7', '#fff', '#f472b6'],
    confetti:         160,
    sparks:           18,
    sparkDist:        82,
    sparkSizes:       [8, 5, 3],
    shimmerSpeed:     '1.5s',
    shimmerRepeat:    'infinite',
    shimmerBrightness: 0.30,
    rings:            3,
    glitter:          20,
    glitterLayers:    1,
    rainbow:          false,
  },
  mythic: {
    flash:            'rgba(168,85,247,0.42)',
    beam:             'rgba(244,114,182,0.62)',
    beam2:            'rgba(167,139,250,0.55)',
    particle:         ['#f472b6', '#c084fc', '#818cf8', '#34d399', '#fbbf24', '#f87171', '#fff', '#a78bfa', '#fb923c'],
    confetti:         250,
    sparks:           26,
    sparkDist:        100,
    sparkSizes:       [10, 7, 4],
    shimmerSpeed:     '1.0s',
    shimmerRepeat:    'infinite',
    shimmerBrightness: 0.32,
    rings:            3,
    glitter:          28,
    glitterLayers:    2,
    rainbow:          true,
  },
}

// ─── Screen flash overlay ────────────────────────────────────────────────────

function ScreenFlash({ color, active }: { color: string; active: boolean }) {
  return (
    <div
      className="fixed inset-0 z-[9990] pointer-events-none"
      style={{
        background: `radial-gradient(ellipse at top, ${color} 0%, transparent 65%)`,
        opacity: active ? 1 : 0,
        transition: active
          ? 'opacity 0.15s ease-out'
          : 'opacity 0.8s ease-in',
      }}
      aria-hidden
    />
  )
}

// ─── Light beam sweeping the top edge ────────────────────────────────────────

function LightBeam({ color, color2, active }: { color: string; color2?: string; active: boolean }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9991] pointer-events-none overflow-hidden"
      style={{ height: color2 ? 5 : 3 }}
      aria-hidden
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          width: '35%',
          height: '100%',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          boxShadow: `0 0 20px 6px ${color}`,
          animation: active ? `beamSweep 1.1s cubic-bezier(0.4,0,0.2,1) 0.05s both` : 'none',
        }}
      />
      {color2 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            width: '25%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${color2}, transparent)`,
            boxShadow: `0 0 24px 8px ${color2}`,
            animation: active ? `beamSweep 1.4s cubic-bezier(0.4,0,0.2,1) 0.45s both` : 'none',
          }}
        />
      )}
    </div>
  )
}

// ─── Floating sparks ─────────────────────────────────────────────────────────

function Sparks({ colors, count, dist, sizes }: {
  colors: string[]
  count:  number
  dist:   number
  sizes:  [number, number, number]
}) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360 + Math.random() * (360 / count)
        const d     = dist + (i % 3) * Math.round(dist * 0.32)
        const size  = i % 4 === 0 ? sizes[0] : i % 3 === 0 ? sizes[1] : sizes[2]
        const delay = (i * 0.045).toFixed(2)
        const color = colors[i % colors.length]
        const drift = ((i % 5) - 2) * 18
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width:  size,
              height: size,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 ${size + 2}px 1px ${color}`,
              top:  '50%',
              left: '50%',
              opacity: 0,
              animation: `sparkBurst 1.1s cubic-bezier(0.16,1,0.3,1) ${delay}s forwards`,
              '--angle': `${angle}deg`,
              '--dist':  `${d}px`,
              '--drift': `${drift}px`,
            } as React.CSSProperties}
          />
        )
      })}
    </div>
  )
}

// ─── Glitter rain ─────────────────────────────────────────────────────────────

function GlitterRain({ colors, count }: { colors: string[]; count: number }) {
  return (
    <div className="fixed inset-0 z-[9992] pointer-events-none overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const x     = 5 + (i * (90 / count)) % 92
        const size  = i % 3 === 0 ? 5 : 3
        const delay = (i * (1.4 / count)).toFixed(2)
        const dur   = (1.2 + (i % 5) * 0.18).toFixed(2)
        const color = colors[i % colors.length]
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: '-8px',
              width:  size,
              height: size,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 4px 1px ${color}`,
              opacity: 0,
              animation: `glitterDrop ${dur}s ease-in ${delay}s 1 forwards`,
              '--end-y': `${80 + (i % 4) * 30}px`,
            } as React.CSSProperties}
          />
        )
      })}
    </div>
  )
}

// ─── Pulse rings ──────────────────────────────────────────────────────────────

function PulseRings({ color, count }: { color: string; count: number }) {
  const delays = [0, 0.28, 0.56].slice(0, count)
  return (
    <div className="absolute inset-0 rounded-2xl pointer-events-none" aria-hidden>
      {delays.map((delay, i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-2xl"
          style={{
            border: `2px solid ${color}`,
            animation: `ringExpand 1.6s ease-out ${delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AchievementToast() {
  const pendingQueue = useAchievementStore(s => s.pendingQueue)
  const dismissToast = useAchievementStore(s => s.dismissToast)
  const [visible, setVisible] = useState(false)

  const currentId   = pendingQueue[0] ?? null
  const achievement = currentId ? ACHIEVEMENTS.find(a => a.id === currentId) : null

  useEffect(() => {
    if (!achievement) { setVisible(false); return }

    const delay = setTimeout(() => {
      const raf = requestAnimationFrame(() => {
        setVisible(true)
        const fx = RARITY_FX[achievement.rarity]
        triggerConfetti(undefined, undefined, fx.confetti)
        if (achievement.rarity === 'legendary') {
          setTimeout(() => triggerConfetti(undefined, undefined, 80), 400)
        }
        if (achievement.rarity === 'mythic') {
          setTimeout(() => triggerConfetti(undefined, undefined, 180), 350)
          setTimeout(() => triggerConfetti(undefined, undefined, 130), 750)
        }
      })
      return () => cancelAnimationFrame(raf)
    }, pendingQueue.length > 1 ? 80 : 0)

    const dismiss = setTimeout(() => {
      setVisible(false)
      setTimeout(dismissToast, 420)
    }, 4400)

    return () => { clearTimeout(delay); clearTimeout(dismiss) }
  }, [achievement?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!achievement) return null

  const cfg = RARITY_CONFIG[achievement.rarity]
  const fx  = RARITY_FX[achievement.rarity]

  const isMythic    = achievement.rarity === 'mythic'
  const isLegendary = achievement.rarity === 'legendary'

  // Glow shadow scales by tier
  const glowShadow =
    isMythic    ? '0 0 70px 24px rgba(168,85,247,0.7), 0 0 35px 12px rgba(244,114,182,0.55), 0 8px 32px rgba(0,0,0,0.35)' :
    isLegendary ? '0 0 48px 16px rgba(251,191,36,0.55), 0 8px 32px rgba(0,0,0,0.3)' :
    achievement.rarity === 'epic'  ? '0 0 32px 10px rgba(168,85,247,0.42), 0 8px 24px rgba(0,0,0,0.25)' :
    achievement.rarity === 'rare'  ? '0 0 18px 5px rgba(96,165,250,0.3), 0 6px 20px rgba(0,0,0,0.2)' :
    '0 6px 18px rgba(0,0,0,0.18)'

  return (
    <>
      {/* Full-screen glow flash */}
      <ScreenFlash color={fx.flash} active={visible} />

      {/* Top-edge light beam */}
      <LightBeam color={fx.beam} color2={fx.beam2} active={visible} />

      {/* Glitter rain */}
      {fx.glitter > 0 && visible && (
        <GlitterRain colors={fx.particle} count={fx.glitter} />
      )}
      {fx.glitterLayers > 1 && visible && (
        <GlitterRain colors={[...fx.particle].reverse()} count={fx.glitter} />
      )}

      {/* Toast */}
      <div
        role="status"
        aria-live="polite"
        className="fixed top-4 left-1/2 z-[9999] pointer-events-none"
        style={{
          transform: `translateX(-50%) translateY(${visible ? '0' : '-120%'}) scale(${visible ? 1 : 0.8})`,
          opacity: visible ? 1 : 0,
          transition: visible
            ? 'transform 0.52s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease'
            : 'transform 0.38s cubic-bezier(0.4,0,0.6,1), opacity 0.32s ease',
          filter: `drop-shadow(0 0 20px ${fx.beam})`,
        }}
      >
        {/* Sparks */}
        <Sparks
          colors={fx.particle}
          count={fx.sparks}
          dist={fx.sparkDist}
          sizes={fx.sparkSizes}
        />

        {/* Pulse rings */}
        {fx.rings > 0 && (
          <PulseRings color={fx.particle[0]} count={fx.rings} />
        )}

        {/* Card */}
        <div
          className={`
            relative flex items-center gap-3.5 px-5 py-4 rounded-2xl
            bg-gradient-to-r ${cfg.gradient}
            ${cfg.ring}
            min-w-[280px] max-w-[360px]
            pointer-events-auto overflow-hidden
          `}
          style={{ boxShadow: glowShadow }}
        >
          {/* Shimmer sweep */}
          {fx.shimmerSpeed && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(105deg, transparent 35%, rgba(255,255,255,${fx.shimmerBrightness}) 50%, transparent 65%)`,
                animation: `shimmerSweep ${fx.shimmerSpeed} ease-out 0.2s ${fx.shimmerRepeat} both`,
              }}
              aria-hidden
            />
          )}

          {/* Rainbow hue shift — mythic only */}
          {fx.rainbow && (
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl opacity-30"
              style={{
                background: 'linear-gradient(135deg, #f472b6, #c084fc, #818cf8, #34d399, #fbbf24, #f472b6)',
                backgroundSize: '300% 300%',
                animation: 'rainbowShift 3s linear infinite',
              }}
              aria-hidden
            />
          )}

          {/* Emoji / image */}
          {achievement.emoji.startsWith('/') ? (
            <img
              src={achievement.emoji}
              alt=""
              className="w-10 h-10 flex-shrink-0 rounded-lg object-cover select-none"
              style={{
                animation: 'emojiBounce 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.12s both',
                filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.4))',
              }}
            />
          ) : (
            <span
              className="text-4xl flex-shrink-0 select-none"
              style={{
                animation: 'emojiBounce 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.12s both',
                filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.3))',
              }}
            >
              {achievement.emoji}
            </span>
          )}

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/65 mb-0.5">
              Achievement freigeschaltet!
            </p>
            <p className="text-sm font-extrabold text-white leading-tight truncate">
              {achievement.title}
            </p>
            <p className="text-[11px] text-white/80 mt-0.5 leading-snug line-clamp-2">
              {achievement.description}
            </p>

            {/* Rarity pips */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {(['common','rare','epic','legendary','mythic'] as const)
                .slice(0, (['common','rare','epic','legendary','mythic'] as const).indexOf(achievement.rarity) + 1)
                .map((r, idx) => (
                  <span
                    key={r}
                    className="w-1.5 h-1.5 rounded-full bg-white/80"
                    style={{ animation: `pipPop 0.3s cubic-bezier(0.34,1.56,0.64,1) ${0.3 + idx * 0.08}s both` }}
                  />
                ))}
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/55 ml-0.5">
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => { setVisible(false); setTimeout(dismissToast, 380) }}
            className="absolute top-2 right-3 text-white/40 hover:text-white/80 text-lg leading-none transition-colors pointer-events-auto"
            aria-label="Schließen"
          >
            ×
          </button>
        </div>
      </div>

      <style>{`
        @keyframes beamSweep {
          from { left: -40%; }
          to   { left: 110%;  }
        }
        @keyframes shimmerSweep {
          from { transform: translateX(-120%); }
          to   { transform: translateX(220%);  }
        }
        @keyframes emojiBounce {
          from { transform: scale(0.3) rotate(-20deg); opacity: 0; }
          to   { transform: scale(1)   rotate(0deg);   opacity: 1; }
        }
        @keyframes pipPop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes sparkBurst {
          0%   { transform: translate(-50%,-50%) rotate(var(--angle)) translateX(0)           scale(1); opacity: 1; }
          60%  { opacity: 0.9; }
          100% { transform: translate(-50%,-50%) rotate(var(--angle)) translateX(var(--dist)) scale(0); opacity: 0; }
        }
        @keyframes ringExpand {
          0%   { transform: scale(1);    opacity: 0.65; }
          100% { transform: scale(1.22); opacity: 0;    }
        }
        @keyframes glitterDrop {
          0%   { opacity: 0;   transform: translateY(0)            rotate(0deg);   }
          15%  { opacity: 1;                                                        }
          100% { opacity: 0;   transform: translateY(var(--end-y)) rotate(360deg); }
        }
        @keyframes rainbowShift {
          0%   { background-position: 0% 50%;   }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%;   }
        }
      `}</style>
    </>
  )
}
