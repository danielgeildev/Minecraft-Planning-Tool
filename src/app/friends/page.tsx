'use client'

import Link from 'next/link'
import { AuthPromptBanner } from '@/components/ui/AuthPromptBanner'
import { FriendsSidebarSection } from '@/components/friends/FriendsSidebarSection'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/useAuthStore'

export default function FriendsPage() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">👥 Freunde</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Freunde per Code adden, Anfragen bestaetigen und Profile anschauen.</p>
      </div>

      {!isAuthenticated ? (
        <>
          <AuthPromptBanner />
          <EmptyState
            icon={<span>👥</span>}
            title="Freunde gibt es nur mit Account"
            description="Mit einem Account bekommst du einen Freundescode, kannst Anfragen senden und den Fortschritt deiner Freunde sehen."
            action={
              <Link href="/login">
                <Button>Jetzt anmelden</Button>
              </Link>
            }
          />
        </>
      ) : (
        <div className="rounded-3xl border border-rose-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 sm:p-5">
          <FriendsSidebarSection mode="page" />
        </div>
      )}
    </div>
  )
}
