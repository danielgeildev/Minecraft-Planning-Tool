// ─── Mob Level Definitions ──────────────────────────────────────────────────

export interface MobLevel {
  level: number
  xpRequired: number
  mob: string
  emoji: string
  description: string
  tier: 'nature' | 'undead' | 'fantasy' | 'boss' | 'transcend'
  color: {
    from: string        // gradient start
    to: string          // gradient end
    accent: string      // primary accent color
    glow: string        // glow/shadow color
    bg: string          // subtle background tint (light mode)
    darkBg: string      // dark mode background tint
    darkFrom: string    // dark mode gradient start (softer)
    darkTo: string      // dark mode gradient end (softer)
    darkAccent: string  // dark mode accent (less bright)
    darkGlow: string    // dark mode glow (more subtle)
  }
}

export const MOB_LEVELS: MobLevel[] = [
  {
    level: 1, xpRequired: 0,
    mob: 'Huhn', emoji: '🐔',
    description: 'Du bist da… aber ehrlich gesagt hätte auch niemand gemerkt, wenn nicht.',
    tier: 'nature',
    color: { from: '#fbbf24', to: '#f59e0b', accent: '#f59e0b', glow: 'rgba(251,191,36,0.3)', bg: '#fffbeb', darkBg: '#1c1a11', darkFrom: '#92710e', darkTo: '#7a5d0a', darkAccent: '#b8860b', darkGlow: 'rgba(184,134,11,0.2)' },
  },
  {
    level: 2, xpRequired: 25,
    mob: 'Schaf', emoji: '🐑',
    description: 'Du rennst allem hinterher. Eigenständiges Denken ist wohl noch im Tutorial.',
    tier: 'nature',
    color: { from: '#d4d4d4', to: '#a3a3a3', accent: '#a3a3a3', glow: 'rgba(163,163,163,0.3)', bg: '#fafafa', darkBg: '#1a1a1a', darkFrom: '#6b6b6b', darkTo: '#525252', darkAccent: '#8a8a8a', darkGlow: 'rgba(100,100,100,0.2)' },
  },
  {
    level: 3, xpRequired: 60,
    mob: 'Kuh', emoji: '🐄',
    description: 'Du bist jetzt nützlich. Glückwunsch – Mindestanforderung erfüllt.',
    tier: 'nature',
    color: { from: '#92400e', to: '#78350f', accent: '#b45309', glow: 'rgba(180,83,9,0.3)', bg: '#fffbeb', darkBg: '#1c1710', darkFrom: '#6b3008', darkTo: '#5a2907', darkAccent: '#8a4a0a', darkGlow: 'rgba(138,74,10,0.2)' },
  },
  {
    level: 4, xpRequired: 110,
    mob: 'Schwein', emoji: '🐷',
    description: 'Sieht chaotisch aus, fühlt sich chaotisch an… passt also perfekt zu dir.',
    tier: 'nature',
    color: { from: '#fb923c', to: '#f97316', accent: '#ea580c', glow: 'rgba(234,88,12,0.3)', bg: '#fff7ed', darkBg: '#1c1510', darkFrom: '#a35a1f', darkTo: '#8b4a14', darkAccent: '#c4650e', darkGlow: 'rgba(196,101,14,0.2)' },
  },
  {
    level: 5, xpRequired: 180,
    mob: 'Hase', emoji: '🐰',
    description: 'Viel Bewegung, null Plan. Du bist basically Aktivität ohne Sinn.',
    tier: 'nature',
    color: { from: '#fcd34d', to: '#fbbf24', accent: '#d97706', glow: 'rgba(217,119,6,0.3)', bg: '#fefce8', darkBg: '#1c1b10', darkFrom: '#9a7a1e', darkTo: '#8a6c12', darkAccent: '#a67c08', darkGlow: 'rgba(166,124,8,0.2)' },
  },
  {
    level: 6, xpRequired: 270,
    mob: 'Zombie', emoji: '🧟',
    description: 'Du machst einfach weiter. Nicht weil\'s gut ist – sondern weil du nichts checkst.',
    tier: 'undead',
    color: { from: '#4ade80', to: '#22c55e', accent: '#16a34a', glow: 'rgba(74,222,128,0.25)', bg: '#f0fdf4', darkBg: '#0f1f15', darkFrom: '#1a7a3a', darkTo: '#146830', darkAccent: '#1a8a42', darkGlow: 'rgba(26,138,66,0.18)' },
  },
  {
    level: 7, xpRequired: 390,
    mob: 'Skelett', emoji: '💀',
    description: 'Du triffst jetzt Dinge. Reiner Zufall, aber wir nehmen\'s.',
    tier: 'undead',
    color: { from: '#d4d4d8', to: '#a1a1aa', accent: '#71717a', glow: 'rgba(113,113,122,0.3)', bg: '#fafafa', darkBg: '#18181b', darkFrom: '#5a5a60', darkTo: '#48484e', darkAccent: '#7a7a82', darkGlow: 'rgba(80,80,86,0.2)' },
  },
  {
    level: 8, xpRequired: 540,
    mob: 'Spinne', emoji: '🕷️',
    description: 'Du klebst überall rum und nennst das Fortschritt. Mutig.',
    tier: 'undead',
    color: { from: '#78716c', to: '#57534e', accent: '#44403c', glow: 'rgba(120,113,108,0.3)', bg: '#fafaf9', darkBg: '#1c1917', darkFrom: '#4a4540', darkTo: '#3a3632', darkAccent: '#6a6460', darkGlow: 'rgba(80,75,70,0.2)' },
  },
  {
    level: 9, xpRequired: 730,
    mob: 'Husk', emoji: '🏜️',
    description: 'Trocken, lost und trotzdem überzeugt, dass du\'s im Griff hast. Stark delusional.',
    tier: 'undead',
    color: { from: '#d6d3d1', to: '#a8a29e', accent: '#78716c', glow: 'rgba(168,162,158,0.25)', bg: '#fafaf9', darkBg: '#1c1917', darkFrom: '#6a6662', darkTo: '#545048', darkAccent: '#8a8480', darkGlow: 'rgba(100,96,90,0.18)' },
  },
  {
    level: 10, xpRequired: 970,
    mob: 'Stray', emoji: '🧊',
    description: 'Du bist nicht nur lost… du bist lost mit Selbstvertrauen.',
    tier: 'undead',
    color: { from: '#93c5fd', to: '#60a5fa', accent: '#3b82f6', glow: 'rgba(59,130,246,0.25)', bg: '#eff6ff', darkBg: '#0f172a', darkFrom: '#2a5faa', darkTo: '#1e4f8a', darkAccent: '#4a8ad4', darkGlow: 'rgba(42,95,170,0.2)' },
  },
  {
    level: 11, xpRequired: 1270,
    mob: 'Creeper', emoji: '💥',
    description: 'Du baust was auf… und ruinierst es direkt wieder weg. Stark.',
    tier: 'fantasy',
    color: { from: '#4ade80', to: '#16a34a', accent: '#15803d', glow: 'rgba(22,163,74,0.3)', bg: '#f0fdf4', darkBg: '#0f1f15', darkFrom: '#1a7a3a', darkTo: '#0e5a28', darkAccent: '#1a8a42', darkGlow: 'rgba(26,122,58,0.22)' },
  },
  {
    level: 12, xpRequired: 1650,
    mob: 'Enderman', emoji: '🟣',
    description: 'Du wirkst effizient, bis man merkt, dass du einfach planlos teleportierst.',
    tier: 'fantasy',
    color: { from: '#a78bfa', to: '#7c3aed', accent: '#6d28d9', glow: 'rgba(124,58,237,0.3)', bg: '#f5f3ff', darkBg: '#1a0f2e', darkFrom: '#6b4aaa', darkTo: '#5228a0', darkAccent: '#8a5ec8', darkGlow: 'rgba(107,74,170,0.22)' },
  },
  {
    level: 13, xpRequired: 2100,
    mob: 'Blaze', emoji: '🔥',
    description: 'Du bist dauerhaft am Brennen. Ob das Fortschritt ist oder Überforderung? Ja.',
    tier: 'fantasy',
    color: { from: '#fb923c', to: '#ea580c', accent: '#c2410c', glow: 'rgba(234,88,12,0.35)', bg: '#fff7ed', darkBg: '#1f1510', darkFrom: '#a35a1f', darkTo: '#8a3a08', darkAccent: '#c06018', darkGlow: 'rgba(163,90,31,0.25)' },
  },
  {
    level: 14, xpRequired: 2650,
    mob: 'Guardian', emoji: '🐡',
    description: 'Du verteidigst Dinge, die du selbst nicht mal verstehst. Klassiker.',
    tier: 'fantasy',
    color: { from: '#22d3ee', to: '#06b6d4', accent: '#0891b2', glow: 'rgba(6,182,212,0.3)', bg: '#ecfeff', darkBg: '#0f1f2a', darkFrom: '#0e7a8a', darkTo: '#086878', darkAccent: '#12919e', darkGlow: 'rgba(14,122,138,0.22)' },
  },
  {
    level: 15, xpRequired: 3300,
    mob: 'Witch', emoji: '🧙‍♀️',
    description: 'Du probierst Sachen aus… und wunderst dich, warum alles schlimmer wird.',
    tier: 'fantasy',
    color: { from: '#c084fc', to: '#9333ea', accent: '#7e22ce', glow: 'rgba(147,51,234,0.3)', bg: '#faf5ff', darkBg: '#1a0f2e', darkFrom: '#7a4aaa', darkTo: '#5e1ea0', darkAccent: '#9a58c8', darkGlow: 'rgba(122,74,170,0.22)' },
  },
  {
    level: 16, xpRequired: 4100,
    mob: 'Piglin Brute', emoji: '🐗',
    description: 'Du gehst einfach drauf. Denken war nie Teil des Plans, oder?',
    tier: 'boss',
    color: { from: '#fbbf24', to: '#b45309', accent: '#92400e', glow: 'rgba(180,83,9,0.35)', bg: '#fffbeb', darkBg: '#1f1a0f', darkFrom: '#8a6c12', darkTo: '#6a3a06', darkAccent: '#a07010', darkGlow: 'rgba(138,108,18,0.25)' },
  },
  {
    level: 17, xpRequired: 5050,
    mob: 'Ender Dragon', emoji: '🐉',
    description: 'Groß, laut, beeindruckend… und trotzdem nur Chaos mit Ego.',
    tier: 'boss',
    color: { from: '#a855f7', to: '#7e22ce', accent: '#6b21a8', glow: 'rgba(168,85,247,0.4)', bg: '#faf5ff', darkBg: '#1a0f2e', darkFrom: '#6b38a0', darkTo: '#521a88', darkAccent: '#8a48c0', darkGlow: 'rgba(107,56,160,0.3)' },
  },
  {
    level: 18, xpRequired: 6200,
    mob: 'Wither', emoji: '☠️',
    description: 'Du zerstörst schneller, als du irgendwas kapierst. Beeindruckend dumm, aber effektiv.',
    tier: 'boss',
    color: { from: '#525252', to: '#171717', accent: '#262626', glow: 'rgba(82,82,82,0.4)', bg: '#f5f5f5', darkBg: '#141414', darkFrom: '#3a3a3a', darkTo: '#1a1a1a', darkAccent: '#5a5a5a', darkGlow: 'rgba(60,60,60,0.3)' },
  },
  {
    level: 19, xpRequired: 7600,
    mob: 'Elder Guardian', emoji: '🔱',
    description: 'Du hältst alles auf. Sogar deinen eigenen Fortschritt. Respekt.',
    tier: 'boss',
    color: { from: '#5eead4', to: '#14b8a6', accent: '#0d9488', glow: 'rgba(94,234,212,0.35)', bg: '#f0fdfa', darkBg: '#0f1f1f', darkFrom: '#1a8a78', darkTo: '#107060', darkAccent: '#1a9a86', darkGlow: 'rgba(26,138,120,0.25)' },
  },
  {
    level: 20, xpRequired: 9300,
    mob: 'Warden', emoji: '👹',
    description: 'Du siehst nichts, verstehst nichts – aber tust so, als wärst du der Boss.',
    tier: 'boss',
    color: { from: '#1e3a5f', to: '#0f172a', accent: '#1e40af', glow: 'rgba(30,64,175,0.4)', bg: '#eff6ff', darkBg: '#0c1524', darkFrom: '#162a48', darkTo: '#0c1524', darkAccent: '#2a5090', darkGlow: 'rgba(22,42,72,0.3)' },
  },
  {
    level: 21, xpRequired: 11300,
    mob: 'Baby Huhn', emoji: '🐣',
    description: 'Alles gemeistert. Alles kontrolliert.\nUnd das Beste, was dabei rauskommt, ist… ein Baby-Huhn.',
    tier: 'transcend',
    color: { from: '#fde68a', to: '#fbbf24', accent: '#f59e0b', glow: 'rgba(253,230,138,0.5)', bg: '#fefce8', darkBg: '#1f1d10', darkFrom: '#9a8a2a', darkTo: '#8a6c12', darkAccent: '#b89a18', darkGlow: 'rgba(154,138,42,0.3)' },
  },
]

/** XP thresholds array for quick lookup */
export const XP_THRESHOLDS = MOB_LEVELS.map(l => l.xpRequired)

/** Get the maximum level number */
export const MAX_LEVEL = MOB_LEVELS.length
