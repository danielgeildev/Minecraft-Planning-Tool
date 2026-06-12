import { describe, it, expect } from 'vitest'
import {
  getLevelFromXp,
  getCurrentMobLevel,
  getXpThresholdForLevel,
  getProgressToNextLevel,
  getXpToNextLevel,
  getXpInCurrentLevel,
  MAX_LEVEL,
} from './xp'
import { XP_THRESHOLDS, MOB_LEVELS } from './levels'

describe('XP_THRESHOLDS invariants', () => {
  it('has one threshold per level, starting at 0', () => {
    expect(XP_THRESHOLDS.length).toBe(MAX_LEVEL)
    expect(XP_THRESHOLDS[0]).toBe(0)
    expect(MOB_LEVELS.length).toBe(MAX_LEVEL)
  })

  it('is strictly increasing', () => {
    for (let i = 1; i < XP_THRESHOLDS.length; i++) {
      expect(XP_THRESHOLDS[i]).toBeGreaterThan(XP_THRESHOLDS[i - 1])
    }
  })
})

describe('getLevelFromXp', () => {
  it('returns level 1 at 0 XP', () => {
    expect(getLevelFromXp(0)).toBe(1)
  })

  it('levels up exactly at each threshold', () => {
    for (let level = 2; level <= MAX_LEVEL; level++) {
      const threshold = XP_THRESHOLDS[level - 1]
      expect(getLevelFromXp(threshold)).toBe(level)
      expect(getLevelFromXp(threshold - 1)).toBe(level - 1)
    }
  })

  it('caps at MAX_LEVEL for huge XP', () => {
    expect(getLevelFromXp(1_000_000)).toBe(MAX_LEVEL)
  })

  it('handles negative XP gracefully', () => {
    expect(getLevelFromXp(-50)).toBe(1)
  })
})

describe('getCurrentMobLevel', () => {
  it('returns the matching MOB_LEVELS entry', () => {
    expect(getCurrentMobLevel(0)).toBe(MOB_LEVELS[0])
    expect(getCurrentMobLevel(1_000_000)).toBe(MOB_LEVELS[MAX_LEVEL - 1])
  })
})

describe('getXpThresholdForLevel', () => {
  it('clamps below 1 and above MAX_LEVEL', () => {
    expect(getXpThresholdForLevel(0)).toBe(0)
    expect(getXpThresholdForLevel(MAX_LEVEL + 5)).toBe(XP_THRESHOLDS[MAX_LEVEL - 1])
  })

  it('returns the threshold for valid levels', () => {
    expect(getXpThresholdForLevel(1)).toBe(XP_THRESHOLDS[0])
    expect(getXpThresholdForLevel(2)).toBe(XP_THRESHOLDS[1])
  })
})

describe('getProgressToNextLevel', () => {
  it('is 0 right at a level threshold', () => {
    expect(getProgressToNextLevel(XP_THRESHOLDS[1])).toBe(0)
  })

  it('is 0.5 at the midpoint of a level', () => {
    const start = XP_THRESHOLDS[1]
    const end   = XP_THRESHOLDS[2]
    expect(getProgressToNextLevel(start + (end - start) / 2)).toBeCloseTo(0.5)
  })

  it('is 1 at max level', () => {
    expect(getProgressToNextLevel(XP_THRESHOLDS[MAX_LEVEL - 1])).toBe(1)
  })
})

describe('getXpToNextLevel', () => {
  it('returns the remaining XP within the current level', () => {
    expect(getXpToNextLevel(0)).toBe(XP_THRESHOLDS[1])
    expect(getXpToNextLevel(XP_THRESHOLDS[1] - 5)).toBe(5)
  })

  it('returns 0 at max level', () => {
    expect(getXpToNextLevel(XP_THRESHOLDS[MAX_LEVEL - 1] + 999)).toBe(0)
  })
})

describe('getXpInCurrentLevel', () => {
  it('returns XP earned since the current level started', () => {
    expect(getXpInCurrentLevel(0)).toBe(0)
    expect(getXpInCurrentLevel(XP_THRESHOLDS[1] + 7)).toBe(7)
  })
})
