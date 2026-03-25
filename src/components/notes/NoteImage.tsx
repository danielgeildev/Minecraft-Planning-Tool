'use client'

import { useState, useEffect } from 'react'
import { ImageOff } from 'lucide-react'
import { getImageBlob, isDataUrl } from '@/lib/imageStorage'

interface NoteImageProps {
  imageRef: string
  alt?: string
  className?: string
}

export function NoteImage({ imageRef, alt = '', className = '' }: NoteImageProps) {
  const legacy = isDataUrl(imageRef)
  const [blobUrl, setBlobUrl]   = useState<string | null>(legacy ? imageRef : null)
  const [loading, setLoading]   = useState(!legacy)
  const [error, setError]       = useState(false)

  useEffect(() => {
    if (legacy) return

    let objectUrl: string | null = null
    let cancelled = false

    getImageBlob(imageRef)
      .then(blob => {
        if (cancelled) return
        if (!blob) { setError(true); setLoading(false); return }
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false) } })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imageRef, legacy])

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-rose-50 dark:bg-slate-700 ${className}`}>
        <div className="w-4 h-4 rounded-full border-2 border-pink-300 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !blobUrl) {
    return (
      <div className={`flex items-center justify-center bg-rose-50 dark:bg-slate-700 ${className}`}>
        <ImageOff size={16} className="text-rose-300" />
      </div>
    )
  }

  return <img src={blobUrl} alt={alt} className={className} />
}
