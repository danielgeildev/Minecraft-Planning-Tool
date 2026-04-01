'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'

export function UserMenu() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    useAuthStore.getState().setUser(null)
    router.push('/login')
    router.refresh()
  }

  if (!isAuthenticated || !user) return null

  const displayName =
    user.user_metadata?.player_name ||
    user.email?.split('@')[0] ||
    'Spieler'

  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-slate-700/50">
      <div className="w-7 h-7 rounded-full bg-pink-400 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate">{displayName}</p>
        <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{user.email}</p>
      </div>
      <button
        onClick={handleLogout}
        className="text-gray-300 dark:text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
        title="Abmelden"
      >
        <LogOut size={14} />
      </button>
    </div>
  )
}
