'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'

const ZOOM = 2.5

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
  const [idx, setIdx]       = useState(initialIndex)
  const [zoomed, setZoomed] = useState(false)
  const scrollRef           = useRef<HTMLDivElement>(null)

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

  /** Zoom in centred on the exact pixel the user clicked. */
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()

    if (zoomed) {
      setZoomed(false)
      return
    }

    // Fraction within the current (un-zoomed) image wrapper
    const rect = e.currentTarget.getBoundingClientRect()
    const fracX = (e.clientX - rect.left)  / rect.width
    const fracY = (e.clientY - rect.top)   / rect.height

    setZoomed(true)

    // After two animation frames the DOM has the zoomed layout; scroll so the
    // clicked point ends up in the centre of the scroll container.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const c = scrollRef.current
      if (!c) return
      c.scrollLeft = fracX * c.scrollWidth  - c.clientWidth  / 2
      c.scrollTop  = fracY * c.scrollHeight - c.clientHeight / 2
    }))
  }

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
        /* Zoomed: scrollable container, image scaled via CSS zoom */
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto cursor-zoom-out"
          onClick={e => { e.stopPropagation(); setZoomed(false) }}
        >
          {/* Inner wrapper carries the zoom; CSS `zoom` affects layout → scrollbars work naturally */}
          <div style={{ zoom: ZOOM }} className="inline-block">
            {renderImage(
              imageRefs[idx],
              'block max-w-[92vw] max-h-[78vh] w-auto h-auto object-contain rounded-xl shadow-2xl select-none',
            )}
          </div>
        </div>
      ) : (
        /* Normal: centred, click to zoom at click point */
        <div className="flex-1 flex items-center justify-center">
          <div
            className="cursor-zoom-in"
            onClick={handleImageClick}
          >
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
        {zoomed ? 'Scrollen zum Erkunden · Klick zum Herauszoomen' : 'Klick zum Hineinzoomen'}
        {imageRefs.length > 1 ? ' · ← →' : ''}
        {' · Esc schließen'}
      </p>
    </div>
  )
}
