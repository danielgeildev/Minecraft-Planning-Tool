'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, KeyRound, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore }  from '@/store/useAuthStore'
import { stopSync }      from '@/lib/supabase/syncEngine'
import { Button }        from '@/components/ui/Button'
import { Input }         from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export function AccountTab() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword]           = useState('')
  const [confirmPw, setConfirmPw]               = useState('')
  const [pwError, setPwError]                   = useState<string | null>(null)
  const [pwSuccess, setPwSuccess]               = useState(false)
  const [pwLoading, setPwLoading]               = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!user) return null

  const provider = user.app_metadata?.provider ?? 'email'
  const isEmailAuth = provider === 'email'

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
                  <Button variant="ghost" onClick={() => setShowPasswordForm(false)}>
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
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          // Delete all user data, then sign out
          const supabase = createClient()
          stopSync()
          // RLS ensures only own data is deleted
          await Promise.all([
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
          await supabase.auth.signOut()
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
