'use client'

import { useEffect, useState } from 'react'
import { getImageBlob, isDataUrl } from '@/lib/imageStorage'

interface BuildingImageProps {
  /** Either a legacy base64 data URL or an IndexedDB key (UUID). */
  imageRef: string
  alt?: string
  className?: string
}

/**
 * Renders a building inspiration image.
 * - Legacy data: URLs are rendered directly without any async loading.
 * - UUID keys are loaded from IndexedDB and converted to object URLs.
 * Object URLs are revoked on unmount to prevent memory leaks.
 */
export function BuildingImage({ imageRef, alt = '', className }: BuildingImageProps) {
  const legacy = isDataUrl(imageRef)

  // For IndexedDB keys: track the resolved blob URL
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(!legacy)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    // Legacy data URLs need no async work — nothing to do
    if (isDataUrl(imageRef)) return

    let objectUrl: string | null = null
    let cancelled = false

    getImageBlob(imageRef)
      .then(blob => {
        if (cancelled) return
        if (!blob) {
          setError(true)
          setLoading(false)
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imageRef])

  // Legacy data URLs render directly — no state involved
  if (legacy) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageRef} alt={alt} className={className} />
  }

  if (loading) {
    return (
      <div className={`bg-gray-100 animate-pulse flex items-center justify-center ${className ?? ''}`}>
        <span className="text-gray-300 text-xs">⏳</span>
      </div>
    )
  }

  if (error || !blobUrl) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className ?? ''}`}>
        <span className="text-gray-300 text-lg">🖼️</span>
      </div>
    )
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={blobUrl} alt={alt} className={className} />
}
