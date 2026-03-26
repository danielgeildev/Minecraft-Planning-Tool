// ─── XP System — Pure Functions ─────────────────────────────────────────────

import { MOB_LEVELS, XP_THRESHOLDS, MAX_LEVEL, type MobLevel } from './levels'

// ─── XP Event Types ─────────────────────────────────────────────────────────

export type XpEventType =
  | 'quest_created'
  | 'quest_completed'
  | 'item_created'
  | 'item_have'
  | 'building_created'
  | 'building_completed'
  | 'note_created'
  | 'goal_created'
  | 'goal_completed'

export const XP_VALUES: Record<XpEventType, number> = {
  quest_created:     8,
  quest_completed:   20,
  item_created:      5,
  item_have:         12,
  building_created:  10,
  building_completed: 25,
  note_created:      6,
  goal_created:      15,
  goal_completed:    30,
}

export const XP_LABELS: Record<XpEventType, string> = {
  quest_created:     'Quest erstellt',
  quest_completed:   'Quest abgeschlossen',
  item_created:      'Item erstellt',
  item_have:         'Item gesammelt',
  building_created:  'Gebäude erstellt',
  building_completed: 'Gebäude fertiggestellt',
  note_created:      'Notiz erstellt',
  goal_created:      'Ziel erstellt',
  goal_completed:    'Ziel erreicht',
}

// ─── Level Calculations ─────────────────────────────────────────────────────

/** Get level number (1–21) from total XP */
export function getLevelFromXp(totalXp: number): number {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= XP_THRESHOLDS[i]) return i + 1
  }
  return 1
}

/** Get the MobLevel definition for a given total XP */
export function getCurrentMobLevel(totalXp: number): MobLevel {
  const level = getLevelFromXp(totalXp)
  return MOB_LEVELS[level - 1]
}

/** Get the XP threshold for a specific level number */
export function getXpThresholdForLevel(level: number): number {
  if (level < 1) return 0
  if (level > MAX_LEVEL) return XP_THRESHOLDS[MAX_LEVEL - 1]
  return XP_THRESHOLDS[level - 1]
}

/** Progress towards next level as 0–1 fraction */
export function getProgressToNextLevel(totalXp: number): number {
  const level = getLevelFromXp(totalXp)
  if (level >= MAX_LEVEL) return 1 // max level reached

  const currentThreshold = XP_THRESHOLDS[level - 1]
  const nextThreshold = XP_THRESHOLDS[level]
  const range = nextThreshold - currentThreshold

  if (range <= 0) return 1
  return Math.min(1, (totalXp - currentThreshold) / range)
}

/** XP remaining until next level */
export function getXpToNextLevel(totalXp: number): number {
  const level = getLevelFromXp(totalXp)
  if (level >= MAX_LEVEL) return 0

  const nextThreshold = XP_THRESHOLDS[level]
  return nextThreshold - totalXp
}

/** XP earned within the current level */
export function getXpInCurrentLevel(totalXp: number): number {
  const level = getLevelFromXp(totalXp)
  return totalXp - XP_THRESHOLDS[level - 1]
}

/** Total XP range for the current level */
export function getCurrentLevelRange(totalXp: number): number {
  const level = getLevelFromXp(totalXp)
  if (level >= MAX_LEVEL) return 0

  return XP_THRESHOLDS[level] - XP_THRESHOLDS[level - 1]
}

// Re-export types and constants
export { MOB_LEVELS, MAX_LEVEL, type MobLevel } from './levels'
