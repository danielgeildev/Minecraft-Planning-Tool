'use client'

import DOMPurify from 'dompurify'

interface RichTextDisplayProps {
  content:   string
  className?: string
  clamp?:    boolean
}

/** Renders Tiptap HTML content. Falls back gracefully for plain-text strings. */
export function RichTextDisplay({ content, className = '', clamp }: RichTextDisplayProps) {
  if (!content) return null

  // If the content looks like HTML, render it; otherwise treat as plain text
  const isHtml = /^<[a-z][\s\S]*>/i.test(content.trim())

  if (isHtml) {
    // Sanitize: content is user-generated and stored in the DB — without this,
    // tampered rows (or future note-sharing) would allow stored XSS
    return (
      <div
        className={`rich-content text-xs ${clamp ? 'line-clamp-3' : ''} ${className}`}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
      />
    )
  }

  // Plain text fallback
  return (
    <p className={`text-xs whitespace-pre-wrap ${clamp ? 'line-clamp-3' : ''} ${className}`}>
      {content}
    </p>
  )
}
