'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Clock3, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  getFriendRequests,
  getMyFriends,
  lookupFriendCode,
  respondToFriendRequest,
  sendFriendRequest,
  type FriendLookupResult,
  type FriendRequestRow,
  type FriendRow,
} from '@/lib/supabase/friends'
import { getCurrentMobLevel } from '@/lib/progression/xp'
import { useAuthStore } from '@/store/useAuthStore'

interface FriendsSidebarSectionProps {
  onNavigate?: () => void
  mode?: 'sidebar' | 'page'
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const initial = name.charAt(0).toUpperCase() || 'F'

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="h-9 w-9 rounded-xl object-cover" />
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-400 text-xs font-bold text-white">
      {initial}
    </div>
  )
}

export function FriendsSidebarSection({ onNavigate, mode = 'sidebar' }: FriendsSidebarSectionProps) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [friendCode, setFriendCode] = useState('')
  const [friends, setFriends] = useState<FriendRow[]>([])
  const [requests, setRequests] = useState<FriendRequestRow[]>([])
  const [lookupResult, setLookupResult] = useState<FriendLookupResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadFriends = useCallback(async () => {
    if (!isAuthenticated) {
      setFriends([])
      setRequests([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [friendRows, requestRows] = await Promise.all([
        getMyFriends(),
        getFriendRequests(),
      ])
      setFriends(friendRows)
      setRequests(requestRows)
    } catch (err) {
      console.error('[friends] failed to load sidebar data', err)
      setError('Freunde konnten gerade nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    void loadFriends()
  }, [loadFriends])

  const incomingRequests = useMemo(
    () => requests.filter(request => request.direction === 'incoming'),
    [requests],
  )

  const outgoingRequests = useMemo(
    () => requests.filter(request => request.direction === 'outgoing'),
    [requests],
  )

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await lookupFriendCode(friendCode)
      if (!result) {
        setLookupResult(null)
        setError('Diesen Freundescode gibt es nicht.')
      } else {
        setLookupResult(result)
      }
    } catch (err) {
      console.error('[friends] code lookup failed', err)
      setError('Der Freundescode konnte nicht geprüft werden.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSendRequest() {
    if (!lookupResult) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await sendFriendRequest(lookupResult.friendCode)
      setSuccess(result === 'accepted' ? 'Freundschaft bestätigt.' : 'Freundschaftsanfrage gesendet.')
      setLookupResult(null)
      setFriendCode('')
      await loadFriends()
    } catch (err) {
      console.error('[friends] send request failed', err)
      setError('Die Freundschaftsanfrage konnte nicht gesendet werden.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRespond(friendId: string, acceptRequest: boolean) {
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      await respondToFriendRequest(friendId, acceptRequest)
      setSuccess(acceptRequest ? 'Freundschaft angenommen.' : 'Anfrage abgelehnt.')
      await loadFriends()
    } catch (err) {
      console.error('[friends] respond request failed', err)
      setError('Die Anfrage konnte nicht verarbeitet werden.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  const isPage = mode === 'page'

  return (
    <section className={isPage ? 'space-y-4' : 'border-t border-rose-50 px-3 py-4 dark:border-slate-700'}>
      <div className="mb-3 flex items-center justify-between px-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-500 dark:text-pink-400">Freunde</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">Code eingeben, adden, Stats sehen</p>
        </div>
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-500 dark:bg-slate-800 dark:text-slate-400">
          {friends.length}
        </span>
      </div>

      <form onSubmit={handleLookup} className="space-y-2 rounded-2xl border border-rose-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <Input
          aria-label="Freundescode"
          placeholder="Freundescode"
          value={friendCode}
          maxLength={8}
          onChange={e => setFriendCode(e.target.value.toUpperCase())}
        />
        <Button type="submit" size="sm" className="w-full justify-center" disabled={submitting || friendCode.trim().length < 6}>
          {submitting ? 'Prüfe...' : 'Freund adden'}
        </Button>

        {lookupResult && (
          <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/80">
            <div className="flex items-center gap-3">
              <Avatar name={lookupResult.playerName} avatarUrl={lookupResult.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800 dark:text-slate-100">{lookupResult.playerName}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400 dark:text-slate-500">{lookupResult.friendCode}</p>
              </div>
            </div>

            <div className="mt-3">
              {lookupResult.relationStatus === 'self' && (
                <p className="text-xs text-gray-500 dark:text-slate-400">Das ist dein eigener Code.</p>
              )}
              {lookupResult.relationStatus === 'accepted' && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Ihr seid bereits befreundet.</p>
              )}
              {lookupResult.relationStatus === 'outgoing_pending' && (
                <p className="text-xs text-amber-600 dark:text-amber-400">Anfrage ist schon unterwegs.</p>
              )}
              {lookupResult.relationStatus === 'incoming_pending' && (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 justify-center" disabled={submitting} onClick={handleSendRequest} type="button">
                    Bestätigen
                  </Button>
                </div>
              )}
              {lookupResult.relationStatus === 'none' && (
                <Button size="sm" className="w-full justify-center" disabled={submitting} onClick={handleSendRequest} type="button">
                  Anfrage senden
                </Button>
              )}
            </div>
          </div>
        )}

        {success && <p className="text-xs text-emerald-600 dark:text-emerald-400">{success}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>

      {loading ? (
        <div className="mt-3 rounded-2xl border border-rose-100 bg-white p-4 text-xs text-gray-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-500">
          Freundesliste wird geladen...
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {incomingRequests.length > 0 && (
            <div className="rounded-2xl border border-rose-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
              <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-slate-200">Offene Anfragen</p>
              <div className="space-y-2">
                {incomingRequests.map(request => (
                  <div key={`${request.friendId}-${request.createdAt}`} className="rounded-xl bg-rose-50/70 p-3 dark:bg-slate-800/80">
                    <div className="flex items-center gap-3">
                      <Avatar name={request.playerName} avatarUrl={request.avatarUrl} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800 dark:text-slate-100">{request.playerName}</p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500">wartet auf deine Antwort</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="flex-1 justify-center" type="button" disabled={submitting} onClick={() => handleRespond(request.friendId, true)}>
                        <Check size={14} /> Annehmen
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1 justify-center" type="button" disabled={submitting} onClick={() => handleRespond(request.friendId, false)}>
                        Später
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {friends.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-rose-200 bg-white/90 p-2 dark:border-slate-700 dark:bg-slate-900/40">
              <EmptyState
                icon={<Users />}
                title="Noch keine Freunde"
                description="Teile deinen Code im Profil und adde hier andere Spieler."
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-rose-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
              <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-slate-200">Deine Liste</p>
              <div className="space-y-2">
                {friends.map(friend => {
                  const mob = getCurrentMobLevel(friend.totalXp)
                  return (
                    <Link
                      key={friend.friendId}
                      href={`/friends/${friend.friendId}`}
                      onClick={onNavigate}
                      className="flex items-center gap-3 rounded-xl bg-rose-50/70 px-3 py-3 transition-colors hover:bg-rose-100 dark:bg-slate-800/80 dark:hover:bg-slate-800"
                    >
                      <Avatar name={friend.playerName} avatarUrl={friend.avatarUrl} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800 dark:text-slate-100">{friend.playerName}</p>
                        <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-gray-500 dark:text-slate-400">
                          <span>{mob.emoji} Lvl {mob.level}</span>
                          <span>{friend.activeQuests} aktiv</span>
                          <span>{friend.completedQuests} fertig</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {outgoingRequests.length > 0 && (
            <div className="rounded-2xl border border-rose-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200">
                <Clock3 size={12} /> Unterwegs
              </p>
              <div className="space-y-2">
                {outgoingRequests.map(request => (
                  <div key={`${request.friendId}-${request.createdAt}`} className="flex items-center gap-3 rounded-xl bg-rose-50/70 px-3 py-2 dark:bg-slate-800/80">
                    <Avatar name={request.playerName} avatarUrl={request.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-slate-100">{request.playerName}</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500">Anfrage gesendet</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
