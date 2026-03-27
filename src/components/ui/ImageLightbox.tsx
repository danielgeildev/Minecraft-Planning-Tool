'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'

const ZOOM        = 2.5
const DRAG_THRESH = 4   // px — below this a drag counts as a click

interface ImageLightboxProps {
  /** imageRefs, UUIDs, or data-URLs — one per image */
  imageRefs: string[]
  initialIndex?: number
  onClose: () => void
  /** Custom renderer so callers can pass <NoteImage> or plain <img> */
  renderImage: (ref: string, className: string) => ReactNode
}

export function ImageLightbox({
  imageRefs,
  initialIndex = 0,
  onClose,
  renderImage,
}: ImageLightboxProps) {
  const [idx, setIdx]         = useState(initialIndex)
  const [zoomed, setZoomed]   = useState(false)
  const [dragging, setDragging] = useState(false)
  const scrollRef             = useRef<HTMLDivElement>(null)

  // Drag state (refs so mouse handlers never become stale)
  const dragOrigin  = useRef({ x: 0, y: 0, sl: 0, st: 0 })
  const dragMoved   = useRef(0)
  const isDragging  = useRef(false)

  const prev = () => { setZoomed(false); setIdx(i => (i - 1 + imageRefs.length) % imageRefs.length) }
  const next = () => { setZoomed(false); setIdx(i => (i + 1) % imageRefs.length) }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')              onClose()
      if (e.key === 'ArrowLeft')           prev()
      if (e.key === 'ArrowRight')          next()
      if (e.key === '+' || e.key === '=') setZoomed(true)
      if (e.key === '-')                   setZoomed(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // No window-level mouseup listener — it fires before React's onMouseUp and
  // resets isDragging.current too early, breaking click-to-zoom-out detection.
  // Drag cancelled via onMouseLeave instead (see below).

  /** Click on un-zoomed image → zoom in, centring on the clicked pixel. */
  const handleUnzoomedClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const fracX = (e.clientX - rect.left) / rect.width
    const fracY = (e.clientY - rect.top)  / rect.height
    setZoomed(true)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const c = scrollRef.current
      if (!c) return
      c.scrollLeft = fracX * c.scrollWidth  - c.clientWidth  / 2
      c.scrollTop  = fracY * c.scrollHeight - c.clientHeight / 2
    }))
  }

  /** Begin drag-to-pan. */
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return
    e.preventDefault()
    const c = scrollRef.current
    isDragging.current = true
    dragMoved.current  = 0
    dragOrigin.current = { x: e.clientX, y: e.clientY, sl: c?.scrollLeft ?? 0, st: c?.scrollTop ?? 0 }
    setDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !scrollRef.current) return
    const dx = e.clientX - dragOrigin.current.x
    const dy = e.clientY - dragOrigin.current.y
    dragMoved.current = Math.sqrt(dx * dx + dy * dy)
    // Only pan once the user has clearly started dragging — avoids micro-shifts on click
    if (dragMoved.current < DRAG_THRESH) return
    scrollRef.current.scrollLeft = dragOrigin.current.sl - dx
    scrollRef.current.scrollTop  = dragOrigin.current.st - dy
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    const moved = dragMoved.current
    isDragging.current = false
    setDragging(false)
    e.stopPropagation()
    if (moved < DRAG_THRESH) setZoomed(false)
  }

  /** Cancel drag when cursor leaves the container — no zoom-out. */
  const handleMouseLeave = () => {
    if (!isDragging.current) return
    isDragging.current = false
    setDragging(false)
  }

  const zoomedCursor = dragging ? 'cursor-grabbing' : 'cursor-grab'

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-white/40 text-xs select-none">
          {imageRefs.length > 1 ? `${idx + 1} / ${imageRefs.length}` : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomed(z => !z)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title={zoomed ? 'Herauszoomen (-)' : 'Hineinzoomen (+)'}
          >
            {zoomed ? <ZoomOut size={15} /> : <ZoomIn size={15} />}
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Image area */}
      {zoomed ? (
        /* Zoomed: drag-to-pan; short click zooms out */
        <div
          ref={scrollRef}
          className={`flex-1 overflow-auto select-none ${zoomedCursor}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={e => e.stopPropagation()}
        >
          {/* CSS `zoom` affects layout → scrollbars / scrollWidth reflect zoomed size */}
          <div style={{ zoom: ZOOM }} className="inline-block">
            {renderImage(
              imageRefs[idx],
              'block max-w-[92vw] max-h-[78vh] w-auto h-auto object-contain rounded-xl shadow-2xl',
            )}
          </div>
        </div>
      ) : (
        /* Normal: centred, click to zoom at click point */
        <div className="flex-1 flex items-center justify-center">
          <div className="cursor-zoom-in" onClick={handleUnzoomedClick}>
            {renderImage(
              imageRefs[idx],
              'block max-w-[92vw] max-h-[78vh] w-auto h-auto object-contain rounded-xl shadow-2xl select-none',
            )}
          </div>
        </div>
      )}

      {/* Nav arrows */}
      {imageRefs.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev() }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Hint */}
      <p className="flex-shrink-0 text-center text-white/25 text-[10px] pb-3 pointer-events-none select-none">
        {zoomed
          ? 'Ziehen zum Erkunden · Klick zum Herauszoomen'
          : 'Klick zum Hineinzoomen'}
        {imageRefs.length > 1 ? ' · ← →' : ''}
        {' · Esc schließen'}
      </p>
    </div>
  )
}
