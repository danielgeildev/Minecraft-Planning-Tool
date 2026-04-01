'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'E-Mail oder Passwort falsch.'
          : error.message,
      )
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-2xl">⛏️</span>
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">Anmelden</h1>
      </div>

      <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
        <Input
          label="E-Mail"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Passwort"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full justify-center">
          {loading ? 'Wird angemeldet...' : 'Anmelden'}
        </Button>
      </form>

      <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-5">
        Noch kein Account?{' '}
        <Link href="/register" className="text-pink-500 hover:text-pink-600 font-medium">
          Registrieren
        </Link>
      </p>

      {/* "Ohne Account" — centered, highlighted */}
      <button
        onClick={() => {
          document.cookie = 'atm10-anonymous-mode=true; path=/; max-age=31536000'
          router.push('/')
          router.refresh()
        }}
        className="w-full text-center py-2.5 text-sm font-semibold text-pink-500 hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-xl transition-colors"
      >
        Ohne Account fortfahren →
      </button>
    </div>
  )
}
