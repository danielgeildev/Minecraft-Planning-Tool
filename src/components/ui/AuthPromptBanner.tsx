'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

export function AuthPromptBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-slate-800 border border-rose-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
          Daten sicher in der Cloud speichern?
        </p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          Erstelle einen Account, um deine Daten auf allen Geräten zu nutzen.
        </p>
      </div>
      <Link
        href="/register"
        className="flex-shrink-0 rounded-xl bg-pink-400 text-white px-3 py-1.5 text-xs font-semibold hover:bg-pink-500 transition-colors"
      >
        Registrieren
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="text-gray-300 dark:text-slate-600 hover:text-gray-500 flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}
