'use client'

import { createClient } from '@/lib/supabase/client'

export type FriendRelationStatus =
  | 'none'
  | 'self'
  | 'accepted'
  | 'incoming_pending'
  | 'outgoing_pending'

export interface FriendLookupResult {
  userId: string
  playerName: string
  avatarUrl: string | null
  friendCode: string
  relationStatus: FriendRelationStatus
}

export interface FriendRequestRow {
  friendId: string
  playerName: string
  avatarUrl: string | null
  friendCode: string
  direction: 'incoming' | 'outgoing'
  createdAt: string
}

export interface FriendRow {
  friendId: string
  playerName: string
  avatarUrl: string | null
  friendCode: string
  friendsSince: string
  totalXp: number
  activeQuests: number
  completedQuests: number
  activeBuildings: number
  completedBuildings: number
  totalGoals: number
}

export interface FriendProfile {
  friendId: string
  playerName: string
  avatarUrl: string | null
  friendCode: string
  friendsSince: string
  totalXp: number
  totalQuests: number
  openQuests: number
  activeQuests: number
  completedQuests: number
  totalBuildings: number
  plannedBuildings: number
  activeBuildings: number
  completedBuildings: number
  totalGoals: number
  totalNotes: number
}

export interface OwnProfileSummary {
  playerName: string
  avatarUrl: string | null
  friendCode: string
}

function normalizeLookupRow(row: Record<string, unknown>): FriendLookupResult {
  return {
    userId: String(row.user_id),
    playerName: String(row.player_name ?? 'Spieler'),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    friendCode: String(row.friend_code ?? ''),
    relationStatus: (row.relation_status ?? 'none') as FriendRelationStatus,
  }
}

function normalizeRequestRow(row: Record<string, unknown>): FriendRequestRow {
  return {
    friendId: String(row.friend_id),
    playerName: String(row.player_name ?? 'Spieler'),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    friendCode: String(row.friend_code ?? ''),
    direction: row.direction === 'incoming' ? 'incoming' : 'outgoing',
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

function normalizeFriendRow(row: Record<string, unknown>): FriendRow {
  return {
    friendId: String(row.friend_id),
    playerName: String(row.player_name ?? 'Spieler'),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    friendCode: String(row.friend_code ?? ''),
    friendsSince: String(row.friends_since ?? new Date().toISOString()),
    totalXp: Number(row.total_xp ?? 0),
    activeQuests: Number(row.active_quests ?? 0),
    completedQuests: Number(row.completed_quests ?? 0),
    activeBuildings: Number(row.active_buildings ?? 0),
    completedBuildings: Number(row.completed_buildings ?? 0),
    totalGoals: Number(row.total_goals ?? 0),
  }
}

function normalizeFriendProfile(row: Record<string, unknown>): FriendProfile {
  return {
    friendId: String(row.friend_id),
    playerName: String(row.player_name ?? 'Spieler'),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    friendCode: String(row.friend_code ?? ''),
    friendsSince: String(row.friends_since ?? new Date().toISOString()),
    totalXp: Number(row.total_xp ?? 0),
    totalQuests: Number(row.total_quests ?? 0),
    openQuests: Number(row.open_quests ?? 0),
    activeQuests: Number(row.active_quests ?? 0),
    completedQuests: Number(row.completed_quests ?? 0),
    totalBuildings: Number(row.total_buildings ?? 0),
    plannedBuildings: Number(row.planned_buildings ?? 0),
    activeBuildings: Number(row.active_buildings ?? 0),
    completedBuildings: Number(row.completed_buildings ?? 0),
    totalGoals: Number(row.total_goals ?? 0),
    totalNotes: Number(row.total_notes ?? 0),
  }
}

export async function getOwnProfileSummary(): Promise<OwnProfileSummary> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error('Nicht eingeloggt.')

  const { data, error } = await supabase
    .from('profiles')
    .select('player_name, avatar_url, friend_code')
    .eq('id', user.id)
    .single()

  if (error) throw error

  return {
    playerName: String(data.player_name ?? 'Spieler'),
    avatarUrl: data.avatar_url ? String(data.avatar_url) : null,
    friendCode: String(data.friend_code ?? ''),
  }
}

export async function lookupFriendCode(friendCode: string): Promise<FriendLookupResult | null> {
  const supabase = createClient()
  const normalized = friendCode.trim().toUpperCase()

  if (!normalized) return null

  const { data, error } = await supabase.rpc('lookup_friend_code', {
    friend_code_input: normalized,
  })

  if (error) throw error

  const row = Array.isArray(data) ? data[0] : null
  return row ? normalizeLookupRow(row as Record<string, unknown>) : null
}

export async function sendFriendRequest(friendCode: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('send_friend_request', {
    friend_code_input: friendCode.trim().toUpperCase(),
  })

  if (error) throw error
  return String(data ?? 'pending')
}

export async function respondToFriendRequest(friendUserId: string, acceptRequest: boolean): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('respond_to_friend_request', {
    friend_user_id: friendUserId,
    accept_request: acceptRequest,
  })

  if (error) throw error
  return String(data ?? (acceptRequest ? 'accepted' : 'rejected'))
}

export async function getFriendRequests(): Promise<FriendRequestRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_friend_requests')

  if (error) throw error
  return Array.isArray(data)
    ? data.map(row => normalizeRequestRow(row as Record<string, unknown>))
    : []
}

export async function getMyFriends(): Promise<FriendRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_my_friends')

  if (error) throw error
  return Array.isArray(data)
    ? data.map(row => normalizeFriendRow(row as Record<string, unknown>))
    : []
}

export async function getFriendProfile(friendUserId: string): Promise<FriendProfile | null> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_friend_profile', {
    friend_user_id: friendUserId,
  })

  if (error) throw error

  const row = Array.isArray(data) ? data[0] : null
  return row ? normalizeFriendProfile(row as Record<string, unknown>) : null
}
