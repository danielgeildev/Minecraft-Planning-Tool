'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, KeyRound, AlertTriangle, Copy, Check, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore }  from '@/store/useAuthStore'
import { resetAllStores } from '@/store/resetAllStores'
import { stopSync }      from '@/lib/supabase/syncEngine'
import { Button }        from '@/components/ui/Button'
import { Input }         from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getOwnProfileSummary } from '@/lib/supabase/friends'

export function AccountTab() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword]           = useState('')
  const [confirmPw, setConfirmPw]               = useState('')
  const [pwError, setPwError]                   = useState<string | null>(null)
  const [pwSuccess, setPwSuccess]               = useState(false)
  const [pwLoading, setPwLoading]               = useState(false)
  const [friendCode, setFriendCode]             = useState('')
  const [profileLoading, setProfileLoading]     = useState(true)
  const [copySuccess, setCopySuccess]           = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteError, setDeleteError]             = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setProfileLoading(false)
      return
    }

    let cancelled = false

    async function loadProfileSummary() {
      try {
        const summary = await getOwnProfileSummary()
        if (!cancelled) {
          setFriendCode(summary.friendCode)
        }
      } catch (err) {
        console.error('[account] failed to load profile summary', err)
      } finally {
        if (!cancelled) {
          setProfileLoading(false)
        }
      }
    }

    void loadProfileSummary()

    return () => {
      cancelled = true
    }
  }, [user])

  if (!user) return null

  const provider = user.app_metadata?.provider ?? 'email'
  const isEmailAuth = provider === 'email'

  async function handleCopyCode() {
    if (!friendCode) return
    await navigator.clipboard.writeText(friendCode)
    setCopySuccess(true)
    window.setTimeout(() => setCopySuccess(false), 1800)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)

    if (newPassword.length < 6) {
      setPwError('Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }
    if (newPassword !== confirmPw) {
      setPwError('Passwörter stimmen nicht überein.')
      return
    }

    setPwLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPwError(error.message)
    } else {
      setPwSuccess(true)
      setNewPassword('')
      setConfirmPw('')
      setShowPasswordForm(false)
    }
    setPwLoading(false)
  }

  async function handleLogout() {
    stopSync()
    const supabase = createClient()
    await supabase.auth.signOut()
    // Wipe stores + localStorage so the next user on this device
    // doesn't see this account's data
    resetAllStores()
    useAuthStore.getState().setUser(null)
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-rose-50 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">👤 Account</h2>
      </div>
      <div className="px-5 py-4 flex flex-col gap-5">

        {/* Email */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">E-Mail</p>
          <p className="text-sm text-gray-800 dark:text-slate-100">{user.email}</p>
        </div>

        {/* Provider */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Anmeldung via</p>
          <p className="text-sm text-gray-800 dark:text-slate-100">
            {isEmailAuth ? 'E-Mail / Passwort' : `OAuth (${provider})`}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-500 dark:text-pink-400">Freundescode</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">Teile diesen Code, damit andere dich in der Sidebar adden koennen.</p>
            </div>
            <Users size={16} className="text-pink-500" />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1 rounded-2xl bg-white px-4 py-3 text-lg font-bold uppercase tracking-[0.24em] text-gray-800 shadow-sm dark:bg-slate-800 dark:text-slate-100">
              {profileLoading ? 'Lade...' : friendCode || '----'}
            </div>
            <Button type="button" variant="secondary" onClick={handleCopyCode} disabled={profileLoading || !friendCode} className="justify-center">
              {copySuccess ? <Check size={14} /> : <Copy size={14} />}
              {copySuccess ? 'Kopiert' : 'Code kopieren'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">Tipp: Sobald euch beide bestaetigt haben, erscheint das Profil in der Freundesliste.</p>
        </div>

        {/* Password change (email auth only) */}
        {isEmailAuth && (
          <div>
            {!showPasswordForm ? (
              <Button
                variant="secondary"
                onClick={() => setShowPasswordForm(true)}
                className="gap-1.5"
              >
                <KeyRound size={13} />
                Passwort ändern
              </Button>
            ) : (
              <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
                <Input
                  label="Neues Passwort"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
                <Input
                  label="Passwort bestätigen"
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {pwError && (
                  <p className="text-xs text-red-500">{pwError}</p>
                )}
                {pwSuccess && (
                  <p className="text-xs text-emerald-500">Passwort erfolgreich geändert!</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={pwLoading}>
                    {pwLoading ? 'Wird geändert...' : 'Speichern'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowPasswordForm(false)}>
                    Abbrechen
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Logout */}
        <div className="pt-2 border-t border-rose-50 dark:border-slate-700">
          <Button variant="secondary" onClick={handleLogout} className="gap-1.5">
            <LogOut size={13} />
            Abmelden
          </Button>
        </div>

        {/* Delete account (danger zone) */}
        <div className="pt-2 border-t border-rose-50 dark:border-slate-700">
          <p className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1">
            <AlertTriangle size={12} />
            Gefahrenzone
          </p>
          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
            className="gap-1.5"
          >
            Account löschen
          </Button>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
            Alle Daten werden unwiderruflich gelöscht.
          </p>
          {deleteError && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mt-2">
              {deleteError}
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          // Delete all user data, then sign out
          const supabase = createClient()
          stopSync()
          setDeleteError(null)
          // RLS ensures only own data is deleted
          const results = await Promise.all([
            supabase.from('quests').delete().eq('user_id', user.id),
            supabase.from('items').delete().eq('user_id', user.id),
            supabase.from('buildings').delete().eq('user_id', user.id),
            supabase.from('goals').delete().eq('user_id', user.id),
            supabase.from('inventory').delete().eq('user_id', user.id),
            supabase.from('notes').delete().eq('user_id', user.id),
            supabase.from('achievements').delete().eq('user_id', user.id),
            supabase.from('progress').delete().eq('user_id', user.id),
            supabase.from('graph_positions').delete().eq('user_id', user.id),
            supabase.from('profiles').delete().eq('id', user.id),
          ])
          const failed = results.filter(r => r.error)
          if (failed.length > 0) {
            // Don't sign out — the user should see that data is left behind
            setShowDeleteConfirm(false)
            setDeleteError(
              `Löschen unvollständig (${failed.length} Tabelle${failed.length > 1 ? 'n' : ''} fehlgeschlagen). Bitte erneut versuchen.`,
            )
            return
          }
          await supabase.auth.signOut()
          resetAllStores()
          useAuthStore.getState().setUser(null)
          router.push('/login')
          router.refresh()
        }}
        title="Account wirklich löschen?"
        description="Alle deine Daten (Quests, Items, Gebäude, Ziele, Notizen, Achievements, Fortschritt) werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Ja, Account löschen"
      />
    </div>
  )
}
