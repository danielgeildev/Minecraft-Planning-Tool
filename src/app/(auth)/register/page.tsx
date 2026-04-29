'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'

export default function RegisterPage() {
  const router = useRouter()
  const [playerName, setPlayerName]       = useState('')
  const [email, setEmail]                 = useState('')
  const [password, setPassword]           = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError]                 = useState<string | null>(null)
  const [loading, setLoading]             = useState(false)
  const [success, setSuccess]             = useState<'session' | 'confirm' | null>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.')
      return
    }
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }

    setLoading(true)

    const trimmedName = playerName.trim()
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: trimmedName ? { player_name: trimmedName } : undefined,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If email confirmation is enabled in Supabase, signUp returns user without session.
    // Don't redirect — middleware would bounce them back to /login.
    if (!data.session) {
      setSuccess('confirm')
      return
    }

    setSuccess('session')
    setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 1500)
  }

  if (success === 'session') {
    return (
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 p-6 shadow-sm text-center">
        <span className="text-4xl block mb-3" aria-hidden="true">🎉</span>
        <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-2">Account erstellt!</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Du wirst gleich weitergeleitet...
        </p>
      </div>
    )
  }

  if (success === 'confirm') {
    return (
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 p-6 shadow-sm text-center">
        <span className="text-4xl block mb-3" aria-hidden="true">📧</span>
        <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-2">Bestätige deine E-Mail</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
          Wir haben dir einen Bestätigungs-Link an
        </p>
        <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3 break-all">
          {email}
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
          geschickt. Klick den Link, um deinen Account zu aktivieren.
        </p>
        <Link
          href="/login"
          className="text-sm text-pink-500 hover:text-pink-600 font-medium"
        >
          Zurück zum Login
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-2xl">⛏️</span>
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">Registrieren</h1>
      </div>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <fieldset disabled={loading} className="contents">
          <Input
            label="Spielername"
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="optional"
            autoFocus
          />
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
            minLength={6}
            autoComplete="new-password"
          />
          <Input
            label="Passwort bestätigen"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Wird erstellt...' : 'Account erstellen'}
          </Button>
        </fieldset>
      </form>

      <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-5">
        Bereits ein Account?{' '}
        <Link href="/login" className="text-pink-500 hover:text-pink-600 font-medium">
          Anmelden
        </Link>
      </p>
    </div>
  )
}
