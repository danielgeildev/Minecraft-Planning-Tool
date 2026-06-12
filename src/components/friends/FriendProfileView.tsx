'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ShieldAlert, Users } from 'lucide-react'
import { AuthPromptBanner } from '@/components/ui/AuthPromptBanner'
import { EmptyState } from '@/components/ui/EmptyState'
import { getFriendProfile, type FriendProfile } from '@/lib/supabase/friends'
import { getCurrentMobLevel, getProgressToNextLevel } from '@/lib/progression/xp'
import { useAuthStore } from '@/store/useAuthStore'

function StatCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400 dark:text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{hint}</p>
    </div>
  )
}

export function FriendProfileView({ friendId }: { friendId: string }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [profile, setProfile] = useState<FriendProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      setError(null)

      try {
        const data = await getFriendProfile(friendId)
        if (!cancelled) {
          setProfile(data)
        }
      } catch (err) {
        console.error('[friends] failed to load profile', err)
        if (!cancelled) {
          setError('Dieses Freundesprofil konnte nicht geladen werden.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [friendId, isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
        <AuthPromptBanner />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
        <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-gray-400 dark:text-slate-500">Freundesprofil wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
        <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm dark:border-red-900/40 dark:bg-slate-800">
          <p className="text-sm font-semibold text-red-500">{error}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Pruefe, ob ihr bereits befreundet seid.</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
        <div className="rounded-3xl border border-dashed border-rose-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <EmptyState
            icon={<ShieldAlert />}
            title="Profil nicht verfuegbar"
            description="Dieses Profil ist nur fuer bestaetigte Freunde sichtbar."
          />
        </div>
      </div>
    )
  }

  const mob = getCurrentMobLevel(profile.totalXp)
  const progressToNext = getProgressToNextLevel(profile.totalXp)
  const friendsSince = new Date(profile.friendsSince).toLocaleDateString('de-DE')
  const initials = profile.playerName.charAt(0).toUpperCase() || 'F'

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-pink-500 hover:text-pink-600">
        <ArrowLeft size={16} /> Zurueck
      </Link>

      <section className="relative overflow-hidden rounded-3xl border border-rose-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,114,182,0.18),_transparent_45%)]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.playerName} className="h-24 w-24 rounded-3xl object-cover shadow-sm" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-pink-400 text-3xl font-bold text-white shadow-sm">
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500 dark:text-pink-400">Freundesprofil</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-800 dark:text-slate-100">{profile.playerName}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-slate-400">
              <span className="rounded-full bg-rose-50 px-3 py-1 dark:bg-slate-700">Code {profile.friendCode}</span>
              <span className="rounded-full bg-rose-50 px-3 py-1 dark:bg-slate-700">Freunde seit {friendsSince}</span>
              <span className="rounded-full bg-rose-50 px-3 py-1 dark:bg-slate-700">{profile.totalXp.toLocaleString('de-DE')} XP</span>
            </div>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-center dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-slate-500">Tier Rang</p>
            <p className="mt-1 text-3xl">{mob.emoji}</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Lvl {mob.level} {mob.mob}</p>
          </div>
        </div>

        <div className="relative mt-6 rounded-2xl border border-rose-100 bg-rose-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex items-center justify-between gap-3 text-xs font-medium text-gray-500 dark:text-slate-400">
            <span>Fortschritt zum naechsten Rang</span>
            <span>{Math.round(progressToNext * 100)}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/80 dark:bg-slate-700">
            <div className="h-2 rounded-full bg-gradient-to-r from-pink-400 to-rose-400" style={{ width: `${Math.max(4, progressToNext * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">{mob.description}</p>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Quests" value={profile.totalQuests} hint={`${profile.activeQuests} aktiv · ${profile.completedQuests} fertig`} />
        <StatCard label="Gebaeude" value={profile.totalBuildings} hint={`${profile.activeBuildings} im Bau · ${profile.completedBuildings} fertig`} />
        <StatCard label="Ziele" value={profile.totalGoals} hint="Alle gesetzten Ziele" />
        <StatCard label="Notizen" value={profile.totalNotes} hint="Persoenliche Sammlung" />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Quest-Ueberblick</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-rose-50/80 px-4 py-3 dark:bg-slate-900/70">
              <span className="text-gray-500 dark:text-slate-400">Offen</span>
              <span className="font-semibold text-gray-800 dark:text-slate-100">{profile.openQuests}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-rose-50/80 px-4 py-3 dark:bg-slate-900/70">
              <span className="text-gray-500 dark:text-slate-400">Gerade aktiv</span>
              <span className="font-semibold text-gray-800 dark:text-slate-100">{profile.activeQuests}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-rose-50/80 px-4 py-3 dark:bg-slate-900/70">
              <span className="text-gray-500 dark:text-slate-400">Abgeschlossen</span>
              <span className="font-semibold text-gray-800 dark:text-slate-100">{profile.completedQuests}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏗️</span>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Bau-Ueberblick</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-rose-50/80 px-4 py-3 dark:bg-slate-900/70">
              <span className="text-gray-500 dark:text-slate-400">Geplant</span>
              <span className="font-semibold text-gray-800 dark:text-slate-100">{profile.plannedBuildings}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-rose-50/80 px-4 py-3 dark:bg-slate-900/70">
              <span className="text-gray-500 dark:text-slate-400">Im Bau</span>
              <span className="font-semibold text-gray-800 dark:text-slate-100">{profile.activeBuildings}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-rose-50/80 px-4 py-3 dark:bg-slate-900/70">
              <span className="text-gray-500 dark:text-slate-400">Fertig</span>
              <span className="font-semibold text-gray-800 dark:text-slate-100">{profile.completedBuildings}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-rose-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-pink-500" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Kurzfazit</h2>
        </div>
        <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-slate-300">
          {profile.playerName} ist aktuell auf Rang <span className="font-semibold text-gray-800 dark:text-slate-100">{mob.mob}</span> unterwegs,
          arbeitet an <span className="font-semibold text-gray-800 dark:text-slate-100">{profile.activeQuests} aktiven Quests</span> und hat bereits
          <span className="font-semibold text-gray-800 dark:text-slate-100"> {profile.completedBuildings} Gebaeude abgeschlossen</span>.
        </p>
      </section>
    </div>
  )
}
