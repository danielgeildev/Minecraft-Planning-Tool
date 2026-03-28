'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'

/* ── constants ─────────────────────────────────────────────────── */
const MIN_SCALE   = 1
const MAX_SCALE   = 5
const DOUBLE_TAP_MS = 300
const SWIPE_THRESH  = 60   // px – minimum swipe distance to navigate
const SWIPE_V_LIMIT = 0.6  // ratio – reject swipes that are more vertical than horizontal

/* ── types ─────────────────────────────────────────────────────── */
interface ImageLightboxProps {
  imageRefs: string[]
  initialIndex?: number
  onClose: () => void
  renderImage: (ref: string, className: string) => ReactNode
}

/* ── component ─────────────────────────────────────────────────── */
export function ImageLightbox({
  imageRefs,
  initialIndex = 0,
  onClose,
  renderImage,
}: ImageLightboxProps) {
  const [idx, setIdx]     = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [tx, setTx]       = useState(0)
  const [ty, setTy]       = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const imgWrapRef   = useRef<HTMLDivElement>(null)

  // Touch tracking refs (avoid stale closures)
  const touchState = useRef({
    startTouches: null as null | { x: number; y: number }[],
    startScale: 1,
    startTx: 0,
    startTy: 0,
    startDist: 0,
    startMid: { x: 0, y: 0 },
    isPinching: false,
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
    swipeStartX: 0,
    swipeStartY: 0,
    hasMoved: false,
  })

  // Mouse drag refs
  const mouseState = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
    moved: 0,
  })

  /* ── helpers ──────────────────────────────────────────────── */
  const resetTransform = useCallback(() => {
    setScale(1)
    setTx(0)
    setTy(0)
  }, [])

  const isZoomed = scale > 1.05

  const clampTranslation = useCallback((s: number, x: number, y: number) => {
    if (s <= 1) return { x: 0, y: 0 }
    const el = imgWrapRef.current
    if (!el) return { x, y }
    const rect = el.getBoundingClientRect()
    const w = rect.width / s   // unscaled width
    const h = rect.height / s  // unscaled height
    const maxX = (w * (s - 1)) / 2
    const maxY = (h * (s - 1)) / 2
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    }
  }, [])

  const prev = useCallback(() => {
    resetTransform()
    setIdx(i => (i - 1 + imageRefs.length) % imageRefs.length)
  }, [imageRefs.length, resetTransform])

  const next = useCallback(() => {
    resetTransform()
    setIdx(i => (i + 1) % imageRefs.length)
  }, [imageRefs.length, resetTransform])

  /* ── keyboard ─────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')              onClose()
      if (e.key === 'ArrowLeft')           prev()
      if (e.key === 'ArrowRight')          next()
      if (e.key === '+' || e.key === '=')  setScale(s => Math.min(MAX_SCALE, s * 1.5))
      if (e.key === '-')                   setScale(s => { const ns = s / 1.5; if (ns <= 1.05) { resetTransform(); return 1 } return ns })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next, resetTransform])

  /* ── prevent iOS Safari bounce / browser zoom ─────────────── */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const prevent = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault()
    }
    el.addEventListener('touchmove', prevent, { passive: false })
    return () => el.removeEventListener('touchmove', prevent)
  }, [])

  /* ── touch handlers ───────────────────────────────────────── */
  const dist = (a: React.Touch, b: React.Touch) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)

  const mid = (a: React.Touch, b: React.Touch) => ({
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2,
  })

  const handleTouchStart = (e: React.TouchEvent) => {
    const ts = touchState.current
    ts.hasMoved = false

    if (e.touches.length === 2) {
      // Pinch start
      ts.isPinching = true
      ts.startScale = scale
      ts.startTx = tx
      ts.startTy = ty
      ts.startDist = dist(e.touches[0], e.touches[1])
      ts.startMid = mid(e.touches[0], e.touches[1])
    } else if (e.touches.length === 1) {
      ts.isPinching = false
      ts.swipeStartX = e.touches[0].clientX
      ts.swipeStartY = e.touches[0].clientY
      ts.startTx = tx
      ts.startTy = ty
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const ts = touchState.current
    ts.hasMoved = true

    if (e.touches.length === 2 && ts.isPinching) {
      // Pinch zoom
      const d = dist(e.touches[0], e.touches[1])
      const ratio = d / ts.startDist
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, ts.startScale * ratio))

      // Translate so the midpoint stays stable
      const m = mid(e.touches[0], e.touches[1])
      const dx = m.x - ts.startMid.x
      const dy = m.y - ts.startMid.y
      const newTx = ts.startTx + dx
      const newTy = ts.startTy + dy
      const clamped = clampTranslation(newScale, newTx, newTy)

      setScale(newScale)
      setTx(clamped.x)
      setTy(clamped.y)
    } else if (e.touches.length === 1 && !ts.isPinching) {
      const dx = e.touches[0].clientX - ts.swipeStartX
      const dy = e.touches[0].clientY - ts.swipeStartY

      if (isZoomed) {
        // Pan
        const newTx = ts.startTx + dx
        const newTy = ts.startTy + dy
        const clamped = clampTranslation(scale, newTx, newTy)
        setTx(clamped.x)
        setTy(clamped.y)
      }
      // Swipe detection happens on touchEnd
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const ts = touchState.current

    // Reset pinch flag when fingers lift
    if (e.touches.length < 2) {
      ts.isPinching = false
    }

    // Snap back to 1 if barely zoomed
    if (scale < 1.1) {
      resetTransform()
    }

    // Single-finger touch end: check for swipe or double-tap
    if (e.changedTouches.length === 1 && e.touches.length === 0) {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const dx = endX - ts.swipeStartX
      const dy = endY - ts.swipeStartY
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      // Swipe navigation (only when not zoomed)
      if (!isZoomed && absDx > SWIPE_THRESH && absDx > absDy / SWIPE_V_LIMIT && imageRefs.length > 1) {
        if (dx < 0) next()
        else prev()
        return
      }

      const isTap = !ts.hasMoved || (absDx < 10 && absDy < 10)

      // Single tap while zoomed → zoom out
      if (isZoomed && isTap) {
        resetTransform()
        return
      }

      // Double-tap to zoom in (only when not zoomed)
      if (isTap) {
        const now = Date.now()
        const tapDx = Math.abs(endX - ts.lastTapX)
        const tapDy = Math.abs(endY - ts.lastTapY)
        if (now - ts.lastTapTime < DOUBLE_TAP_MS && tapDx < 30 && tapDy < 30) {
          const rect = imgWrapRef.current?.getBoundingClientRect()
          if (rect) {
            const newScale = 2.5
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2
            const offsetX = (endX - centerX) * (newScale - 1)
            const offsetY = (endY - centerY) * (newScale - 1)
            const clamped = clampTranslation(newScale, -offsetX, -offsetY)
            setScale(newScale)
            setTx(clamped.x)
            setTy(clamped.y)
          } else {
            setScale(2.5)
          }
          ts.lastTapTime = 0
          return
        }
        ts.lastTapTime = now
        ts.lastTapX = endX
        ts.lastTapY = endY
      }
    }
  }

  /* ── mouse handlers (desktop drag-to-pan) ─────────────────── */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isZoomed) return
    e.preventDefault()
    const ms = mouseState.current
    ms.dragging = true
    ms.moved = 0
    ms.startX = e.clientX
    ms.startY = e.clientY
    ms.startTx = tx
    ms.startTy = ty
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const ms = mouseState.current
    if (!ms.dragging) return
    const dx = e.clientX - ms.startX
    const dy = e.clientY - ms.startY
    ms.moved = Math.hypot(dx, dy)
    const clamped = clampTranslation(scale, ms.startTx + dx, ms.startTy + dy)
    setTx(clamped.x)
    setTy(clamped.y)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    const ms = mouseState.current
    if (!ms.dragging) return
    ms.dragging = false
    if (ms.moved < 4) {
      // Click — toggle zoom
      e.stopPropagation()
      if (isZoomed) {
        resetTransform()
      } else {
        handleClickZoom(e)
      }
    }
  }

  const handleMouseLeave = () => {
    mouseState.current.dragging = false
  }

  /** Click to zoom on desktop (non-zoomed state) */
  const handleClickZoom = (e: React.MouseEvent) => {
    const rect = imgWrapRef.current?.getBoundingClientRect()
    if (!rect) { setScale(2.5); return }
    const newScale = 2.5
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const offsetX = (e.clientX - centerX) * (newScale - 1)
    const offsetY = (e.clientY - centerY) * (newScale - 1)
    const clamped = clampTranslation(newScale, -offsetX, -offsetY)
    setScale(newScale)
    setTx(clamped.x)
    setTy(clamped.y)
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isZoomed && !mouseState.current.dragging) {
      handleClickZoom(e)
    }
  }

  /* ── wheel zoom (desktop) ────────────────────────────────── */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.85 : 1.18
      setScale(prev => {
        const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev * delta))
        if (ns <= 1.05) {
          setTx(0)
          setTy(0)
          return 1
        }
        return ns
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  /* ── zoom button handlers ────────────────────────────────── */
  const zoomIn = () => setScale(s => Math.min(MAX_SCALE, s * 1.5))
  const zoomOut = () => {
    setScale(s => {
      const ns = s / 1.5
      if (ns <= 1.05) { resetTransform(); return 1 }
      return ns
    })
  }

  /* ── cursor ──────────────────────────────────────────────── */
  const cursor = isZoomed
    ? (mouseState.current.dragging ? 'cursor-grabbing' : 'cursor-grab')
    : 'cursor-zoom-in'

  /* ── render ──────────────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-black/90 touch-none"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3 safe-area-top"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-white/40 text-xs select-none">
          {imageRefs.length > 1 ? `${idx + 1} / ${imageRefs.length}` : ''}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={zoomIn}
            className="w-10 h-10 rounded-full bg-white/10 active:bg-white/30 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={zoomOut}
            className="w-10 h-10 rounded-full bg-white/10 active:bg-white/30 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 active:bg-white/30 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        className={`flex-1 flex items-center justify-center overflow-hidden select-none ${cursor}`}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={imgWrapRef}
          className="transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            willChange: 'transform',
          }}
          onClick={handleImageClick}
        >
          {renderImage(
            imageRefs[idx],
            'block max-w-[94vw] max-h-[80vh] w-auto h-auto object-contain rounded-xl shadow-2xl pointer-events-none',
          )}
        </div>
      </div>

      {/* Nav arrows (hidden on small screens — use swipe) */}
      {imageRefs.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev() }}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80 text-white items-center justify-center transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next() }}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80 text-white items-center justify-center transition-colors"
            aria-label="Next image"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Dots indicator for mobile (multiple images) */}
      {imageRefs.length > 1 && (
        <div className="flex-shrink-0 flex justify-center gap-1.5 pb-2 sm:hidden" onClick={e => e.stopPropagation()}>
          {imageRefs.map((_, i) => (
            <button
              key={i}
              onClick={() => { resetTransform(); setIdx(i) }}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === idx ? 'bg-white' : 'bg-white/30'
              }`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Hint */}
      <p className="flex-shrink-0 text-center text-white/25 text-[10px] pb-3 pointer-events-none select-none safe-area-bottom">
        {isZoomed
          ? 'Drag to pan · Tap to zoom out'
          : 'Click to zoom · Double-tap for 2.5×'}
        {imageRefs.length > 1 && !isZoomed ? ' · Swipe ← →' : ''}
        {' · Esc to close'}
      </p>
    </div>
  )
}
