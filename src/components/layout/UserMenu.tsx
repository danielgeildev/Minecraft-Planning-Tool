'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Camera, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/useAuthStore'
import { stopSync } from '@/lib/supabase/syncEngine'

export function ProfileAvatar() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const displayName =
    user?.user_metadata?.player_name ||
    user?.email?.split('@')[0] ||
    'Spieler'
  const initial = displayName.charAt(0).toUpperCase()

  async function handleLogout() {
    stopSync()
    const supabase = createClient()
    await supabase.auth.signOut()
    useAuthStore.getState().setUser(null)
    setMenuOpen(false)
    router.push('/login')
    router.refresh()
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    const supabase = createClient()

    // Upload to Supabase Storage (avatars bucket)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      console.error('[avatar] upload failed', uploadError)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    // Update user metadata with avatar URL
    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: `${publicUrl}?t=${Date.now()}` },
    })

    if (updateError) {
      console.error('[avatar] metadata update failed', updateError)
    } else {
      // Refresh auth state to pick up new avatar
      const { data: { user: refreshed } } = await supabase.auth.getUser()
      if (refreshed) useAuthStore.getState().setUser(refreshed)
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Anonymous / not logged in — gray silhouette
  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/login"
        className="group relative flex-shrink-0"
        title="Anmelden"
      >
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-500 group-hover:bg-gray-300 dark:group-hover:bg-slate-600 transition-colors">
          <User size={18} />
        </div>
      </Link>
    )
  }

  // Authenticated — avatar with menu
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="w-9 h-9 rounded-full overflow-hidden border-2 border-pink-200 dark:border-pink-800 hover:border-pink-400 transition-colors"
        title={displayName}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-pink-400 text-white flex items-center justify-center text-sm font-bold">
            {initial}
          </div>
        )}
      </button>

      {uploading && (
        <div className="absolute inset-0 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-12 left-0 z-50 w-56 bg-white dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-slate-700 shadow-lg py-2">
            {/* User info */}
            <div className="px-3 py-2 border-b border-rose-50 dark:border-slate-700">
              <p className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate">{displayName}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{user.email}</p>
            </div>

            {/* Change profile picture */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Camera size={13} />
              Profilbild ändern
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />

            {/* Settings link */}
            <Link
              href="/settings?tab=account"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="text-sm">⚙️</span>
              Account-Einstellungen
            </Link>

            {/* Logout */}
            <div className="border-t border-rose-50 dark:border-slate-700 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut size={13} />
                Abmelden
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
